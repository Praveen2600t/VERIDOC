import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.aadhaar_validator import validate_aadhaar, calculate_verhoeff_check_digit

def test_verhoeff_logic():
    # Example Aadhaar prefix: 54328765432
    prefix = "54328765432"
    check_digit = calculate_verhoeff_check_digit(prefix)
    full_number = f"{prefix}{check_digit}"
    
    print(f"Generated Valid Aadhaar with Check Digit: {full_number} (check digit = {check_digit})")
    
    res = validate_aadhaar(full_number)
    assert res["is_valid"] is True, f"Expected valid, got {res}"
    assert res["checksum_passed"] is True
    print("PASS: Valid Aadhaar passed Verhoeff check.")

    # Now tamper the last digit
    tampered_digit = (check_digit + 1) % 10
    tampered_number = f"{prefix}{tampered_digit}"
    res_tampered = validate_aadhaar(tampered_number)
    assert res_tampered["checksum_passed"] is False, "Expected checksum failure for tampered digit."
    print("PASS: Tampered Aadhaar correctly rejected by Verhoeff check.")

    # Test single-digit transposition (swapping adjacent digits)
    transposed = "54238765432" + str(check_digit)
    res_trans = validate_aadhaar(transposed)
    assert res_trans["checksum_passed"] is False, "Expected checksum failure for transposed digits."
    print("PASS: Transposed digits correctly detected by Verhoeff check.")

if __name__ == "__main__":
    test_verhoeff_logic()
    print("ALL VERHOEFF TESTS PASSED!")
