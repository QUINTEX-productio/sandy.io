#include "display_manager.h"
#include "../config/config.h"
#include <SPI.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ST7789.h>
#include <stdio.h>
#include <string.h>
namespace Display {
Manager display;
static Adafruit_ST7789 tft(&SPI, Pins::TFT_CS, Pins::TFT_DC, Pins::TFT_RST);
bool Manager::begin() {
  if (Pins::TFT_SCK < 0 || Pins::TFT_MOSI < 0 || Pins::TFT_DC < 0) {
    Serial.println("[DISPLAY] Disabled: SPI/DC GPIO mapping missing");
    return false;
  }
  if (Pins::TFT_BL >= 0) {
    pinMode(Pins::TFT_BL, OUTPUT);
    digitalWrite(Pins::TFT_BL, Settings::TFT_BL_ACTIVE_HIGH ? HIGH : LOW);
  }
  SPI.begin(Pins::TFT_SCK, -1, Pins::TFT_MOSI, Pins::TFT_CS);
  tft.init(240, 240);
  tft.setRotation(Settings::DISPLAY_ROTATION);
  tft.fillScreen(ST77XX_BLACK);
  tft.setTextWrap(false);
  tft.setTextSize(2);
  tft.setTextColor(ST77XX_CYAN);
  tft.setCursor(12, 7);
  tft.print("POSTURE DETECTOR");
  tft.drawFastHLine(6, 32, 228, ST77XX_BLUE);
  tft.drawFastHLine(6, 181, 228, ST77XX_BLUE);
  ready_ = true;
  Serial.println("[DISPLAY] ST7789 initialized");
  return true;
}
void Manager::drawLine(uint8_t row, const char* str, uint16_t fg, uint8_t size) {
  // Only draw the changed row, never redraw the entire 240x240 framebuffer.
  if (strncmp(cached_[row], str, sizeof(cached_[row])) == 0 && cachedColor_[row] == fg && cachedSize_[row] == size) return;
  cachedColor_[row] = fg;
  cachedSize_[row] = size;
  snprintf(cached_[row], sizeof(cached_[row]), "%s", str);
  const int y[] = {42, 63, 84, 111, 141, 188, 211};
  tft.fillRect(6, y[row], 228, 20, ST77XX_BLACK);
  tft.setCursor(8, y[row] + 2);
  tft.setTextColor(fg);
  tft.setTextSize(size);
  tft.print(str);
}
void Manager::tick(const Posture::Snapshot& s, uint32_t ms) {
  if (!ready_ || (uint32_t)(ms - lastUpdate_) < Settings::DISPLAY_INTERVAL_MS) return;
  lastUpdate_ = ms;
  drawLine(0, s.cameraReady ? "CAM: ONLINE" : "CAM: ERROR", s.cameraReady ? ST77XX_GREEN : ST77XX_RED);
  drawLine(1, s.wifiReady ? "WIFI: CONNECTED" : "WIFI: OFFLINE", s.wifiReady ? ST77XX_GREEN : ST77XX_YELLOW, 1);
  drawLine(2, s.aiReady ? "AI: ONLINE" : "AI: OFFLINE", s.aiReady ? ST77XX_GREEN : ST77XX_YELLOW);
  const char* postureText = Posture::stateName(s.state);
  uint16_t color = ST77XX_YELLOW;
  if (s.state == Posture::State::SITTING_GOOD) color = ST77XX_GREEN;
  if (s.state == Posture::State::SITTING_BAD || s.state == Posture::State::CAMERA_ERROR) color = ST77XX_RED;
  drawLine(3, "POSTURE STATUS", ST77XX_WHITE, 1);
  drawLine(4, postureText, color, strlen(postureText) > 16 ? 1 : 2);
  char confidence[46];
  if (s.state == Posture::State::SITTING_GOOD || s.state == Posture::State::SITTING_BAD || s.state == Posture::State::ANALYZING)
    snprintf(confidence, sizeof(confidence), "Confidence: %.0f%%", s.confidence * 100.f);
  else snprintf(confidence, sizeof(confidence), "Confidence: --");
  drawLine(5, confidence, ST77XX_WHITE, 1);
  drawLine(6, s.muted ? "ALARM: MUTED" : (s.warning ? "WARNING: POSTURE" : "WARNING: NONE"),
           s.warning ? ST77XX_RED : ST77XX_CYAN, 1);
}
}
