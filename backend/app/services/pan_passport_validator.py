import re
from typing import Dict, Any

PAN_ENTITY_TYPES = {
    "P": "Individual (Person)",
    "C": "Company",
    "H": "Hindu Undivided Family (HUF)",
    "A": "Association of Persons (AOP)",
    "B": "Body of Individuals (BOI)",
    "G": "Government Agency",
    "J": "Artificial Juridical Person",
    "L": "Local Authority",
    "F": "Firm / Limited Liability Partnership",
    "T": "Trust"
}

def validate_pan(pan_input: str, name_hint: str = "") -> Dict[str, Any]:
    """
    Validates PAN number format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F).
    Checks 4th char for entity type and 5th char against surname initial if provided.
    """
    cleaned = (pan_input or "").strip().upper().replace(" ", "")
    if not cleaned:
        return {
            "is_valid": False,
            "format_valid": False,
            "masked_number": "XXXXX****X",
            "reason": "No PAN number detected.",
            "risk_delta": 25
        }

    pattern = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
    if not re.match(pattern, cleaned):
        return {
            "is_valid": False,
            "format_valid": False,
            "masked_number": f"{cleaned[:5]}****{cleaned[-1]}" if len(cleaned) == 10 else "XXXXX****X",
            "reason": f"Invalid PAN format. Must be 5 uppercase letters, 4 digits, and 1 letter (e.g., ABCDE1234F).",
            "risk_delta": 25
        }

    entity_char = cleaned[3]
    entity_desc = PAN_ENTITY_TYPES.get(entity_char, "Unknown Entity Code")
    masked = f"{cleaned[:5]}****{cleaned[-1]}"

    # Surname initial cross-check
    surname_match = True
    if name_hint and entity_char == "P":
        parts = name_hint.strip().split()
        if parts:
            surname_initial = parts[-1][0].upper()
            if cleaned[4] != surname_initial:
                surname_match = False

    if not surname_match:
        return {
            "is_valid": True,
            "format_valid": True,
            "entity_type": entity_desc,
            "masked_number": masked,
            "surname_match": False,
            "reason": f"PAN format valid ({entity_desc}), but 5th letter '{cleaned[4]}' does not match name initial.",
            "risk_delta": 10
        }

    return {
        "is_valid": True,
        "format_valid": True,
        "entity_type": entity_desc,
        "masked_number": masked,
        "surname_match": True,
        "reason": f"PAN format valid ({entity_desc}).",
        "risk_delta": 0
    }


def validate_passport(passport_input: str) -> Dict[str, Any]:
    """
    Validates Indian Passport number format: 1 uppercase letter followed by 7 digits.
    """
    cleaned = (passport_input or "").strip().upper().replace(" ", "")
    if not cleaned:
        return {
            "is_valid": False,
            "format_valid": False,
            "masked_number": "X*******",
            "reason": "No Passport number detected.",
            "risk_delta": 25
        }

    pattern = r"^[A-Z]{1}[0-9]{7}$"
    if not re.match(pattern, cleaned):
        return {
            "is_valid": False,
            "format_valid": False,
            "masked_number": f"{cleaned[:3]}****" if len(cleaned) >= 4 else "X*******",
            "reason": "Invalid Indian Passport format. Must begin with a letter followed by 7 digits.",
            "risk_delta": 20
        }

    masked = f"{cleaned[:3]}****{cleaned[-1]}"
    return {
        "is_valid": True,
        "format_valid": True,
        "masked_number": masked,
        "reason": "Passport format valid.",
        "risk_delta": 0
    }
