#pragma once
#include <Arduino.h>
#include "../posture/posture_manager.h"
namespace Display {
class Manager {
public:
  bool begin();
  void tick(const Posture::Snapshot& status, uint32_t nowMs);
private:
  bool ready_ = false;
  uint32_t lastUpdate_ = 0;
  char cached_[7][46] = {};
  uint16_t cachedColor_[7] = {};
  uint8_t cachedSize_[7] = {};
  void drawLine(uint8_t row, const char* text, uint16_t fg, uint8_t textSize = 2);
};
extern Manager display;
}
