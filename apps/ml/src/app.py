"""EduFlow ML Service — FastAPI face detection & recognition sidecar.

Runs as a separate process from the Express API. The API calls these HTTP
endpoints instead of doing ML work in-process, keeping the ML models isolated.

API contract (matches apps/ml/README.md):

    POST /detect        single-face detection for registration
    POST /embed         generate a face embedding (exactly one face)
    POST /detect-multi  detect all faces in a photo + embeddings
    GET  /health        model/backend status
"""

import os
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from pydantic import BaseModel

from . import backends


class ImageRequest(BaseModel):
    image: str


class DetectResponse(BaseModel):
    detected: bool
    faceCount: int
    confidence: Optional[float] = None
    boundingBox: Optional[dict] = None


class EmbedResponse(BaseModel):
    embedding: List[float]
    modelVersion: str
    confidence: float


class DetectedFace(BaseModel):
    faceIndex: int
    confidence: float
    boundingBox: dict
    embedding: List[float]


class DetectMultiResponse(BaseModel):
    faces: List[DetectedFace]


def create_app() -> FastAPI:
    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        try:
            _app.state.backend = backends.get_backend()
            _app.state.error = None
        except Exception as exc:  # noqa: BLE001 - surface any load failure
            _app.state.backend = None
            _app.state.error = str(exc)
        yield

    app = FastAPI(title="EduFlow ML Service", version="1.0.0", lifespan=lifespan)

    def require_backend(request: Request) -> backends.FaceBackend:
        backend: Optional[backends.FaceBackend] = getattr(request.app.state, "backend", None)
        if backend is None:
            detail = getattr(request.app.state, "error", None) or "backend not loaded"
            raise HTTPException(status_code=503, detail=f"ML backend unavailable: {detail}")
        return backend

    def require_secret(request: Request) -> None:
        """Reject requests that don't carry the shared ML service secret.

        Reads the secret from the ``ML_SERVICE_SECRET`` environment variable so
        it can be rotated without a code change. Exempts only ``/health``, which
        is intentionally unauthenticated for liveness probes. This is
        defense-in-depth — the sidecar should still be bound to ``127.0.0.1`` or
        an internal-only network so it is not directly reachable.
        """
        expected = os.getenv("ML_SERVICE_SECRET", "")
        if not expected:
            raise HTTPException(status_code=503, detail="ML service secret is not configured")
        provided = request.headers.get("X-ML-Service-Secret", "")
        if provided != expected:
            raise HTTPException(status_code=401, detail="missing or invalid ML service secret")

    @app.get("/health")
    def health(request: Request) -> dict:
        backend = getattr(request.app.state, "backend", None)
        if backend is None:
            return {
                "status": "degraded",
                "backend": None,
                "loaded": False,
                "error": getattr(request.app.state, "error", "backend not loaded"),
            }
        payload = backend.health()
        payload["status"] = "ok"
        return payload

    @app.post("/detect", response_model=DetectResponse, dependencies=[Depends(require_secret)])
    def detect(body: ImageRequest, request: Request) -> DetectResponse:
        backend = require_backend(request)
        try:
            img = backends.decode_data_url(body.image)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        detections = backend.detect(img)
        if not detections:
            return DetectResponse(detected=False, faceCount=0)

        first = detections[0]
        return DetectResponse(
            detected=True,
            faceCount=len(detections),
            confidence=first.confidence,
            boundingBox=first.bounding_box,
        )

    @app.post("/embed", response_model=EmbedResponse, dependencies=[Depends(require_secret)])
    def embed(body: ImageRequest, request: Request) -> EmbedResponse:
        backend = require_backend(request)
        try:
            img = backends.decode_data_url(body.image)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        detections = backend.detect(img)
        if not detections:
            raise HTTPException(status_code=400, detail="no face detected in the image")
        if len(detections) > 1:
            raise HTTPException(
                status_code=422,
                detail="multiple faces detected — image must contain exactly one person",
            )

        face = detections[0]
        if not face.embedding:
            raise HTTPException(status_code=503, detail="backend did not produce an embedding")

        return EmbedResponse(
            embedding=face.embedding,
            modelVersion=backend.model_version(),
            confidence=face.confidence,
        )

    @app.post("/detect-multi", response_model=DetectMultiResponse, dependencies=[Depends(require_secret)])
    def detect_multi(body: ImageRequest, request: Request) -> DetectMultiResponse:
        backend = require_backend(request)
        try:
            img = backends.decode_data_url(body.image)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        faces = []
        for index, detection in enumerate(backend.detect(img)):
            faces.append(
                DetectedFace(
                    faceIndex=index,
                    confidence=detection.confidence,
                    boundingBox=detection.bounding_box,
                    embedding=detection.embedding or [],
                )
            )

        if not faces:
            raise HTTPException(status_code=400, detail="no faces detected in the image")

        return DetectMultiResponse(faces=faces)

    return app


app = create_app()
