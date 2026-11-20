"""PostureDetector JPEG-to-YOLOv5 HTTP gateway (ESP32-S3 N16R8 + Web Dashboard + Colab).

Run:
  pip install -r gateway/requirements.txt
  POSTURE_MODE=mock python -m uvicorn gateway.app:app --host 0.0.0.0 --port 8000

For a trained YOLOv5 *detection* checkpoint, set:
  POSTURE_MODE=yolov5
  YOLOV5_REPO=/absolute/path/to/yolov5
  YOLOV5_WEIGHTS=/absolute/path/to/best.pt
"""
from __future__ import annotations

import base64
import io
import os
import secrets
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.concurrency import run_in_threadpool
from PIL import Image, UnidentifiedImageError

app = FastAPI(title="ESP32-S3 Posture Detection Gateway", version="2.0.0")

# Allow GitHub Pages and local browsers to query /api/status, /predict, and /health
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASS_NAMES = {0: "sitting_good", 1: "sitting_bad"}
MODE = os.getenv("POSTURE_MODE", "mock").lower()
API_TOKEN = os.getenv("POSTURE_API_TOKEN", "")
MAX_IMAGE_BYTES = int(os.getenv("POSTURE_MAX_IMAGE_BYTES", "750000"))
MOCK_SEQUENCE = [x.strip() for x in os.getenv("POSTURE_MOCK_SEQUENCE", "sitting_good").split(",")]
if not MOCK_SEQUENCE or any(x not in CLASS_NAMES.values() for x in MOCK_SEQUENCE):
    raise RuntimeError("POSTURE_MOCK_SEQUENCE only accepts sitting_good and sitting_bad")
if MODE not in ("mock", "yolov5"):
    raise RuntimeError("POSTURE_MODE must be mock or yolov5")

_model = None
_model_lock = threading.Lock()
_sequence_lock = threading.Lock()
_mock_index = 0

# Live telemetry state for the Web Interface (Interface.html / index.html)
_live_lock = threading.Lock()
_live_state: Dict[str, Any] = {
    "frame_base64": None,
    "width": 640,
    "height": 480,
    "frame_id": 0,
    "device_id": "posture-esp32s3-01",
    "detections": [],
    "class_id": None,
    "class_name": "IDLE",
    "confidence": 0.0,
    "latency_ms": 0,
    "fps": 0.0,
    "last_frame_ts": 0.0,
    "good_frames": 0,
    "bad_frames": 0,
    "total_frames": 0,
}


def _load_model():
    global _model
    if _model is not None:
        return _model
    with _model_lock:
        if _model is not None:
            return _model
        import torch  # Heavy optional dependency needed only in yolov5 mode.
        repo = Path(os.environ["YOLOV5_REPO"]).resolve()
        weights = Path(os.environ["YOLOV5_WEIGHTS"]).resolve()
        if not repo.is_dir() or not (repo / "hubconf.py").is_file():
            raise RuntimeError(f"Invalid YOLOV5_REPO: {repo}")
        if not weights.is_file():
            raise RuntimeError(f"YOLOV5_WEIGHTS not found: {weights}")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = torch.hub.load(str(repo), "custom", path=str(weights), source="local", device=device)
        names = model.names
        class_lookup = {int(k): str(v) for k, v in names.items()} if isinstance(names, dict) else dict(enumerate(names))
        if class_lookup != CLASS_NAMES:
            raise RuntimeError(f"Expected model classes exactly {CLASS_NAMES}, got {class_lookup}")
        model.eval()
        _model = model
        return _model


def _classify_with_boxes(image: Image.Image) -> Tuple[Optional[Tuple[int, float]], List[Dict[str, Any]]]:
    """Run inference and return both ((class_id, confidence), detections_list) for the UI."""
    global _mock_index
    w, h = image.size
    if MODE == "mock":
        with _sequence_lock:
            label = MOCK_SEQUENCE[_mock_index % len(MOCK_SEQUENCE)]
            _mock_index += 1
        class_id = 0 if label == "sitting_good" else 1
        conf = 0.94
        box = {
            "xmin": round(w * 0.25, 1),
            "ymin": round(h * 0.15, 1),
            "xmax": round(w * 0.75, 1),
            "ymax": round(h * 0.90, 1),
            "confidence": conf,
            "class": class_id,
            "name": CLASS_NAMES[class_id],
        }
        return (class_id, conf), [box]

    model = _load_model()
    with _model_lock:
        result = model(image, size=640)
        detections = result.xyxy[0]
        if len(detections) == 0:
            return None, []
        boxes: List[Dict[str, Any]] = []
        for row in detections:
            cid = int(row[5].item())
            cval = float(row[4].item())
            boxes.append({
                "xmin": float(row[0].item()),
                "ymin": float(row[1].item()),
                "xmax": float(row[2].item()),
                "ymax": float(row[3].item()),
                "confidence": cval,
                "class": cid,
                "name": CLASS_NAMES.get(cid, str(cid)),
            })
        top = detections[detections[:, 4].argmax()]
        class_id, confidence = int(top[5].item()), float(top[4].item())
    if class_id not in CLASS_NAMES:
        raise RuntimeError(f"Unexpected class id {class_id}")
    return (class_id, confidence), boxes


def _classify(image: Image.Image) -> Optional[Tuple[int, float]]:
    """Preserved function signature for unit tests in tests/test_gateway.py."""
    pred, _ = _classify_with_boxes(image)
    return pred


def _record_live_frame(
    jpeg_bytes: bytes,
    width: int,
    height: int,
    frame_id: int,
    device_id: str,
    prediction: Optional[Tuple[int, float]],
    boxes: List[Dict[str, Any]],
    latency_ms: int,
):
    now = time.time()
    b64_str = base64.b64encode(jpeg_bytes).decode("ascii")
    with _live_lock:
        prev_ts = _live_state["last_frame_ts"]
        fps = round(1.0 / max(0.001, now - prev_ts), 1) if prev_ts > 0 else 0.0
        _live_state["frame_base64"] = b64_str
        _live_state["width"] = width
        _live_state["height"] = height
        _live_state["frame_id"] = frame_id
        _live_state["device_id"] = device_id or "posture-esp32s3-01"
        _live_state["latency_ms"] = latency_ms
        _live_state["fps"] = min(fps, 60.0)
        _live_state["last_frame_ts"] = now
        _live_state["total_frames"] += 1

        if prediction is not None:
            cid, conf = prediction
            cname = CLASS_NAMES.get(cid, "sitting_good")
            _live_state["class_id"] = cid
            _live_state["class_name"] = cname
            _live_state["confidence"] = round(conf, 4)
            if not boxes:
                boxes = [{
                    "xmin": round(width * 0.25, 1),
                    "ymin": round(height * 0.15, 1),
                    "xmax": round(width * 0.75, 1),
                    "ymax": round(height * 0.90, 1),
                    "confidence": round(conf, 4),
                    "class": cid,
                    "name": cname,
                }]
            _live_state["detections"] = boxes
            if cid == 1:
                _live_state["bad_frames"] += 1
            else:
                _live_state["good_frames"] += 1
        else:
            _live_state["class_id"] = None
            _live_state["class_name"] = "NO_DETECTION"
            _live_state["confidence"] = 0.0
            _live_state["detections"] = []


@app.get("/")
def serve_index():
    root_dir = Path(__file__).resolve().parent.parent
    index_file = root_dir / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))
    return {"status": "ok", "mode": MODE, "service": "ESP32-S3 Posture Detection Gateway"}


@app.get("/health")
def health():
    return {"status": "ok", "mode": MODE, "model_loaded": _model is not None}


@app.get("/api/status")
def api_status():
    """Live telemetry & frame endpoint polled by the GitHub Pages / Web Dashboard."""
    now = time.time()
    with _live_lock:
        age = round(now - _live_state["last_frame_ts"], 1) if _live_state["last_frame_ts"] > 0 else None
        esp_connected = age is not None and age < 10.0
        good = _live_state["good_frames"]
        bad = _live_state["bad_frames"]
        classified = good + bad
        good_rate = round((good / classified) * 100) if classified > 0 else 100

        return {
            "ok": True,
            "mode": MODE,
            "frame_base64": _live_state["frame_base64"],
            "width": _live_state["width"],
            "height": _live_state["height"],
            "frame_id": _live_state["frame_id"],
            "device_id": _live_state["device_id"],
            "detections": _live_state["detections"],
            "class_id": _live_state["class_id"],
            "class_name": _live_state["class_name"],
            "confidence": _live_state["confidence"],
            "latency_ms": _live_state["latency_ms"],
            "fps": _live_state["fps"],
            "esp_connected": esp_connected,
            "esp_frame_age_sec": age,
            "colab_connected": True,
            "session_stats": {
                "total_frames": _live_state["total_frames"],
                "good_frames": good,
                "bad_frames": bad,
                "good_posture_rate": good_rate,
            },
            "timestamp": int(now),
        }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """Browser / Colab multipart prediction endpoint for webcam or USB serial frames."""
    start_t = time.perf_counter()
    data = await file.read()
    try:
        with Image.open(io.BytesIO(data)) as img:
            rgb = img.convert("RGB")
            w, h = rgb.size
    except Exception as ex:
        raise HTTPException(status_code=400, detail=f"Invalid image: {ex}") from ex

    prediction, boxes = await run_in_threadpool(_classify_with_boxes, rgb)
    latency_ms = round((time.perf_counter() - start_t) * 1000)
    _record_live_frame(data, w, h, 0, "browser-client", prediction, boxes, latency_ms)
    return {"detections": _live_state["detections"], "latency_ms": latency_ms}


@app.post("/infer")
async def infer(
    request: Request,
    x_frame_id: str = Header(..., alias="X-Frame-ID"),
    x_device_id: str = Header("posture-esp32s3-01", alias="X-Device-ID"),
    authorization: str = Header("", alias="Authorization"),
):
    """
    ESP32-S3-WROOM-1-N16R8 Firmware Endpoint (`src/network/ai_client.cpp`).
    Validates X-Frame-ID, runs YOLOv5/mock classification, updates the live web
    dashboard state, and returns the exact JSON contract expected by the ESP32-S3.
    """
    start_t = time.perf_counter()
    if API_TOKEN and not secrets.compare_digest(authorization, f"Bearer {API_TOKEN}"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not x_frame_id.isascii() or not x_frame_id.isdecimal():
        raise HTTPException(status_code=400, detail="Invalid X-Frame-ID")
    frame_id = int(x_frame_id)
    if not (1 <= frame_id <= 0xFFFFFFFF):
        raise HTTPException(status_code=400, detail="Out-of-range frame ID")
    if request.headers.get("content-type", "").split(";")[0].lower() != "image/jpeg":
        raise HTTPException(status_code=415, detail="Expected image/jpeg")
    content_length = request.headers.get("content-length")
    if content_length and (not content_length.isdecimal() or int(content_length) > MAX_IMAGE_BYTES):
        raise HTTPException(status_code=413, detail="Image too large")

    data = bytearray()
    async for chunk in request.stream():
        data.extend(chunk)
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image too large")
    if not data:
        raise HTTPException(status_code=400, detail="Empty JPEG")

    try:
        with Image.open(io.BytesIO(data)) as img:
            if img.format != "JPEG":
                raise ValueError("Not a JPEG")
            img.load()
            if img.width > 8192 or img.height > 8192:
                raise ValueError("Unexpected image dimensions")
            rgb = img.convert("RGB")
            w, h = rgb.size
    except (UnidentifiedImageError, ValueError, OSError) as ex:
        raise HTTPException(status_code=400, detail=f"Invalid JPEG: {ex}") from ex

    try:
        # Support monkeypatching _classify in unit tests while also capturing boxes when unpatched
        if _classify is not _DEFAULT_CLASSIFY_REF:
            prediction = await run_in_threadpool(_classify, rgb)
            boxes: List[Dict[str, Any]] = []
        else:
            prediction, boxes = await run_in_threadpool(_classify_with_boxes, rgb)
    except Exception as ex:
        print(f"[AI] Backend failure: {type(ex).__name__}: {ex}", flush=True)
        raise HTTPException(status_code=503, detail="Inference unavailable") from ex

    latency_ms = round((time.perf_counter() - start_t) * 1000)
    _record_live_frame(bytes(data), w, h, frame_id, x_device_id, prediction, boxes, latency_ms)

    if prediction is None:
        return Response(status_code=204)  # no detectable posture; NOT sitting_good

    class_id, confidence = prediction
    return JSONResponse({
        "frame_id": frame_id,
        "class_id": class_id,
        "class_name": CLASS_NAMES[class_id],
        "confidence": round(confidence, 6),
        "timestamp": int(time.time()),
    })


_DEFAULT_CLASSIFY_REF = _classify
