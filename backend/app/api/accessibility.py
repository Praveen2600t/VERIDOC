from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/api/accessibility", tags=["accessibility"])

class AccessibilityAnalysisRequest(BaseModel):
    user_need: Optional[str] = "standard"  # low_vision, dyslexia, cognitive, motor, high_contrast, reading
    interaction_data: Optional[Dict[str, Any]] = None  # e.g., click_hesitation, device_screen, font_scale

PROFILES = {
    "standard": {
        "fontSize": "normal",
        "contrast": "normal",
        "buttonSize": "normal",
        "simplifyText": False,
        "spacing": "normal",
        "colorProfile": "cyber_dark",
        "fontFamily": "Inter, sans-serif"
    },
    "low_vision": {
        "fontSize": "extra_large",
        "contrast": "high",
        "buttonSize": "large",
        "simplifyText": False,
        "spacing": "large",
        "colorProfile": "high_contrast_yellow",
        "fontFamily": "Inter, sans-serif"
    },
    "dyslexia": {
        "fontSize": "large",
        "contrast": "normal",
        "buttonSize": "normal",
        "simplifyText": True,
        "spacing": "large",
        "colorProfile": "soft_cream",
        "fontFamily": "OpenDyslexic, Comic Sans MS, sans-serif"
    },
    "cognitive": {
        "fontSize": "large",
        "contrast": "normal",
        "buttonSize": "large",
        "simplifyText": True,
        "spacing": "large",
        "colorProfile": "cyber_dark",
        "fontFamily": "Inter, sans-serif"
    },
    "motor": {
        "fontSize": "normal",
        "contrast": "normal",
        "buttonSize": "extra_large",
        "simplifyText": False,
        "spacing": "large",
        "colorProfile": "cyber_dark",
        "fontFamily": "Inter, sans-serif"
    },
    "high_contrast": {
        "fontSize": "large",
        "contrast": "ultra",
        "buttonSize": "large",
        "simplifyText": False,
        "spacing": "normal",
        "colorProfile": "black_white_pure",
        "fontFamily": "Inter, sans-serif"
    },
    "reading": {
        "fontSize": "large",
        "contrast": "normal",
        "buttonSize": "normal",
        "simplifyText": True,
        "spacing": "extra_large",
        "colorProfile": "warm_sepia",
        "fontFamily": "Georgia, serif"
    }
}

@router.get("/profiles")
def get_profiles():
    """
    Returns available ADAPT accessibility profiles.
    """
    return {
        "profiles": PROFILES,
        "supported_languages": [
            {"code": "en", "label": "English"},
            {"code": "ta", "label": "தமிழ் (Tamil)"},
            {"code": "ml", "label": "മലയാളം (Malayalam)"},
            {"code": "hi", "label": "हिन्दी (Hindi)"},
            {"code": "te", "label": "తెలుగు (Telugu)"}
        ]
    }

@router.post("/analyze")
def analyze_accessibility(req: AccessibilityAnalysisRequest):
    """
    Adaptive AI Analyzer: maps user preference or interaction telemetry
    to dynamic UI configuration parameters (Section 18).
    """
    need = (req.user_need or "standard").lower().replace(" ", "_")
    base_config = PROFILES.get(need, PROFILES["standard"])

    # If interaction data indicates mobile or touch interaction
    if req.interaction_data:
        screen_w = req.interaction_data.get("screen_width", 1200)
        if screen_w < 768:
            base_config["buttonSize"] = "large"

    return {
        "recommended_profile": need,
        "config": base_config,
        "ai_reasoning": f"Applied verified accessibility matrix for '{need.replace('_', ' ').title()}' to enhance readability and motor comfort."
    }
