"""
validator.py — Strict, pre-verified ID validation.
The Verhoeff implementation below has been tested against known-valid and
known-invalid generic digit sequences and confirmed mathematically correct.
Do not modify the tables or the algorithm logic.
"""

_MULTIPLICATION_TABLE = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]

_PERMUTATION_TABLE = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]

_INVERSE_TABLE = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]

_PAN_HOLDER_TYPES = {
    "P": "Individual", "C": "Company", "H": "HUF", "F": "Firm",
    "A": "Association of Persons", "T": "Trust", "B": "Body of Individuals",
    "L": "Local Authority", "J": "Artificial Juridical Person",
    "G": "Government",
}


def _string_to_digit_array(s: str) -> list[int]:
    return [int(d) for d in reversed(s)]


def validate_verhoeff(full_number: str) -> bool:
    c = 0
    for i, digit in enumerate(_string_to_digit_array(full_number)):
        c = _MULTIPLICATION_TABLE[c][_PERMUTATION_TABLE[i % 8][digit]]
    return c == 0


def generate_verhoeff_checksum(number_without_check_digit: str) -> int:
    c = 0
    for i, digit in enumerate(_string_to_digit_array(number_without_check_digit)):
        c = _MULTIPLICATION_TABLE[c][_PERMUTATION_TABLE[(i + 1) % 8][digit]]
    return _INVERSE_TABLE[c]


def validate_aadhaar(number: str) -> dict:
    cleaned = number.replace(" ", "")
    # Check for masked Aadhaar format (XXXX XXXX 1234)
    if "X" in cleaned.upper():
        if len(cleaned) == 12 and cleaned[:8].upper() == "XXXXXXXX" and cleaned[8:].isdigit():
            return {
                "is_valid": True,
                "is_masked": True,
                "reason": f"Masked Aadhaar recognized (XXXX XXXX {cleaned[8:]}) — checksum not checkable on masked digits."
            }
        return {"is_valid": False, "reason": "Invalid masked Aadhaar format. Expected format: XXXX XXXX 1234"}
    if not cleaned.isdigit() or len(cleaned) != 12:
        return {"is_valid": False, "reason": "Aadhaar number must be exactly 12 digits."}
    if cleaned[0] in ("0", "1"):
        return {"is_valid": False, "reason": "Aadhaar numbers cannot start with 0 or 1."}
    if validate_verhoeff(cleaned):
        return {"is_valid": True, "reason": "Verhoeff checksum passed — number is well-formed."}
    return {"is_valid": False, "reason": "Verhoeff checksum failed — number is not valid."}


def validate_pan(number: str) -> dict:
    import re
    cleaned = number.replace(" ", "").upper()
    if not re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]{1}", cleaned):
        return {"is_valid": False, "reason": "PAN must match format AAAAA9999A."}
    holder_char = cleaned[3]
    if holder_char not in _PAN_HOLDER_TYPES:
        return {"is_valid": False, "reason": f"4th character '{holder_char}' is not a recognized holder-type code."}
    return {
        "is_valid": True,
        "reason": f"Format valid — holder type: {_PAN_HOLDER_TYPES[holder_char]}.",
    }


def validate_document(doc_type: str, id_number: str) -> dict:
    doc_type_clean = (doc_type or "").lower().strip()
    if doc_type_clean == "aadhaar":
        return validate_aadhaar(id_number)
    if doc_type_clean == "pan":
        return validate_pan(id_number)
    return {"is_valid": False, "reason": f"Unsupported document type: {doc_type}"}
