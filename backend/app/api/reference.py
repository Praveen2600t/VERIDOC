import os
import shutil
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db, EnrolmentReference
from app.services.reference_service import (
    get_reference_dashboard_stats, 
    evaluate_regional_intelligence,
    seed_reference_data_if_needed,
    CSV_FILE_PATH
)

router = APIRouter(prefix="/api/reference", tags=["reference"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """
    Returns high-level statistical summaries for the Reference Intelligence Dashboard.
    """
    return get_reference_dashboard_stats(db)

@router.get("/district/{district_name}")
def get_district_details(district_name: str, state: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Retrieves demographic and enrolment baseline profile for a district.
    """
    return evaluate_regional_intelligence(db, state=state, district=district_name, pincode=None)

@router.get("/filter")
def filter_reference_records(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    registrar: Optional[str] = Query(None),
    agency: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Queries reference records with interactive filters and pagination.
    """
    query = db.query(EnrolmentReference)
    if state:
        query = query.filter(func.lower(EnrolmentReference.state) == state.lower())
    if district:
        query = query.filter(func.lower(EnrolmentReference.district) == district.lower())
    if registrar:
        query = query.filter(func.lower(EnrolmentReference.registrar) == registrar.lower())
    if agency:
        query = query.filter(func.lower(EnrolmentReference.enrolment_agency) == agency.lower())

    total = query.count()
    rows = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "records": [
            {
                "id": r.id,
                "registrar": r.registrar,
                "enrolment_agency": r.enrolment_agency,
                "state": r.state,
                "district": r.district,
                "sub_district": r.sub_district,
                "pincode": r.pincode,
                "gender": r.gender,
                "age": r.age,
                "aadhaar_generated": r.aadhaar_generated,
                "enrolment_rejected": r.enrolment_rejected,
                "residents_email": r.residents_email,
                "residents_mobile": r.residents_mobile
            }
            for r in rows
        ]
    }

@router.post("/upload-csv")
async def upload_custom_abc_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Hot-load user's abc.csv reference analytics dataset directly into the SQLite database.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV dataset.")

    # Save to data/abc.csv
    with open(CSV_FILE_PATH, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Wipe existing and reload
    db.query(EnrolmentReference).delete()
    db.commit()
    count = seed_reference_data_if_needed(db, force_reload=True)

    return {
        "status": "success",
        "message": f"Successfully indexed abc.csv. Database now contains {count} reference records.",
        "total_records": count
    }
