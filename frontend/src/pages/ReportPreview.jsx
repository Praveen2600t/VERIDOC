import React from 'react';
import { 
  Download, ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, 
  FileText, Lock, QrCode, MapPin, Printer
} from 'lucide-react';

export default function ReportPreview({ 
  verificationData, 
  onBackToResults,
  onDownloadReport 
}) {
  if (!verificationData) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-sm">No report dossier loaded.</p>
        <button
          onClick={onBackToResults}
          className="mt-4 px-4 py-2 bg-cyan-500 text-black font-bold rounded-lg text-xs"
        >
          Return to Results
        </button>
      </div>
    );
  }

  const vId = verificationData.verification_id || "VD-DEMO-01";
  const score = verificationData.risk_score ?? 12;
  const level = verificationData.risk_level ?? "LOW";
  const decision = verificationData.final_decision ?? "PASSED";
  const ext = verificationData.extractions || {};
  const val = verificationData.validation || {};
  const qr = verificationData.qr_analysis || {};
  const mistakes = verificationData.mistakes_and_issues || [];

  const tierColor = level === 'LOW' ? 'text-emerald-600 border-emerald-500 bg-emerald-50' :
    level === 'MEDIUM' ? 'text-amber-600 border-amber-500 bg-amber-50' :
    level === 'HIGH' ? 'text-orange-600 border-orange-500 bg-orange-50' :
    'text-red-600 border-red-500 bg-red-50';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToResults}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Results</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
          <button
            onClick={onDownloadReport}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet View (Clean A4 Paper Aesthetic) */}
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl p-8 sm:p-12 border border-slate-200 font-sans space-y-6">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-800 pb-4 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-[#0284c7]" />
              <h1 className="text-xl font-black tracking-wider text-slate-950 uppercase">
                VERIDOC 2.0 — IDENTITY SCREENING REPORT
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              AI-Powered Fake Identity & Document Forensics Engine | Smart India Hackathon 2026
            </p>
          </div>

          <div className="text-right sm:text-right font-mono text-xs text-slate-600">
            <div>Verification ID: <b className="text-slate-900">{vId}</b></div>
            <div>Generated: <b>{new Date().toLocaleDateString()}</b></div>
            <div>Doc Type: <b className="text-slate-900">{verificationData.document_type || 'Aadhaar'}</b></div>
          </div>
        </div>

        {/* Executive Risk Banner */}
        <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${tierColor}`}>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider font-bold">
              Screening Assessment
            </div>
            <div className="text-2xl font-black">
              {level} RISK ({score} / 100) — {decision}
            </div>
            <p className="text-xs mt-1 text-slate-700 max-w-xl">
              Composite score synthesized from OCR clarity (15%), Verhoeff checksum (20%), 
              image forensics (20%), AI tamper analysis (25%), and QR matrix checks (10%).
            </p>
          </div>

          <div className="text-center bg-white/80 px-4 py-2 rounded-xl border border-current shadow-sm">
            <span className="text-[10px] font-mono block text-slate-600">Decision Status</span>
            <span className="text-lg font-black">{decision}</span>
          </div>
        </div>

        {/* 1. Masked Extracted Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <h2 className="text-sm font-extrabold uppercase text-slate-900 tracking-wide flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-cyan-600" />
              <span>1. AI Extracted Information (Privacy-Masked)</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              OCR Confidence: {ext.ocr_confidence || 94.7}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Full Name</span>
              <span className="font-bold text-slate-900">{ext.name || 'Demo Person'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Father / Guardian</span>
              <span className="font-bold text-slate-900">{ext.father_name || 'Demo Father'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Date / Year of Birth</span>
              <span className="font-bold text-slate-900">{ext.date_of_birth || '15/08/1998'} (YOB: {ext.year_of_birth || '1998'})</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Gender</span>
              <span className="font-bold text-slate-900">{ext.gender || 'Male'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">Masked Aadhaar Number</span>
              <span className="font-mono font-black text-red-600 text-sm">{ext.document_number_masked || 'XXXX XXXX 1234'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] uppercase text-slate-500 font-semibold block">State / District / PIN</span>
              <span className="font-bold text-slate-900">{ext.district || 'Kollam'}, {ext.state || 'Kerala'} — {ext.pincode || '691001'}</span>
            </div>
          </div>
        </div>

        {/* 2. Aadhaar Validation & QR Code Audit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Checksum Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Aadhaar Format & Mathematical Validation</span>
            </h3>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Aadhaar Format:</span>
                <b className={val.format_valid !== false ? 'text-emerald-700' : 'text-red-700'}>
                  {val.format_valid !== false ? 'PASS' : 'FAIL'}
                </b>
              </div>
              <div className="flex justify-between">
                <span>Verhoeff D5 Checksum:</span>
                <b className={val.checksum_passed !== false ? 'text-emerald-700' : 'text-red-700'}>
                  {val.checksum_passed !== false ? 'PASS' : 'FAIL'}
                </b>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2">
              Verhoeff checksum verifies numeric transcription parity. Does not constitute official UIDAI authentication.
            </p>
          </div>

          {/* QR Code Audit */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-cyan-600" />
              <span>QR Code Verification</span>
            </h3>
            <div className="space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>QR Detection:</span>
                <b className="text-slate-900">{qr.qr_detected ? '✓ Detected' : 'Not Detected'}</b>
              </div>
              <div className="flex justify-between">
                <span>QR Readability:</span>
                <b className={qr.qr_readable ? 'text-emerald-700' : 'text-amber-700'}>
                  {qr.qr_readable ? '✓ Readable' : '⚠ Attention Required'}
                </b>
              </div>
              <div className="flex justify-between">
                <span>QR-OCR Consistency:</span>
                <b className="text-emerald-700">{qr.qr_ocr_consistency_status || '✓ Consistent'}</b>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic mt-2">
              QR absence alone does not imply document forgery. Sensitive payload bytes remain encrypted.
            </p>
          </div>

        </div>

        {/* 3. Mistakes & Issues Identification */}
        <div className="space-y-2">
          <h2 className="text-sm font-extrabold uppercase text-slate-900 tracking-wide border-b border-slate-200 pb-1.5 flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>2. Detected Issues & Anomalies</span>
          </h2>

          <div className="space-y-2 text-xs">
            {mistakes.map((m, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg border flex items-start justify-between gap-3 bg-slate-50 border-slate-200"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{m.field || m.title}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{m.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  m.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-300' :
                  m.severity === 'WARNING' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                  m.severity === 'ATTENTION' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                  'bg-emerald-100 text-emerald-700 border border-emerald-300'
                }`}>
                  {m.severity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Statutory Disclaimer & Signoff */}
        <div className="border-t-2 border-slate-200 pt-4 text-[10px] text-slate-500 font-mono text-center space-y-1">
          <p className="font-bold text-slate-700 uppercase">
            Statutory Legal Notice & Security Protocol
          </p>
          <p>
            VeriDoc 2.0 provides AI document screening and forensic analysis for preliminary fraud mitigation. 
            This report does NOT constitute official Aadhaar identity authentication or statutory UIDAI confirmation.
          </p>
          <p className="text-slate-400">
            Document SHA-256: {verificationData.document_hash || 'N/A'} | System Timestamp: {new Date().toISOString()}
          </p>
        </div>

      </div>

    </div>
  );
}
