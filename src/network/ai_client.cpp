#include "ai_client.h"
#include "../config/config.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <math.h>
namespace Network {
AiClient aiClient;
bool AiClient::configured() const {
  String base(Settings::aiBaseUrl());
  return base.startsWith("http://") || base.startsWith("https://");
}
bool AiClient::parseResponse(const String& body, uint32_t expected, Prediction& out) {
  JsonDocument doc;
  if (deserializeJson(doc, body) || !doc.is<JsonObject>()) return false;
  JsonVariant id = doc["frame_id"];
  JsonVariant cls = doc["class_id"];
  JsonVariant name = doc["class_name"];
  JsonVariant confidence = doc["confidence"];
  JsonVariant stamp = doc["timestamp"];
  // ArduinoJson coercions are NOT used to validate types: strings are rejected.
  if (!(id.is<int>() || id.is<unsigned int>() || id.is<uint64_t>()) ||
      !(cls.is<int>() || cls.is<unsigned int>()) ||
      !name.is<const char*>() ||
      !(confidence.is<double>() || confidence.is<float>() || confidence.is<int>()) ||
      !(stamp.is<int>() || stamp.is<uint64_t>() || stamp.is<int64_t>())) return false;
  const uint64_t responseId = id.as<uint64_t>();
  const int classId = cls.as<int>();
  const char* className = name.as<const char*>();
  const double conf = confidence.as<double>();
  const int64_t timestamp = stamp.as<int64_t>();
  if (responseId != expected || responseId == 0 || classId < 0 || classId > 1 ||
      !isfinite(conf) || conf < 0.0 || conf > 1.0 || timestamp <= 0 ||
      !className || strcmp(className, classId == 0 ? "sitting_good" : "sitting_bad") != 0)
    return false;
  out.frameId = static_cast<uint32_t>(responseId);
  out.classId = static_cast<uint8_t>(classId);
  out.confidence = static_cast<float>(conf);
  out.timestamp = static_cast<uint64_t>(timestamp);
  return true;
}
InferenceResult AiClient::sendFrame(const camera_fb_t* fb, uint32_t frameId, Prediction& out) {
  if (!fb || !fb->buf || fb->format != PIXFORMAT_JPEG || !fb->len || !configured()) return InferenceResult::ERROR;
  String url(Settings::aiBaseUrl());
  while (url.endsWith("/")) url.remove(url.length()-1);
  url += "/infer";
  HTTPClient http;
  http.setConnectTimeout(Settings::HTTP_TIMEOUT_MS);
  http.setTimeout(Settings::HTTP_TIMEOUT_MS);
  WiFiClient plain;
  WiFiClientSecure tls;
  bool opened = false;
  if (url.startsWith("https://")) {
    if (!*Settings::tlsRootCa()) {
      Serial.println("[AI] HTTPS requires POSTURE_TLS_ROOT_CA (fail closed)");
      return InferenceResult::ERROR;
    }
    tls.setCACert(Settings::tlsRootCa());
    opened = http.begin(tls, url);
  } else {
    opened = http.begin(plain, url);
  }
  if (!opened) { Serial.println("[AI] Unable to open HTTP client"); return InferenceResult::ERROR; }
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Frame-ID", String(frameId));
  http.addHeader("X-Device-ID", Settings::DEVICE_ID);
  if (*Settings::apiToken()) http.addHeader("Authorization", String("Bearer ") + Settings::apiToken());
  const int code = http.POST(const_cast<uint8_t*>(fb->buf), fb->len);
  if (code == HTTP_CODE_NO_CONTENT) {
    http.end();
    return InferenceResult::NO_DETECTION;
  }
  if (code != HTTP_CODE_OK) {
    Serial.printf("[AI] POST failed, status=%d\n", code);
    http.end();
    return InferenceResult::ERROR;
  }
  int contentLength = http.getSize();
  if (contentLength < 0 || contentLength > (int)Settings::MAX_RESPONSE_BYTES) {
    Serial.printf("[AI] Invalid response Content-Length=%d\n", contentLength);
    http.end();
    return InferenceResult::ERROR;
  }
  String response = http.getString();
  http.end();
  if (response.length() > Settings::MAX_RESPONSE_BYTES || !parseResponse(response, frameId, out)) {
    Serial.println("[AI] Invalid, inconsistent, or stale prediction JSON");
    return InferenceResult::ERROR;
  }
  return InferenceResult::PREDICTION;
}
}
