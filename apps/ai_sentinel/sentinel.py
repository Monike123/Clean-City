"""
AI Sentinel - DEMO MODE with Smart Validation
Clear City - City Eye Module

Features:
- 95% confidence threshold for high accuracy
- Multi-frame validation (3+ detections before confirming)
- NO database writes - safe demo mode
"""

import cv2
import time
import os
import datetime
import threading
import base64
import random

from ultralytics import YOLO
from flask import Flask, Response, jsonify
from flask_cors import CORS

# =============================================================================
# CONFIGURATION
# =============================================================================

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "garbage_detect.pt")
CONFIDENCE_THRESHOLD = 0.95  # High threshold for accuracy
VALIDATION_FRAMES = 3  # Must detect in 3+ consecutive frames to confirm
CAMERA_SOURCE = 0
CAMERA_WIDTH = 640
CAMERA_HEIGHT = 480
SERVER_PORT = 5000

# =============================================================================
# INITIALIZATION
# =============================================================================

print("=" * 70)
print("  🤖 CLEAR CITY - AI SENTINEL (DEMO MODE)")
print("  Smart Validation: 95% confidence + 3-frame confirmation")
print("=" * 70)

# Load YOLO model
print("\n🧠 Loading YOLOv11 model...")
if not os.path.exists(MODEL_PATH):
    print(f"❌ Model not found: {MODEL_PATH}")
    exit(1)

model = YOLO(MODEL_PATH)
print(f"✅ Model loaded")

# Initialize camera
print(f"\n📹 Initializing camera...")
cap = cv2.VideoCapture(CAMERA_SOURCE)
if not cap.isOpened():
    print("❌ Could not open camera")
    exit(1)

cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
print(f"✅ Camera ready ({CAMERA_WIDTH}x{CAMERA_HEIGHT})")

# =============================================================================
# GLOBAL STATE
# =============================================================================

output_frame = None
frame_lock = threading.Lock()
detection_active = False  # Start paused

# Validation tracking
consecutive_detections = 0
validated_garbage = False

# Demo stats
stats = {
    "total_detections": random.randint(50, 150),
    "reports_created": random.randint(20, 45),
    "verifications_passed": random.randint(15, 35),
    "verifications_failed": random.randint(2, 8),
    "is_detecting": False,
    "validation_count": 0
}

# =============================================================================
# FLASK SERVER
# =============================================================================

app = Flask(__name__)
CORS(app)

def generate_video_stream():
    global output_frame, frame_lock
    while True:
        with frame_lock:
            if output_frame is None:
                time.sleep(0.01)
                continue
            success, encoded = cv2.imencode(".jpg", output_frame)
            if not success:
                continue
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + 
               bytearray(encoded) + b'\r\n')

@app.route("/video_feed")
def video_feed():
    return Response(generate_video_stream(), 
                   mimetype="multipart/x-mixed-replace; boundary=frame")

@app.route("/")
def index():
    return f"""
    <html>
        <head><title>AI Sentinel - DEMO</title></head>
        <body style="margin:0; background:#0f172a; font-family:system-ui;">
            <h1 style="color:#4ade80; text-align:center; padding:20px;">
                🤖 City Eye AI - DEMO MODE
            </h1>
            <p style="color:#fbbf24; text-align:center;">
                95% confidence + 3-frame validation | No DB writes
            </p>
            <img src="/video_feed" style="width:100%; max-width:900px; 
                 display:block; margin:0 auto; border-radius:12px;">
        </body>
    </html>
    """

@app.route("/api/status")
def get_status():
    return jsonify({
        "active": detection_active,
        "camera_id": "demo-camera-001",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "demo_mode": True,
        "stats": stats
    })

@app.route("/api/toggle", methods=["POST"])
def toggle_detection():
    global detection_active, consecutive_detections, validated_garbage
    detection_active = not detection_active
    if not detection_active:
        consecutive_detections = 0
        validated_garbage = False
    print(f"\n{'▶️ STARTED' if detection_active else '⏸️ PAUSED'} detection")
    return jsonify({"active": detection_active})

@app.route("/api/snapshot")
def get_snapshot():
    global output_frame, frame_lock
    with frame_lock:
        if output_frame is None:
            return jsonify({"error": "No frame"}), 503
        success, encoded = cv2.imencode(".jpg", output_frame)
        if not success:
            return jsonify({"error": "Failed"}), 500
        b64 = base64.b64encode(encoded).decode('utf-8')
    return jsonify({
        "image": f"data:image/jpeg;base64,{b64}",
        "timestamp": datetime.datetime.now().isoformat()
    })

# =============================================================================
# SMART DETECTION LOOP
# =============================================================================

def detection_loop():
    global output_frame, frame_lock, stats, detection_active
    global consecutive_detections, validated_garbage
    
    print("\n" + "=" * 70)
    print("🟢 AI SENTINEL - SMART VALIDATION MODE")
    print(f"   Confidence: {CONFIDENCE_THRESHOLD*100:.0f}%")
    print(f"   Validation: Detect {VALIDATION_FRAMES}+ frames before confirming")
    print("=" * 70 + "\n")
    
    last_log_time = 0
    
    while True:
        success, frame = cap.read()
        if not success:
            time.sleep(0.1)
            continue
        
        if detection_active:
            # Run YOLO inference
            results = model(frame, verbose=False)
            annotated = results[0].plot()
            
            # Analyze detections
            frame_has_garbage = False
            highest_conf = 0
            
            for box in results[0].boxes:
                conf = float(box.conf[0])
                if conf > CONFIDENCE_THRESHOLD:
                    frame_has_garbage = True
                    if conf > highest_conf:
                        highest_conf = conf
            
            # SMART VALIDATION LOGIC
            if frame_has_garbage:
                consecutive_detections += 1
                stats["validation_count"] = consecutive_detections
                
                # Only confirm garbage after N consecutive detections
                if consecutive_detections >= VALIDATION_FRAMES:
                    if not validated_garbage:
                        validated_garbage = True
                        stats["total_detections"] += 1
                        print(f"✅ CONFIRMED: Garbage validated ({consecutive_detections} frames @ {highest_conf*100:.1f}%)")
                    stats["is_detecting"] = True
                else:
                    # Still validating...
                    if time.time() - last_log_time > 2:
                        print(f"🔍 Validating... ({consecutive_detections}/{VALIDATION_FRAMES} frames)")
                        last_log_time = time.time()
                
                # Add validation status to frame
                status_text = f"VALIDATING: {consecutive_detections}/{VALIDATION_FRAMES}" if consecutive_detections < VALIDATION_FRAMES else "CONFIRMED GARBAGE"
                color = (0, 255, 255) if consecutive_detections < VALIDATION_FRAMES else (0, 0, 255)
                cv2.putText(annotated, status_text, (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                           
            else:
                # No detection - reset validation
                if consecutive_detections > 0:
                    print(f"↩️ Reset: Lost detection after {consecutive_detections} frames")
                consecutive_detections = 0
                validated_garbage = False
                stats["is_detecting"] = False
                stats["validation_count"] = 0
            
            with frame_lock:
                output_frame = annotated.copy()
        else:
            # Paused
            overlay = frame.copy()
            cv2.putText(overlay, "PAUSED - Click Start in Dashboard", (30, 50),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)
            with frame_lock:
                output_frame = overlay
    
    cap.release()

# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("  STARTING AI SENTINEL - DEMO MODE")
    print("  ⚠️ Safe: No reports created in database")
    print("=" * 70)
    
    det_thread = threading.Thread(target=detection_loop)
    det_thread.daemon = True
    det_thread.start()
    
    print(f"\n🌐 Video: http://localhost:{SERVER_PORT}/video_feed")
    print(f"📊 Status: http://localhost:{SERVER_PORT}/api/status")
    print("=" * 70 + "\n")
    
    try:
        app.run(host="0.0.0.0", port=SERVER_PORT, debug=False, threaded=True)
    except KeyboardInterrupt:
        print("\n👋 Stopped")
