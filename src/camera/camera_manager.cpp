#include "camera_manager.h"
#include "../config/config.h"
namespace Camera {
Manager camera;
bool Manager::configured() const {
  const int p[] = {Pins::CAM_XCLK,Pins::CAM_SDA,Pins::CAM_SCL,Pins::CAM_D0,
    Pins::CAM_D1,Pins::CAM_D2,Pins::CAM_D3,Pins::CAM_D4,Pins::CAM_D5,
    Pins::CAM_D6,Pins::CAM_D7,Pins::CAM_VSYNC,Pins::CAM_HREF,Pins::CAM_PCLK};
  for (int pin : p) if (pin < 0) return false;
  return true;
}
bool Manager::begin() {
  if (!configured()) { Serial.println("[CAMERA] DISABLED: DVP GPIO mapping missing"); return false; }
  if (!psramFound()) { Serial.println("[CAMERA] ERROR: PSRAM missing/disabled"); retryAfterMs_ = millis() + Settings::CAMERA_RETRY_MS; return false; }
  camera_config_t c = {};
  c.pin_pwdn = Pins::CAM_PWDN;
  c.pin_reset = Pins::CAM_RESET;
  c.pin_xclk = Pins::CAM_XCLK;
  c.pin_sccb_sda = Pins::CAM_SDA;
  c.pin_sccb_scl = Pins::CAM_SCL;
  c.pin_d0 = Pins::CAM_D0; c.pin_d1 = Pins::CAM_D1;
  c.pin_d2 = Pins::CAM_D2; c.pin_d3 = Pins::CAM_D3;
  c.pin_d4 = Pins::CAM_D4; c.pin_d5 = Pins::CAM_D5;
  c.pin_d6 = Pins::CAM_D6; c.pin_d7 = Pins::CAM_D7;
  c.pin_vsync = Pins::CAM_VSYNC;
  c.pin_href = Pins::CAM_HREF;
  c.pin_pclk = Pins::CAM_PCLK;
  c.xclk_freq_hz = Settings::CAMERA_XCLK_HZ;
  c.ledc_timer = LEDC_TIMER_0;
  c.ledc_channel = LEDC_CHANNEL_0;
  c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size = FRAMESIZE_VGA; // 640x480
  c.jpeg_quality = Settings::CAMERA_JPEG_QUALITY;
  c.fb_count = Settings::CAMERA_BUFFER_COUNT;
  c.fb_location = CAMERA_FB_IN_PSRAM;
  c.grab_mode = CAMERA_GRAB_LATEST;
  const esp_err_t result = esp_camera_init(&c);
  ready_ = (result == ESP_OK);
  if (ready_) {
    failures_ = 0;
    Serial.printf("[CAMERA] OV5640/JPEG VGA ready; PSRAM=%u bytes\n", (unsigned)ESP.getPsramSize());
  } else {
    Serial.printf("[CAMERA] init error: 0x%04x\n", (unsigned)result);
    retryAfterMs_ = millis() + Settings::CAMERA_RETRY_MS;
  }
  return ready_;
}
camera_fb_t* Manager::capture() {
  if (!ready_) return nullptr;
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb || fb->format != PIXFORMAT_JPEG || fb->len == 0) {
    if (fb) esp_camera_fb_return(fb);
    if (failures_ < 255) ++failures_;
    Serial.printf("[CAMERA] capture failed (%u)\n", failures_);
    if (failures_ >= Settings::CAMERA_FAILS_BEFORE_REINIT) {
      ready_ = false;
      retryAfterMs_ = millis() + Settings::CAMERA_RETRY_MS;
    }
    return nullptr;
  }
  failures_ = 0;
  return fb;
}
void Manager::release(camera_fb_t* fb) { if (fb) esp_camera_fb_return(fb); }
bool Manager::recover(uint32_t nowMs) {
  if (ready_) return true;
  if (!configured() || (int32_t)(nowMs - retryAfterMs_) < 0) return false;
  esp_camera_deinit(); // safe after capture task has returned all buffers
  return begin();
}
}
