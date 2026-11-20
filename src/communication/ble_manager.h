#pragma once
#include <Arduino.h>
#include "esp_camera.h"

namespace Communication {

// Custom BLE UUIDs matching the PostureAI Web Bluetooth client in Interface.html
constexpr char BLE_DEVICE_NAME[]       = "PostureAI-ESP32S3";
constexpr char BLE_SERVICE_UUID[]      = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
constexpr char BLE_FRAME_CHAR_UUID[]   = "beb5483e-36e1-4688-b7f5-ea07361b26a8"; // Notify: chunked JPEG frame
constexpr char BLE_CMD_CHAR_UUID[]     = "beb5483e-36e1-4688-b7f5-ea07361b26a9"; // Write: BUZZ, MUTE, WIFI:ssid:pass
constexpr char BLE_STATUS_CHAR_UUID[]  = "beb5483e-36e1-4688-b7f5-ea07361b26aa"; // Read/Notify: JSON status & IP

class BleManager {
public:
  void begin();
  void tick(uint32_t nowMs);
  bool clientConnected() const { return connected_; }
  void notifyFrame(const camera_fb_t* fb);
  void notifyStatus(const char* stateStr, float confidence, uint32_t frameId);

  // Internal callbacks used by BLE stack
  void onConnectStateChanged(bool isConnected);
  void onCommandReceived(const String& cmd);

private:
  bool initialized_ = false;
  bool connected_ = false;
  uint32_t lastStatusNotifyMs_ = 0;
  uint32_t lastFrameNotifyMs_ = 0;
};

extern BleManager bleManager;

} // namespace Communication
