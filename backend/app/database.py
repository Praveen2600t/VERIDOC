import os
from datetime import datetime
from typing import Generator
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean, 
    DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "veridoc.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True)
    role = Column(String(32), default="auditor")  # auditor, admin, agent
    created_at = Column(DateTime, default=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), default="demo_user")
    document_type = Column(String(64), default="unknown")  # Aadhaar, PAN, Passport, etc.
    file_hash = Column(String(128), index=True)
    original_filename = Column(String(256))
    file_size_bytes = Column(Integer, default=0)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(32), default="uploaded")  # uploaded, verified, deleted
    preview_url = Column(String(512), nullable=True)
    ela_url = Column(String(512), nullable=True)

    extractions = relationship("DocumentExtraction", back_populates="document", cascade="all, delete-orphan")
    verification = relationship("VerificationResult", back_populates="document", uselist=False, cascade="all, delete-orphan")


class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(String(64), ForeignKey("documents.document_id"), index=True)
    name = Column(String(256), nullable=True)
    date_of_birth = Column(String(64), nullable=True)
    gender = Column(String(32), nullable=True)
    document_number_masked = Column(String(64), nullable=True)
    address = Column(Text, nullable=True)
    state = Column(String(128), nullable=True)
    district = Column(String(128), nullable=True)
    pincode = Column(String(32), nullable=True)
    ocr_confidence = Column(Float, default=0.0)

    document = relationship("Document", back_populates="extractions")


class VerificationResult(Base):
    __tablename__ = "verification_results"

    verification_id = Column(String(64), primary_key=True, index=True)
    document_id = Column(String(64), ForeignKey("documents.document_id"), unique=True)
    risk_score = Column(Integer, default=0)  # 0 - 100
    risk_level = Column(String(32), default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    ocr_score = Column(Float, default=0.0)
    validation_score = Column(Float, default=0.0)
    tamper_score = Column(Float, default=0.0)
    reference_score = Column(Float, default=0.0)
    cross_document_score = Column(Float, default=0.0)
    final_decision = Column(String(64), default="PENDING")  # PASSED, REVIEW, FLAGGED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="verification")
    evidence_items = relationship("RiskEvidence", back_populates="verification", cascade="all, delete-orphan")


class RiskEvidence(Base):
    __tablename__ = "risk_evidence"

    evidence_id = Column(Integer, primary_key=True, autoincrement=True)
    verification_id = Column(String(64), ForeignKey("verification_results.verification_id"), index=True)
    category = Column(String(64))  # Tampering, Checksum, Reference Anomaly, OCR Confidence, Cross-Document
    description = Column(Text)
    severity = Column(String(32))  # Info, Low, Medium, High, Critical
    confidence = Column(Float, default=1.0)
    risk_delta = Column(Integer, default=0)  # e.g. +30, -5

    verification = relationship("VerificationResult", back_populates="evidence_items")


class VerificationReport(Base):
    __tablename__ = "verification_reports"

    report_id = Column(String(64), primary_key=True, index=True)
    verification_id = Column(String(64), index=True)
    file_path = Column(String(512))
    report_hash = Column(String(128))
    generated_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    verification_id = Column(String(64), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    document_hash = Column(String(128))
    risk_score = Column(Integer)
    decision = Column(String(64))
    actor = Column(String(64), default="system")
    integrity_signature = Column(String(128))


class AccessibilityPreference(Base):
    __tablename__ = "accessibility_preferences"

    preference_id = Column(String(64), primary_key=True, index=True)
    user_id = Column(String(64), default="default_user")
    font_size = Column(String(32), default="medium")  # small, medium, large, extra_large
    contrast = Column(String(32), default="normal")  # normal, high, ultra
    button_size = Column(String(32), default="normal")
    simplify_text = Column(Boolean, default=False)
    spacing = Column(String(32), default="normal")
    color_profile = Column(String(32), default="cyber_dark")  # cyber_dark, high_contrast, light, dyslexia
    language = Column(String(16), default="en")  # en, hi, ta, ml, te
    updated_at = Column(DateTime, default=datetime.utcnow)


class EnrolmentReference(Base):
    __tablename__ = "enrolment_reference"

    id = Column(Integer, primary_key=True, autoincrement=True)
    registrar = Column(String(128), index=True)
    enrolment_agency = Column(String(128), index=True)
    state = Column(String(128), index=True)
    district = Column(String(128), index=True)
    sub_district = Column(String(128), nullable=True)
    pincode = Column(String(32), index=True)
    gender = Column(String(16), nullable=True)
    age = Column(Integer, default=0)
    aadhaar_generated = Column(Integer, default=1)
    enrolment_rejected = Column(Integer, default=0)
    residents_email = Column(Integer, default=0)
    residents_mobile = Column(Integer, default=0)

    __table_args__ = (
        Index("ix_enrolment_state_district", "state", "district"),
        Index("ix_enrolment_pincode", "pincode"),
    )


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
