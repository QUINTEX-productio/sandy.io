#include "ble_manager.h"
#include "../config/config.h"
#include "../network/wifi_manager.h"
#include "../posture/posture_manager.h"
#include "../audio/audio_manager.h"
#include <WiFi.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

namespace Communication {

BleManager bleManager;

namespace {
BLEServer* gServer = nullptr;
BLECharacteristic* gFrameChar = nullptr;
BLECharacteristic* gCmdChar = nullptr;
BLECharacteristic* gStatusChar = nullptr;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    bleManager.onConnectStateChanged(true);
  }
  void onDisconnect(BLEServer* pServer) override {
    bleManager.onConnectStateChanged(false);
    if (pServer) {
      pServer->startAdvertising();
    }
  }
};

class CommandCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pCharacteristic) override {
    if (!pCharacteristic) return;
    String val = pCharacteristic->getValue();
    if (val.length() > 0) {
      bleManager.onCommandReceived(val);
    }
  }
};
} // namespace

void BleManager::begin() {
  if (initialized_) return;

  BLEDevice::init(BLE_DEVICE_NAME);
  BLEDevice::setMTU(517);

  gServer = BLEDevice::createServer();
  gServer->setCallbacks(new ServerCallbacks());

  BLEService* service = gServer->createService(BLE_SERVICE_UUID);

  gFrameChar = service->createCharacteristic(
      BLE_FRAME_CHAR_UUID,
      BLECharacteristic::PROPERTY_NOTIFY
  );
  gFrameChar->addDescriptor(new BLE2902());

  gCmdChar = service->createCharacteristic(
      BLE_CMD_CHAR_UUID,
      BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR
  );
  gCmdChar->setCallbacks(new CommandCallbacks());

  gStatusChar = service->createCharacteristic(
      BLE_STATUS_CHAR_UUID,
      BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
  );
  gStatusChar->addDescriptor(new BLE2902());

  service->start();

  BLEAdvertising* advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(BLE_SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->setMinPreferred(0x06);
  BLEDevice::startAdvertising();

  initialized_ = true;
  Serial.printf("[BLE] Advertising started as '%s'\n", BLE_DEVICE_NAME);
}

void BleManager::onConnectStateChanged(bool isConnected) {
  connected_ = isConnected;
  Serial.printf("[BLE] Client %s\n", isConnected ? "connected" : "disconnected");
}

void BleManager::onCommandReceived(const String& rawCmd) {
  String cmd = rawCmd;
  cmd.trim();
  Serial.printf("[BLE] Command received: %s\n", cmd.c_str());

  if (cmd == "BUZZ") {
    Audio::audio.requestWarning();
  } else if (cmd == "MUTE:1") {
    Posture::posture.setMuted(true);
  } else if (cmd == "MUTE:0") {
    Posture::posture.setMuted(false);
  } else if (cmd.startsWith("WIFI:")) {
    // Format: WIFI:ssid:password
    int firstColon = cmd.indexOf(':');
    int secondColon = cmd.indexOf(':', firstColon + 1);
    if (secondColon > firstColon) {
      String ssid = cmd.substring(firstColon + 1, secondColon);
      String pass = cmd.substring(secondColon + 1);
      Network::wifiManager.setRuntimeCredentials(ssid, pass);
    }
  }
}

void BleManager::notifyFrame(const camera_fb_t* fb) {
  if (!initialized_ || !connected_ || !gFrameChar || !fb || !fb->buf || fb->len == 0) return;

  const uint32_t now = millis();
  if (now - lastFrameNotifyMs_ < 900) return; // Cap BLE frame streaming to ~1 FPS to fit BLE bandwidth
  lastFrameNotifyMs_ = now;

  // Send START header packet: "START:<total_bytes>"
  String startMsg = String("START:") + String(fb->len);
  gFrameChar->setValue((uint8_t*)startMsg.c_str(), startMsg.length());
  gFrameChar->notify();
  delay(8);

  // Send binary JPEG chunks (up to 240 bytes per BLE notification)
  const size_t chunkSize = 240;
  for (size_t offset = 0; offset < fb->len; offset += chunkSize) {
    if (!connected_) return;
    size_t len = (fb->len - offset < chunkSize) ? (fb->len - offset) : chunkSize;
    gFrameChar->setValue(const_cast<uint8_t*>(fb->buf + offset), len);
    gFrameChar->notify();
    delay(6);
  }

  // Send END marker packet: "END"
  const char endMsg[] = "END";
  gFrameChar->setValue((uint8_t*)endMsg, 3);
  gFrameChar->notify();
}

void BleManager::notifyStatus(const char* stateStr, float confidence, uint32_t frameId) {
  if (!initialized_ || !gStatusChar) return;
  const uint32_t now = millis();
  if (now - lastStatusNotifyMs_ < 1000) return;
  lastStatusNotifyMs_ = now;

  String ipStr = (WiFi.status() == WL_CONNECTED)
                     ? WiFi.localIP().toString()
                     : WiFi.softAPIP().toString();

  char buf[192];
  snprintf(buf, sizeof(buf),
           "{\"state\":\"%s\",\"conf\":%.2f,\"frame\":%lu,\"ip\":\"%s\",\"wifi\":%d}",
           stateStr ? stateStr : "IDLE",
           confidence,
           (unsigned long)frameId,
           ipStr.c_str(),
           WiFi.status() == WL_CONNECTED ? 1 : 0);

  gStatusChar->setValue((uint8_t*)buf, strlen(buf));
  if (connected_) {
    gStatusChar->notify();
  }
}

void BleManager::tick(uint32_t nowMs) {
  if (!initialized_) return;
  const auto s = Posture::posture.snapshot(nowMs);
  notifyStatus(Posture::stateName(s.state), s.confidence, s.frameId);
}

} // namespace Communication
