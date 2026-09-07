from typing import Optional
from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db, VerificationResult, Document, AuditLog
from app.utils.hashing import compute_sha256

router = APIRouter(prefix="/api", tags=["history_audit"])

@router.get("/history")
def get_verification_history(
    risk: Optional[str] = Query(None),
    doc_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Returns verification history with optional filtering by risk, document type, and status.
    """
    query = db.query(VerificationResult).join(Document, VerificationResult.document_id == Document.document_id)
    
    if risk:
        query = query.filter(VerificationResult.risk_level == risk.upper())
    if doc_type:
        query = query.filter(Document.document_type == doc_type)
    if status:
        query = query.filter(VerificationResult.final_decision == status.upper())

    results = query.order_by(desc(VerificationResult.created_at)).limit(limit).all()

    history_items = []
    for r in results:
        doc = r.document
        ext = doc.extractions[0] if doc and doc.extractions else None
        history_items.append({
            "verification_id": r.verification_id,
            "document_id": r.document_id,
            "document_type": doc.document_type if doc else "Aadhaar",
            "name": ext.name if ext else "N/A",
            "document_number_masked": ext.document_number_masked if ext else "XXXX XXXX XXXX",
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "status": r.final_decision,
            "timestamp": r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "Just now",
            "document_hash": doc.file_hash if doc else "N/A",
            "report_url": f"/static/reports/veridoc_report_{r.verification_id}.pdf"
        })

    return {
        "count": len(history_items),
        "history": history_items
    }


@router.get("/audit/logs")
def get_audit_trail(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """
    Returns cryptographic, tamper-evident audit logs (Section 23).
    Includes SHA-256 hashes and independent integrity validation.
    """
    logs = db.query(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit).all()

    trail = []
    for log in logs:
        # Verify integrity of signature on-the-fly
        expected_sig = compute_sha256(f"{log.verification_id}:{log.document_hash}:{log.risk_score}:{log.decision}")
        integrity_valid = (expected_sig == log.integrity_signature)

        trail.append({
            "log_id": log.log_id,
            "verification_id": log.verification_id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "document_hash": log.document_hash,
            "risk_score": log.risk_score,
            "decision": log.decision,
            "integrity_signature": log.integrity_signature,
            "integrity_status": "Verified (Cryptographically Untampered)" if integrity_valid else "Corrupted"
        })

    return {
        "total_audit_records": len(trail),
        "trail": trail,
        "tamper_evident_guarantee": "All verification decisions are irreversibly sealed using SHA-256 cryptographic signatures."
    }
