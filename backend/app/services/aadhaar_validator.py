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
    cleaned = re.sub(r"\D", "", str(number_input or ""))
    
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

    # Disallow repeated single-digit dummy numbers like 000000000000 or 111111111111
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

    # Aadhaar cannot start with 0 or 1
    if cleaned[0] in ("0", "1"):
        return {
            "is_valid": False,
            "format_valid": False,
            "length_valid": True,
            "checksum_passed": False,
            "aadhaar_format": "FAIL",
            "checksum_status": "FAIL",
            "masked_number": f"XXXX XXXX {cleaned[-4:]}",
            "reason": "Aadhaar number prefix cannot start with 0 or 1.",
            "risk_delta": 25,
            "disclaimer": "Checksum validation measures mathematical integrity, not official authentication."
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
