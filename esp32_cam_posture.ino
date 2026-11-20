/**
 * PostureAI - ESP32-CAM Plug & Play Sketch (USB Cable + Built-in Hotspot + Optional Wi-Fi)
 * -----------------------------------------------------------------------------------------
 * NO HOME WI-FI REQUIRED! Works out-of-the-box in 2 direct device modes:
 *
 *   MODE 1: USB Cable into Laptop (Default - Zero Wi-Fi needed!)
 *     - Just plug the ESP32-CAM into your laptop via USB cable.
 *     - Open your GitHub Pages website in Chrome/Edge -> click "Start Monitor"
 *       -> select your ESP32 USB COM port!
 *     - The ESP32 sends live frames (`FRAME:<base64>`) over USB and buzzes when
 *       the website sends `BUZZ\n`.
 *
 *   MODE 2: ESP32 Built-in Hotspot (Connect Phone or Laptop directly to ESP32)
 *     - The ESP32 creates its own Wi-Fi network: "PostureAI-CAM" (Password: "12345678")
 *     - Serves live snapshots with CORS at: http://192.168.4.1/capture
 */

#include <WiFi.h>
#include <WebServer.h>
#include "esp_camera.h"
#include "mbedtls/base64.h"

// Built-in ESP32 Hotspot Name & Password (for direct phone/laptop connection)
const char* AP_SSID     = "PostureAI-CAM";
const char* AP_PASSWORD = "12345678";

// Hardware Alert Pin (Piezo Buzzer or LED)
#define BUZZER_PIN 12
#define STATUS_LED 33 // Built-in red LED on back of AI-Thinker ESP32-CAM (active LOW)

// AI-Thinker ESP32-CAM Pin Map
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

WebServer server(80);
unsigned long lastSerialFrameMs = 0;

void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // QVGA (320x240) for fast USB Serial & Hotspot streaming
  config.frame_size   = FRAMESIZE_QVGA;
  config.jpeg_quality = 14;
  config.fb_count     = psramFound() ? 2 : 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    delay(2000);
    ESP.restart();
  }
}

String encodeBase64(const uint8_t* data, size_t len) {
  size_t outLen = 0;
  mbedtls_base64_encode(NULL, 0, &outLen, data, len);
  char* buf = (char*)malloc(outLen + 1);
  if (!buf) return "";
  mbedtls_base64_encode((unsigned char*)buf, outLen, &outLen, data, len);
  buf[outLen] = '\0';
  String result(buf);
  free(buf);
  return result;
}

// HTTP endpoint http://192.168.4.1/capture (with CORS for browser access)
void handleCapture() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Cache-Control", "no-store");
  server.send_P(200, "image/jpeg", (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}

void handleBuzz() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(180);
  digitalWrite(BUZZER_PIN, LOW);
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"ok\":true}");
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(STATUS_LED, LOW); // Turn ON status LED

  setupCamera();

  // Start ESP32's own Wi-Fi Hotspot (no router Wi-Fi needed)
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  server.on("/capture", HTTP_GET, handleCapture);
  server.on("/buzz", HTTP_GET, handleBuzz);
  server.begin();
}

void loop() {
  server.handleClient();

  // Check if laptop sent "BUZZ" over USB Serial cable
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "BUZZ") {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(180);
      digitalWrite(BUZZER_PIN, LOW);
    }
  }

  // Send live camera frame over USB Serial cable every 350ms
  unsigned long now = millis();
  if (now - lastSerialFrameMs >= 350) {
    lastSerialFrameMs = now;
    camera_fb_t * fb = esp_camera_fb_get();
    if (fb) {
      String b64 = encodeBase64(fb->buf, fb->len);
      esp_camera_fb_return(fb);
      if (b64.length() > 0) {
        Serial.print("FRAME:");
        Serial.println(b64);
      }
    }
  }
}
