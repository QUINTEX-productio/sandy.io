#include "posture_manager.h"
#include "../config/config.h"
#include <math.h>
namespace Posture {
Manager posture;
const char* stateName(State s) {
  switch(s) {
    case State::INITIALIZING: return "INITIALIZING";
    case State::CAMERA_READY: return "CAMERA_READY";
    case State::CONNECTING_WIFI: return "CONNECTING_WIFI";
    case State::CONNECTING_AI: return "CONNECTING_AI";
    case State::ANALYZING: return "ANALYZING";
    case State::SITTING_GOOD: return "SITTING_GOOD";
    case State::SITTING_BAD: return "SITTING_BAD";
    case State::SERVER_OFFLINE: return "SERVER_OFFLINE";
    case State::CAMERA_ERROR: return "CAMERA_ERROR";
  }
  return "UNKNOWN";
}
void Manager::setCamera(bool ok) {
  portENTER_CRITICAL(&lock_);
  camera_ = ok;
  if (!ok) { havePrediction_ = false; badStreak_ = 0; stableClass_ = -1; }
  portEXIT_CRITICAL(&lock_);
}
void Manager::setWifi(bool ok) {
  portENTER_CRITICAL(&lock_);
  wifi_ = ok;
  if (!ok) { ai_ = false; havePrediction_ = false; badStreak_ = 0; stableClass_ = -1; }
  portEXIT_CRITICAL(&lock_);
}
void Manager::setAi(bool ok) {
  portENTER_CRITICAL(&lock_);
  ai_ = ok;
  if (ok) everAi_ = true;
  if (!ok) { havePrediction_ = false; badStreak_ = 0; stableClass_ = -1; }
  portEXIT_CRITICAL(&lock_);
}
bool Manager::recordPrediction(uint32_t id, uint8_t cls, float conf) {
  if ((cls != 0 && cls != 1) || !isfinite(conf) || conf < 0 || conf > 1 || id == 0) return false;
  portENTER_CRITICAL(&lock_);
  if (id <= lastFrameId_ || !wifi_ || !camera_) {
    portEXIT_CRITICAL(&lock_);
    return false;
  }
  lastFrameId_ = id;
  lastPredictionMs_ = millis();
  havePrediction_ = true;
  ai_ = true;
  everAi_ = true;
  confidence_ = conf;
  if (conf < Settings::CONFIDENCE_THRESHOLD) {
    badStreak_ = 0;
    stableClass_ = -1;
  } else if (cls == 0) {
    badStreak_ = 0;
    stableClass_ = 0;
    lastAlarmMs_ = 0;
  } else {
    if (badStreak_ < 255) ++badStreak_;
    stableClass_ = badStreak_ >= Settings::BAD_CONFIRMATIONS ? 1 : -1;
  }
  portEXIT_CRITICAL(&lock_);
  return true;
}
void Manager::noDetection() {
  portENTER_CRITICAL(&lock_);
  ai_ = true;
  everAi_ = true;
  havePrediction_ = false;
  badStreak_ = 0;
  stableClass_ = -1;
  portEXIT_CRITICAL(&lock_);
}
State Manager::computeState(uint32_t nowMs) const {
  if (Settings::BUILD_STAGE <= 1) return State::INITIALIZING;
  if (!camera_) return State::CAMERA_ERROR;
  if (Settings::BUILD_STAGE == 2) return State::CAMERA_READY;
  if (!wifi_) return State::CONNECTING_WIFI;
  if (!ai_) return everAi_ ? State::SERVER_OFFLINE : State::CONNECTING_AI;
  if (!havePrediction_) return everAi_ ? State::ANALYZING : State::CONNECTING_AI;
  if ((uint32_t)(nowMs - lastPredictionMs_) > Settings::PREDICTION_STALE_MS)
    return State::SERVER_OFFLINE;
  if (stableClass_ == 0) return State::SITTING_GOOD;
  if (stableClass_ == 1) return State::SITTING_BAD;
  return State::ANALYZING;
}
Snapshot Manager::snapshot(uint32_t nowMs) {
  portENTER_CRITICAL(&lock_);
  State state = computeState(nowMs);
  Snapshot x{state, camera_, wifi_, ai_ && state != State::SERVER_OFFLINE,
             state == State::SITTING_BAD && !muted_, muted_, confidence_,
             lastFrameId_, badStreak_};
  portEXIT_CRITICAL(&lock_);
  return x;
}
bool Manager::claimAlarmIfDue(uint32_t nowMs) {
  portENTER_CRITICAL(&lock_);
  const bool due = computeState(nowMs) == State::SITTING_BAD && !muted_ &&
    (lastAlarmMs_ == 0 || (uint32_t)(nowMs - lastAlarmMs_) >= Settings::ALARM_COOLDOWN_MS);
  if (due) lastAlarmMs_ = nowMs ? nowMs : 1;
  portEXIT_CRITICAL(&lock_);
  return due;
}
void Manager::setMuted(bool x) { portENTER_CRITICAL(&lock_); muted_ = x; portEXIT_CRITICAL(&lock_); }
void Manager::toggleMuted() { portENTER_CRITICAL(&lock_); muted_ = !muted_; portEXIT_CRITICAL(&lock_); }
}
