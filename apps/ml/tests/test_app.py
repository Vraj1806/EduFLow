import base64
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from src.app import create_app
from src.backends import Detection

# The sidecar requires the shared secret (set in conftest.py). Every test
# request that hits a protected endpoint must carry it.
AUTH_HEADERS = {"X-ML-Service-Secret": "test-ml-secret"}


def image_data_url(size=(320, 240), color=(90, 120, 150)) -> str:
    img = Image.new("RGB", size, color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{encoded}"


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c


@pytest.fixture
def fake_backend():
    def _make(detections, *, name="fake", version="fake-v1"):
        class FakeBackend:
            def name(self):
                return name

            def model_version(self):
                return version

            def detect(self, img):
                return detections

            def health(self):
                return {
                    "backend": name,
                    "models": ["face_detection", "face_embedding"],
                    "modelVersion": version,
                    "embeddingDim": 512,
                    "device": "fake",
                    "loaded": True,
                }

        return FakeBackend()

    return _make


def single_detection(embedding=None, confidence=0.95):
    return Detection(
        confidence=confidence,
        bounding_box={"x": 10, "y": 10, "width": 100, "height": 120},
        embedding=embedding if embedding is not None else [0.1] * 512,
    )


def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["backend"] == "demo"
    assert body["modelVersion"] == "demo-v1.0"


def test_detect_returns_single_face(client):
    res = client.post("/detect", json={"image": image_data_url()}, headers=AUTH_HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert body["detected"] is True
    assert body["faceCount"] == 1
    assert body["confidence"] > 0.5
    assert set(body["boundingBox"]) == {"x", "y", "width", "height"}


def test_detect_rejects_invalid_image(client):
    res = client.post(
        "/detect", json={"image": "data:image/jpeg;base64,%%%%"}, headers=AUTH_HEADERS
    )
    assert res.status_code == 400


def test_detect_rejects_non_data_url(client):
    res = client.post("/detect", json={"image": "not-a-data-url"}, headers=AUTH_HEADERS)
    assert res.status_code == 400


def test_embed_returns_512_dim_vector(client):
    res = client.post("/embed", json={"image": image_data_url()}, headers=AUTH_HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert body["modelVersion"] == "demo-v1.0"
    assert isinstance(body["embedding"], list)
    assert len(body["embedding"]) == 512
    assert all(isinstance(v, float) for v in body["embedding"])


def test_embed_rejects_multiple_faces(client, fake_backend):
    detections = [
        single_detection(),
        single_detection(embedding=[0.2] * 512),
    ]
    client.app.state.backend = fake_backend(detections)
    res = client.post("/embed", json={"image": image_data_url()}, headers=AUTH_HEADERS)
    assert res.status_code == 422


def test_embed_rejects_no_face(client, fake_backend):
    client.app.state.backend = fake_backend([])
    res = client.post("/embed", json={"image": image_data_url()}, headers=AUTH_HEADERS)
    assert res.status_code == 400


def test_detect_multi_returns_faces_with_embeddings(client):
    res = client.post("/detect-multi", json={"image": image_data_url()}, headers=AUTH_HEADERS)
    assert res.status_code == 200
    body = res.json()
    assert len(body["faces"]) == 1
    face = body["faces"][0]
    assert face["faceIndex"] == 0
    assert len(face["embedding"]) == 512


def test_detect_multi_rejects_no_faces(client, fake_backend):
    client.app.state.backend = fake_backend([])
    res = client.post("/detect-multi", json={"image": image_data_url()}, headers=AUTH_HEADERS)
    assert res.status_code == 400


def test_health_degraded_when_backend_missing(client):
    client.app.state.backend = None
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "degraded"


def test_endpoints_return_503_when_backend_missing(client):
    client.app.state.backend = None
    assert (
        client.post("/detect", json={"image": image_data_url()}, headers=AUTH_HEADERS).status_code
        == 503
    )
    assert (
        client.post("/embed", json={"image": image_data_url()}, headers=AUTH_HEADERS).status_code
        == 503
    )
    assert (
        client.post(
            "/detect-multi", json={"image": image_data_url()}, headers=AUTH_HEADERS
        ).status_code
        == 503
    )


# ---- Auth (shared secret) ----


def test_protected_endpoints_reject_missing_secret(client):
    res = client.post("/detect", json={"image": image_data_url()})
    assert res.status_code == 401
    assert client.post("/embed", json={"image": image_data_url()}).status_code == 401
    assert client.post("/detect-multi", json={"image": image_data_url()}).status_code == 401


def test_protected_endpoints_reject_wrong_secret(client):
    wrong = {"X-ML-Service-Secret": "wrong-secret"}
    res = client.post("/detect", json={"image": image_data_url()}, headers=wrong)
    assert res.status_code == 401
    assert client.post("/embed", json={"image": image_data_url()}, headers=wrong).status_code == 401


def test_health_is_exempt_from_secret(client):
    res = client.get("/health")
    assert res.status_code == 200
