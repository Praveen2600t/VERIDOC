"""
generate_sample.py — Synthetic Specimen Document Generator (Pillow-only)
Generates 100% synthetic ID cards for safe testing and live demonstrations.
Every generated document carries a prominent diagonal "SPECIMEN — NOT A REAL DOCUMENT" watermark.
Layouts supported:
- old_pvc: Old-format PVC Aadhaar with tricolor brush stroke, emblem, photo, fields, QR, 12-digit number
- my_aadhaar: Modern MyAadhaar card with clean stripes and vertical layout
- dual_sided: Two-panel front + back e-Aadhaar preview
- masked: First 8 digits masked as XXXX XXXX 8531
- pan: Income Tax Department PAN Card specimen
"""

import io
import os
import math
import random
from typing import Dict, Any, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import qrcode
from api._pipeline.validator import generate_verhoeff_checksum


def get_default_font(size: int = 16) -> ImageFont.ImageFont:
    """Tries to load Arial/Segoe UI font, falls back to Pillow default."""
    try:
        # Common Windows fonts
        for font_name in ["arial.ttf", "segoeui.ttf", "calibri.ttf", "DejaVuSans.ttf"]:
            try:
                return ImageFont.truetype(font_name, size)
            except Exception:
                continue
    except Exception:
        pass
    return ImageFont.load_default()


def create_specimen_qr(data_text: str, size: int = 120) -> Image.Image:
    """Generates a scannable QR code image containing the specimen data."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(data_text)
    qr.make(fit=True)
    img_qr = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    return img_qr.resize((size, size), Image.Resampling.NEAREST)


def apply_specimen_watermark(img: Image.Image) -> Image.Image:
    """Draws a bold, semi-transparent diagonal SPECIMEN watermark across the image."""
    overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    
    font_size = max(24, int(img.width / 18))
    font = get_default_font(font_size)
    watermark_text = "SPECIMEN — NOT A REAL DOCUMENT"
    
    # Calculate diagonal position
    cx, cy = img.width // 2, img.height // 2
    
    # Draw repeating banner or angled stripes
    banner_height = font_size + 24
    angle = -22
    
    # Create a separate high-res text strip to rotate
    strip_w = int(img.width * 1.5)
    strip_h = banner_height + 20
    strip = Image.new("RGBA", (strip_w, strip_h), (255, 255, 255, 0))
    strip_draw = ImageDraw.Draw(strip)
    
    # Translucent red background banner
    strip_draw.rectangle([0, 8, strip_w, strip_h - 8], fill=(220, 38, 38, 55))
    strip_draw.line([(0, 8), (strip_w, 8)], fill=(185, 28, 28, 140), width=2)
    strip_draw.line([(0, strip_h - 8), (strip_w, strip_h - 8)], fill=(185, 28, 28, 140), width=2)
    
    # Repeat text along strip
    step = font_size * 18
    for x in range(10, strip_w, step):
        strip_draw.text((x, 14), watermark_text, fill=(220, 38, 38, 180), font=font)
        
    rotated_strip = strip.rotate(angle, expand=True, resample=Image.Resampling.BILINEAR)
    rx = cx - rotated_strip.width // 2
    ry = cy - rotated_strip.height // 2
    overlay.paste(rotated_strip, (rx, ry), rotated_strip)
    
    # Secondary top and bottom subtle banners
    font_sub = get_default_font(max(12, int(img.width / 35)))
    draw.rectangle([0, 0, img.width, 22], fill=(220, 38, 38, 60))
    draw.text((img.width // 2 - 120, 3), "SYNTHETIC SPECIMEN FOR SIH DEMO ONLY", fill=(220, 38, 38, 220), font=font_sub)
    
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def draw_avatar_placeholder(draw: ImageDraw.Draw, x: int, y: int, w: int, h: int):
    """Draws a clean silhouette avatar in the photo box."""
    # Background
    draw.rectangle([x, y, x + w, y + h], fill=(225, 231, 239), outline=(148, 163, 184), width=1)
    
    # Head circle
    head_r = int(w * 0.22)
    head_cx = x + w // 2
    head_cy = y + int(h * 0.38)
    draw.ellipse([head_cx - head_r, head_cy - head_r, head_cx + head_r, head_cy + head_r], fill=(148, 163, 184))
    
    # Shoulders curve
    shoulder_w = int(w * 0.68)
    shoulder_h = int(h * 0.42)
    sx = head_cx - shoulder_w // 2
    sy = y + int(h * 0.62)
    draw.chord([sx, sy, sx + shoulder_w, sy + shoulder_h * 2], start=180, end=360, fill=(148, 163, 184))


def generate_specimen_data(doc_type: str = "aadhaar", layout: str = "old_pvc", tampered: bool = False) -> Dict[str, Any]:
    """Generates synthetic identity data with valid or corrupted checksums."""
    names = ["AARAV SHARMA", "PRIYA PATEL", "ROHAN VERMA", "ANANYA IYER", "VIKRAM SINGH", "NEHA GUPTA"]
    dobs = ["15/08/1998", "23/04/1995", "10/12/2001", "07/02/1992", "19/09/1997", "04/11/2000"]
    genders = ["Male", "Female", "Male", "Female", "Male", "Female"]
    
    idx = random.randint(0, len(names) - 1)
    name = names[idx]
    dob = dobs[idx]
    gender = genders[idx]
    
    if doc_type == "pan":
        # Format: AAAAA9999A with P as 4th char for individual
        prefix = "ABC"
        holder = "P"
        letter5 = name[0]
        digits = f"{random.randint(1000, 9999)}"
        check_char = "F"
        pan_no = f"{prefix}{holder}{letter5}{digits}{check_char}"
        if tampered:
            # Corrupt holder or length
            pan_no = f"{prefix}X{letter5}{digits}{check_char}"
        return {
            "doc_type": "pan",
            "name": name,
            "id_number": pan_no,
            "dob": dob,
            "gender": gender,
            "father_name": "RAJESH " + name.split()[-1],
            "layout": "pan",
            "tampered": tampered
        }
        
    # Aadhaar Number generation
    # Valid 11 digits: starting with 2-9
    first_digit = str(random.randint(2, 9))
    middle_10 = "".join([str(random.randint(0, 9)) for _ in range(10)])
    raw11 = first_digit + middle_10
    chk = generate_verhoeff_checksum(raw11)
    valid_12 = f"{raw11}{chk}"
    
    if layout == "masked":
        id_display = f"XXXX XXXX {valid_12[-4:]}"
        actual_id = id_display
    else:
        if tampered:
            # Modify checksum digit or splice middle digits
            corrupted_chk = (chk + 1) % 10
            actual_id = f"{raw11[:-1]}{corrupted_chk}{chk}" if len(raw11) >= 11 else f"{raw11}{corrupted_chk}"
            # Ensure altered
            if actual_id == valid_12:
                actual_id = f"{raw11}{(chk + 3) % 10}"
        else:
            actual_id = valid_12
            
        id_display = f"{actual_id[0:4]} {actual_id[4:8]} {actual_id[8:12]}"
        
    return {
        "doc_type": "aadhaar",
        "name": name,
        "id_number": id_display,
        "actual_digits": actual_id.replace(" ", ""),
        "dob": dob,
        "gender": gender,
        "father_name": "RAMESH " + name.split()[-1],
        "layout": layout,
        "tampered": tampered
    }


def generate_specimen_image(
    layout: str = "old_pvc",
    tampered: bool = False,
    data: Dict[str, Any] = None
) -> Tuple[Image.Image, Dict[str, Any]]:
    """
    Renders a complete synthetic specimen image according to the selected layout.
    Baked with scannable QR code and prominent diagonal SPECIMEN watermark.
    """
    if layout not in ("old_pvc", "my_aadhaar", "dual_sided", "masked", "pan"):
        layout = "old_pvc"
        
    doc_type = "pan" if layout == "pan" else "aadhaar"
    if not data:
        data = generate_specimen_data(doc_type=doc_type, layout=layout, tampered=tampered)
        
    # Card canvas size
    width = 760 if layout != "dual_sided" else 1120
    height = 480
    
    img = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    font_lg = get_default_font(20)
    font_md = get_default_font(16)
    font_sm = get_default_font(13)
    font_uid = get_default_font(24)
    
    # -------------------------------------------------------------
    # 1. OLD PVC AADHAAR & MASKED VARIANT
    # -------------------------------------------------------------
    if layout in ("old_pvc", "masked"):
        # Header tricolor bands
        draw.rectangle([20, 20, width - 20, 28], fill=(245, 158, 11))   # Saffron
        draw.rectangle([20, 28, width - 20, 36], fill=(255, 255, 255))  # White
        draw.rectangle([20, 36, width - 20, 44], fill=(16, 185, 129))   # Green
        
        # Header text
        draw.text((120, 48), "भारत सरकार / Government of India", fill=(30, 41, 59), font=font_lg)
        
        # Ashoka emblem placeholder
        draw.rectangle([40, 46, 85, 95], outline=(202, 138, 4), width=2)
        draw.text((48, 62), "सत्यमेव\nजयते", fill=(202, 138, 4), font=get_default_font(11))
        
        # Aadhaar fingerprint icon placeholder
        draw.ellipse([width - 100, 44, width - 40, 104], outline=(239, 68, 68), width=2)
        draw.text((width - 85, 68), "आधार", fill=(239, 68, 68), font=font_sm)
        
        # Photo box
        draw_avatar_placeholder(draw, 40, 120, 150, 185)
        
        # Demographic fields
        lx = 220
        draw.text((lx, 130), f"Name / नाम : {data['name']}", fill=(15, 23, 42), font=font_md)
        draw.text((lx, 170), f"DOB / जन्म तिथि : {data['dob']}", fill=(15, 23, 42), font=font_md)
        draw.text((lx, 210), f"Gender / लिंग : {data['gender']}", fill=(15, 23, 42), font=font_md)
        
        # Real QR Code encoded with payload
        qr_payload = f"UID:{data['id_number']}|NAME:{data['name']}|DOB:{data['dob']}|GEN:{data['gender']}"
        if tampered:
            # In tampered card: QR contains genuine name, but text was modified
            qr_payload = f"UID:{data['id_number']}|NAME:DIFFERENT PERSON|DOB:01/01/1990|GEN:Male"
            
        qr_img = create_specimen_qr(qr_payload, size=130)
        img.paste(qr_img, (width - 170, 130))
        
        # Red divider line
        draw.line([(30, 335), (width - 30, 335)], fill=(220, 38, 38), width=2)
        
        # 12-digit number (or masked)
        id_text = data["id_number"]
        draw.text((width // 2 - 120, 360), id_text, fill=(185, 28, 28), font=font_uid)
        
        # Footer
        draw.text((width // 2 - 100, 415), "मेरा आधार, मेरी पहचान", fill=(100, 116, 139), font=font_sm)

    # -------------------------------------------------------------
    # 2. MY AADHAAR MODERN FORMAT
    # -------------------------------------------------------------
    elif layout == "my_aadhaar":
        # Sleek top bar
        draw.rectangle([0, 0, width, 55], fill=(30, 41, 59))
        draw.text((30, 16), "GOVERNMENT OF INDIA", fill=(255, 255, 255), font=font_lg)
        draw.text((width - 150, 16), "AADHAAR", fill=(245, 158, 11), font=font_lg)
        
        # Tricolor accent stripe below nav
        draw.rectangle([0, 55, width, 58], fill=(245, 158, 11))
        draw.rectangle([0, 58, width, 61], fill=(255, 255, 255))
        draw.rectangle([0, 61, width, 64], fill=(16, 185, 129))
        
        # Photo box
        draw_avatar_placeholder(draw, 45, 95, 140, 175)
        
        # Fields
        lx = 220
        draw.text((lx, 105), f"Name", fill=(100, 116, 139), font=font_sm)
        draw.text((lx, 125), data['name'], fill=(15, 23, 42), font=font_md)
        
        draw.text((lx, 160), f"Date of Birth", fill=(100, 116, 139), font=font_sm)
        draw.text((lx, 180), data['dob'], fill=(15, 23, 42), font=font_md)
        
        draw.text((lx, 215), f"Gender", fill=(100, 116, 139), font=font_sm)
        draw.text((lx, 235), data['gender'], fill=(15, 23, 42), font=font_md)
        
        # QR Code
        qr_payload = f"NAME:{data['name']},DOB:{data['dob']},UID:{data['id_number']}"
        if tampered:
            qr_payload = f"NAME:MISMATCH USER,DOB:01/01/1980,UID:999988887777"
        qr_img = create_specimen_qr(qr_payload, size=135)
        img.paste(qr_img, (width - 180, 95))
        
        # Bottom UID banner
        draw.rectangle([30, 310, width - 30, 375], fill=(241, 245, 249), outline=(203, 213, 225), width=1)
        draw.text((width // 2 - 110, 328), data["id_number"], fill=(30, 41, 59), font=font_uid)
        
        draw.text((width // 2 - 80, 400), "Unique Identification Authority of India", fill=(100, 116, 139), font=font_sm)

    # -------------------------------------------------------------
    # 3. DUAL-SIDED E-AADHAAR
    # -------------------------------------------------------------
    elif layout == "dual_sided":
        panel_w = width // 2
        # Front Panel (Left)
        draw.rectangle([20, 20, panel_w - 15, height - 20], fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        # Tricolor header
        draw.rectangle([30, 30, panel_w - 25, 38], fill=(245, 158, 11))
        draw.rectangle([30, 38, panel_w - 25, 46], fill=(16, 185, 129))
        draw.text((40, 55), "Government of India / भारत सरकार", fill=(30, 41, 59), font=font_md)
        
        draw_avatar_placeholder(draw, 40, 100, 120, 150)
        draw.text((180, 110), f"Name: {data['name']}", fill=(15, 23, 42), font=font_md)
        draw.text((180, 150), f"DOB: {data['dob']}", fill=(15, 23, 42), font=font_md)
        draw.text((180, 190), f"Gender: {data['gender']}", fill=(15, 23, 42), font=font_md)
        
        draw.line([(30, 280), (panel_w - 25, 280)], fill=(220, 38, 38), width=2)
        draw.text((panel_w // 2 - 90, 305), data["id_number"], fill=(185, 28, 28), font=font_uid)
        draw.text((panel_w // 2 - 70, 360), "FRONT PANEL", fill=(148, 163, 184), font=font_sm)
        
        # Back Panel (Right)
        draw.rectangle([panel_w + 15, 20, width - 20, height - 20], fill=(255, 255, 255), outline=(203, 213, 225), width=2)
        draw.text((panel_w + 35, 45), "Unique Identification Authority of India", fill=(30, 41, 59), font=font_md)
        
        draw.text((panel_w + 35, 90), f"Address / पता:", fill=(100, 116, 139), font=font_sm)
        draw.text((panel_w + 35, 115), f"S/O: {data['father_name']}\n155, SAMPLE STREET, MODEL TOWN\nNEW DELHI, DELHI - 110001", fill=(15, 23, 42), font=font_sm)
        
        qr_payload = f"UID:{data['id_number']}|NAME:{data['name']}|DOB:{data['dob']}"
        if tampered:
            qr_payload = f"UID:999900001111|NAME:UNKNOWN|DOB:01/01/1980"
        qr_img = create_specimen_qr(qr_payload, size=130)
        img.paste(qr_img, (width - 170, 100))
        
        draw.line([(panel_w + 25, 280), (width - 25, 280)], fill=(220, 38, 38), width=2)
        draw.text((panel_w + (panel_w // 2) - 90, 305), data["id_number"], fill=(185, 28, 28), font=font_uid)
        draw.text((panel_w + (panel_w // 2) - 65, 360), "BACK PANEL", fill=(148, 163, 184), font=font_sm)

    # -------------------------------------------------------------
    # 4. PAN CARD SPECIMEN
    # -------------------------------------------------------------
    elif layout == "pan":
        # Blue gradient-like header
        draw.rectangle([20, 20, width - 20, 80], fill=(219, 234, 254), outline=(147, 197, 253), width=1)
        draw.text((40, 30), "INCOME TAX DEPARTMENT", fill=(30, 58, 138), font=font_lg)
        draw.text((40, 55), "GOVT. OF INDIA", fill=(30, 58, 138), font=font_sm)
        
        # Photo
        draw_avatar_placeholder(draw, 40, 110, 130, 165)
        
        # Fields
        lx = 200
        draw.text((lx, 110), "Name / नाम", fill=(100, 116, 139), font=font_sm)
        draw.text((lx, 130), data['name'], fill=(15, 23, 42), font=font_md)
        
        draw.text((lx, 165), "Father's Name / पिता का नाम", fill=(100, 116, 139), font=font_sm)
        draw.text((lx, 185), data['father_name'], fill=(15, 23, 42), font=font_md)
        
        draw.text((lx, 220), "Date of Birth / जन्म की तारीख", fill=(100, 116, 139), font=font_sm)
        draw.text((lx, 240), data['dob'], fill=(15, 23, 42), font=font_md)
        
        # QR Code
        qr_payload = f"PAN:{data['id_number']}|NAME:{data['name']}|DOB:{data['dob']}"
        if tampered:
            qr_payload = f"PAN:TAMPERED99F|NAME:MISMATCH|DOB:01/01/1970"
        qr_img = create_specimen_qr(qr_payload, size=115)
        img.paste(qr_img, (width - 155, 110))
        
        # Signature block
        draw.rectangle([40, 290, 170, 340], fill=(248, 250, 252), outline=(203, 213, 225), width=1)
        draw.text((60, 308), "Sample Signature", fill=(100, 116, 139), font=font_sm)
        
        # Permanent Account Number Banner
        draw.rectangle([200, 290, width - 40, 345], fill=(241, 245, 249), outline=(148, 163, 184), width=1)
        draw.text((215, 296), "Permanent Account Number :", fill=(71, 85, 105), font=font_sm)
        draw.text((215, 315), data["id_number"], fill=(15, 23, 42), font=font_uid)

    # -------------------------------------------------------------
    # Splicing / Digital Tampering Artifacts (if tampered=True)
    # -------------------------------------------------------------
    if tampered:
        # Intentionally create a localized digital editing artifact around the name or ID number
        patch_box = (200, 120, 380, 165)
        patch = img.crop(patch_box)
        patch = patch.filter(ImageFilter.GaussianBlur(radius=2.5))
        patch_draw = ImageDraw.Draw(patch)
        patch_draw.rectangle([0, 0, patch.width - 1, patch.height - 1], outline=(180, 80, 80), width=1)
        img.paste(patch, (patch_box[0], patch_box[1]))
        data["tampered_region"] = {"x": patch_box[0], "y": patch_box[1], "w": patch_box[2] - patch_box[0], "h": patch_box[3] - patch_box[1]}

    # Apply the mandatory unremovable diagonal SPECIMEN watermark
    watermarked_img = apply_specimen_watermark(img)
    
    if tampered:
        # Inject EXIF Software tag for image manipulation detection
        exif = watermarked_img.getexif()
        exif[0x0131] = "Adobe Photoshop 24.0 (Windows)"
        watermarked_img._exif = exif
        watermarked_img.info["Software"] = "Adobe Photoshop 24.0 (Windows)"
    
    return watermarked_img, data


# -------------------------------------------------------------
# Vercel Serverless HTTP Handler
# -------------------------------------------------------------
from http.server import BaseHTTPRequestHandler
import json
import base64
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def _handle_request(self):
        # Parse query params
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        
        layout = qs.get("layout", ["old_pvc"])[0]
        tampered_str = qs.get("tampered", ["false"])[0].lower()
        tampered = tampered_str in ("true", "1", "yes")
        format_type = qs.get("format", ["image"])[0].lower()
        
        # Parse POST body if present
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len > 0:
            try:
                body = self.rfile.read(content_len).decode("utf-8")
                body_json = json.loads(body)
                if "layout" in body_json:
                    layout = body_json["layout"]
                if "tampered" in body_json:
                    tampered = bool(body_json["tampered"])
                if "format" in body_json:
                    format_type = body_json["format"]
            except Exception:
                pass
                
        img, data = generate_specimen_image(layout=layout, tampered=tampered)
        
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        png_bytes = buf.getvalue()
        
        if format_type == "json" or "application/json" in self.headers.get("Accept", ""):
            b64_str = base64.b64encode(png_bytes).decode("ascii")
            resp_payload = {
                "specimen_data": data,
                "image_base64": f"data:image/png;base64,{b64_str}"
            }
            resp_bytes = json.dumps(resp_payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(resp_bytes)))
            self.end_headers()
            self.wfile.write(resp_bytes)
        else:
            self.send_response(200)
            self.send_header("Content-Type", "image/png")
            self.send_header("Content-Disposition", f"inline; filename=\"specimen_{layout}.png\"")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Expose-Headers", "X-Specimen-Data")
            self.send_header("X-Specimen-Data", json.dumps(data))
            self.send_header("Content-Length", str(len(png_bytes)))
            self.end_headers()
            self.wfile.write(png_bytes)

    def do_GET(self):
        self._handle_request()

    def do_POST(self):
        self._handle_request()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

