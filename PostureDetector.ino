/*
  ESP32-S3 posture monitor (Arduino-ESP32 3.x).
  Stage 1 boots without any peripheral GPIO configured.
  IMPORTANT: Set the exact board-specific pins in src/config/config.h before stage 2+.
  YOLOv5 inference runs on a separate HTTP gateway, NOT on the ESP32-S3.
*/
#include <Arduino.h>
#include <WiFi.h>
#include "src/config/config.h"
#include "src/camera/camera_manager.h"
#include "src/network/wifi_manager.h"
#include "src/network/ai_client.h"
#include "src/posture/posture_manager.h"
#include "src/display/display_manager.h"
#include "src/audio/audio_manager.h"
#include "src/indicators/led_manager.h"
#include "src/communication/microbit_uart.h"
#include "src/communication/ble_manager.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

namespace {
TaskHandle_t captureTaskHandle = nullptr;
bool pinsValid = true;

struct NamedPin { const char* name; int number; };
bool checkPinAssignments() {
  // -1 is unassigned; any shared nonnegative pin requires an explicit redesign.
  const NamedPin p[] = {
    {"CAM_PWDN",Pins::CAM_PWDN},{"CAM_RESET",Pins::CAM_RESET},
    {"CAM_XCLK",Pins::CAM_XCLK},{"CAM_SDA",Pins::CAM_SDA},{"CAM_SCL",Pins::CAM_SCL},
    {"CAM_D0",Pins::CAM_D0},{"CAM_D1",Pins::CAM_D1},{"CAM_D2",Pins::CAM_D2},
    {"CAM_D3",Pins::CAM_D3},{"CAM_D4",Pins::CAM_D4},{"CAM_D5",Pins::CAM_D5},
    {"CAM_D6",Pins::CAM_D6},{"CAM_D7",Pins::CAM_D7},
    {"CAM_VSYNC",Pins::CAM_VSYNC},{"CAM_HREF",Pins::CAM_HREF},{"CAM_PCLK",Pins::CAM_PCLK},
    {"TFT_SCK",Pins::TFT_SCK},{"TFT_MOSI",Pins::TFT_MOSI},{"TFT_CS",Pins::TFT_CS},
    {"TFT_DC",Pins::TFT_DC},{"TFT_RST",Pins::TFT_RST},{"TFT_BL",Pins::TFT_BL},
    {"I2S_BCLK",Pins::I2S_BCLK},{"I2S_LRCK",Pins::I2S_LRCK},
    {"I2S_DOUT",Pins::I2S_DOUT},{"LED_GREEN",Pins::LED_GREEN},
    {"LED_RED",Pins::LED_RED},{"LED_YELLOW",Pins::LED_YELLOW},
    {"MICROBIT_TX",Pins::MICROBIT_TX},{"MICROBIT_RX",Pins::MICROBIT_RX}
  };
  bool ok = true;
  for (size_t i = 0; i < sizeof(p) / sizeof(p[0]); ++i) {
    const int gpio = p[i].number;
    if (gpio < 0) continue; // intentionally unassigned peripherals
    // N16R8: GPIO35-37 belong to 8 MB Octal PSRAM, GPIO19/20 to USB.
    // GPIO22-34 are not routed as user GPIOs on this WROOM-1 module.
    if (gpio == 19 || gpio == 20 || (gpio >= 22 && gpio <= 37) || gpio > 48) {
      Serial.printf("[GPIO] ERROR: %s uses GPIO%d; reserved/unavailable for this N16R8 project\n",
                    p[i].name, gpio);
      ok = false;
    }
    // Strapping pins may make the board fail to boot depending on attached hardware.
    if (gpio == 0 || gpio == 3 || gpio == 45 || gpio == 46) {
      Serial.printf("[GPIO] WARNING: %s uses strapping GPIO%d; check board schematic and boot levels\n",
                    p[i].name, gpio);
    }
  }
  for (size_t i = 0; i < sizeof(p) / sizeof(p[0]); ++i) {
    for (size_t j = i+1; j < sizeof(p) / sizeof(p[0]); ++j) {
      if (p[i].number >= 0 && p[i].number == p[j].number) {
        Serial.printf("[GPIO] COLLISION GPIO%d: %s and %s\n", p[i].number, p[i].name, p[j].name);
        ok = false;
      }
    }
  }
  if (!ok) Serial.println("[GPIO] Peripheral initialization blocked until collisions are resolved");
  return ok;
}

void captureWorker(void*) {
  uint32_t frameId = 0;
  uint32_t lastCapture = 0;
  uint32_t retryAfter = 0;
  uint32_t backoffMs = Settings::SERVER_RETRY_MIN_MS;
  const uint32_t periodMs = 1000UL / (Settings::TARGET_FPS ? Settings::TARGET_FPS : 1);
  Camera::camera.begin();
  Posture::posture.setCamera(Camera::camera.ready());

  for (;;) {
    const uint32_t now = millis();
    if (!Camera::camera.ready()) {
      Posture::posture.setCamera(false);
      Camera::camera.recover(now);
      Posture::posture.setCamera(Camera::camera.ready());
      vTaskDelay(pdMS_TO_TICKS(100));
      continue;
    }
    if ((uint32_t)(now - lastCapture) < periodMs) {
      vTaskDelay(pdMS_TO_TICKS(10));
      continue;
    }
    lastCapture = now;
    camera_fb_t* fb = Camera::camera.capture();
    if (!fb) {
      Posture::posture.setCamera(Camera::camera.ready());
      vTaskDelay(pdMS_TO_TICKS(50));
      continue;
    }
    ++frameId;
    Network::wifiManager.updateLatestFrame(fb);
    Communication::bleManager.notifyFrame(fb);
    if (Settings::BUILD_STAGE < 4) {
      // Stage 2/3 isolated camera test. Return the buffer on every path.
      Serial.printf("[CAMERA] frame=%lu %ux%u jpeg=%u B\n", (unsigned long)frameId,
                    (unsigned)fb->width, (unsigned)fb->height, (unsigned)fb->len);
    } else if (Network::wifiManager.connected() && (int32_t)(millis() - retryAfter) >= 0) {
      Network::Prediction result;
      // Only one HTTP frame in flight; latest-frame grab drops older captures.
      const Network::InferenceResult response = Network::aiClient.sendFrame(fb, frameId, result);
      if (response != Network::InferenceResult::ERROR) {
        Posture::posture.setAi(true);
        if (response == Network::InferenceResult::NO_DETECTION) {
          Posture::posture.noDetection();
          Serial.printf("[AI] frame=%lu: no posture detected\n", (unsigned long)frameId);
        } else {
          const bool accepted = Posture::posture.recordPrediction(
              result.frameId, result.classId, result.confidence);
          if (accepted) {
            Serial.printf("[POSTURE] %s confidence=%.3f frame=%lu\n",
                          result.classId == 0 ? "sitting_good" : "sitting_bad",
                          result.confidence, (unsigned long)result.frameId);
          }
        }
        backoffMs = Settings::SERVER_RETRY_MIN_MS;
        retryAfter = 0;
      } else {
        Posture::posture.setAi(false);
        retryAfter = millis() + backoffMs;
        backoffMs = (backoffMs >= Settings::SERVER_RETRY_MAX_MS / 2)
                        ? Settings::SERVER_RETRY_MAX_MS : backoffMs * 2;
        Serial.printf("[AI] Offline, reconnect after %lums\n", (unsigned long)backoffMs);
      }
    }
    Camera::camera.release(fb);
    vTaskDelay(pdMS_TO_TICKS(1));
  }
}

void logDiagnostics(uint32_t ms) {
  static uint32_t last = 0;
  if ((uint32_t)(ms - last) < 5000) return;
  last = ms;
  const auto s = Posture::posture.snapshot(ms);
  Serial.printf("[HEALTH] uptime=%lus heap=%u psram_free=%u state=%s wifi=%d frame=%lu\n",
      (unsigned long)(ms / 1000), (unsigned)ESP.getFreeHeap(),
      (unsigned)ESP.getFreePsram(), Posture::stateName(s.state),
      s.wifiReady, (unsigned long)s.frameId);
}
} // namespace

void setup() {
  Serial.begin(Settings::SERIAL_BAUD);
  // USB CDC Serial On Boot must be enabled in Tools for native USB on many S3 boards.
  Serial.println("\n[BOOT] ESP32-S3 Posture Detector");
  const uint32_t flashBytes = ESP.getFlashChipSize();
  const uint32_t psramBytes = ESP.getPsramSize();
  Serial.printf("[BOOT] module=%s stage=%u flash=%u PSRAM=%u present=%d\n",
                Settings::MODULE_NAME, Settings::BUILD_STAGE,
                (unsigned)flashBytes, (unsigned)psramBytes, psramFound());
  if (flashBytes != Settings::EXPECTED_FLASH_BYTES) {
    Serial.println("[BOOT] WARNING: expected 16 MB QSPI Flash. Set Flash Size=16MB and Flash Mode=QIO.");
  }
  if (psramBytes != Settings::EXPECTED_PSRAM_BYTES || !psramFound()) {
    Serial.println("[BOOT] WARNING: expected 8 MB Octal PSRAM. Set Tools > PSRAM > OPI PSRAM.");
  }
  pinsValid = checkPinAssignments();
  Communication::bleManager.begin();
  if (Settings::BUILD_STAGE == 1) {
    Serial.println("[BOOT] Stage 1 only: serial + BLE startup/diagnostics; no peripheral GPIO required");
    return;
  }
  if (!pinsValid) return;
  if (Settings::BUILD_STAGE >= 3) Network::wifiManager.begin();
  if (Settings::BUILD_STAGE >= 6) Display::display.begin();
  if (Settings::BUILD_STAGE >= 7) Audio::audio.begin();
  if (Settings::BUILD_STAGE >= 8) Indicators::leds.begin();
  if (Settings::BUILD_STAGE >= 9) Communication::microbit.begin();
  if (Settings::BUILD_STAGE >= 2) {
    const BaseType_t started = xTaskCreatePinnedToCore(
      captureWorker, "capture_http", 10240, nullptr, 1, &captureTaskHandle, 1);
    if (started != pdPASS) {
      Serial.println("[BOOT] FATAL: failed to create capture task");
      Posture::posture.setCamera(false);
    }
  }
}

void loop() {
  const uint32_t now = millis();
  Communication::bleManager.tick(now);
  if (Settings::BUILD_STAGE == 1 || !pinsValid) {
    logDiagnostics(now);
    vTaskDelay(pdMS_TO_TICKS(20));
    return;
  }
  if (Settings::BUILD_STAGE >= 3) {
    Network::wifiManager.tick(now);
    Posture::posture.setWifi(Network::wifiManager.connected());
  }
  const auto status = Posture::posture.snapshot(now);
  if (Settings::BUILD_STAGE >= 6) Display::display.tick(status, now);
  if (Settings::BUILD_STAGE >= 8) Indicators::leds.tick(status, now);
  if (Settings::BUILD_STAGE >= 9) Communication::microbit.tick();
  if (Settings::BUILD_STAGE >= 7 && Audio::audio.ready() && Posture::posture.claimAlarmIfDue(now)) {
    Audio::audio.requestWarning();
    Serial.println("[AUDIO] Warning activated");
  }
  logDiagnostics(now);
  vTaskDelay(pdMS_TO_TICKS(20));
}
