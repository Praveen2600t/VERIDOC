import os
import uuid
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import (
    get_db, Document, DocumentExtraction, 
    VerificationResult, RiskEvidence, AuditLog
)
from app.utils.hashing import compute_sha256
from app.utils.masking import mask_general_id
from app.services.ocr_service import extract_document_fields
from app.services.aadhaar_validator import validate_aadhaar
from app.services.pan_passport_validator import validate_pan, validate_passport
from app.services.ela_service import perform_ela
from app.services.tamper_service import tamper_classifier
from app.services.reference_service import evaluate_regional_intelligence
from app.services.cross_document import evaluate_cross_documents
from app.services.risk_engine import compute_composite_risk, evaluate_mistakes_and_issues
from app.services.report_service import generate_pdf_report
from app.services.qr_service import analyze_qr_code
from app.services.redaction_service import generate_redacted_preview

router = APIRouter(prefix="/api", tags=["verification"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/verify")
@router.post("/analyze")
async def run_verification_pipeline(
    file: Optional[UploadFile] = File(None),
    secondary_file: Optional[UploadFile] = File(None),
    document_id: Optional[str] = Form(None),
    secondary_document_id: Optional[str] = Form(None),
    doc_type: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Executes the full end-to-end verification pipeline synchronously.
    Accepts direct file upload or pre-uploaded document_id.
    Supports optional secondary_file for cross-document consistency verification.
    """
    # 1. Resolve primary file path
    primary_path = None
    file_hash = "0000"
    filename = "document.png"

    if file:
        contents = await file.read()
        filename = file.filename or "uploaded_doc.png"
        file_hash = compute_sha256(contents)
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        primary_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{filename}")
        with open(primary_path, "wb") as f:
            f.write(contents)
            
        doc_record = Document(
            document_id=doc_id,
            file_hash=file_hash,
            original_filename=filename,
            file_size_bytes=len(contents),
            preview_url=f"/uploads/{os.path.basename(primary_path)}"
        )
        db.add(doc_record)
        db.commit()
    elif document_id:
        doc_record = db.query(Document).filter(Document.document_id == document_id).first()
        if not doc_record:
            raise HTTPException(status_code=404, detail="Document ID not found.")
        doc_id = doc_record.document_id
        file_hash = doc_record.file_hash
        filename = doc_record.original_filename
        primary_path = os.path.join(UPLOAD_DIR, os.path.basename(doc_record.preview_url))
    else:
        raise HTTPException(status_code=400, detail="Must provide 'file' or 'document_id'.")

    # Resolve secondary file if present
    secondary_path = None
    if secondary_file:
        sec_contents = await secondary_file.read()
        sec_fn = secondary_file.filename or "secondary_doc.png"
        sec_doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        secondary_path = os.path.join(UPLOAD_DIR, f"{sec_doc_id}_{sec_fn}")
        with open(secondary_path, "wb") as f:
            f.write(sec_contents)
    elif secondary_document_id:
        sec_record = db.query(Document).filter(Document.document_id == secondary_document_id).first()
        if sec_record and sec_record.preview_url:
            secondary_path = os.path.join(UPLOAD_DIR, os.path.basename(sec_record.preview_url))

    # Stage 1 & 2: OCR and Field Extraction
    ocr_res = extract_document_fields(primary_path)
    doc_type = ocr_res["document_type"]

    # Stage 3: Structural Validation & Mathematical Checksums
    raw_num = ocr_res.get("document_number", "")
    if doc_type == "Aadhaar":
        val_res = validate_aadhaar(raw_num, ocr_confidence=ocr_res.get("ocr_confidence", 95.0))
    elif doc_type == "PAN":
        val_res = validate_pan(raw_num, ocr_res.get("name", ""))
    elif doc_type == "Passport":
        val_res = validate_passport(raw_num)
    else:
        val_res = {"is_valid": True, "checksum_passed": True, "masked_number": mask_general_id(doc_type, raw_num), "risk_delta": 0}

    masked_num = val_res.get("masked_number") or mask_general_id(doc_type, raw_num)

    # Stage 4: Forensics & AI Tamper Classification
    ela_res = perform_ela(primary_path)
    tamper_res = tamper_classifier.analyze(primary_path, ela_res)

    # Stage 5: Reference Dataset Regional Intelligence
    ref_res = evaluate_regional_intelligence(
        db,
        state=ocr_res.get("state"),
        district=ocr_res.get("district"),
        pincode=ocr_res.get("pincode")
    )

    # Stage 6: QR Code Analysis (Section 4 & 9)
    qr_res = analyze_qr_code(primary_path, ocr_res)

    # Stage 7: Privacy-Protected / Redacted Preview Generation (Section 3)
    redacted_meta = generate_redacted_preview(primary_path, ocr_res, doc_id)

    # Stage 8: Cross-Document Consistency (if secondary doc uploaded)
    cross_res = {"is_evaluated": False, "consistency_score": 100}
    if secondary_path and os.path.exists(secondary_path):
        sec_ocr = extract_document_fields(secondary_path)
        cross_res = evaluate_cross_documents([ocr_res, sec_ocr])

    # Stage 9: Evidence Fusion & Explainable Risk Score (Section 9)
    risk_fusion = compute_composite_risk(
        ocr_data=ocr_res,
        validation_data=val_res,
        forensics_data=ela_res,
        tamper_data=tamper_res,
        reference_data=ref_res,
        cross_data=cross_res,
        qr_data=qr_res
    )

    # Stage 10: Categorized Mistake & Issue Identification (Section 6)
    mistakes_res = evaluate_mistakes_and_issues(
        ocr_data=ocr_res,
        validation_data=val_res,
        forensics_data=ela_res,
        tamper_data=tamper_res,
        reference_data=ref_res,
        qr_data=qr_res
    )

    # Save extractions & verification result in database
    v_id = f"VD-{uuid.uuid4().hex[:6].upper()}"
    
    # Store extraction
    extraction = DocumentExtraction(
        document_id=doc_id,
        name=ocr_res.get("name"),
        date_of_birth=ocr_res.get("date_of_birth"),
        gender=ocr_res.get("gender"),
        document_number_masked=masked_num,
        address=ocr_res.get("address"),
        state=ocr_res.get("state"),
        district=ocr_res.get("district"),
        pincode=ocr_res.get("pincode"),
        ocr_confidence=ocr_res.get("ocr_confidence", 0.0)
    )
    db.add(extraction)

    # Store verification result
    v_result = VerificationResult(
        verification_id=v_id,
        document_id=doc_id,
        risk_score=risk_fusion["risk_score"],
        risk_level=risk_fusion["risk_level"],
        ocr_score=ocr_res.get("ocr_confidence", 90.0),
        validation_score=0.0 if val_res.get("is_valid") else 1.0,
        tamper_score=tamper_res.get("tampering_probability", 15.0),
        reference_score=ref_res.get("risk_delta", 0.0),
        cross_document_score=cross_res.get("consistency_score", 100.0),
        final_decision=risk_fusion["final_decision"]
    )
    db.add(v_result)

    # Store individual evidence items
    for item in risk_fusion["evidence_items"]:
        ev_record = RiskEvidence(
            verification_id=v_id,
            category=item["category"],
            description=item["description"],
            severity=item["severity"],
            confidence=item["confidence"],
            risk_delta=item["risk_delta"]
        )
        db.add(ev_record)

    # Update document status & preview URLs
    doc_record = db.query(Document).filter(Document.document_id == doc_id).first()
    if doc_record:
        doc_record.document_type = doc_type
        doc_record.status = "verified"
        doc_record.ela_url = ela_res.get("heatmap_url")

    # Cryptographic Audit Log Entry
    audit_sig = compute_sha256(f"{v_id}:{file_hash}:{risk_fusion['risk_score']}:{risk_fusion['final_decision']}")
    audit_entry = AuditLog(
        verification_id=v_id,
        document_hash=file_hash,
        risk_score=risk_fusion["risk_score"],
        decision=risk_fusion["final_decision"],
        integrity_signature=audit_sig
    )
    db.add(audit_entry)
    db.commit()

    # Pre-generate PDF report
    report_meta = generate_pdf_report({
        "verification_id": v_id,
        "document_type": doc_type,
        "document_hash": file_hash,
        "risk_score": risk_fusion["risk_score"],
        "risk_level": risk_fusion["risk_level"],
        "final_decision": risk_fusion["final_decision"],
        "ocr_score": ocr_res.get("ocr_confidence", 94),
        "validation_score": 0 if val_res.get("is_valid") else 1,
        "tamper_score": tamper_res.get("tampering_probability", 15),
        "extractions": {
            "name": ocr_res.get("name"),
            "father_name": ocr_res.get("father_name"),
            "date_of_birth": ocr_res.get("date_of_birth"),
            "year_of_birth": ocr_res.get("year_of_birth"),
            "gender": ocr_res.get("gender"),
            "document_number_masked": masked_num,
            "address": ocr_res.get("address"),
            "state": ocr_res.get("state"),
            "district": ocr_res.get("district"),
            "pincode": ocr_res.get("pincode"),
            "ocr_confidence": ocr_res.get("ocr_confidence")
        },
        "evidence_items": risk_fusion["evidence_items"],
        "reference_intelligence": ref_res,
        "cross_document": cross_res,
        "qr_analysis": qr_res,
        "mistakes_and_issues": mistakes_res
    })

    return {
        "verification_id": v_id,
        "document_id": doc_id,
        "document_type": doc_type,
        "type_confidence": ocr_res.get("type_confidence", 96.4),
        "risk_score": risk_fusion["risk_score"],
        "risk_level": risk_fusion["risk_level"],
        "final_decision": risk_fusion["final_decision"],
        "document_hash": file_hash,
        "audit_signature": audit_sig,
        "extractions": {
            "name": ocr_res.get("name"),
            "father_name": ocr_res.get("father_name"),
            "date_of_birth": ocr_res.get("date_of_birth"),
            "year_of_birth": ocr_res.get("year_of_birth"),
            "gender": ocr_res.get("gender"),
            "document_number_masked": masked_num,
            "address": ocr_res.get("address"),
            "state": ocr_res.get("state"),
            "district": ocr_res.get("district"),
            "pincode": ocr_res.get("pincode"),
            "ocr_confidence": ocr_res.get("ocr_confidence"),
            "field_confidences": ocr_res.get("field_confidences", {})
        },
        "validation": val_res,
        "forensics": {
            "forensic_score": ela_res.get("forensic_score"),
            "suspicious_boxes": ela_res.get("suspicious_boxes"),
            "summary": ela_res.get("summary"),
            "preview_url": f"/uploads/{os.path.basename(primary_path)}",
            "redacted_preview_url": redacted_meta.get("redacted_url"),
            "ela_url": ela_res.get("ela_image_url"),
            "heatmap_url": ela_res.get("heatmap_url"),
            "annotated_url": ela_res.get("annotated_url")
        },
        "qr_analysis": qr_res,
        "mistakes_and_issues": mistakes_res,
        "ai_tampering": tamper_res,
        "reference_intelligence": ref_res,
        "cross_document": cross_res,
        "evidence_items": risk_fusion["evidence_items"],
        "report_url": report_meta.get("download_url"),
        "overall_risk_score": risk_fusion["risk_score"],
        "bounding_boxes": ela_res.get("suspicious_boxes", []),
        "breakdown": {
            "checksum_validation": val_res,
            "forensic_ela": ela_res,
            "ai_tamper": tamper_res,
            "qr_code": qr_res,
            "weights": risk_fusion.get("weights_breakdown", {})
        },
        "disclaimer": "VeriDoc 2.0 provides evidence-based identity screening. Does not constitute official government authentication."
    }


@router.get("/verification/{v_id}")
def get_verification_details(v_id: str, db: Session = Depends(get_db)):
    """
    Retrieves complete verification dossier by verification_id.
    """
    vres = db.query(VerificationResult).filter(VerificationResult.verification_id == v_id).first()
    if not vres:
        raise HTTPException(status_code=404, detail="Verification not found.")

    doc = vres.document
    extractions = doc.extractions[0] if doc and doc.extractions else None
    evidence_list = vres.evidence_items

    return {
        "verification_id": vres.verification_id,
        "document_id": vres.document_id,
        "document_type": doc.document_type if doc else "Aadhaar",
        "risk_score": vres.risk_score,
        "risk_level": vres.risk_level,
        "final_decision": vres.final_decision,
        "created_at": vres.created_at.isoformat() if vres.created_at else None,
        "document_hash": doc.file_hash if doc else "N/A",
        "preview_url": doc.preview_url if doc else None,
        "ela_url": doc.ela_url if doc else None,
        "extractions": {
            "name": extractions.name if extractions else "N/A",
            "date_of_birth": extractions.date_of_birth if extractions else "N/A",
            "gender": extractions.gender if extractions else "N/A",
            "document_number_masked": extractions.document_number_masked if extractions else "XXXX XXXX XXXX",
            "address": extractions.address if extractions else "N/A",
            "state": extractions.state if extractions else "N/A",
            "district": extractions.district if extractions else "N/A",
            "pincode": extractions.pincode if extractions else "N/A",
            "ocr_confidence": extractions.ocr_confidence if extractions else 90.0
        },
        "evidence_items": [
            {
                "category": e.category,
                "description": e.description,
                "severity": e.severity,
                "confidence": e.confidence,
                "risk_delta": e.risk_delta
            }
            for e in evidence_list
        ],
        "report_url": f"/static/reports/veridoc_report_{v_id}.pdf"
    }


@router.get("/verification/{v_id}/evidence")
def get_verification_evidence(v_id: str, db: Session = Depends(get_db)):
    """
    Dedicated endpoint for 'Why This Score?' evidence panel.
    """
    evidence_items = db.query(RiskEvidence).filter(RiskEvidence.verification_id == v_id).all()
    vres = db.query(VerificationResult).filter(VerificationResult.verification_id == v_id).first()
    
    return {
        "verification_id": v_id,
        "risk_score": vres.risk_score if vres else 0,
        "risk_level": vres.risk_level if vres else "LOW",
        "evidence": [
            {
                "id": e.evidence_id,
                "category": e.category,
                "description": e.description,
                "severity": e.severity,
                "confidence": e.confidence,
                "risk_delta": e.risk_delta
            }
            for e in evidence_items
        ]
    }
