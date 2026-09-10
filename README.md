# VeriDoc — AI-Based Fake Identity & Document Screening Prototype

**Smart India Hackathon 2026 (SIH26188)**  
*Theme:* Blockchain & Cybersecurity  
*Organization:* Ministry of Home Affairs (MHA)  

VeriDoc is a lightweight, zero-bloat identity document screening application engineered specifically for serverless deployment on **Vercel** (single project for frontend + backend).

---

## Key Highlights

- **Lightweight Serverless Backend**: Built without PyTorch, OpenCV, or EasyOCR overhead. Powered strictly by `Pillow` and `NumPy` for minimal cold starts and sub-second execution.
- **Strict Verhoeff Checksum**: Uses an exact, verified Dihedral Group $D_5$ algorithm for Aadhaar numbers and standard format matching for PAN.
- **Offline QR Cross-Verification**: Decodes printed QR codes locally using `pyzbar` and cross-matches them against user-typed Name and Date of Birth without requiring external UIDAI API access.
- **Error Level Analysis (ELA) & Forensics**: Computes 90% JPEG re-save error residuals, detects editing software tags (Photoshop, GIMP, Snapseed), and detects localized pixel variance anomalies.
- **Multi-Signal Fusion Scoring**: Synthesizes a composite 0–100 risk score (`Low`, `Medium`, `High`) with transparent attribution bars.
- **Synthetic Specimen Test Bench**: Renders 100% synthetic specimen cards with a baked-in diagonal `"SPECIMEN — NOT A REAL DOCUMENT"` watermark across 4 layout variants (`old_pvc`, `my_aadhaar`, `dual_sided`, `masked`, and `pan`).
- **Client-Side History**: Stateless serverless backend — inspection audit history is persisted directly in browser `localStorage` (`veridoc_history`).

---

## Project Structure

```
veridoc/
├── api/
│   ├── upload.py              # POST /api/upload (Multi-factor screening endpoint)
│   ├── generate_sample.py     # POST /api/generate-sample (Synthetic specimen generator)
│   ├── health.py              # GET  /api/health (Service status check)
│   └── _pipeline/
│       ├── validator.py       # Exact Section 3 Verhoeff & PAN validator
│       ├── forensics.py       # Pillow + NumPy ELA, EXIF, and noise analysis
│       ├── qr_check.py        # Offline pyzbar QR decoder & cross-matcher
│       ├── scoring.py         # Multi-signal fusion risk formula
│       └── multipart.py       # Standard library multipart form parser
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadView.jsx # Drag-and-drop, specimen test bench, typed inputs
│   │   │   ├── ResultsView.jsx# HTML canvas overlay for suspicious regions & 3-row breakdown
│   │   │   ├── HistoryView.jsx# localStorage audit records table
│   │   │   └── RiskBadge.jsx  # Color-coded risk status badge
│   │   ├── App.jsx            # Tab navigation & local storage controller
│   │   ├── main.jsx
│   │   └── index.css          # Tailwind design system (#1E2761 Navy & #00C2CB Cyan)
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── vercel.json                # Single-project Vercel rewrite configuration
├── requirements.txt           # pillow, numpy, pyzbar, qrcode
├── server.py                  # Local development server matching Vercel routing
└── README.md
```

---

## Running Locally

### 1. Backend Server
```bash
# Using Python 3.10+
pip install -r requirements.txt
python server.py 8000
```
Backend runs at `http://127.0.0.1:8000`.

### 2. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:5173`.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository into **Vercel** as a new project.
3. Keep the Root Directory as `./` (project root).
4. Vercel automatically detects `vercel.json`:
   - Builds frontend into `frontend/dist` via `cd frontend && npm run build`.
   - Provisions serverless Python functions under `api/*.py`.
5. Deploy! Both frontend and backend will be live on a single unified URL.

*Note on pyzbar:* If `zbar` shared libraries are absent in a particular serverless container, `qr_check.py` gracefully degrades by flagging `qr_found: false` and uses the two-factor formula without crashing.

---

## Multi-Factor Fusion Formula

```
Risk Score (0–100) = 100 * (
    0.40 * Forensic_Score +
    0.35 * (0 if Checksum_Valid else 1) +
    0.25 * (0 if QR_Matches_Input else 1)
)
```

- **Low Risk (0–33)**: Valid checksum, QR matches, natural compression profile.
- **Medium Risk (34–66)**: Minor discrepancies or unreadable QR.
- **High Risk (67–100)**: Checksum failure, QR mismatch, or localized image splicing.