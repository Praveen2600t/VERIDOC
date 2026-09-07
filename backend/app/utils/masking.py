import re
from typing import Optional

def mask_aadhaar(number_str: Optional[str]) -> str:
    """
    Masks a 12-digit Aadhaar number as XXXX XXXX 1234.
    """
    if not number_str:
        return "XXXX XXXX XXXX"
    digits = re.sub(r"\D", "", str(number_str))
    if len(digits) == 12:
        return f"XXXX XXXX {digits[-4:]}"
    elif len(digits) >= 4:
        return f"XXXX XXXX {digits[-4:]}"
    return "XXXX XXXX XXXX"

def mask_pan(pan_str: Optional[str]) -> str:
    """
    Masks a 10-char PAN card number as ABCDE****F.
    """
    if not pan_str:
        return "XXXXX****X"
    cleaned = pan_str.strip().upper()
    if len(cleaned) == 10:
        return f"{cleaned[:5]}****{cleaned[-1]}"
    return "XXXXX****X"

def mask_passport(pass_str: Optional[str]) -> str:
    """
    Masks a passport number as A123****.
    """
    if not pass_str:
        return "XXXX****"
    cleaned = pass_str.strip().upper()
    if len(cleaned) >= 6:
        return f"{cleaned[:4]}****"
    return "XXXX****"

def mask_general_id(doc_type: str, number_str: Optional[str]) -> str:
    dt = (doc_type or "").lower()
    if "aadhaar" in dt or "aadhar" in dt:
        return mask_aadhaar(number_str)
    elif "pan" in dt:
        return mask_pan(number_str)
    elif "passport" in dt:
        return mask_passport(number_str)
    elif number_str and len(number_str) > 4:
        return f"****{number_str[-4:]}"
    return "XXXXXXXX"
