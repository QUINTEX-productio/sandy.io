#include "wifi_manager.h"
#include "../config/config.h"
#include "../posture/posture_manager.h"
#include "../audio/audio_manager.h"
#include <WiFi.h>
#include <WebServer.h>
#include <time.h>

namespace Network {
WiFiManager wifiManager;

namespace {
WebServer httpServer(80);
uint8_t* latestJpegBuf = nullptr;
size_t latestJpegLen = 0;
size_t latestJpegCap = 0;
portMUX_TYPE frameMux = portMUX_INITIALIZER_UNLOCKED;

void addCorsHeaders() {
  httpServer.sendHeader("Access-Control-Allow-Origin", "*");
  httpServer.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  httpServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  httpServer.sendHeader("Access-Control-Allow-Private-Network", "true");
  httpServer.sendHeader("Cache-Control", "no-store");
}

void handleOptions() {
  addCorsHeaders();
  httpServer.send(204);
}

void handleCapture() {
  addCorsHeaders();
  portENTER_CRITICAL(&frameMux);
  if (!latestJpegBuf || latestJpegLen == 0) {
    portEXIT_CRITICAL(&frameMux);
    httpServer.send(404, "application/json", "{\"error\":\"No frame captured yet\"}");
    return;
  }
  size_t len = latestJpegLen;
  uint8_t* copyBuf = (uint8_t*)malloc(len);
  if (copyBuf) {
    memcpy(copyBuf, latestJpegBuf, len);
  }
  portEXIT_CRITICAL(&frameMux);

  if (!copyBuf) {
    httpServer.send(500, "application/json", "{\"error\":\"Out of memory\"}");
    return;
  }
  httpServer.send_P(200, "image/jpeg", (const char*)copyBuf, len);
  free(copyBuf);
}

void handleStatus() {
  addCorsHeaders();
  const auto s = Posture::posture.snapshot(millis());
  String ipStr = (WiFi.status() == WL_CONNECTED)
                     ? WiFi.localIP().toString()
                     : WiFi.softAPIP().toString();
  char json[220];
  snprintf(json, sizeof(json),
           "{\"ok\":true,\"device_id\":\"%s\",\"state\":\"%s\",\"confidence\":%.2f,\"frame_id\":%lu,\"ip\":\"%s\"}",
           Settings::DEVICE_ID,
           Posture::stateName(s.state),
           s.confidence,
           (unsigned long)s.frameId,
           ipStr.c_str());
  httpServer.send(200, "application/json", json);
}

void handleBuzz() {
  addCorsHeaders();
  Audio::audio.requestWarning();
  httpServer.send(200, "application/json", "{\"ok\":true}");
}
} // namespace

void WiFiManager::begin() {
  WiFi.persistent(false);
  WiFi.mode(WIFI_AP_STA);
  // Start SoftAP so phone/laptop can always connect directly via Wi-Fi even without a router
  WiFi.softAP("PostureAI-ESP32S3", "12345678");
  Serial.printf("[WIFI] SoftAP ready: SSID=PostureAI-ESP32S3 IP=%s\n", WiFi.softAPIP().toString().c_str());

  WiFi.setAutoReconnect(false); // explicit bounded retry state machine
  startHttpServer();
  tick(millis());
}

void WiFiManager::startHttpServer() {
  if (serverStarted_) return;
  httpServer.on("/capture", HTTP_GET, handleCapture);
  httpServer.on("/capture", HTTP_OPTIONS, handleOptions);
  httpServer.on("/status", HTTP_GET, handleStatus);
  httpServer.on("/status", HTTP_OPTIONS, handleOptions);
  httpServer.on("/buzz", HTTP_POST, handleBuzz);
  httpServer.on("/buzz", HTTP_GET, handleBuzz);
  httpServer.on("/buzz", HTTP_OPTIONS, handleOptions);
  httpServer.begin();
  serverStarted_ = true;
  Serial.println("[WIFI] Local HTTP server started on port 80 (/capture, /status, /buzz)");
}

void WiFiManager::updateLatestFrame(const camera_fb_t* fb) {
  if (!fb || !fb->buf || fb->len == 0) return;
  portENTER_CRITICAL(&frameMux);
  if (fb->len > latestJpegCap) {
    uint8_t* newBuf = (uint8_t*)realloc(latestJpegBuf, fb->len);
    if (newBuf) {
      latestJpegBuf = newBuf;
      latestJpegCap = fb->len;
    }
  }
  if (latestJpegBuf && fb->len <= latestJpegCap) {
    memcpy(latestJpegBuf, fb->buf, fb->len);
    latestJpegLen = fb->len;
  }
  portEXIT_CRITICAL(&frameMux);
}

void WiFiManager::setRuntimeCredentials(const String& ssid, const String& password) {
  runtimeSsid_ = ssid;
  runtimePass_ = password;
  trying_ = false;
  wasConnected_ = false;
  retryAfter_ = 0;
  connect(millis());
}

bool WiFiManager::connected() const { return WiFi.status() == WL_CONNECTED; }

void WiFiManager::connect(uint32_t nowMs) {
  const char* ssid = runtimeSsid_.length() > 0 ? runtimeSsid_.c_str() : Settings::wifiSsid();
  const char* pass = runtimeSsid_.length() > 0 ? runtimePass_.c_str() : Settings::wifiPassword();

  if (!ssid || !*ssid) {
    Serial.println("[WIFI] Station idle (use Bluetooth or SoftAP 192.168.4.1, or set Wi-Fi in secrets.h)");
    retryAfter_ = nowMs + 30000;
    return;
  }
  WiFi.disconnect(false, false);
  WiFi.begin(ssid, pass);
  trying_ = true;
  startedAt_ = nowMs;
  Serial.printf("[WIFI] Connecting to '%s' (non-blocking)...\n", ssid);
}

void WiFiManager::tick(uint32_t nowMs) {
  if (serverStarted_) {
    httpServer.handleClient();
  }
  const bool online = connected();
  if (online) {
    if (!wasConnected_) {
      Serial.printf("[WIFI] Connected, IP=%s RSSI=%d\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
    }
    trying_ = false;
    wasConnected_ = true;
    if (!ntpStarted_) {
      configTime(0, 0, "pool.ntp.org"); // Starts SNTP without blocking loop()
      ntpStarted_ = true;
    }
    return;
  }
  if (wasConnected_) {
    Serial.println("[WIFI] Link lost");
    wasConnected_ = false;
    trying_ = false;
    retryAfter_ = nowMs + Settings::WIFI_RETRY_MS;
  }
  if (trying_) {
    if ((uint32_t)(nowMs - startedAt_) >= Settings::WIFI_CONNECT_TIMEOUT_MS) {
      Serial.println("[WIFI] Timeout; retry scheduled");
      WiFi.disconnect(false, false);
      trying_ = false;
      retryAfter_ = nowMs + Settings::WIFI_RETRY_MS;
    }
  } else if ((int32_t)(nowMs - retryAfter_) >= 0) {
    connect(nowMs);
  }
}
}
