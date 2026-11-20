#include "led_manager.h"
#include "../config/config.h"
namespace Indicators {
LedManager leds;
void LedManager::begin() {
  const int gpio[] = {Pins::LED_GREEN, Pins::LED_RED, Pins::LED_YELLOW};
  for (int p : gpio) {
    if (p >= 0) {
      digitalWrite(p, Settings::LED_ACTIVE_HIGH ? LOW : HIGH);
      pinMode(p, OUTPUT);
      available_ = true;
    }
  }
  if (!available_) Serial.println("[LED] Disabled: no GPIO configured");
}
void LedManager::writeIfChanged(int pin, bool state, bool& last) {
  if (pin >= 0 && state != last) {
    digitalWrite(pin, (state == Settings::LED_ACTIVE_HIGH) ? HIGH : LOW);
    last = state;
  }
}
void LedManager::tick(const Posture::Snapshot& s, uint32_t ms) {
  if (!available_) return;
  const bool blinking = (ms / Settings::LED_BLINK_MS) % 2 == 0;
  const bool green = s.state == Posture::State::SITTING_GOOD;
  const bool red = s.state == Posture::State::SITTING_BAD;
  const bool yellow = !green && !red && blinking;
  writeIfChanged(Pins::LED_GREEN, green, lastG_);
  writeIfChanged(Pins::LED_RED, red, lastR_);
  writeIfChanged(Pins::LED_YELLOW, yellow, lastY_);
}
}
