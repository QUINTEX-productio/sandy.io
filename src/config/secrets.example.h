#pragma once
// Copy to config/secrets.h and edit. Do not publish actual credentials.
#ifndef POSTURE_WIFI_SSID
#define POSTURE_WIFI_SSID ""
#endif
#ifndef POSTURE_WIFI_PASSWORD
#define POSTURE_WIFI_PASSWORD ""
#endif
// Example after local setup: "http://192.168.x.y:8000" (NOT localhost) or ngrok URL.
#ifndef POSTURE_AI_BASE_URL
#define POSTURE_AI_BASE_URL ""
#endif
#ifndef POSTURE_API_TOKEN
#define POSTURE_API_TOKEN ""
#endif
// For HTTPS, supply the PEM CA certificate. No insecure-TLS fallback.
#ifndef POSTURE_TLS_ROOT_CA
#define POSTURE_TLS_ROOT_CA ""
#endif
