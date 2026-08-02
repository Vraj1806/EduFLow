# EDUFLOW ML INTEGRATION RESEARCH

**Created:** 2026-08-02  
**Session:** 2 — ML Integration Research & Planning  
**Status:** RESEARCH COMPLETE — Ready for implementation decision

---

## 1. INTEGRATION POINTS

Four functions need real ML replacement (all in `apps/api/src/services/`):

| Function | File | Input | Output | Purpose |
|----------|------|-------|--------|---------|
| `detectFaces()` | face.service.ts:38 | base64 image | `{detected, faceCount, confidence, boundingBox}` | Single face detection for registration |
| `generateEmbedding()` | face.service.ts:65 | base64 image | `{vector: number[128], modelVersion}` | Generate 128-dim face embedding |
| `detectClassroomFaces()` | classroom.service.ts:46 | base64 image | `DetectedFace[]` with embeddings | Multi-face detection for attendance |
| `compareFaceWithStudents()` | classroom.service.ts:79 | embedding, class filters | `{studentId, confidence} \| null` | Cosine similarity matching |

**Embedding storage:** JSON-serialized `number[]` in `FaceProfile.embedding` (String column).  
**Model version:** Tracked in `FaceProfile.modelVersion` for future model upgrades.  
**Similarity threshold:** Currently 0.6 (placeholder). Real threshold TBD per model.

---

## 2. LIBRARY RESEARCH

### Option A: @vladmandic/face-api (Node.js Native)

**Repository:** https://github.com/vladmandic/face-api  
**Model:** Based on face-api.js, updated with modern TF.js  
**Dependencies:** @tensorflow/tfjs-node (native binaries)

| Capability | Status |
|------------|--------|
| Face detection (SSD/MTCNN) | ✅ Built-in |
| Face landmark detection | ✅ Built-in |
| Face embedding (128-dim) | ✅ TinyFaceRecognizer |
| Face recognition/matching | ✅ Cosine distance |
| Multi-face in single image | ✅ |
| Runs in Node.js process | ✅ |
| Requires Python | ❌ No |
| GPU acceleration | ✅ (CUDA optional) |
| Model download size | ~15MB |

**Pros:**
- Pure Node.js — no Python service needed
- Same process as Express API — no IPC overhead
- Well-maintained fork of face-api.js
- 128-dim embeddings (matches current storage format)
- Works offline (models loaded at startup)
- Single deployment unit

**Cons:**
- TF.js native binaries can be finicky on some platforms
- Slower than Python alternatives (~2-3x)
- No GPU acceleration on Windows without CUDA setup
- Higher memory usage (~500MB-1GB loaded models)
- face-api.js is aging (original face-api.js by justadudewhohacks is archived)

**Accuracy:** ~95% on LFW benchmark (Labeled Faces in the Wild)  
**Speed:** ~100-300ms per image (CPU, Node.js)

### Option B: Python FastAPI Sidecar

**Libraries:** face_recognition, InsightFace, or DeepFace  
**Communication:** HTTP REST between Express → FastAPI

| Library | Embedding Dim | Accuracy (LFW) | Speed | Dependencies |
|---------|---------------|-----------------|-------|--------------|
| face_recognition | 128 | ~99.38% | ~1s | dlib, CMake |
| InsightFace | 512 | ~99.83% | ~0.5s | onnxruntime, cv2 |
| DeepFace | varies | ~99.5% | ~0.8s | tf/keras, opencv |

**Pros:**
- Higher accuracy than Node.js options
- Active research communities
- More models and configurations available
- GPU support out of the box
- Easier to upgrade models later

**Cons:**
- Requires Python runtime + separate service
- Two services to deploy and manage
- HTTP overhead for each ML call (~10-50ms)
- More complex deployment (Docker recommended)
- Different technology stack

### Option C: ONNX Runtime (Node.js Native)

**Library:** onnxruntime-node  
**Model:** InsightFace/ArcFace exported to ONNX

| Capability | Status |
|------------|--------|
| Face detection (RetinaFace) | ✅ via ONNX |
| Face embedding (ArcFace) | ✅ via ONNX |
| Multi-face detection | ✅ |
| Runs in Node.js process | ✅ |
| No Python required | ✅ |
| GPU acceleration | ✅ (DirectML, CUDA) |
| Model size | ~25MB total |

**Pros:**
- Near-Python accuracy without Python
- Single process deployment
- Better performance than TF.js
- Modern model architectures (ArcFace)
- ONNX is framework-agnostic (future-proof)

**Cons:**
- Requires manual ONNX model downloads
- Less documentation/community than face_recognition
- More setup work upfront
- Newer ecosystem (less battle-tested)

---

## 3. ARCHITECTURE RECOMMENDATION

### Recommended: Option B — Python FastAPI Sidecar

**Rationale:**

1. **Accuracy matters for attendance.** Face recognition in classroom settings (varying lighting, angles, distances) demands the best possible accuracy. face_recognition achieves 99.38% on LFW vs ~95% for face-api.js. In a real classroom, that 4% gap means 4 fewer misidentifications per 100 students.

2. **The existing architecture already anticipates this.** The placeholder comments explicitly say "Python FastAPI service" (face.service.ts:49). The service abstraction layer means the Express API just calls HTTP endpoints — zero refactoring needed.

3. **Model ecosystem is richer in Python.** InsightFace, ArcFace, and other state-of-the-art models are Python-first. ONNX export is possible but adds a step.

4. **Isolation is a feature.** ML models consume significant memory (500MB-2GB). Running them in a separate process means an ML crash doesn't take down the API server. Memory leaks in ML processing don't affect the main app.

5. **Future flexibility.** If we need to switch from face_recognition to InsightFace later, we only change the Python service. The Express API stays untouched.

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│  Express API (Node.js, port 4000)               │
│                                                 │
│  face.service.ts                                │
│    detectFaces()      → POST /ml/detect         │
│    generateEmbedding() → POST /ml/embed          │
│                                                 │
│  classroom.service.ts                           │
│    detectClassroomFaces() → POST /ml/detect-multi│
│    compareFaceWithStudents() → local cosine sim  │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │ HTTP (localhost:5000)
                   ▼
┌─────────────────────────────────────────────────┐
│  ML Service (Python FastAPI, port 5000)         │
│                                                 │
│  POST /detect       → detect single face        │
│  POST /embed        → generate 128-dim embedding│
│  POST /detect-multi → detect all faces + embed  │
│  GET  /health       → model status              │
│                                                 │
│  Models loaded at startup:                      │
│    - face_detection (RetinaFace or HOG)         │
│    - face_embedding (ArcFace or resnet)         │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Key Design Decision: Where Does Comparison Happen?

**Option 1: Python does comparison (HTTP call includes all registered embeddings)**
- Pros: Most accurate, can use GPU
- Cons: Large payload for many students, latency

**Option 2: Python returns embeddings, Express does cosine similarity (RECOMMENDED)**
- Pros: Lower latency, smaller payloads, Python stays stateless
- Cons: Slightly less accurate (no learned threshold per student)

**Recommendation: Option 2.** The Python service detects faces and generates embeddings. Express loads registered embeddings from DB and computes cosine similarity locally. This keeps the ML service simple and stateless.

### Why Not Option A (face-api.js)?

While tempting for simplicity, face-api.js has real limitations:
- ~95% accuracy is insufficient for attendance (5% error rate)
- TF.js native binaries have platform-specific issues
- The face-api.js ecosystem is archived/unmaintained
- Higher memory footprint than a focused Python service

---

## 4. ML SERVICE API CONTRACT

### POST /ml/detect
**Purpose:** Detect faces in a single-image for registration  
**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```
**Response:**
```json
{
  "detected": true,
  "faceCount": 1,
  "confidence": 0.95,
  "boundingBox": { "x": 100, "y": 100, "width": 200, "height": 200 }
}
```
**Errors:** 400 (invalid image, no face, multiple faces)

### POST /ml/embed
**Purpose:** Generate 128-dim face embedding  
**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```
**Response:**
```json
{
  "embedding": [0.12, -0.34, ...],
  "modelVersion": "insightface-v1.0",
  "confidence": 0.98
}
```
**Errors:** 400 (invalid image, no face), 422 (multiple faces)

### POST /ml/detect-multi
**Purpose:** Detect all faces in classroom photo + generate embeddings  
**Request:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```
**Response:**
```json
{
  "faces": [
    {
      "faceIndex": 0,
      "confidence": 0.92,
      "boundingBox": { "x": 50, "y": 30, "width": 180, "height": 180 },
      "embedding": [0.12, -0.34, ...]
    },
    ...
  ]
}
```
**Errors:** 400 (invalid image, no faces detected)

### GET /ml/health
**Purpose:** Check ML service status  
**Response:**
```json
{
  "status": "ok",
  "models": ["face_detection", "face_embedding"],
  "modelVersion": "insightface-v1.0",
  "device": "cpu"
}
```

---

## 5. IMPLEMENTATION PLAN

### Phase 3A: ML Service (Python)
1. Create `apps/ml/` directory with FastAPI service
2. Install dependencies: `fastapi`, `uvicorn`, `insightface`, `onnxruntime`, `opencv-python`
3. Implement 3 endpoints: `/detect`, `/embed`, `/detect-multi`
4. Add health check endpoint
5. Add Dockerfile for containerization
6. Write ML service tests

### Phase 3B: Express Integration
1. Add `ML_SERVICE_URL` env var (default: `http://localhost:5000`)
2. Replace `detectFaces()` → HTTP call to `/ml/detect`
3. Replace `generateEmbedding()` → HTTP call to `/ml/embed`
4. Replace `detectClassroomFaces()` → HTTP call to `/ml/detect-multi`
5. Keep `compareFaceWithStudents()` as local cosine similarity
6. Add ML service health check to Express health endpoint
7. Add graceful degradation (ML service down → clear error)

### Phase 3C: Configuration & Deployment
1. Add ML_ENABLED env var (default: false)
2. Add ML_SERVICE_URL env var
3. Add Docker Compose for API + ML service
4. Update AGENTS.md with ML setup instructions
5. Add ML service to CI pipeline (optional)

### Phase 3D: Testing & Validation
1. Test with real classroom photos
2. Tune confidence threshold (currently 0.6)
3. Test with various lighting conditions
4. Test with glasses, masks, different angles
5. Benchmark accuracy on sample dataset
6. Performance testing (concurrent requests)

---

## 6. ENVIRONMENT REQUIREMENTS

### Development
```
Python 3.10+
pip install fastapi uvicorn insightface onnxruntime opencv-python
# Optional: CUDA for GPU acceleration
```

### Production
```
Docker (recommended) or bare metal
512MB RAM minimum for ML service
GPU optional but recommended for >100 concurrent students
```

### Environment Variables
```bash
ML_ENABLED=true
ML_SERVICE_URL=http://localhost:5000
ML_CONFIDENCE_THRESHOLD=0.6
```

---

## 7. RISK ASSESSMENT

| Risk | Impact | Mitigation |
|------|--------|------------|
| ML service slow under load | High | Cache embeddings, async processing, GPU |
| Low accuracy in poor lighting | High | Image preprocessing, multiple photos per student |
| ML service crashes | Medium | Health checks, auto-restart, graceful degradation |
| Model version mismatch | Medium | Version tracking in FaceProfile, migration strategy |
| Memory leak in ML service | Medium | Process isolation, memory limits, monitoring |
| ONNX model download fails | Low | Bundle models in Docker image, offline fallback |

---

## 8. DECISION REQUIRED

**The implementation can proceed once the following are decided:**

1. **Architecture:** Python sidecar (recommended) vs Node.js native vs ONNX
2. **ML Library:** face_recognition (simplest) vs InsightFace (best accuracy) vs DeepFace
3. **Embedding dimension:** 128 (face_recognition) vs 512 (InsightFace) — affects storage
4. **Deployment:** Docker Compose vs bare metal vs cloud functions
5. **Confidence threshold:** Needs real-world testing to tune

---

## 9. ESTIMATED EFFORT

| Phase | Tasks | Hours |
|-------|-------|-------|
| 3A: ML Service | FastAPI setup, 3 endpoints, tests | 8-12h |
| 3B: Express Integration | Replace 4 placeholders, env vars | 3-4h |
| 3C: Config & Deployment | Docker, env vars, docs | 4-6h |
| 3D: Testing & Tuning | Real photos, threshold tuning | 6-8h |
| **Total** | | **21-30h** |

---

## 10. COMPARISON: CURRENT vs PROPOSED

| Aspect | Current (Placeholder) | Proposed (Real ML) |
|--------|----------------------|-------------------|
| Face detection | Returns hardcoded true | Real RetinaFace/HOG detection |
| Embedding generation | Random 128-dim vector | ArcFace/resnet embedding |
| Multi-face detection | Random 3-7 faces | Real multi-face detection |
| Face comparison | Random confidence | Cosine similarity |
| Accuracy | 0% (random) | ~99% (LFW benchmark) |
| Speed | ~1ms (no-op) | ~100-500ms (real ML) |
| Memory | 0MB | ~500MB-1GB |
| External dependency | None | Python + ML models |
