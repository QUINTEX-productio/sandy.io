#pragma once
#include <Arduino.h>
#include <ESP_I2S.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
namespace Audio {
class Manager {
public:
  bool begin();
  void requestWarning(); // queues one warning, nonblocking
  bool ready() const { return ready_; }
private:
  I2SClass i2s_;
  portMUX_TYPE lock_ = portMUX_INITIALIZER_UNLOCKED;
  bool ready_ = false, pending_ = false, playing_ = false;
  static void taskEntry(void* arg);
  void worker();
  void playTone(uint16_t freqHz, uint32_t ms);
};
extern Manager audio;
}
