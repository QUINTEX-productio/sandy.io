/**
 * ============================================================================
 * DEVELOPER BACKEND CONFIGURATION (Editable in Code Only)
 * ============================================================================
 * All technical URLs, AI model endpoints, and Firebase keys are configured
 * here in code so the website interface stays 100% friendly for non-coders.
 */

// 1. Google Colab Endpoints (2 Separate Notebooks: YOLOv5 + Qwen3.6-35B)
window.BACKEND_CONFIG = {
  colabApiUrl: "https://plastic-smudgy-occupant.ngrok-free.dev",   // Notebook 1: YOLOv5 Posture Detection
  qwenApiUrl: "https://referenced-temperatures-wit-stay.trycloudflare.com", // Notebook 2: Qwen3.6-35B-A3B Report Coach & Chat
  esp32DefaultWifiUrl: "http://192.168.4.1/capture",
  defaultConfidenceThreshold: 0.40,
  slouchAlertSeconds: 5
};

// 2. Firebase Project Configuration (Project: posturedection)
const firebaseConfig = {
  apiKey: "AIzaSyD6O32oglKmqtjZNlSXOOBjY5wIp1x77UY",
  authDomain: "posturedection.firebaseapp.com",
  projectId: "posturedection",
  storageBucket: "posturedection.firebasestorage.app",
  messagingSenderId: "377446077231",
  appId: "1:377446077231:web:9d1541d24b0c08711b07da",
  measurementId: "G-R7TBSMMYC3"
};

window.DEFAULT_FIREBASE_CONFIG = firebaseConfig;
