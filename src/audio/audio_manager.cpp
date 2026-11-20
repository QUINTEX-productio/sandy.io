#include "audio_manager.h"
#include "../config/config.h"
#include <math.h>
namespace Audio {
Manager audio;
bool Manager::begin() {
  if (Pins::I2S_BCLK < 0 || Pins::I2S_LRCK < 0 || Pins::I2S_DOUT < 0) {
    Serial.println("[AUDIO] Disabled: I2S pins missing");
    return false;
  }
  i2s_.setPins(Pins::I2S_BCLK, Pins::I2S_LRCK, Pins::I2S_DOUT);
  if (!i2s_.begin(I2S_MODE_STD, Settings::AUDIO_SAMPLE_RATE,
                   I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO)) {
    Serial.printf("[AUDIO] I2S begin failed, code=%d\n", i2s_.lastError());
    return false;
  }
  BaseType_t r = xTaskCreate(taskEntry, "audio", 4096, this, 1, nullptr);
  if (r != pdPASS) {
    Serial.println("[AUDIO] task allocation failed");
    i2s_.end();
    return false;
  }
  ready_ = true;
  Serial.println("[AUDIO] MAX98357A I2S ready");
  return true;
}
void Manager::requestWarning() {
  portENTER_CRITICAL(&lock_);
  if (ready_ && !pending_ && !playing_) pending_ = true;
  portEXIT_CRITICAL(&lock_);
}
void Manager::taskEntry(void* arg) { static_cast<Manager*>(arg)->worker(); }
void Manager::worker() {
  while (true) {
    bool play = false;
    portENTER_CRITICAL(&lock_);
    if (pending_) { pending_ = false; playing_ = true; play = true; }
    portEXIT_CRITICAL(&lock_);
    if (play) {
      playTone(Settings::AUDIO_TONE_HZ, 160);
      // silence between the two beeps; only this dedicated task is delayed
      playTone(0, 120);
      playTone(Settings::AUDIO_TONE_HZ, 160);
      playTone(0, 30);
      portENTER_CRITICAL(&lock_);
      playing_ = false;
      portEXIT_CRITICAL(&lock_);
      Serial.println("[AUDIO] Warning completed");
    } else vTaskDelay(pdMS_TO_TICKS(20));
  }
}
void Manager::playTone(uint16_t hz, uint32_t durationMs) {
  constexpr size_t framesPerChunk = 128;
  int16_t pcm[framesPerChunk * 2]; // stereo interleaved: MAX98357A can select either channel
  const uint32_t sampleCount = Settings::AUDIO_SAMPLE_RATE * durationMs / 1000;
  const int16_t peak = (int16_t)(32767.f * Settings::AUDIO_VOLUME);
  uint32_t sent = 0;
  while (sent < sampleCount) {
    const size_t count = min((uint32_t)framesPerChunk, sampleCount - sent);
    for (size_t i = 0; i < count; i++) {
      const float phase = 6.283185307f * hz * (sent + i) / Settings::AUDIO_SAMPLE_RATE;
      const int16_t value = hz ? (int16_t)(peak * sinf(phase)) : 0;
      pcm[2 * i] = value;
      pcm[2 * i + 1] = value;
    }
    if (i2s_.write(pcm, count * 2 * sizeof(int16_t)) != count * 2 * sizeof(int16_t)) {
      Serial.println("[AUDIO] short I2S write");
      break;
    }
    sent += count;
    taskYIELD();
  }
}
}
