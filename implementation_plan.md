# Implementation Plan: VeriDoc 2.0 AI-Powered Fake Identity & Document Screening

Build **VeriDoc 2.0**, an end-to-end, enterprise-grade AI-powered identity and document screening platform tailored for Smart India Hackathon (SIH) demonstration. The system moves beyond binary "VALID / INVALID" checks by producing multi-signal **evidence-based risk assessments**, combining OCR field extraction, Verhoeff mathematical checksums, ELA/AI image forensics, reference intelligence analytics, multi-document consistency checking, dynamic ADAPT accessibility, AI Copilot explanation, multilingual support, voice assistance, professional PDF report generation, and cryptographically verifiable audit trails.

---

## User Review Required

> [!IMPORTANT]
> **Reference Analytics Database (`abc.csv`)**:
> The prompt mentions an uploaded `abc.csv` dataset containing ~440,818 enrolment records across 12 UIDAI fields (*Registrar, Enrolment Agency, State, District, Sub District, Pin Code, Gender, Age, Aadhaar generated, Enrolment Rejected, Residents providing email, Residents providing mobile number*).
> Since `abc.csv` is not yet present on the local filesystem, VeriDoc 2.0 will include:
> 1. An automated **Dataset Ingestion & Seeder Service** that immediately generates a realistic, statistically grounded 10,000+ record reference dataset with real Indian states/districts (including Kerala/Kollam, Delhi, Maharashtra, Tamil Nadu, etc.) and pre-aggregated statistical indexes for instant querying.
> 2. A hot-drop capability: dropping any real `abc.csv` into `backend/data/abc.csv` or uploading it via the UI will automatically index and populate the full database without restart.

> [!NOTE]
> **Aadhaar Authenticity Communication**:
> In strict accordance with the problem statement, passing the Verhoeff checksum or matching reference statistics is explicitly labeled as **structural/contextual integrity**, *not* proof of authentic identity, clearly highlighted across both the UI and generated PDF reports.

---

## Architecture Overview

```
                                  VERIDOC 2.0 ARCHITECTURE
                                  
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                           ADAPT ACCESSIBILITY LAYER                         │
  │     Low Vision  •  Dyslexia (OpenDyslexic)  •  Cognitive  •  High Contrast  │
  │     Motor Support  •  Multilingual (EN, HI, TA, ML, TE)  •  Voice Assistant │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                            REACT + VITE FRONTEND                            │
  │  • Real-time Cybersecurity Dashboard with volume, risk & anomaly analytics   │
  │  • Multi-Stage Upload Pipeline with animated scan stages                    │
  │  • Interactive Visual Forensics (Original, ELA Heatmap, Suspicious Patches)  │
  │  • "Why This Score?" Explainability Modal & Evidence Breakdown               │
  │  • Cross-Document Consistency Matrix (Aadhaar vs PAN vs Passport)           │
  │  • Reference Intelligence Explorer (States, Agencies, Rejection Ratios)     │
  │  • VeriDoc Copilot: Context-grounded AI Investigator (zero-hallucination)    │
  │  • 1-Click PDF Report Generator & Tamper-Evident SHA-256 Audit Trail         │
  └──────────────────────────────────────┬──────────────────────────────────────┘
                                         │ REST API
                                         ▼
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                            FASTAPI PYTHON BACKEND                           │
  │  ┌───────────────────────────────┐     ┌──────────────────────────────────┐ │
  │  │ Pipeline Services             │     │ Forensic & Reference Engines     │ │
  │  │ • Preprocessing & Doc Detect  │     │ • ELA & Noise Variance Forensics │ │
  │  │ • OCR Field Extraction Engine │     │ • AI Tamper Classification Model │ │
  │  │ • Verhoeff Aadhaar Validator  │     │ • Reference Intelligence Engine  │ │
  │  │ • PAN & Passport Checkers     │     │ • Cross-Document Matcher         │ │
  │  │ • Evidence Fusion Risk Engine │     │ • ReportLab PDF Report Engine    │ │
  │  └───────────────────────────────┘     └──────────────────────────────────┘ │
  │                                      │                                      │
  │  ┌───────────────────────────────────▼───────────────────────────────────┐  │
  │  │ SQLite Relational Database (SQLAlchemy)                               │  │
  │  │  users • documents • document_extractions • verification_results     │  │
  │  │  risk_evidence • verification_reports • audit_logs • enrolment_ref    │  │
  │  └───────────────────────────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### 1. Backend Core & Database Schema (`backend/`)

#### [NEW] [backend/requirements.txt](file:///c:/Users/Pc/Documents/SIH%202.0/backend/requirements.txt)
- Dependencies: `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `pillow`, `opencv-python-headless`, `numpy`, `python-multipart`, `reportlab`, `python-dotenv`.

#### [NEW] [backend/app/database.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/database.py)
- SQLite database initialization with WAL mode for high concurrent throughput.
- SQLAlchemy ORM models matching Section 5:
  - `User`: user profiles and settings
  - `Document`: uploaded file metadata, SHA-256 hash, upload timestamp, status
  - `DocumentExtraction`: masked document numbers, name, DOB, gender, address, state, district, pincode, OCR confidence
  - `VerificationResult`: composite risk score (0-100), risk tier (LOW, MEDIUM, HIGH, CRITICAL), OCR score, validation score, tamper score, reference score, cross_document_score, final decision
  - `RiskEvidence`: categorized individual risk items (Tampering, Checksum, Reference Anomaly, Mismatch) with severity, confidence, risk delta (+/- points), and plain-language explanation
  - `VerificationReport`: generated PDF reports, metadata, hash
  - `AuditLog`: tamper-evident cryptographic log with SHA-256 hashes, timestamp, decision
  - `AccessibilityPreference`: user accessibility profiles
  - `EnrolmentReference`: UIDAI dataset table with indexed columns (`state`, `district`, `pincode`, `registrar`, `enrolment_agency`, `aadhaar_generated`, `enrolment_rejected`, `residents_email`, `residents_mobile`).

#### [NEW] [backend/app/utils/hashing.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/utils/hashing.py)
- Computes SHA-256 hashes of documents and verification records for cryptographic audit integrity.

#### [NEW] [backend/app/utils/masking.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/utils/masking.py)
- Masks sensitive identity fields: Aadhaar (`XXXX XXXX 1234`), PAN (`ABCDE****F`), Passport numbers, and residential street numbers to ensure privacy-first compliance.

---

### 2. Analytical & Forensic Services (`backend/app/services/`)

#### [NEW] [backend/app/services/reference_service.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/reference_service.py)
- Loads/indexes `abc.csv` or seeds representative 440K+ distribution dataset.
- Statistical anomaly detection:
  - Computes regional baseline (State, District, PIN code).
  - Checks if extracted location and registrar/agency combination matches reference distribution.
  - Computes district rejection ratio and enrolment volume anomaly.
  - Generates supporting contextual evidence (`Location consistent` vs `Statistical anomaly: unusually high rejection district / unmapped agency`, with explicit disclaimer that anomalies are not definitive fraud).
  - Supplies aggregated metrics for the Reference Intelligence Dashboard (volume by state, rejection ratios, age/gender distributions, mobile/email linkage).

#### [NEW] [backend/app/services/aadhaar_validator.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/aadhaar_validator.py)
- Strict, genuine mathematical implementation of the **Verhoeff algorithm** (multiplication table $d$, permutation table $p$, inverse table $inv$).
- Validates 12-digit format, ensures non-trivial sequence (e.g. not all identical digits), returns valid/invalid flag, formatted masked display, and explanatory risk delta.

#### [NEW] [backend/app/services/pan_passport_validator.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/pan_passport_validator.py)
- PAN validator: format `[A-Z]{5}[0-9]{4}[A-Z]`, checks 4th character entity type (P = Individual, C = Company, H = HUF, F = Firm, A = AOP, T = Trust, etc.), checks 5th character against surname initial.
- Passport validator: checks format, extracts and validates MRZ lines using ICAO 9303 check-digit algorithm.

#### [NEW] [backend/app/services/ocr_service.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/ocr_service.py)
- Document type detection (Aadhaar, PAN, Passport, Driving Licence, Other, Unknown) with confidence rating based on visual markers, government headers, emblems, and keyword frequencies.
- High-res image preprocessing: grayscale conversion, contrast enhancement (CLAHE), deskewing.
- Multi-field extraction: Name, DOB, Gender, Document Number, Address, State, District, PIN Code.
- Computes weighted OCR extraction confidence score.

#### [NEW] [backend/app/services/ela_service.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/ela_service.py)
- Error Level Analysis (ELA): resaves image at 90% quality JPEG, computes absolute pixel difference, scales and applies color heatmap (jet/inferno colormap).
- Patches image into grid cells to detect localized compression divergence (indicative of digital splicing, copy-paste clone stamp, or digital text insertion).
- Identifies bounding boxes of anomalous patches (photo area, name area, document number area).
- Generates base64 / static preview images of ELA heatmap and annotated bounding boxes.

#### [NEW] [backend/app/services/tamper_service.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/tamper_service.py)
- AI-based Tampering Classifier: evaluates high-frequency Laplacian edge variance, localized gradient dissonance, EXIF metadata inspection (detecting editing tools like Photoshop, GIMP, Canva), and ELA anomaly density.
- Outputs `Authenticity Probability` (e.g. 18%) and `Tampering Probability` (e.g. 82%) with modular interface ready for plug-in deep-learning models.

#### [NEW] [backend/app/services/cross_document.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/cross_document.py)
- Multi-document consistency comparator:
  - Compares Name across documents using normalized fuzzy token matching (handles middle names and initials).
  - Compares Date of Birth (handles `DD/MM/YYYY`, `YYYY-MM-DD`, `DD-MM-YYYY`).
  - Compares Gender.
  - Compares Address components (State, District, PIN).
  - Compares Photo similarity indicators.
- Produces itemized match matrix (`Name: MATCH`, `DOB: MATCH`, `Address: PARTIAL MISMATCH`) and overall Cross-Document Consistency Score (0-100%).

#### [NEW] [backend/app/services/risk_engine.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/risk_engine.py)
- Configurable multi-signal evidence fusion engine:
  $$\text{Composite Risk} = w_{tamper} \cdot S_{tamper} + w_{val} \cdot S_{val} + w_{ref} \cdot S_{ref} + w_{cross} \cdot S_{cross} - w_{ocr} \cdot S_{ocr}$$
- Assigns Risk Tiers:
  - `0 - 29`: **LOW RISK** (Green)
  - `30 - 59`: **MEDIUM RISK** (Yellow/Amber)
  - `60 - 79`: **HIGH RISK** (Orange/Red)
  - `80 - 100`: **CRITICAL RISK** (Crimson)
- Constructs plain-language, non-technical **"Why This Score?"** itemized risk breakdown with positive and negative risk point contributions.

#### [NEW] [backend/app/services/copilot_service.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/copilot_service.py)
- AI Verification Copilot engine: context-grounded reasoning assistant.
- Evaluates the document's verification result, extracted fields, forensic findings, reference stats, and cross-doc discrepancies.
- Answers user queries ("Why is this document risky?", "What evidence was found?", "Which document has the mismatch?", "What should I verify manually?", "Generate executive summary").
- Guaranteed zero-hallucination: strictly bases responses on actual pipeline signals.

#### [NEW] [backend/app/services/report_service.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/services/report_service.py)
- ReportLab-powered official PDF Verification Report generator:
  - Header: VeriDoc 2.0 Security Screening Banner, Verification ID, Timestamp, Document Type.
  - Section 1: Extracted & Masked Information Card.
  - Section 2: Validation Results (OCR, Verhoeff Checksum, Format).
  - Section 3: Forensic & AI Tampering Analysis (with metrics and findings).
  - Section 4: Explainable Risk Score & Itemized Evidence Table.
  - Section 5: Cross-Document Consistency Matrix.
  - Section 6: Reference Dataset Regional Intelligence.
  - Section 7: Final Decision (LOW/MEDIUM/HIGH/CRITICAL) & Cryptographic SHA-256 Audit Seal.
  - Official statutory screening disclaimer.

---

### 3. API Routers (`backend/app/api/`)

#### [NEW] [backend/app/api/documents.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/api/documents.py)
- `POST /api/documents/upload`: multi-format document upload (PDF, PNG, JPG, JPEG).
- `DELETE /api/documents/{id}`: privacy erasure feature (zeroes out temporary file and sensitive records).

#### [NEW] [backend/app/api/verification.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/api/verification.py)
- `POST /api/verify`: runs single or multi-document verification pipeline synchronously.
- `GET /api/verification/{id}`: retrieves full verification summary.
- `GET /api/verification/{id}/evidence`: retrieves detailed "Why This Score?" evidence list.
- `POST /api/verify/cross`: runs multi-document consistency check on 2 or 3 documents.

#### [NEW] [backend/app/api/reports.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/api/reports.py)
- `GET /api/verification/{id}/report`: streams generated PDF report for direct download or browser preview.

#### [NEW] [backend/app/api/reference.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/api/reference.py)
- `GET /api/reference/stats`: aggregate dashboard metrics (total records, state counts, district counts, overall rejection rate, gender/age distributions, mobile/email rates).
- `GET /api/reference/filter`: filtered dataset query for states, districts, registrars, and agencies.
- `GET /api/reference/district/{district}`: district-level baseline profile.

#### [NEW] [backend/app/api/accessibility.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/api/accessibility.py)
- `POST /api/accessibility/analyze`: AI Accessibility Analyzer taking user preferences/interactions and producing optimal UI config.
- `GET /api/accessibility/profiles`: predefined accessible profiles (Low Vision, Dyslexia, Reading Support, Cognitive Simplification, Motor Support, High Contrast).

#### [NEW] [backend/app/api/copilot.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/api/copilot.py)
- `POST /api/copilot/chat`: chat interface for VeriDoc Copilot grounded in the active verification ID.

#### [NEW] [backend/app/api/history.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/api/history.py)
- `GET /api/history`: verification history with search, risk level filters, doc type filters, and date range filters.
- `GET /api/audit/logs`: cryptographic audit log entries with SHA-256 verification.

#### [NEW] [backend/app/main.py](file:///c:/Users/Pc/Documents/SIH%202.0/backend/app/main.py)
- FastAPI application entry point, CORS middleware, static file mounts for forensic previews, auto-database seeding on startup.

---

### 4. Frontend Application (`frontend/`)

#### [NEW] [frontend/package.json](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/package.json)
- Vite + React + Tailwind CSS + Lucide Icons.

#### [NEW] [frontend/src/accessibility/adaptEngine.js](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/accessibility/adaptEngine.js) & [frontend/src/accessibility/translations.js](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/accessibility/translations.js)
- **ADAPT Engine**: dynamic DOM application of font scaling, contrast themes (Light, Cyber Dark, High Contrast Yellow/Black, Crisp White), dyslexic typography, spacing, enlarged touch targets, simplified cognitive wording.
- **Multilingual Engine**: translations for English, Tamil (தமிழ்), Malayalam (മലയാളം), Hindi (हिन्दी), and Telugu (తెలుగు).
- **Voice Assistant**: Speech-to-text input + Text-to-speech feedback.

#### [NEW] [frontend/src/components/Navbar.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/components/Navbar.jsx)
- Top cybersecurity bar with VeriDoc 2.0 branding, system status beacon, ADAPT Accessibility quick-switch, Language selector, Voice Assistant trigger, and quick navigation.

#### [NEW] [frontend/src/components/UploadBox.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/components/UploadBox.jsx)
- Drag-and-drop file upload with format badges (PDF, PNG, JPG, JPEG).
- Multi-document upload mode (Doc 1: Primary ID, Doc 2: Secondary ID).
- One-click **Demo Sample Selectors** (Clean Aadhaar, Tampered Aadhaar, PAN card, Mismatched pair) for instant live presentation.
- Animated multi-stage scanning progress:
  `Uploading...` $\to$ `Scanning...` $\to$ `Extracting...` $\to$ `Analyzing...` $\to$ `Verification Complete`.

#### [NEW] [frontend/src/components/ForensicsViewer.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/components/ForensicsViewer.jsx)
- Interactive tabbed/split viewer: Original Document vs. Error Level Analysis (ELA) Heatmap vs. Suspicious Region Bounding Boxes.
- Visual magnification and tamper probability gauge (e.g. Tampering Probability 82%).

#### [NEW] [frontend/src/components/WhyThisScoreModal.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/components/WhyThisScoreModal.jsx)
- Dedicated explainability panel explaining exactly how the composite risk score was calculated:
  - +30 Image tampering detected around photograph
  - +25 Verhoeff checksum failed
  - +12 Cross-document address mismatch
  - +5 Reference dataset anomaly
  - -3 High OCR confidence

#### [NEW] [frontend/src/components/CopilotDrawer.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/components/CopilotDrawer.jsx)
- AI Verification Copilot slide-over chat interface with suggested quick prompts, evidence summary, and real-time interactive Q&A.

#### [NEW] [frontend/src/components/CrossDocumentCard.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/components/CrossDocumentCard.jsx)
- Side-by-side multi-document consistency table: Name match, DOB match, Gender match, Address match, Photo similarity, and overall consistency score.

#### [NEW] [frontend/src/components/AdaptPanel.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/components/AdaptPanel.jsx)
- ADAPT accessibility modal allowing users to toggle Low Vision, Reading Support, Dyslexia Support, Cognitive Simplification, Motor Support, and High Contrast, or run the AI Accessibility Analyzer.

#### [NEW] [frontend/src/pages/Dashboard.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/pages/Dashboard.jsx)
- Main cybersecurity command center:
  - Stat cards: Documents Verified, High Risk, Medium Risk, Low Risk, Tampering Detected.
  - Interactive SVG risk distribution donut, volume trend line chart, and fraud indicator meters.
  - Recent verifications table with quick action links.
  - Quick action to Start New Verification.

#### [NEW] [frontend/src/pages/Verify.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/pages/Verify.jsx)
- Unified verification page with single-document and multi-document modes, live scan progression, and sample loader.

#### [NEW] [frontend/src/pages/Results.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/pages/Results.jsx)
- Comprehensive result view matching Section 31:
  - Risk gauge (0-100) and risk tier banner (LOW / MEDIUM / HIGH / CRITICAL).
  - Extracted Information card with sensitive number masking.
  - Aadhaar / PAN validation card with Verhoeff checksum breakdown.
  - Visual Image Forensics & ELA viewer.
  - Action buttons: `[ WHY THIS SCORE? ]`, `[ ASK VERIDOC COPILOT ]`, `[ DOWNLOAD REPORT ]`, `[ VIEW AUDIT TRAIL ]`, `[ DELETE DOCUMENT ]`.

#### [NEW] [frontend/src/pages/ReferenceIntelligence.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/pages/ReferenceIntelligence.jsx)
- Reference Dataset Intelligence Dashboard:
  - Metrics: Total Enrolment Records, States, Districts, Registrars, Enrolment Agencies.
  - Interactive filtering by State, District, Gender, Age, and Agency.
  - Visual charts: Aadhaar generated by state, rejection rates by district, gender/age distributions, and mobile/email linkage.

#### [NEW] [frontend/src/pages/History.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/pages/History.jsx)
- Verification History table with filtering by Risk Tier, Document Type, Date, and Status, plus audit hash inspection.

#### [NEW] [frontend/src/pages/AuditLogs.jsx](file:///c:/Users/Pc/Documents/SIH%202.0/frontend/src/pages/AuditLogs.jsx)
- Cryptographic Audit Trail page displaying SHA-256 document hashes, verification hashes, timestamps, and integrity status.

---

### 5. Demo Assets & Quick-Start Scripts

#### [NEW] [sample_docs/](file:///c:/Users/Pc/Documents/SIH%202.0/sample_docs/)
- Seeded high-quality mock identity cards for demo:
  - `aadhaar_genuine.png`: genuine format, valid Verhoeff checksum, clean compression.
  - `aadhaar_tampered.png`: modified photo region, corrupted checksum digit, ELA compression anomaly.
  - `pan_card_sample.png`: valid PAN structure, matching identity.
  - `pan_card_mismatched.png`: mismatched name/DOB for cross-document consistency demo.

#### [NEW] [start_veridoc.bat](file:///c:/Users/Pc/Documents/SIH%202.0/start_veridoc.bat)
- 1-click startup script that launches both FastAPI backend and Vite frontend with proper environment setup.

---

## Verification Plan

### Automated Tests
1. **Verhoeff Checksum Test**:
   - Verify valid Aadhaar checksum computation and detection of single-digit transpositions and substitutions.
   - Run: `python backend/tests/test_verhoeff.py`
2. **Forensics & ELA Test**:
   - Verify ELA heatmap generation and anomaly bounding box detection on tampered sample image.
   - Run: `python backend/tests/test_forensics.py`
3. **Reference Intelligence Query Test**:
   - Verify dataset loading, indexing, anomaly scoring for Kollam/Kerala vs unknown district.
   - Run: `python backend/tests/test_reference.py`
4. **PDF Report Generation Test**:
   - Verify ReportLab builds a valid, uncorrupted PDF report with all required sections.
   - Run: `python backend/tests/test_report.py`
5. **API Integration Test**:
   - Verify endpoints: `/api/health`, `/api/verify`, `/api/verification/{id}`, `/api/reference/stats`, `/api/copilot/chat`.
   - Run: `python backend/tests/test_api.py`

### Manual Verification
1. **End-to-End Hackathon Demo Flow (Section 33)**:
   - Step 1: Open Dashboard at `http://localhost:5173`.
   - Step 2: Navigate to Verify, select genuine sample Aadhaar $\to$ Observe 5-stage progress indicator $\to$ Result: LOW RISK, checksum passed, clean forensics.
   - Step 3: Select tampered sample Aadhaar $\to$ Result: HIGH/CRITICAL RISK, Verhoeff checksum failed, ELA highlights manipulated photo region with 82%+ tamper probability.
   - Step 4: Click "WHY THIS SCORE?" $\to$ Verify itemized risk breakdown modal appears with clear point additions.
   - Step 5: Open VeriDoc Copilot $\to$ Ask "Why is this document suspicious?" $\to$ Verify accurate, grounded explanation.
   - Step 6: Toggle ADAPT accessibility mode (e.g. Low Vision or Dyslexia mode) $\to$ Verify UI immediately adapts typography, contrast, and simplified text.
   - Step 7: Click "DOWNLOAD REPORT" $\to$ Verify PDF downloads with full evidence and SHA-256 seal.
   - Step 8: Multi-document verification $\to$ Upload Aadhaar + PAN $\to$ Verify Cross-Document Consistency Matrix.
   - Step 9: Open Reference Intelligence $\to$ Filter by state/district, view statistical charts.
   - Step 10: Test "DELETE DOCUMENT" $\to$ Confirm privacy wipe.
