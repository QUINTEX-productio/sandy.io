#pragma once
#include <Arduino.h>
#include "esp_camera.h"

namespace Network {
class WiFiManager {
public:
  void begin();
  void tick(uint32_t nowMs);
  bool connected() const;
  void setRuntimeCredentials(const String& ssid, const String& password);
  void updateLatestFrame(const camera_fb_t* fb);
private:
  bool trying_ = false, wasConnected_ = false, ntpStarted_ = false, serverStarted_ = false;
  uint32_t startedAt_ = 0, retryAfter_ = 0;
  String runtimeSsid_;
  String runtimePass_;
  void connect(uint32_t nowMs);
  void startHttpServer();
};
extern WiFiManager wifiManager;
}
