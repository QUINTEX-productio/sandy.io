#pragma once
#include <Arduino.h>
#include "esp_camera.h"
namespace Network {
struct Prediction {
  uint32_t frameId = 0;
  uint8_t classId = 0;
  float confidence = 0;
  uint64_t timestamp = 0;
};
enum class InferenceResult : uint8_t { PREDICTION, NO_DETECTION, ERROR };
class AiClient {
public:
  InferenceResult sendFrame(const camera_fb_t* frame, uint32_t frameId, Prediction& result);
  bool configured() const;
private:
  bool parseResponse(const String& body, uint32_t expectedFrameId, Prediction& out);
};
extern AiClient aiClient;
}
