#pragma once
#include <Arduino.h>
#include "esp_camera.h"
namespace Camera {
class Manager {
public:
  bool begin();
  bool recover(uint32_t nowMs);
  camera_fb_t* capture(); // caller MUST call release(), including on HTTP error
  void release(camera_fb_t* frame);
  bool ready() const { return ready_; }
  bool configured() const;
private:
  bool ready_ = false;
  uint8_t failures_ = 0;
  uint32_t retryAfterMs_ = 0;
};
extern Manager camera;
}
