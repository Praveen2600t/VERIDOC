"""
upload.py — POST /api/upload Vercel Serverless Endpoint
Accepts multipart/form-data with:
- file: document photo (JPG/PNG)
- doc_type: 'aadhaar' or 'pan'
- id_number: ID number shown on card
- name: cardholder name shown on card
- dob: date of birth shown on card (DD/MM/YYYY)
Runs:
1. Strict checksum validation (Section 3)
2. Offline QR cross-verification (Section 3B)
3. Pillow + NumPy image forensics (Section 4)
4. Multi-factor fusion risk scoring (Section 6)
Returns exact Section 7 JSON response schema.
"""

import io
import json
import uuid
import base64
from http.server import BaseHTTPRequestHandler
from PIL import Image

from api._pipeline.validator import validate_document
from api._pipeline.forensics import analyze_image_forensics
from api._pipeline.qr_check import verify_qr
from api._pipeline.scoring import compute_fusion_score
from api._pipeline.multipart import parse_multipart_request


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_POST(self):
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            if content_len == 0:
                self._send_json({"error": "Empty request body"}, status=400)
                return

            body_bytes = self.rfile.read(content_len)
            
            # Parse multipart or JSON
            headers_dict = {k: v for k, v in self.headers.items()}
            fields, file_bytes, filename = parse_multipart_request(headers_dict, body_bytes)

            doc_type = (fields.get("doc_type") or "aadhaar").lower().strip()
            id_number = (fields.get("id_number") or "").strip()
            name = (fields.get("name") or "").strip()
            dob = (fields.get("dob") or "").strip()

            # Support base64 image in JSON if file_bytes is None
            if not file_bytes and "image_base64" in fields:
                raw_b64 = fields["image_base64"]
                if "," in raw_b64:
                    raw_b64 = raw_b64.split(",", 1)[1]
                file_bytes = base64.b64decode(raw_b64)

            if not file_bytes:
                self._send_json({"error": "No image file provided in upload"}, status=400)
                return

            # Open image via Pillow
            try:
                img = Image.open(io.BytesIO(file_bytes))
                img.load()
            except Exception as e:
                self._send_json({"error": f"Invalid image file: {str(e)}"}, status=400)
                return

            # 1. Run Strict Checksum Validation
            checksum_res = validate_document(doc_type, id_number)

            # 2. Run Image Forensics (ELA + EXIF + Noise)
            forensic_res = analyze_image_forensics(img)

            # 3. Run Offline QR Cross-Verification
            qr_res = verify_qr(img, typed_name=name, typed_dob=dob, typed_id=id_number)

            # 4. Compute Fusion Risk Score & Breakdown
            fusion_res = compute_fusion_score(forensic_res, checksum_res, qr_res)

            scan_id = str(uuid.uuid4())

            # Construct exact response schema (Section 7)
            response_data = {
                "scan_id": scan_id,
                "doc_type": doc_type,
                "entered_fields": {
                    "name": name,
                    "id_number": id_number,
                    "dob": dob
                },
                "checksum": {
                    "is_valid": checksum_res.get("is_valid", False),
                    "reason": checksum_res.get("reason", "Validation check completed.")
                },
                "qr_check": {
                    "qr_found": qr_res.get("qr_found", False),
                    "qr_matches_input": qr_res.get("qr_matches_input", False),
                    "reason": qr_res.get("reason", "QR check completed.")
                },
                "forensics": {
                    "forensic_score": forensic_res.get("forensic_score", 0.0),
                    "suspicious_regions": forensic_res.get("suspicious_regions", []),
                    "metadata_flag": forensic_res.get("metadata_flag", False)
                },
                "risk_score": fusion_res.get("risk_score", 0),
                "risk_label": fusion_res.get("risk_label", "Low"),
                "breakdown": {
                    "forensic_contribution": fusion_res.get("breakdown", {}).get("forensic_contribution", 0.0),
                    "checksum_contribution": fusion_res.get("breakdown", {}).get("checksum_contribution", 0.0),
                    "qr_contribution": fusion_res.get("breakdown", {}).get("qr_contribution", 0.0)
                }
            }

            self._send_json(response_data, status=200)

        except Exception as err:
            self._send_json({"error": f"Internal pipeline error: {str(err)}"}, status=500)

    def _send_json(self, data: dict, status: int = 200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
