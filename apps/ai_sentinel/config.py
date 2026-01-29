"""
AI Sentinel Configuration
Clear City - City Eye Module
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://espifpuklwcvptddbfkh.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzcGlmcHVrbHdjdnB0ZGRiZmtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4ODI4NTAsImV4cCI6MjA1MDQ1ODg1MH0.mXQQPLF3oAE_G5JqSPxnXetM8TDJ0_kcpLQXJQSPxvg")

# =============================================================================
# AI MODEL CONFIGURATION
# =============================================================================
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "garbage_detect.pt")

# Detection confidence threshold (0.0 to 1.0)
# Lower = more sensitive but more false positives
# Higher = less sensitive but fewer false positives
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.50"))

# =============================================================================
# REPORTING CONFIGURATION
# =============================================================================

# Seconds to wait before creating another report for the same area
REPORT_COOLDOWN = int(os.getenv("REPORT_COOLDOWN", "60"))

# Seconds between verification checks for resolved reports
VERIFICATION_INTERVAL = int(os.getenv("VERIFICATION_INTERVAL", "30"))

# Camera identifier for this AI sentinel instance
CAMERA_ID = os.getenv("CAMERA_ID", "ai-sentinel-001")

# User ID used for AI-generated reports
AI_USER_ID = f"ai-sentinel-{CAMERA_ID}"

# =============================================================================
# CAMERA CONFIGURATION
# =============================================================================

# Camera source: 0 = default webcam, or RTSP URL for IP cameras
# Example RTSP: "rtsp://admin:password@192.168.1.100:554/stream"
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "0")
if CAMERA_SOURCE.isdigit():
    CAMERA_SOURCE = int(CAMERA_SOURCE)

# Camera resolution
CAMERA_WIDTH = int(os.getenv("CAMERA_WIDTH", "640"))
CAMERA_HEIGHT = int(os.getenv("CAMERA_HEIGHT", "480"))

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================

# Flask server settings
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "5000"))

# =============================================================================
# LOCATION CONFIGURATION (Demo coordinates - update for production)
# =============================================================================

# Default location for this camera (Mumbai - update for actual deployment)
DEFAULT_LATITUDE = float(os.getenv("CAMERA_LATITUDE", "19.0760"))
DEFAULT_LONGITUDE = float(os.getenv("CAMERA_LONGITUDE", "72.8777"))
DEFAULT_ADDRESS = os.getenv("CAMERA_ADDRESS", "AI Camera - Demo Location")
