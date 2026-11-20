#pragma once
#include <Arduino.h>
#include <HardwareSerial.h>
#include "../posture/posture_manager.h"

namespace Communication {
class MicrobitUart {
public:
  void begin();
  void tick(); // bounded, non-blocking, call from loop()
  bool ready() const { return ready_; }
private:
  HardwareSerial uart_{1};
  bool ready_ = false;
  char line_[192] = {};
  size_t length_ = 0;
  bool overflow_ = false;
  void handleLine();
  void sendStatus();
};
extern MicrobitUart microbit;
}
