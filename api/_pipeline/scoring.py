"""
scoring.py — Fusion Risk Scoring Engine
Implements the exact Section 6 formula fusing:
1. Forensic Tamper Score (40% or 55%)
2. Checksum Validation (35% or 45%)
3. QR Cross-Verification (25% or skipped if unavailable)
Classifies risk into Low (0–33), Medium (34–66), High (67–100).
"""

from typing import Dict, Any


def compute_fusion_score(
    forensic_res: Dict[str, Any],
    checksum_res: Dict[str, Any],
    qr_res: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes overall risk score (0–100) and contribution breakdown.
    """
    forensic_score = float(forensic_res.get("forensic_score", 0.0))
    checksum_valid = bool(checksum_res.get("is_valid", False))
    qr_found = bool(qr_res.get("qr_found", False))
    qr_matches_input = bool(qr_res.get("qr_matches_input", False))

    checksum_fail = 0.0 if checksum_valid else 1.0

    if qr_found:
        # 3-Factor formula from Section 6
        # risk_score = 100 * (0.40 * forensic_score + 0.35 * (0 if checksum_valid else 1) + 0.25 * (0 if qr_matches_input else 1))
        qr_fail = 0.0 if qr_matches_input else 1.0
        
        forensic_contrib = round(100 * 0.40 * forensic_score, 1)
        checksum_contrib = round(100 * 0.35 * checksum_fail, 1)
        qr_contrib = round(100 * 0.25 * qr_fail, 1)
        
        raw_score = forensic_contrib + checksum_contrib + qr_contrib
        qr_note = "Evaluated"
    else:
        # 2-Factor fallback formula when QR decoding unavailable/not present
        # risk_score = 100 * (0.55 * forensic_score + 0.45 * checksum-contribution)
        forensic_contrib = round(100 * 0.55 * forensic_score, 1)
        checksum_contrib = round(100 * 0.45 * checksum_fail, 1)
        qr_contrib = 0.0
        
        raw_score = forensic_contrib + checksum_contrib
        qr_note = "Skipped (QR not detectable or unavailable)"

    # Clamp 0 to 100 integer
    risk_score = int(round(max(0, min(100, raw_score))))

    # Risk Tier Bucketing
    if risk_score <= 33:
        risk_label = "Low"
    elif risk_score <= 66:
        risk_label = "Medium"
    else:
        risk_label = "High"

    return {
        "risk_score": risk_score,
        "risk_label": risk_label,
        "breakdown": {
            "forensic_contribution": forensic_contrib,
            "checksum_contribution": checksum_contrib,
            "qr_contribution": qr_contrib,
            "qr_status": qr_note
        }
    }
