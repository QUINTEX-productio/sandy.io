#pragma once
#include <Arduino.h>
#include "../posture/posture_manager.h"
namespace Indicators {
class LedManager {
public:
  void begin();
  void tick(const Posture::Snapshot& status, uint32_t nowMs);
private:
  bool available_ = false;
  bool lastG_ = false, lastR_ = false, lastY_ = false;
  void writeIfChanged(int pin, bool state, bool& last);
};
extern LedManager leds;
}
