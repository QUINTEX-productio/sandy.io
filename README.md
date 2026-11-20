# ESP32-S3 AI Sitting Posture Detector — Arduino IDE project

**Status:** ESP32-S3-WROOM-1-**N16R8-specific configuration** for Arduino-ESP32 **3.x**, with an executable mock/YOLOv5 HTTP gateway and Python gateway tests. **NOT compiled with an ESP32 toolchain and NOT tested on physical hardware in this environment.** No physical GPIO wiring is authorized until you identify your exact ESP32-S3 board, camera connector pin map, and peripheral wiring. By default `BUILD_STAGE=1` and all peripheral GPIO values are `-1`: **serial diagnostics only**.

The ESP32-S3 continuously captures JPEGs from an OV5640 DVP camera and uploads them as a bounded *sequence of live video frames* at the configured target of 2–5 FPS (initial 3). YOLOv5 runs **only on a separate gateway/PC/Colab instance**, and returns one posture result per frame. The ESP32 updates the dashboard, colored LEDs and sound warning after confirmed bad predictions. A micro:bit V2 UART link is optional. No local YOLOv5 inference occurs on the ESP32.

## 0. Confirmed module configuration — ESP32-S3-WROOM-1-N16R8

The actual RF module is **ESP32-S3-WROOM-1-N16R8**, NOT WROOM-2-N16R8V. Per Espressif, it contains **16 MB Quad SPI (QSPI) flash** and **8 MB Octal SPI (OPI) PSRAM**. It does *not* identify the make/model of the carrier board, and it does *not* define the OV5640 DVP connector or ST7789 / I2S / LED / UART wiring.

For a generic development board using this module, start with the following **Arduino IDE 2.x → Tools** settings:

| Setting | Value | Notes |
| --- | --- | --- |
| Board | `ESP32S3 Dev Module` | Only if the specific development board does not have its own profile. Prefer manufacturer profile when available. |
| Flash Size | `16MB (128Mb)` | N16 = 16 MB |
| Flash Mode | `QIO` | N16R8 **WROOM-1** flash is Quad SPI, **not** Octal Flash. |
| PSRAM | `OPI PSRAM` | R8 = 8 MB Octal SPI RAM |
| CPU Frequency | `240 MHz` | Common board default; may be varied for power/thermal considerations |
| USB CDC On Boot | `Enabled` | Useful when using native USB GPIO19/20; board and USB connector dependent |
| Partition Scheme | Any valid 16 MB layout with enough application space | Use 16 MB scheme selected from Tools; avoid a 4 MB layout |
| Serial Monitor | `115200` baud | Matches `Settings::SERIAL_BAUD` |

**Module-specific GPIO guardrails:** GPIO35/36/37 are occupied by Octal PSRAM. GPIO19/20 are reserved by *this project's* native USB connection. Module connections do not expose GPIO22–34 as general header GPIOs. Avoid GPIO0/3/45/46 (boot strapping) unless the development-board schematic validates them. The firmware's pin validator rejects reserved/unavailable selections, detects duplicate GPIOs, and warns about strapping pins.

The default `Settings::BUILD_STAGE = 1` runs without wiring peripherals. Once loaded, check Serial output for values close to:

```text
[BOOT] ESP32-S3 Posture Detector
[BOOT] module=ESP32-S3-WROOM-1-N16R8 stage=1 flash=16777216 PSRAM=8388608 present=1
[BOOT] Stage 1 only: serial startup/diagnostics; no peripheral GPIO required
```

This is **expected output**, not a measured result. The actual serial output will show the detected sizes; incorrect sizes produce `[BOOT] WARNING` messages. GPIO wiring remains intentionally `-1` until the specific carrier board and **OV5640 camera connector pin mapping** have been supplied.

Official references:
- Espressif WROOM-1 datasheet: https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf
- Espressif Arduino troubleshooting, module flash/PSRAM table: https://docs.espressif.com/projects/arduino-esp32/en/latest/troubleshooting.html
- Espressif Arduino Tools menu: https://docs.espressif.com/projects/arduino-esp32/en/latest/guides/tools_menu.html

## 1. Project structure

```text
PostureDetector/
  PostureDetector.ino              # main orchestrator + FreeRTOS capture/upload task
  src/
    config/config.h               # central stages, pins and settings
    config/secrets.example.h      # copy to secrets.h for private local values
    camera/camera_manager.{h,cpp}
    network/wifi_manager.{h,cpp}
    network/ai_client.{h,cpp}
    posture/posture_manager.{h,cpp}
    display/display_manager.{h,cpp}
    audio/audio_manager.{h,cpp}
    indicators/led_manager.{h,cpp}
    communication/microbit_uart.{h,cpp}
  gateway/                        # FastAPI test or YOLOv5 inference service
    app.py
    requirements.txt
    .env.example
  tests/test_gateway.py
  microbit/microbit_v2_micropython.py
  README.md
```

**Arduino IDE compilation note:** the Arduino sketch specification compiles `.cpp` files **recursively only from the `src/` folder**. Therefore, all firmware modules intentionally reside under `src/` and not directly under multiple sibling folders.

## 2. Target hardware and dependencies

| Component | Implementation | Dependency |
| --- | --- | --- |
| ESP32-S3-WROOM-1 16 MB flash / 8 MB PSRAM | Arduino ESP32 core, Wi-Fi and FreeRTOS | Install `esp32` by **Espressif Systems**, version **3.x** (target 3.3.x or 3.4.x; check available board support) |
| OV5640, parallel DVP | `esp_camera.h` JPEG driver, VGA 640×480 | Bundled Espressif camera driver in ESP32 Arduino core; do not install duplicate camera libraries |
| ST7789 SPI TFT, 1.54″ 240×240 | `Adafruit_ST7789` + `Adafruit_GFX` | Library Manager: **Adafruit ST7735 and ST7789 Library**, **Adafruit GFX Library**, **Adafruit BusIO** (installed as needed) |
| MAX98357A I2S speaker | `ESP_I2S.h` / `I2SClass`, 16-bit stereo PCM | Bundled Arduino-ESP32 3.x ESP_I2S library |
| REST/JSON | `HTTPClient`, `WiFiClientSecure`, `ArduinoJson` | Library Manager: **ArduinoJson** by Benoit Blanchon, **version 7.x** |
| micro:bit V2 (optional) | Hardware UART 9600 8N1 | Bundled `HardwareSerial`; optional MicroPython example |
| AI gateway | FastAPI server, mock or local YOLOv5 detection checkpoint | Python 3.10+, `gateway/requirements.txt`; PyTorch and YOLOv5 dependencies for real inference |

**The user has confirmed the module marking ESP32-S3-WROOM-1-N16R8. This determines the flash and PSRAM settings but not the development-board header or camera wiring.** This describes the module/chip capabilities, not the development board’s connector or whether the OV5640 is soldered/plugged in. To finish the GPIO configuration, obtain: exact board manufacturer/model/photo, official pinout/schematic; DVP camera connector wiring; TFT pins and backlight polarity; micro:bit/LED/audio wiring; and whether camera/display pins are already reserved on the board. Avoid USB D±, strapping/reserved flash/PSRAM pins and invalid input-only pins according to that schematic.

## 3. Hardware signal map — **assign actual GPIOs from your schematic**

All names below exist in `src/config/config.h` under `namespace Pins`. Value `-1` = unassigned. The startup routine rejects any duplicate nonnegative GPIO assignment across modules.

| Peripheral | Signals to map | Notes |
| --- | --- | --- |
| OV5640 DVP | `CAM_XCLK`, `CAM_SDA`, `CAM_SCL`, `CAM_D0`..`CAM_D7`, `CAM_VSYNC`, `CAM_HREF`, `CAM_PCLK` | Every listed pin required for driver initialization. Confirm D0..D7 order on your camera board and its 3.3 V logic. |
| Camera optional | `CAM_PWDN`, `CAM_RESET` | Leave `-1` only if not connected or managed on-board. |
| ST7789 SPI | `TFT_SCK`, `TFT_MOSI`, `TFT_DC`, `TFT_CS`, `TFT_RST`, `TFT_BL` | SCK/MOSI/DC required; CS and reset may be `-1` only if the hardware supports that wiring. Backlight enable optional; verify voltage/polarity. MISO unused. |
| MAX98357A I2S | `I2S_BCLK`→BCLK, `I2S_LRCK`→LRC/WS, `I2S_DOUT`→DIN | BCLK/LRCK/DOUT required, common GND. Speaker connects **between the amp's two speaker output terminals**, never to GND. Amplifier supply must match module specification. |
| LEDs | `LED_GREEN`, `LED_RED`, `LED_YELLOW` | GPIO → appropriate current-limiting resistor → LED (or reverse polarity per chosen circuit). Adjust `LED_ACTIVE_HIGH`. |
| micro:bit V2 UART (optional) | `MICROBIT_TX`→micro:bit RX, `MICROBIT_RX`←micro:bit TX | All 3.3 V logic with common GND; power each board separately by USB if unsure. |

**Safety**: Never drive a 4 Ω speaker directly from an ESP32 GPIO. Supply the MAX98357A according to its module documentation, make sure the speaker rating matches the amplifier operating voltage and gain, and do not attach either differential speaker output to ground.

## 4. Arduino IDE installation and upload on Windows

1. Install **Arduino IDE 2.x**.
2. Open **Tools → Board → Boards Manager**, install **esp32 by Espressif Systems**, major version **3.x**. Select your **exact ESP32-S3 board**; if using an unlisted generic board, confirm all module features and USB mode before choosing `ESP32S3 Dev Module`.
3. In **Tools → Manage Libraries**, install **ArduinoJson 7.x**, **Adafruit ST7735 and ST7789 Library**, **Adafruit GFX Library**, and **Adafruit BusIO**. The camera and ESP_I2S libraries should come from the ESP32 Arduino core.
4. Select the real USB-C COM port in **Tools → Port**, then set **USB CDC On Boot = Enabled** if your board relies on native USB serial. Set **PSRAM = OPI PSRAM**, **Flash Mode = QIO**, and **Flash Size = 16 MB** for the confirmed N16R8 module. Flash Mode, partition and USB upload mode are board-specific.
5. Extract the whole ZIP. Open **`PostureDetector/PostureDetector.ino`** in Arduino IDE; do not open only a nested `.cpp` file. Keep folder name `PostureDetector`.
6. Start with `Settings::BUILD_STAGE=1`. Click **Verify**, then **Upload**. Open Serial Monitor at **115200 baud**. Use BOOT/RESET buttons if required by your board, and inspect board-specific USB driver instructions if no COM port appears.
7. After confirming the *actual* pinout, assign GPIO numbers in `src/config/config.h`, create private `src/config/secrets.h` (see below), then increase stages in order. Do not skip hardware verification.

### Secrets and Wi-Fi

Copy `src/config/secrets.example.h` to **`src/config/secrets.h`** and edit, for example:

```cpp
#pragma once
#define POSTURE_WIFI_SSID     "Your_2.4GHz_WiFi"
#define POSTURE_WIFI_PASSWORD "Your_Local_Password"
#define POSTURE_AI_BASE_URL   "http://192.168.1.50:8000"
#define POSTURE_API_TOKEN     "a_unique_local_test_token"
#define POSTURE_TLS_ROOT_CA   "" // HTTP on trusted LAN only; see HTTPS note
```

- Use your **gateway PC's private LAN IP**, not `localhost`/`127.0.0.1`, since those would refer to the ESP32.
- ESP32-S3 station mode connects to **2.4 GHz** Wi-Fi; enable LAN access through Windows Defender Firewall on the gateway port.
- `secrets.h` is ignored by `.gitignore`. Never commit Wi-Fi passwords, bearer tokens, private keys or other credentials to a public project.
- For **HTTPS**, firmware requires an actual trusted PEM CA in `POSTURE_TLS_ROOT_CA` (it refuses HTTPS without one). The certificate must match the hostname; valid system time via NTP/RTC is needed for certificate validation. Wi-Fi module requests SNTP time non-blockingly, but the server must supply a valid clock before an HTTPS handshake succeeds. **Do not set `setInsecure()`**. If remote TLS/Colab tunneling is required, validate the CA chain and device clock before exposing any camera data. HTTP is only suitable on a trusted private LAN.

## 5. AI gateway: run a test server first

The gateway receives JPEG *bytes* at `POST /infer` (one request at a time per ESP32), runs mock prediction or real YOLOv5, and responds in the exact schema the ESP32 validates. It does not store JPEGs on disk.

### Windows PowerShell — mock mode

From the parent folder containing `PostureDetector`:

```powershell
cd PostureDetector
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r gateway/requirements.txt
$env:POSTURE_MODE = "mock"
$env:POSTURE_API_TOKEN = "a_unique_local_test_token"
$env:POSTURE_MOCK_SEQUENCE = "sitting_good,sitting_bad,sitting_bad,sitting_bad,sitting_bad"
python -m uvicorn gateway.app:app --host 0.0.0.0 --port 8000
```

Use browser `http://localhost:8000/health` on the PC; set ESP32 `POSTURE_AI_BASE_URL` to `http://<that-PC-LAN-IP>:8000`. The mock result is **synthetic**, not a real posture classifier, and its confidence of 0.94 is only for protocol/integration testing. A repeated `sitting_bad` sequence tests 3-frame confirmation and cooldown.

Test HTTP manually with a genuine JPEG (e.g. camera test photo):

```powershell
curl.exe -X POST "http://localhost:8000/infer" -H "Content-Type: image/jpeg" -H "X-Frame-ID: 123" -H "Authorization: Bearer a_unique_local_test_token" --data-binary "@sample.jpg"
```

### Real YOLOv5 detection model

1. Train or supply a compatible **YOLOv5 object-detection checkpoint** `best.pt`, with labels **index 0 = `sitting_good`**, **index 1 = `sitting_bad`**. This implementation expects detection results (`results.xyxy`), **not** a YOLOv5 classification-head `.pt` model. If you have a classifier, you must adapt the gateway's `_classify()` adapter to its output format. The ESP32 protocol remains unchanged.
2. Clone the official YOLOv5 repository on the server and install its requirements plus the appropriate PyTorch/CUDA build according to its official documentation. Test GPU visibility (`torch.cuda.is_available()`) separately. For Google Colab with Tesla T4, use the repo and weights files from the notebook runtime. Colab sessions expire; when sessions/tunnels restart the endpoint may change.
3. Set `POSTURE_MODE=yolov5`, `YOLOV5_REPO` to your checked-out local YOLOv5 repo, and `YOLOV5_WEIGHTS` to your trained `.pt` file. Start Uvicorn as above.
4. Inference selects the highest-confidence detected posture bounding box in each image. With zero detections, returns **HTTP 204 No Content**; firmware clears any active bad streak, marks AI online and shows `ANALYZING`. If multiple people appear, selecting the highest-confidence bounding box is **not subject tracking**; for a shared room, a designated desk ROI/person-tracking policy would be needed.
5. Do not upload personal footage to a publicly accessible inference endpoint without consent/security review. A tunnel must provide proper TLS, authentication, and preferably network access controls.

**No public Colab API is created by running a notebook alone**; use a reachable authenticated gateway/tunnel with a stable DNS name and trusted certificate for deployment, or move the gateway to a local always-on PC/cloud server.

## 6. Gateway API contract

**Request:**

```http
POST /infer HTTP/1.1
Content-Type: image/jpeg
X-Frame-ID: 123
X-Device-ID: posture-esp32s3-01
Authorization: Bearer <your-token>
Content-Length: <jpeg-length>

<raw-jpeg-bytes>
```

**Response: 200 OK**, `application/json`, bounded body ≤1024 B:

```json
{"frame_id":123,"class_id":1,"class_name":"sitting_bad","confidence":0.94,"timestamp":1730000000}
```

`timestamp` is Unix epoch seconds produced by the gateway; `frame_id` must echo the exact request. The ESP32 validates each JSON field and rejects malformed values, class-label mismatch, confidence outside [0,1], invalid timestamps and unexpected frame IDs. `sitting_good` = class `0`; `sitting_bad` = class `1`. A gateway that cannot detect a posture returns **204**; non-200/204 HTTP statuses are treated as server failures. The client limits result size, caps in-flight requests at **one**, and uses timeouts/backoff. This implements **live sequential JPEG-frame streaming to the backend**, not a browser MJPEG viewer or full-motion RTSP/H.264 pipeline.

**Health:** `GET /health` (only basic server status, no camera access). Production network security should enforce TLS and authentication at the gateway or reverse proxy.

## 7. Staged test plan — change only `Settings::BUILD_STAGE`

| Stage | Test action | Expected Serial output | Expected device action | Diagnosis if failed |
| --- | --- | --- | --- | --- |
| **1** | Flash default unconfigured firmware | `[BOOT]`, `[HEALTH]` every 5s, stage 1 | USB serial works; external modules inactive | Check board choice, USB CDC, COM driver, baud, BOOT/RESET |
| **2** | Assign full OV5640 DVP GPIO mapping; enable PSRAM; power camera | `[CAMERA] ... ready`, `frame=... 640x480 jpeg=...` | JPEG capture about 3 FPS, no Wi-Fi dependency | Confirm sensor cable orientation, 3.3V rails, D0–D7 mapping, PSRAM mode, XCLK, SCCB pins |
| **3** | Add Wi-Fi credentials | `[WIFI] Connecting...`, `Connected, IP=` | Disconnect/reconnect router; captures continue | Confirm 2.4 GHz network, SSID/password, RSSI; check router isolation |
| **4** | Start **mock** FastAPI gateway, set URL/token | `[POSTURE]` with frame IDs and confidence, or `[AI]` error code | JPEG uploaded continuously to HTTP gateway | Confirm PC IP/port, Windows firewall, API token, `/infer` returns valid JSON |
| **5** | Vary mock labels; set threshold / streak length | `sitting_good` / `sitting_bad` and state in `[HEALTH]` | State changes only on valid results; 3 bad frames required | Verify class names, response `frame_id`, `confidence`, timestamp; use test sequence |
| **6** | Assign ST7789 GPIOs | `[DISPLAY] ... initialized` | 240×240 posture dashboard, partial row updates | Check DC/SCK/MOSI, 3.3V logic, panel offset/rotation, CS/RST/BL polarity |
| **7** | Assign I2S pins, connect MAX98357A and speaker | `[AUDIO] ... ready`, warning logs after 3 bad results | Two-beep tone; no overlapping alarm | Verify speaker wired across outputs, gain/power, 3.3V logic, LRCK/BCLK/DIN, 15s cooldown |
| **8** | Wire 3 LEDs with resistors | `[LED]` only if unassigned; startup status in UI | Green good, red bad, yellow blinking while connecting/analyzing | LED polarity, current-limiting resistors, actual GPIO conflicts |
| **9** | Connect optional micro:bit V2 UART | `[UART] ... link ready` | A toggles mute, B requests status | Check TX↔RX cross-connect, common ground, 9600 baud and LF JSON line |
| **10** | Integrated end-to-end test with camera + mock and then real AI | `[HEALTH]`, `[POSTURE]`, `[AUDIO]` | No runaway queues, no repeat sound on each frame | Inspect stack/heap/PSRAM, network latency and Wi-Fi loss |
| **11** | 4–24 hour soak test | 5-second heap/PSRAM telemetry; no unexpected resets | Reconnect after Wi-Fi and server restart | Check memory trends, watchdog logs, camera frame returns, gateway overload |

Required libraries/wiring at each stage are cumulative as described in Sections 2–3. Every stage still compiles all source modules, so install all Arduino libraries before beginning Stage 1. `BUILD_STAGE=4` already parses mock predictions for a useful protocol smoke test. `BUILD_STAGE=7` emits sound **only for confirmed bad posture**; configure mock sequence accordingly.

## 8. Posture state and warning behavior

- **States:** `INITIALIZING`, `CAMERA_READY`, `CONNECTING_WIFI`, `CONNECTING_AI`, `ANALYZING`, `SITTING_GOOD`, `SITTING_BAD`, `SERVER_OFFLINE`, `CAMERA_ERROR`. Device startup or earlier stages may show camera/wifi states in status output rather than a final classification.
- **Threshold** = 0.70 by default; classifications below this threshold are not treated as good or bad, and reset bad confirmation.
- **Bad confirmation** = 3 consecutive valid, above-threshold `sitting_bad` predictions. Good immediately resets bad streak. Zero detections cancel any pending streak.
- **Alarm** = two I2S-generated 740 Hz tones with a pause; cooldown **15 s** while bad persists. Non-blocking audio task; no sound if server offline, camera fails, or micro:bit toggles mute.
- **Staleness** = 7 seconds after last valid AI result; treat as server offline rather than keep an old bad warning. If network request errors, mark server offline immediately and retry with bounded exponential backoff.
- **Concurrency** = FreeRTOS task captures JPEG and transmits one frame at a time, main loop handles Wi-Fi, dashboard, LEDs and UART, and a separate task generates I2S sound. Frame buffer is returned on every send/error path. The latest-frame camera capture mode keeps old frames from forming an unlimited backlog.

### micro:bit V2 protocol

UART 9600, 8N1, UTF-8 newline-delimited JSON. Supported incoming messages:

```json
{"device":"microbit","event":"button_a","value":1}
{"device":"microbit","event":"button_b","value":1}
{"device":"microbit","event":"get_status"}
{"device":"microbit","event":"mute","value":1}
```

Button A toggles mute, B requests a status. `mute: 0` unmutes, `mute: 1` mutes. Device replies:

```json
{"device":"esp32","event":"status","state":"SITTING_GOOD","confidence":0.97,"muted":false}
```

Use `microbit/microbit_v2_micropython.py` as a separate optional firmware program on the micro:bit V2. It uses micro:bit edge connector **pin1 TX**, **pin2 RX**; do not copy those pin numbers into the ESP32 mapping. The ESP32 keeps operating if micro:bit is disconnected.

## 9. Programmatic gateway tests

```powershell
pip install -r gateway/requirements.txt pytest httpx
$env:POSTURE_MODE = "mock"
Remove-Item Env:POSTURE_API_TOKEN -ErrorAction SilentlyContinue
python -m pytest -q tests/test_gateway.py
```

Tests check `/health`, valid schema, ID echo, invalid JPEG, missing/invalid frame ID, and MIME-type validation. They do **not** replace an Arduino compiler test or hardware tests.

## 10. Troubleshooting and limits

| Symptom | Likely cause/action |
| --- | --- |
| `CAMERA ... pin mapping missing` | Do not guess; obtain actual board schematic, assign DVP interface and camera power/reset. |
| Camera init `0x...` error | Check OV5640 driver support, connector seating, SCCB lines, PSRAM config, sensor supply, XCLK, GPIO strapping conflicts. |
| PSRAM not found | Confirm memory SKU and Arduino board's PSRAM configuration. Avoid forcing OPI/QSPI selection without board evidence. |
| Wi-Fi timeout | 2.4 GHz only, wrong credentials, router client isolation, weak RSSI, power/brownout. |
| HTTP `status=-1`, 401, 404, 503, JSON rejected | Wrong IP/port, firewall, bearer token, endpoint path, server not started, model unavailable, unsupported response types. |
| Camera live rate lower than 3 FPS | Synchronous HTTP inference/upload is the FPS limiter. This is deliberate backpressure; adjust resolution/timeout/FPS or use a streaming gateway after profiling. |
| ST7789 dark or shifted display | Unassigned/wrong SCK/MOSI/DC, voltage, rotation, RST/CS, backlight polarity, panel-specific offsets. |
| No I2S sound | I2S pins/power/speaker wiring, gain/mute on MAX98357A, model did not produce 3 consecutive bad predictions, alarm muted. |
| LEDs wrong polarity | Set `LED_ACTIVE_HIGH` to match wiring; use a resistor per LED. |
| Micro:bit no response | GPIO cross wiring, 3.3V common ground, 9600 baud; UART is optional and intentionally does not gate other tasks. |
| HTTPS fails | Supply valid CA chain, use matching hostname and synchronized time; no insecure-cert bypass. |
| Colab endpoint stops working | Colab runtime and tunnels are not permanent. Restart gateway or deploy on always-on server; update `POSTURE_AI_BASE_URL`. |

**Known limitations:** no physical compile/flash verification; GPIOs unset by design; no phone app or RTSP/MJPEG browser viewer (live JPEG uplink to AI gateway only); no multi-person identity tracking; only YOLOv5 **detection-format** `.pt` supported by provided backend; no local inference; no HTTPS server implementation bundled (a trusted reverse proxy can provide it); actual image FPS and heap stability require board measurements; HTTP upload with a retained camera frame buffer is robust for bounded throughput but can fall below 2 FPS when inference/network is slow; exact OV5640 signal compatibility and 240×240 ST7789 panel offset depend on your hardware revision.

## 11. External API/driver references checked

- Arduino sketch build structure: https://docs.arduino.cc/arduino-cli/sketch-specification/
- Espressif camera configuration and buffer ownership: https://github.com/espressif/esp32-camera/blob/master/driver/include/esp_camera.h
- Arduino-ESP32 I2SClass API: https://github.com/espressif/arduino-esp32/blob/master/libraries/ESP_I2S/src/ESP_I2S.h
- Adafruit ST7789 display interface: https://adafruit.github.io/Adafruit-ST7735-Library/html/class_adafruit___s_t7789.html

**To finalize GPIO wiring for physical hardware:** N16R8 memory is confirmed. Supply the actual development board's manufacturer/model and schematic or photographs of both sides, plus OV5640 and TFT connector pinout. No arbitrary GPIO assignment is safe without these details.
