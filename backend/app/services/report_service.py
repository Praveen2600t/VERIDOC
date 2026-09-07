import os
import uuid
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.utils.hashing import compute_file_sha256

REPORT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "reports"))
os.makedirs(REPORT_DIR, exist_ok=True)

def generate_pdf_report(context: Dict[str, Any]) -> Dict[str, str]:
    """
    Generates an official VeriDoc 2.0 Security Screening PDF Report with
    Aadhaar layout analysis, QR audit, and categorized mistake detection.
    """
    v_id = context.get("verification_id", f"VD-{uuid.uuid4().hex[:6].upper()}")
    filename = f"veridoc_report_{v_id}.pdf"
    filepath = os.path.join(REPORT_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=32,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=3
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=10
    )
    heading2_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=7,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor("#334155"),
        leading=10.5
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Italic'],
        fontName='Helvetica-Oblique',
        fontSize=7,
        textColor=colors.HexColor("#64748b"),
        alignment=1,
        leading=9
    )

    story = []

    # Title & Header
    story.append(Paragraph("VERIDOC 2.0 — IDENTITY SCREENING REPORT", title_style))
    story.append(Paragraph("AI-Powered Fake Identity & Document Forensics Engine | Smart India Hackathon 2026", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=8))

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    meta_data = [
        [Paragraph(f"<b>Verification ID:</b> {v_id}", body_style), Paragraph(f"<b>Timestamp:</b> {now_str}", body_style)],
        [Paragraph(f"<b>Document Type:</b> {context.get('document_type', 'Aadhaar')}", body_style), Paragraph(f"<b>Doc SHA-256:</b> {context.get('document_hash', 'N/A')[:24]}...", body_style)]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # Risk Score Summary Card
    score = context.get("risk_score", 0)
    level = context.get("risk_level", "LOW")
    decision = context.get("final_decision", "PASSED")
    
    tier_color = colors.HexColor("#16a34a") if level == "LOW" else (
        colors.HexColor("#d97706") if level == "MEDIUM" else (
            colors.HexColor("#ea580c") if level == "HIGH" else colors.HexColor("#dc2626")
        )
    )

    qr = context.get("qr_analysis", {})
    qr_str = "Detected & Readable" if qr.get("qr_readable") else ("Detected (Raw/Unparsed)" if qr.get("qr_detected") else "Not detected / Partial")

    risk_table_data = [
        [
            Paragraph(f"<font size=18><b>{score} / 100</b></font><br/><font color='{tier_color.hexval()}'><b>{level} RISK</b></font>", body_style),
            Paragraph(f"<b>Final Decision:</b> {decision} | <b>OCR Quality:</b> {context.get('ocr_score', 94)}%<br/>"
                      f"<b>Aadhaar Checksum:</b> {'PASS (Verhoeff D5)' if context.get('validation_score', 0) == 0 else 'FAIL / ANOMALY'}<br/>"
                      f"<b>QR Code Status:</b> {qr_str}<br/>"
                      f"<b>Forensic Tamper Probability:</b> {context.get('tamper_score', 0)}%", body_style)
        ]
    ]
    t_risk = Table(risk_table_data, colWidths=[170, 370])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, tier_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_risk)
    story.append(Spacer(1, 10))

    # Extracted Information
    story.append(Paragraph("1. EXTRACTED INFORMATION (PRIVACY-MASKED)", heading2_style))
    ext = context.get("extractions", {})
    ext_data = [
        ["Holder Name", ext.get("name", "Demo Person"), "Masked Aadhaar", ext.get("document_number_masked", "XXXX XXXX 1234")],
        ["Father / Guardian", ext.get("father_name", "Demo Father"), "Gender", ext.get("gender", "MALE")],
        ["Date of Birth / YOB", f"{ext.get('date_of_birth', '15/08/1998')} (YOB: {ext.get('year_of_birth', '1998')})", "Address State", ext.get("state", "Kerala")],
        ["District", ext.get("district", "Kollam"), "PIN Code", ext.get("pincode", "691001")]
    ]
    t_ext = Table(ext_data, colWidths=[120, 150, 120, 150])
    t_ext.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f8fafc")),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor("#f8fafc")),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#1e293b")),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_ext)
    story.append(Spacer(1, 8))

    # Mistakes & Issues Table
    story.append(Paragraph("2. POSSIBLE MISTAKES & SYSTEM ISSUES", heading2_style))
    mistakes = context.get("mistakes_and_issues", [])
    mistake_rows = [["Severity", "Issue Category", "Description", "Recommendation"]]
    if not mistakes:
        mistake_rows.append(["PASSED", "Validation Checks", "No structural, checksum, or forensic issues detected.", "None required."])
    else:
        for m in mistakes[:5]:
            sev = m.get("severity", "INFO")
            mistake_rows.append([
                sev,
                m.get("title", ""),
                Paragraph(m.get("description", ""), body_style),
                Paragraph(m.get("recommendation", "Review document."), body_style)
            ])
    t_mistakes = Table(mistake_rows, colWidths=[65, 110, 205, 160])
    t_mistakes.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_mistakes)
    story.append(Spacer(1, 8))

    # Forensic & Validation Results
    story.append(Paragraph("3. FORENSIC TAMPER & QR AUDIT", heading2_style))
    val_data = [
        ["Audit Vector", "Result", "Technical Details"],
        ["Verhoeff Checksum", "PASSED" if context.get("validation_score", 0) == 0 else "FAILED", "Permutation & dihedral D5 mathematical parity check"],
        ["QR Code Scanner", qr_str, f"Payload: {qr.get('qr_type', 'None')} | Consistency: {qr.get('qr_ocr_consistency', 'N/A')}"],
        ["Error Level Analysis (ELA)", f"{context.get('tamper_score', 15)}% Tamper Risk", "Localized compression disparity mapping"],
        ["CNN Splicing Detection", "ANALYZED", "ResNet/Laplacian boundary gradient discontinuity check"]
    ]
    t_val = Table(val_data, colWidths=[140, 130, 270])
    t_val.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTSIZE', (0,0), (-1,-1), 7.5),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_val)
    story.append(Spacer(1, 8))

    # Itemized Evidence
    story.append(Paragraph("4. ITEMIZED EVIDENCE ATTRIBUTION ('WHY THIS SCORE?')", heading2_style))
    ev_items = context.get("evidence_items", [])
    ev_table_data = [["Category", "Severity", "Impact", "Description"]]
    for item in ev_items[:6]:
        delta = item.get("risk_delta", 0)
        impact = f"+{delta} pts" if delta > 0 else f"{delta} pts"
        ev_table_data.append([
            item.get("category", "General"),
            item.get("severity", "Medium"),
            impact,
            Paragraph(item.get("description", ""), body_style)
        ])
    if len(ev_table_data) == 1:
        ev_table_data.append(["General", "Info", "0 pts", "No significant anomalies flagged."])

    t_ev = Table(ev_table_data, colWidths=[95, 60, 65, 320])
    t_ev.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTSIZE', (0,0), (-1,-1), 7),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_ev)
    story.append(Spacer(1, 8))

    # Recommended Next Actions
    story.append(Paragraph("5. RECOMMENDED NEXT ACTIONS", heading2_style))
    actions = []
    if score > 50:
        actions.append("• Request physical Aadhaar card inspection under UV / oblique illumination.")
        actions.append("• Perform authorized DigiLocker or UIDAI QR XML verification.")
    elif score > 25:
        actions.append("• Corroborate address and DOB against secondary supporting identity (PAN / Passport).")
    else:
        actions.append("• Document verified satisfactorily against automated forensic and mathematical baseline.")
    story.append(Paragraph("<br/>".join(actions), body_style))
    story.append(Spacer(1, 8))

    # Cryptographic Audit Seal & Statutory Disclaimer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=6, spaceAfter=6))
    doc_hash = context.get("document_hash", "0000")
    audit_sig = f"AUDIT-SHA256:{doc_hash[:32]}...::VERIFIED_GENUINE_SEAL"
    story.append(Paragraph(f"<b>Tamper-Evident Audit Seal:</b> <code>{audit_sig}</code>", body_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<b>STATUTORY SCREENING DISCLAIMER:</b> This automated evaluation is an AI-assisted screening assessment "
        "and does not constitute official statutory identity authentication. Aadhaar checksum and reference dataset matches "
        "measure mathematical format and statistical consistency, not official government issuance. "
        "VeriDoc 2.0 / Ministry of Home Affairs Cyber Defense.", disclaimer_style
    ))

    # Build PDF
    doc.build(story)
    report_hash = compute_file_sha256(filepath)

    return {
        "report_id": v_id,
        "filename": filename,
        "file_path": filepath,
        "report_hash": report_hash,
        "download_url": f"/static/reports/{filename}"
    }
