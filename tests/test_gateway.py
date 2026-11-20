"""Run: POSTURE_MODE=mock python -m pytest -q tests/"""
import io
from PIL import Image
from fastapi.testclient import TestClient
from gateway.app import app

client = TestClient(app)


def jpeg():
    f = io.BytesIO()
    Image.new("RGB", (32, 32), (80, 120, 180)).save(f, format="JPEG")
    return f.getvalue()


def test_health():
    data = client.get("/health")
    assert data.status_code == 200
    assert data.json()["status"] == "ok"


def test_mock_schema_and_id_echo():
    response = client.post("/infer", content=jpeg(), headers={"X-Frame-ID": "123", "Content-Type": "image/jpeg"})
    assert response.status_code == 200
    data = response.json()
    assert data["frame_id"] == 123
    assert data["class_name"] in ("sitting_good", "sitting_bad")
    assert (data["class_id"] == 0) == (data["class_name"] == "sitting_good")
    assert 0 <= data["confidence"] <= 1
    assert data["timestamp"] > 0


def test_reject_bad_payload():
    response = client.post("/infer", content=b"not-a-jpeg", headers={"X-Frame-ID": "1", "Content-Type": "image/jpeg"})
    assert response.status_code == 400


def test_reject_missing_frame_id():
    response = client.post("/infer", content=jpeg(), headers={"Content-Type": "image/jpeg"})
    assert response.status_code == 422


def test_reject_bad_frame_id():
    response = client.post("/infer", content=jpeg(), headers={"X-Frame-ID": "-1", "Content-Type": "image/jpeg"})
    assert response.status_code == 400


def test_reject_wrong_mime():
    response = client.post("/infer", content=jpeg(), headers={"X-Frame-ID": "1", "Content-Type": "application/octet-stream"})
    assert response.status_code == 415


def test_no_detection_returns_204(monkeypatch):
    import gateway.app as gateway_module
    monkeypatch.setattr(gateway_module, "_classify", lambda _image: None)
    response = client.post("/infer", content=jpeg(), headers={"X-Frame-ID": "321", "Content-Type": "image/jpeg"})
    assert response.status_code == 204
    assert response.content == b""
