import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db, VerificationResult, Document

router = APIRouter(prefix="/api/reports", tags=["reports"])

REPORT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "reports"))

@router.get("/{verification_id}")
def download_pdf_report(verification_id: str, db: Session = Depends(get_db)):
    """
    Downloads or previews the PDF report for the given verification ID.
    """
    filename = f"veridoc_report_{verification_id}.pdf"
    filepath = os.path.join(REPORT_DIR, filename)

    if not os.path.exists(filepath):
        # Check if verification exists to return proper 404
        vres = db.query(VerificationResult).filter(VerificationResult.verification_id == verification_id).first()
        if not vres:
            raise HTTPException(status_code=404, detail="Verification record not found.")
        raise HTTPException(status_code=404, detail="Report PDF not found on disk.")

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/pdf"
    )
