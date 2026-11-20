#include "microbit_uart.h"
#include "../config/config.h"
#include <ArduinoJson.h>
#include <string.h>

namespace Communication {
MicrobitUart microbit;

void MicrobitUart::begin() {
  if (Pins::MICROBIT_TX < 0 || Pins::MICROBIT_RX < 0) {
    Serial.println("[UART] Disabled: micro:bit TX/RX GPIO unassigned");
    return;
  }
  uart_.begin(Settings::MICROBIT_BAUD, SERIAL_8N1, Pins::MICROBIT_RX, Pins::MICROBIT_TX);
  ready_ = true;
  Serial.println("[UART] micro:bit link ready, optional device may be absent");
}

void MicrobitUart::tick() {
  if (!ready_) return;
  // Keep UART processing bounded so display/network scheduling stays responsive.
  for (uint16_t i = 0; i < 96 && uart_.available(); ++i) {
    const char c = static_cast<char>(uart_.read());
    if (c == '\r') continue;
    if (c == '\n') {
      if (!overflow_ && length_ != 0) {
        line_[length_] = '\0';
        handleLine();
      } else if (overflow_) Serial.println("[UART] Dropped oversized line");
      length_ = 0;
      overflow_ = false;
      continue;
    }
    if (overflow_) continue;
    if (length_ + 1 >= sizeof(line_)) {
      overflow_ = true;
      length_ = 0;
    } else line_[length_++] = c;
  }
}

void MicrobitUart::handleLine() {
  JsonDocument doc;
  if (deserializeJson(doc, line_) || !doc.is<JsonObject>()) {
    Serial.println("[UART] Invalid JSON"); return;
  }
  if (!doc["device"].is<const char*>() || strcmp(doc["device"].as<const char*>(), "microbit") != 0 ||
      !doc["event"].is<const char*>()) {
    Serial.println("[UART] Invalid device/event"); return;
  }
  const char* event = doc["event"].as<const char*>();
  if (strcmp(event, "get_status") == 0) {
    sendStatus();
  } else if (strcmp(event, "button_a") == 0 && doc["value"].is<int>() && doc["value"].as<int>() == 1) {
    Posture::posture.toggleMuted();
    sendStatus();
  } else if (strcmp(event, "button_b") == 0 && doc["value"].is<int>() && doc["value"].as<int>() == 1) {
    sendStatus();
  } else if (strcmp(event, "mute") == 0 && doc["value"].is<int>() &&
             (doc["value"].as<int>() == 0 || doc["value"].as<int>() == 1)) {
    Posture::posture.setMuted(doc["value"].as<int>() == 1);
    sendStatus();
  } else {
    Serial.println("[UART] Unknown/invalid event");
  }
}

void MicrobitUart::sendStatus() {
  const auto s = Posture::posture.snapshot(millis());
  // One complete JSON line; no buffer accumulation if micro:bit disconnects.
  uart_.printf("{\"device\":\"esp32\",\"event\":\"status\",\"state\":\"%s\",\"confidence\":%.3f,\"muted\":%s}\n",
               Posture::stateName(s.state), s.confidence, s.muted ? "true" : "false");
}
}
