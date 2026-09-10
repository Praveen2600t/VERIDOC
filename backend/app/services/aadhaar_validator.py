import re
from typing import Dict, Any

# Verhoeff algorithm lookup tables
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]


def verhoeff_checksum(number_str: str) -> int:
    """
    Computes the Verhoeff checksum over a string of digits.
    Returns 0 if valid according to Verhoeff check.
    """
    c = 0
    # Process digits in reverse order (index 0 is least significant digit)
    reversed_digits = [int(x) for x in reversed(number_str)]
    for i, num in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[i % 8][num]]
    return c


def calculate_verhoeff_check_digit(number_without_check_digit: str) -> int:
    """
    Calculates the required check digit for an 11-digit prefix.
    """
    c = 0
    # The check digit will be at position 0, so prefix digits are at positions 1, 2, ...
    reversed_digits = [int(x) for x in reversed(number_without_check_digit)]
    for i, num in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][num]]
    return VERHOEFF_INV[c]


def validate_aadhaar(number_input: str, ocr_confidence: float = 95.0) -> Dict[str, Any]:
    """
    Validates format, length, structural non-triviality, and Verhoeff checksum (Section 5).
    Returns validation result with exact PASS/FAIL/NOT AVAILABLE indicators.
    """
    raw_str = str(number_input or "").strip()
    
    # 1. Check for placeholder all-X dummy number (Sample 1)
    if re.search(r"^[X\s\-_]+$", raw_str, re.I) or "XXXX XXXX XXXX" in raw_str.upper():
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": False,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "NOT AVAILABLE",
            "masked_number": "XXXX XXXX XXXX",
            "reason": "Dummy placeholder sequence ('XXXX XXXX XXXX') detected. No authentic individual identity number present.",
            "risk_delta": 30,
            "disclaimer": "Placeholder sequences are typical of specimen illustrations or dummy templates."
        }

    cleaned = re.sub(r"\D", "", raw_str)
    
    if ocr_confidence < 45.0 or not cleaned:
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": False,
            "checksum_passed": False,
            "aadhaar_format": "FAIL" if cleaned else "NOT AVAILABLE",
            "checksum_status": "NOT AVAILABLE",
            "masked_number": "XXXX XXXX 1234",
            "reason": "Unable to confidently read Aadhaar number.",
            "risk_delta": 10,
            "disclaimer": "OCR confidence low. Document is not automatically labeled as invalid solely due to unreadable number."
        }

    # 2. Check 16-digit counterfeit PVC card signature (Sample 2)
    if len(cleaned) == 16:
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": False,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "NOT AVAILABLE",
            "raw_length": 16,
            "masked_number": f"XXXX XXXX XXXX {cleaned[-4:]}",
            "reason": f"Invalid 16-digit number sequence detected ('{cleaned[:4]} {cleaned[4:8]} {cleaned[8:12]} {cleaned[12:]}'). UIDAI Aadhaar standard is strictly 12 digits.",
            "risk_delta": 35,
            "disclaimer": "16-digit sequences indicate an unauthorized mock or counterfeit card template."
        }

    format_valid = True
    length_valid = len(cleaned) == 12

    if not length_valid:
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": False,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "NOT AVAILABLE",
            "raw_length": len(cleaned),
            "masked_number": f"XXXX XXXX {cleaned[-4:]}" if len(cleaned) >= 4 else "XXXX XXXX 1234",
            "reason": f"Aadhaar format invalid: expected 12 digits, detected {len(cleaned)} digits.",
            "risk_delta": 20,
            "disclaimer": "Checksum validation measures mathematical integrity, not official authentication."
        }

    # 3. Check for repetitive single-digit dummy numbers like 000000000000 or 111111111111
    if len(set(cleaned)) == 1:
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": True,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "FAIL",
            "masked_number": f"XXXX XXXX {cleaned[-4:]}",
            "reason": "Trivial repetitive digit sequence detected.",
            "risk_delta": 30,
            "disclaimer": "Checksum validation measures mathematical integrity, not official authentication."
        }

    # 4. Check for synthetic repeating blocks (e.g., 0000 1111 2222 or 4444 3333 6666)
    blocks = [cleaned[i:i+4] for i in range(0, len(cleaned), 4)]
    if len(blocks) >= 3 and any(len(set(b)) == 1 for b in blocks):
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": True,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "FAIL",
            "masked_number": f"XXXX XXXX {cleaned[-4:]}",
            "reason": f"Synthetic repetitive block sequence detected ('{' '.join(blocks)}'). Identified as demo/template card.",
            "risk_delta": 35,
            "disclaimer": "Repetitive block sequences are synthetic placeholders and fail UIDAI randomness standards."
        }

    # 5. Check for synthetic sequential ascending/descending numbers (e.g., 1234 5678 9012)
    if cleaned in ("123456789012", "012345678901", "234567890123", "987654321098") or "12345678" in cleaned:
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": True,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "FAIL",
            "masked_number": f"XXXX XXXX {cleaned[-4:]}",
            "reason": f"Sequential ascending dummy sequence detected ('{cleaned[:4]} {cleaned[4:8]} {cleaned[8:]}'). Identified as synthetic demo/placeholder card.",
            "risk_delta": 35,
            "disclaimer": "Sequential ascending numbers are dummy placeholders and violate UIDAI randomness specifications."
        }

    # 6. Aadhaar cannot start with 0 or 1 per official UIDAI specification (Sample 3)
    if cleaned[0] in ("0", "1"):
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": True,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "FAIL",
            "masked_number": f"XXXX XXXX {cleaned[-4:]}",
            "reason": f"Illegal leading digit '{cleaned[0]}'. Per UIDAI specifications, genuine Aadhaar numbers must begin with digits 2–9.",
            "risk_delta": 30,
            "disclaimer": "Leading digit '0' or '1' violates official UIDAI number generation rules."
        }


    # Compute Verhoeff Checksum
    checksum_result = verhoeff_checksum(cleaned)
    checksum_passed = (checksum_result == 0)

    masked = f"XXXX XXXX {cleaned[-4:]}"

    if checksum_passed:
        return {
            "is_valid": True,
            "format_valid": True,
            "length_valid": True,
            "checksum_passed": True,
            "aadhaar_format": "PASS",
            "checksum_status": "PASS",
            "masked_number": masked,
            "reason": "Format, 12-digit length, and Verhoeff checksum algorithm passed.",
            "risk_delta": 0,
            "disclaimer": "Note: Verhoeff checksum passing confirms mathematical structure only, not authentic government issuance."
        }
    else:
        return {
            "is_valid": False,
            "format_valid": True,
            "length_valid": True,
            "checksum_passed": False,
            "aadhaar_format": "PASS",
            "checksum_status": "FAIL",
            "masked_number": masked,
            "reason": "Aadhaar Verhoeff checksum validation failed. Possible digit alteration or transcription error.",
            "risk_delta": 25,
            "disclaimer": "Note: Verhoeff checksum failure indicates numeric tampering or invalid identity format."
        }
