#pragma once
#include <Arduino.h>
#if __has_include("secrets.h")
  #include "secrets.h"  // Local overrides; ignored by Git.
#else
  #include "secrets.example.h"
#endif

// Target: ESP32-S3-WROOM-1-N16R8 (16 MB QSPI Flash + 8 MB OPI PSRAM).
// Module marking does NOT establish the dev board/OV5640 wiring.
// Replace -1 only after checking your specific development board schematic.
// Native USB: GPIO19 (D-) and GPIO20 (D+) are kept clear.
// N16R8's OPI PSRAM uses GPIO35, GPIO36 and GPIO37; never allocate them.
#if !defined(CONFIG_IDF_TARGET_ESP32S3)
  #error "Choose an ESP32-S3 board profile (e.g. ESP32S3 Dev Module) in Arduino IDE."
#endif
namespace Pins {
  constexpr int UNUSED = -1;
  // OV5640 DVP interface. PWDN and RESET may remain -1 if not wired.
  constexpr int CAM_PWDN  = -1;
  constexpr int CAM_RESET = -1;
  constexpr int CAM_XCLK  = -1;
  constexpr int CAM_SDA   = -1;  // SCCB SDA
  constexpr int CAM_SCL   = -1;  // SCCB SCL
  constexpr int CAM_D0    = -1;
  constexpr int CAM_D1    = -1;
  constexpr int CAM_D2    = -1;
  constexpr int CAM_D3    = -1;
  constexpr int CAM_D4    = -1;
  constexpr int CAM_D5    = -1;
  constexpr int CAM_D6    = -1;
  constexpr int CAM_D7    = -1;
  constexpr int CAM_VSYNC = -1;
  constexpr int CAM_HREF  = -1;
  constexpr int CAM_PCLK  = -1;

  // ST7789 SPI. CS/RST may remain -1 if hardware is wired appropriately.
  constexpr int TFT_SCK  = -1;
  constexpr int TFT_MOSI = -1;
  constexpr int TFT_CS   = -1;
  constexpr int TFT_DC   = -1;
  constexpr int TFT_RST  = -1;
  constexpr int TFT_BL   = -1; // optional backlight enable, not PWM

  // MAX98357A I2S standard transmit (no MCLK required).
  constexpr int I2S_BCLK = -1;
  constexpr int I2S_LRCK = -1;
  constexpr int I2S_DOUT = -1;

  constexpr int LED_GREEN  = -1;
  constexpr int LED_RED    = -1;
  constexpr int LED_YELLOW = -1;

  // ESP TX -> micro:bit RX and ESP RX <- micro:bit TX; common GND.
  constexpr int MICROBIT_TX = -1;
  constexpr int MICROBIT_RX = -1;
}

namespace Settings {
  constexpr char MODULE_NAME[] = "ESP32-S3-WROOM-1-N16R8";
  constexpr uint32_t EXPECTED_FLASH_BYTES = 16UL * 1024UL * 1024UL;
  constexpr uint32_t EXPECTED_PSRAM_BYTES = 8UL * 1024UL * 1024UL;
  // 1 serial, 2 camera, 3 Wi-Fi, 4 test stream, 5 AI, 6 TFT,
  // 7 audio, 8 LEDs, 9 micro:bit, 10 integrated, 11 soak test.
  constexpr uint8_t BUILD_STAGE = 1; // Start with serial; advance stage by stage
  constexpr uint32_t SERIAL_BAUD = 115200;
  constexpr uint32_t CAMERA_XCLK_HZ = 20000000;
  constexpr uint8_t CAMERA_JPEG_QUALITY = 12; // 0=best, 63=worst
  constexpr uint8_t CAMERA_BUFFER_COUNT = 2;
  constexpr uint8_t TARGET_FPS = 3; // target; actual is limited by upload+inference
  constexpr uint32_t CAMERA_RETRY_MS = 10000;
  constexpr uint8_t CAMERA_FAILS_BEFORE_REINIT = 4;
  constexpr uint32_t WIFI_RETRY_MS = 5000;
  constexpr uint32_t WIFI_CONNECT_TIMEOUT_MS = 12000;
  constexpr uint32_t HTTP_TIMEOUT_MS = 2500;
  constexpr uint32_t SERVER_RETRY_MIN_MS = 1000;
  constexpr uint32_t SERVER_RETRY_MAX_MS = 10000;
  constexpr size_t MAX_RESPONSE_BYTES = 1024;
  constexpr float CONFIDENCE_THRESHOLD = 0.70f;
  constexpr uint8_t BAD_CONFIRMATIONS = 3;
  constexpr uint32_t ALARM_COOLDOWN_MS = 15000;
  constexpr uint32_t PREDICTION_STALE_MS = 7000;
  constexpr uint32_t DISPLAY_INTERVAL_MS = 300;
  constexpr uint32_t LED_BLINK_MS = 400;
  constexpr uint32_t AUDIO_SAMPLE_RATE = 16000;
  constexpr uint16_t AUDIO_TONE_HZ = 740;
  constexpr float AUDIO_VOLUME = 0.18f; // digital PCM gain, from 0.0 to 1.0
  constexpr uint32_t MICROBIT_BAUD = 9600;
  constexpr uint32_t MICROBIT_IDLE_REPORT_MS = 0; // status is request/response only
  constexpr uint8_t DISPLAY_ROTATION = 0;
  constexpr bool LED_ACTIVE_HIGH = true;
  constexpr bool TFT_BL_ACTIVE_HIGH = true;
  constexpr char DEVICE_ID[] = "posture-esp32s3-01";
  // All three values are defined in secrets.example.h or secrets.h
  inline const char* wifiSsid() { return POSTURE_WIFI_SSID; }
  inline const char* wifiPassword() { return POSTURE_WIFI_PASSWORD; }
  inline const char* aiBaseUrl() { return POSTURE_AI_BASE_URL; }
  inline const char* apiToken() { return POSTURE_API_TOKEN; }
  inline const char* tlsRootCa() { return POSTURE_TLS_ROOT_CA; }
}
