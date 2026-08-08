"""Face recognition backends for the EduFlow ML service.

The service is deliberately backend-agnostic so the model can be swapped
without touching the API contract. Two backends ship with the service:

- ``insightface`` (default): real detection + 512-dim ArcFace embeddings via
  the InsightFace model zoo. Models are downloaded on first use.
- ``demo``: deterministic, content-derived fake results used for offline
  development, CI and end-to-end pipeline testing. Never used in production.
"""

import base64
import hashlib
import os
from dataclasses import dataclass, field
from typing import List, Optional

import cv2
import numpy as np

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10MB, matches the API-side validation


class BackendError(Exception):
    """Raised when a backend cannot be loaded."""


@dataclass
class Detection:
    confidence: float
    bounding_box: dict
    embedding: Optional[List[float]] = None


def decode_data_url(data_url: str) -> np.ndarray:
    """Decode a `data:image/...;base64,...` URL into a BGR ndarray."""
    if not data_url or not data_url.startswith("data:image/"):
        raise ValueError("image must be a data URL")
    try:
        _, payload = data_url.split(",", 1)
        raw = base64.b64decode(payload)
    except Exception as exc:
        raise ValueError("image must be a base64 data URL") from exc
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("image too large (max 10MB)")
    arr = np.frombuffer(raw, dtype=np.uint8)
    try:
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except cv2.error as exc:
        raise ValueError("invalid image data") from exc
    if img is None:
        raise ValueError("invalid image data")
    return img


class FaceBackend:
    """Interface implemented by every backend."""

    def name(self) -> str:
        raise NotImplementedError

    def model_version(self) -> str:
        raise NotImplementedError

    def detect(self, img: np.ndarray) -> List[Detection]:
        raise NotImplementedError

    def health(self) -> dict:
        raise NotImplementedError


class InsightFaceBackend(FaceBackend):
    """Real face detection + recognition via the InsightFace model zoo."""

    def __init__(
        self,
        model_pack: str = "buffalo_l",
        device: str = "CPUExecutionProvider",
        det_threshold: float = 0.5,
    ):
        self._model_pack = model_pack
        self._device = device
        self._det_threshold = det_threshold
        self._embed_dim = 512
        try:
            from insightface.app import FaceAnalysis
        except ImportError as exc:
            raise BackendError(
                "insightface is not installed. Run `pip install -r apps/ml/requirements.txt`."
            ) from exc

        try:
            self._app = FaceAnalysis(
                name=model_pack,
                allowed_modules=["detection", "recognition"],
                providers=[device],
            )
            self._app.prepare(ctx_id=-1, det_size=(640, 640))
        except Exception as exc:
            raise BackendError(
                f"failed to load InsightFace model pack '{model_pack}': {exc}"
            ) from exc

    def name(self) -> str:
        return "insightface"

    def model_version(self) -> str:
        return f"insightface-{self._model_pack}-v1"

    def detect(self, img: np.ndarray) -> List[Detection]:
        results: List[Detection] = []
        for face in self._app.get(img):
            if float(face.det_score) < self._det_threshold:
                continue
            x1, y1, x2, y2 = [int(v) for v in face.bbox]
            embedding = (
                [float(v) for v in face.normed_embedding]
                if face.normed_embedding is not None
                else None
            )
            results.append(
                Detection(
                    confidence=float(face.det_score),
                    bounding_box={
                        "x": x1,
                        "y": y1,
                        "width": max(x2 - x1, 0),
                        "height": max(y2 - y1, 0),
                    },
                    embedding=embedding,
                )
            )
        return results

    def health(self) -> dict:
        return {
            "backend": self.name(),
            "models": ["face_detection", "face_embedding"],
            "modelVersion": self.model_version(),
            "embeddingDim": self._embed_dim,
            "device": self._device,
            "loaded": True,
        }


class DemoBackend(FaceBackend):
    """Deterministic fake results for offline development and tests.

    Embeddings are derived from the image content, so the same image always
    produces the same vector while different images differ. Results are never
    real — the health endpoint reports ``backend: demo``.
    """

    def __init__(self):
        self._embed_dim = 512

    def name(self) -> str:
        return "demo"

    def model_version(self) -> str:
        return "demo-v1.0"

    def detect(self, img: np.ndarray) -> List[Detection]:
        height, width = img.shape[:2]
        seed = int(
            hashlib.sha256(img.tobytes()).hexdigest()[:8], 16
        )
        rng = np.random.default_rng(seed)
        x = int(width * 0.35)
        y = int(height * 0.30)
        w = int(width * 0.30)
        h = int(height * 0.40)
        embedding = [float(v) for v in rng.normal(0, 1, self._embed_dim)]
        norm = float(np.linalg.norm(embedding)) or 1.0
        embedding = [v / norm for v in embedding]
        return [
            Detection(
                confidence=0.97,
                bounding_box={"x": x, "y": y, "width": w, "height": h},
                embedding=embedding,
            )
        ]

    def health(self) -> dict:
        return {
            "backend": self.name(),
            "models": ["face_detection", "face_embedding"],
            "modelVersion": self.model_version(),
            "embeddingDim": self._embed_dim,
            "device": "demo",
            "loaded": True,
        }


def get_backend() -> FaceBackend:
    """Build the backend selected by the ``ML_BACKEND`` environment variable."""
    selected = os.getenv("ML_BACKEND", "insightface").strip().lower()
    if selected == "demo":
        return DemoBackend()
    if selected == "insightface":
        return InsightFaceBackend(
            model_pack=os.getenv("ML_MODEL_PACK", "buffalo_l"),
            device=os.getenv("ML_DEVICE", "CPUExecutionProvider"),
            det_threshold=float(os.getenv("ML_DETECT_THRESHOLD", "0.5")),
        )
    raise BackendError(f"unknown ML_BACKEND '{selected}'")
