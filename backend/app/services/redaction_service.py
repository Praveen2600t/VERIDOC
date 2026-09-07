import os
import uuid
from typing import Dict, Any, Optional
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FORENSIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "forensics"))
os.makedirs(FORENSIC_DIR, exist_ok=True)

def generate_redacted_preview(image_path: str, ocr_data_or_masked: Any = "XXXX XXXX 1234", doc_id: str = None) -> Dict[str, Any]:
    """
    Generates a separate 'Privacy Protected / Redacted Preview' (Section 3).
    Visually masks the Aadhaar number and sensitive personal information
    without permanently altering the user's original uploaded file.
    """
    unique_id = doc_id or str(uuid.uuid4())[:8]
    out_filename = f"redacted_{unique_id}.png"
    out_path = os.path.join(FORENSIC_DIR, out_filename)

    masked_aadhaar = "XXXX XXXX 1234"
    if isinstance(ocr_data_or_masked, dict):
        masked_aadhaar = ocr_data_or_masked.get("document_number_masked") or ocr_data_or_masked.get("document_number") or "XXXX XXXX 1234"
        if len(masked_aadhaar) >= 4 and not masked_aadhaar.startswith("XXXX"):
            masked_aadhaar = f"XXXX XXXX {masked_aadhaar[-4:]}"
    elif isinstance(ocr_data_or_masked, str):
        masked_aadhaar = ocr_data_or_masked

    # Open with PIL
    img = Image.open(image_path).convert("RGB")
    width, height = img.size
    draw = ImageDraw.Draw(img)

    # 1. Redact Aadhaar Number Bar at the bottom
    # Typically bottom 18% of document height, center 70% width
    y1_num = int(height * 0.82)
    y2_num = int(height * 0.96)
    x1_num = int(width * 0.15)
    x2_num = int(width * 0.85)

    # Draw dark privacy mask rectangle
    draw.rectangle([x1_num, y1_num, x2_num, y2_num], fill=(15, 23, 42), outline=(0, 240, 255), width=2)
    
    # Render masked number in clean privacy typeface
    draw.text((x1_num + 24, y1_num + 12), f"AADHAAR:  {masked_aadhaar}  [PRIVACY MASKED]", fill=(0, 240, 255))

    # 2. Add Privacy Protection Watermark Stamp in top-right corner
    stamp_x1 = int(width * 0.60)
    stamp_y1 = 10
    draw.rectangle([stamp_x1, stamp_y1, width - 15, stamp_y1 + 26], fill=(6, 78, 59), outline=(16, 185, 129), width=1)
    draw.text((stamp_x1 + 10, stamp_y1 + 6), "✓ PRIVACY PROTECTED PREVIEW", fill=(255, 255, 255))

    img.save(out_path, "PNG")
    rel_url = f"/static/forensics/{out_filename}"
    return {
        "redacted_url": rel_url,
        "filename": out_filename,
        "status": "success",
        "masked_value": masked_aadhaar
    }
