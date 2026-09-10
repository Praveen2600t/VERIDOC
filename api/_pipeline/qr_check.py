"""
qr_check.py — Offline QR Cross-Verification Module
Decodes the printed QR code on the identity document (offline, no government API),
extracts encoded demographic fields, and cross-matches them with user-typed inputs.
Provides graceful degradation if pyzbar or the underlying zbar library is missing.
"""

import re
from typing import Dict, Any, Optional
from PIL import Image


def _normalize_str(s: Optional[str]) -> str:
    """Strips punctuation and whitespace for robust text comparison."""
    if not s:
        return ""
    return re.sub(r"[^A-Za-z0-9]", "", s).lower()


def _normalize_date(d: Optional[str]) -> str:
    """Normalizes date string e.g. 15/08/1998 -> 15081998."""
    if not d:
        return ""
    return re.sub(r"\D", "", d)


def verify_qr(
    img: Image.Image,
    typed_name: Optional[str] = None,
    typed_dob: Optional[str] = None,
    typed_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Decodes the QR code on the image using pyzbar (if available) and cross-checks
    its payload against the entered identity fields.
    """
    # 1. Graceful import check for pyzbar
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
    except Exception:
        return {
            "qr_found": False,
            "qr_matches_input": False,
            "reason": "QR decoding unavailable in this environment (zbar library not present)."
        }

    # 2. Decode QR codes from image
    try:
        # Preprocessing: convert to grayscale or RGB
        decoded_objs = pyzbar_decode(img)
        if not decoded_objs:
            # Try on grayscale high-contrast version
            gray = img.convert("L")
            decoded_objs = pyzbar_decode(gray)
    except Exception as e:
        return {
            "qr_found": False,
            "qr_matches_input": False,
            "reason": f"QR decoding error: {str(e)}"
        }

    if not decoded_objs:
        return {
            "qr_found": False,
            "qr_matches_input": False,
            "reason": "No readable QR code detected on the document."
        }

    # Filter for QRCODE
    qr_item = None
    for obj in decoded_objs:
        if obj.type in ("QRCODE", "QR"):
            qr_item = obj
            break
            
    if not qr_item:
        qr_item = decoded_objs[0]

    # 3. Parse QR Payload
    try:
        raw_payload = qr_item.data.decode("utf-8", errors="ignore").strip()
    except Exception:
        raw_payload = str(qr_item.data)

    if not raw_payload:
        return {
            "qr_found": True,
            "qr_matches_input": False,
            "reason": "QR code detected but payload was empty or unreadable."
        }

    # Normalize fields for matching
    norm_payload = _normalize_str(raw_payload)
    norm_typed_name = _normalize_str(typed_name)
    norm_typed_dob = _normalize_date(typed_dob)
    norm_typed_id = _normalize_str(typed_id)

    # 4. Compare Name and DOB against payload
    name_matched = True
    if norm_typed_name:
        # Check if typed name or major tokens exist in QR payload
        name_tokens = [t for t in re.split(r"[^A-Za-z0-9]", (typed_name or "").lower()) if len(t) > 2]
        if norm_typed_name in norm_payload:
            name_matched = True
        elif name_tokens and all(token in norm_payload for token in name_tokens):
            name_matched = True
        else:
            name_matched = False

    dob_matched = True
    if norm_typed_dob:
        if norm_typed_dob in norm_payload:
            dob_matched = True
        elif len(norm_typed_dob) >= 4 and norm_typed_dob[-4:] in norm_payload:
            # Year of birth match
            dob_matched = True
        else:
            dob_matched = False

    # Check ID number if provided and not masked
    id_matched = True
    if norm_typed_id and "x" not in norm_typed_id:
        if len(norm_typed_id) == 12:
            id_matched = norm_typed_id in norm_payload

    if name_matched and dob_matched and id_matched:
        return {
            "qr_found": True,
            "qr_matches_input": True,
            "reason": "QR-decoded name and DOB match entered fields."
        }
    else:
        mismatches = []
        if not name_matched:
            mismatches.append("Name mismatch")
        if not dob_matched:
            mismatches.append("DOB mismatch")
        if not id_matched:
            mismatches.append("ID number mismatch")
            
        mismatch_str = ", ".join(mismatches) if mismatches else "Data disparity"
        return {
            "qr_found": True,
            "qr_matches_input": False,
            "reason": f"QR cross-check mismatch ({mismatch_str}): QR payload does not match typed input."
        }
