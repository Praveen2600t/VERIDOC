from typing import Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db, VerificationResult
from app.services.copilot_service import answer_copilot_query

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

class CopilotChatRequest(BaseModel):
    query: str
    mode: Optional[str] = "technical"
    verification_id: Optional[str] = None
    verification_data: Optional[Dict[str, Any]] = None

@router.post("/chat")
def copilot_chat(req: CopilotChatRequest, db: Session = Depends(get_db)):
    """
    AI Verification Copilot chat endpoint.
    Context-grounded assistant for explaining verification evidence and recommendations.
    """
    context = req.verification_data or {}

    # If verification_id provided and context is sparse, load from DB
    if req.verification_id and not context.get("evidence_items"):
        vres = db.query(VerificationResult).filter(VerificationResult.verification_id == req.verification_id).first()
        if vres:
            doc = vres.document
            ext = doc.extractions[0] if doc and doc.extractions else None
            context = {
                "verification_id": vres.verification_id,
                "document_type": doc.document_type if doc else "Aadhaar",
                "risk_score": vres.risk_score,
                "risk_level": vres.risk_level,
                "final_decision": vres.final_decision,
                "extractions": {
                    "name": ext.name if ext else "N/A",
                    "date_of_birth": ext.date_of_birth if ext else "N/A",
                    "gender": ext.gender if ext else "N/A",
                    "document_number_masked": ext.document_number_masked if ext else "XXXX XXXX XXXX"
                },
                "evidence_items": [
                    {
                        "category": e.category,
                        "description": e.description,
                        "severity": e.severity,
                        "confidence": e.confidence,
                        "risk_delta": e.risk_delta
                    }
                    for e in vres.evidence_items
                ]
            }

    result = answer_copilot_query(req.query, context, mode=req.mode or "technical")
    return {
        "query": req.query,
        "mode": req.mode or "technical",
        "response": result["answer"],
        "grounded_evidence_count": result["grounded_evidence_count"]
    }
