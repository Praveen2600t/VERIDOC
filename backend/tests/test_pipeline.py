import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import init_db, SessionLocal
from app.services.reference_service import seed_reference_data_if_needed, evaluate_regional_intelligence
from app.services.aadhaar_validator import validate_aadhaar
from app.services.ela_service import perform_ela
from app.services.tamper_service import tamper_classifier
from app.services.ocr_service import extract_document_fields
from app.services.cross_document import evaluate_cross_documents
from app.services.risk_engine import compute_composite_risk
from app.services.copilot_service import answer_copilot_query
from app.services.report_service import generate_pdf_report

def run_pipeline_test():
    print("--- 1. Testing Database & Reference Data Seeding ---")
    init_db()
    db = SessionLocal()
    count = seed_reference_data_if_needed(db)
    print(f"[OK] Reference DB seeded with {count} records.")

    print("\n--- 2. Testing Clean Aadhaar Pipeline ---")
    clean_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_docs", "aadhaar_clean.png"))
    ocr_clean = extract_document_fields(clean_img)
    val_clean = validate_aadhaar(ocr_clean["document_number"])
    ela_clean = perform_ela(clean_img)
    tamper_clean = tamper_classifier.analyze(clean_img, ela_clean)
    ref_clean = evaluate_regional_intelligence(db, ocr_clean["state"], ocr_clean["district"], ocr_clean["pincode"])
    
    risk_clean = compute_composite_risk(
        ocr_data=ocr_clean,
        validation_data=val_clean,
        forensics_data=ela_clean,
        tamper_data=tamper_clean,
        reference_data=ref_clean,
        cross_data={"is_evaluated": False}
    )
    print(f"Clean Aadhaar Risk Score: {risk_clean['risk_score']} / 100 ({risk_clean['risk_level']})")
    assert risk_clean["risk_score"] <= 29, f"Clean document should be LOW risk, got {risk_clean['risk_score']}"

    print("\n--- 3. Testing Tampered Aadhaar Pipeline ---")
    tampered_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_docs", "aadhaar_edited.png"))
    ocr_tamp = extract_document_fields(tampered_img)
    val_tamp = validate_aadhaar(ocr_tamp["document_number"])
    ela_tamp = perform_ela(tampered_img)
    tamper_tamp = tamper_classifier.analyze(tampered_img, ela_tamp)
    ref_tamp = evaluate_regional_intelligence(db, ocr_tamp["state"], ocr_tamp["district"], ocr_tamp["pincode"])
    
    risk_tamp = compute_composite_risk(
        ocr_data=ocr_tamp,
        validation_data=val_tamp,
        forensics_data=ela_tamp,
        tamper_data=tamper_tamp,
        reference_data=ref_tamp,
        cross_data={"is_evaluated": False}
    )
    print(f"Tampered Aadhaar Risk Score: {risk_tamp['risk_score']} / 100 ({risk_tamp['risk_level']})")
    print(f"Tamper Probability: {tamper_tamp['tampering_probability']}%")
    print(f"Checksum Valid: {val_tamp['checksum_passed']}")
    assert risk_tamp["risk_score"] >= 50, f"Tampered document should have elevated risk, got {risk_tamp['risk_score']}"
    assert val_tamp["checksum_passed"] is False, "Tampered checksum should fail"

    print("\n--- 4. Testing Cross-Document Consistency ---")
    pan_clean_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_docs", "pan_clean.png"))
    ocr_pan_clean = extract_document_fields(pan_clean_img)
    cross_match = evaluate_cross_documents([ocr_clean, ocr_pan_clean])
    print(f"Matched Pair Consistency Score: {cross_match['consistency_score']}% (Has Mismatch: {cross_match['has_mismatch']})")
    assert cross_match["consistency_score"] >= 80

    pan_mismatch_img = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "sample_docs", "pan_mismatched.png"))
    ocr_pan_mismatch = extract_document_fields(pan_mismatch_img)
    cross_diff = evaluate_cross_documents([ocr_clean, ocr_pan_mismatch])
    print(f"Mismatched Pair Consistency Score: {cross_diff['consistency_score']}% (Has Mismatch: {cross_diff['has_mismatch']})")
    assert cross_diff["has_mismatch"] is True

    print("\n--- 5. Testing ReportLab PDF Generation ---")
    rep = generate_pdf_report({
        "verification_id": "VD-TEST-99",
        "document_type": "Aadhaar",
        "document_hash": "a1b2c3d4e5f678901234567890abcdef",
        "risk_score": risk_tamp["risk_score"],
        "risk_level": risk_tamp["risk_level"],
        "final_decision": risk_tamp["final_decision"],
        "ocr_score": 88.5,
        "validation_score": 1.0,
        "tamper_score": tamper_tamp["tampering_probability"],
        "extractions": ocr_tamp,
        "evidence_items": risk_tamp["evidence_items"],
        "reference_intelligence": ref_tamp
    })
    print(f"[OK] Report Generated: {rep['file_path']} (Hash: {rep['report_hash'][:16]}...)")
    assert os.path.exists(rep["file_path"])

    print("\n--- 6. Testing AI Verification Copilot ---")
    copilot_res = answer_copilot_query(
        "Why is this document suspicious?",
        {
            "verification_id": "VD-TEST-99",
            "risk_score": risk_tamp["risk_score"],
            "risk_level": risk_tamp["risk_level"],
            "document_type": "Aadhaar",
            "evidence_items": risk_tamp["evidence_items"],
            "extractions": ocr_tamp
        }
    )
    print(f"[OK] Copilot Output:\n{copilot_res['answer']}")
    assert copilot_res["grounded_evidence_count"] > 0

    db.close()
    print("\nALL PIPELINE TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_pipeline_test()
