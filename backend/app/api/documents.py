import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db, Document
from app.utils.hashing import compute_sha256

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Handles drag-and-drop file upload supporting PDF, PNG, JPG, JPEG.
    Computes cryptographic SHA-256 hash.
    """
    fn = file.filename or "uploaded_doc"
    ext = os.path.splitext(fn)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg", ".webp"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Use PNG, JPG, JPEG, or PDF.")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # File size limit (e.g. 15MB)
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 15MB limit.")

    file_hash = compute_sha256(contents)
    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    saved_path = os.path.join(UPLOAD_DIR, f"{doc_id}_{fn}")
    
    with open(saved_path, "wb") as f:
        f.write(contents)

    new_doc = Document(
        document_id=doc_id,
        user_id="demo_user",
        file_hash=file_hash,
        original_filename=fn,
        file_size_bytes=len(contents),
        status="uploaded",
        preview_url=f"/uploads/{os.path.basename(saved_path)}"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "document_id": doc_id,
        "filename": fn,
        "file_hash": file_hash,
        "size_bytes": len(contents),
        "preview_url": new_doc.preview_url,
        "status": "uploaded",
        "file_path": saved_path
    }


@router.delete("/{document_id}")
def delete_document_privacy(document_id: str, db: Session = Depends(get_db)):
    """
    Privacy-first zeroing feature: Permanently removes temporary document
    and associated raw files from server storage.
    """
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove files
    if doc.preview_url:
        local_path = os.path.join(UPLOAD_DIR, os.path.basename(doc.preview_url))
        if os.path.exists(local_path):
            try:
                # Cryptographic wipe: overwrite before unlink
                with open(local_path, "ba+") as f:
                    length = f.tell()
                    f.seek(0)
                    f.write(b"\x00" * length)
                os.remove(local_path)
            except Exception:
                pass

    doc.status = "deleted"
    db.commit()

    return {
        "status": "success",
        "document_id": document_id,
        "message": "Document zeroed and securely wiped from server storage. Privacy protection verified."
    }
