#pragma once
#include <Arduino.h>
#include "freertos/FreeRTOS.h"

namespace Posture {
enum class State : uint8_t {
  INITIALIZING, CAMERA_READY, CONNECTING_WIFI, CONNECTING_AI, ANALYZING,
  SITTING_GOOD, SITTING_BAD, SERVER_OFFLINE, CAMERA_ERROR
};
const char* stateName(State s);
struct Snapshot {
  State state;
  bool cameraReady;
  bool wifiReady;
  bool aiReady;
  bool warning;
  bool muted;
  float confidence;
  uint32_t frameId;
  uint8_t badStreak;
};
class Manager {
public:
  void setCamera(bool online);
  void setWifi(bool online);
  void setAi(bool online);
  bool recordPrediction(uint32_t id, uint8_t classId, float confidence);
  void noDetection(); // AI online; image contains no usable posture result
  bool claimAlarmIfDue(uint32_t nowMs);
  void setMuted(bool muted);
  void toggleMuted();
  Snapshot snapshot(uint32_t nowMs);
private:
  State computeState(uint32_t nowMs) const;
  mutable portMUX_TYPE lock_ = portMUX_INITIALIZER_UNLOCKED;
  bool camera_ = false, wifi_ = false, ai_ = false, everAi_ = false;
  bool muted_ = false, havePrediction_ = false;
  uint8_t badStreak_ = 0;
  int8_t stableClass_ = -1;
  float confidence_ = 0;
  uint32_t lastFrameId_ = 0, lastPredictionMs_ = 0, lastAlarmMs_ = 0;
};
extern Manager posture;
}
