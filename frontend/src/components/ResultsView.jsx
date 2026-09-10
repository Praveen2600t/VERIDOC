import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, 
  HelpCircle, Eye, RefreshCw, FileText, Info, Camera,
  ShieldCheck, ShieldAlert
} from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function ResultsView({ result, imagePreviewUrl, onScanAnother }) {
  const canvasRef = useRef(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!result) return null;

  const {
    scan_id,
    doc_type,
    entered_fields = {},
    checksum = {},
    qr_check = {},
    forensics = {},
    risk_score = 0,
    risk_label = 'Low',
    breakdown = {}
  } = result;

  const suspicious_regions = forensics.suspicious_regions || [];
  const metadata_flag = forensics.metadata_flag || false;

  // Draw image and bounding boxes on HTML canvas scaled to element size
  useEffect(() => {
    if (!imagePreviewUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagePreviewUrl;

    img.onload = () => {
      setImageLoaded(true);
      // Set canvas internal drawing buffer to match image resolution
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw background document
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw suspicious red bounding boxes if enabled
      if (showBoxes && suspicious_regions.length > 0) {
        suspicious_regions.forEach((box, idx) => {
          const { x, y, w, h } = box;

          // Translucent fill
          ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
          ctx.fillRect(x, y, w, h);

          // Glowing border
          ctx.strokeStyle = '#DC2626';
          ctx.lineWidth = Math.max(2, Math.round(canvas.width / 300));
          ctx.strokeRect(x, y, w, h);

          // Label badge
          const labelText = `TAMPER REGION #${idx + 1}`;
          const fontSize = Math.max(12, Math.round(canvas.width / 45));
          ctx.font = `bold ${fontSize}px sans-serif`;

          const textMetrics = ctx.measureText(labelText);
          const pad = 6;
          const tagW = textMetrics.width + pad * 2;
          const tagH = fontSize + pad * 2;

          ctx.fillStyle = '#DC2626';
          ctx.fillRect(x, Math.max(0, y - tagH), tagW, tagH);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(labelText, x + pad, Math.max(fontSize, y - pad));
        });
      }
    };
  }, [imagePreviewUrl, showBoxes, suspicious_regions]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onScanAnother}
            className="p-2 rounded-lg text-slate-500 hover:text-navy hover:bg-slate-100 transition"
            title="Back to upload"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-navy flex items-center gap-2">
              <span>Screening Audit Results</span>
              <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
                {doc_type}
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">Scan ID: {scan_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RiskBadge score={risk_score} label={risk_label} />
          <button
            onClick={onScanAnother}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy hover:bg-navy-light text-white rounded-xl text-sm font-semibold shadow-xs transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan Another Document</span>
          </button>
        </div>
      </div>

      {/* Metadata Warning Chip if editing software detected */}
      {metadata_flag && (
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">EXIF Tampering Signature Detected</p>
            <p className="text-xs text-rose-700 mt-0.5">
              Image metadata indicates manipulation using photo-editing software (Photoshop/GIMP/Snapseed). This strongly correlates with digital forging.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Visual Canvas Overlay (Left) + Multi-Signal Breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Canvas Viewer */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan" />
              <span>Forensic Canvas Inspection</span>
            </h3>

            {suspicious_regions.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={showBoxes}
                  onChange={(e) => setShowBoxes(e.target.checked)}
                  className="rounded border-slate-300 text-cyan focus:ring-cyan"
                />
                <span>Highlight Suspicious Regions ({suspicious_regions.length})</span>
              </label>
            )}
          </div>

          <div className="relative rounded-xl border border-slate-200 bg-slate-900 overflow-hidden flex items-center justify-center min-h-[300px] max-h-[520px]">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[500px] w-auto h-auto object-contain rounded-lg"
            />
          </div>

          {/* Entered Fields Recap */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="font-semibold text-slate-700">Verified User Inputs:</div>
            <div className="grid grid-cols-3 gap-2 text-slate-600">
              <div><span className="text-slate-400">Name:</span> <span className="font-medium text-slate-900">{entered_fields.name || 'N/A'}</span></div>
              <div><span className="text-slate-400">ID No:</span> <span className="font-medium font-mono text-slate-900">{entered_fields.id_number || 'N/A'}</span></div>
              <div><span className="text-slate-400">DOB:</span> <span className="font-medium text-slate-900">{entered_fields.dob || 'N/A'}</span></div>
            </div>
          </div>
        </div>

        {/* Right: Three-Row Signal Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Multi-Factor Risk Breakdown</h3>
              <p className="text-xs text-slate-500">Transparent mathematical attribution of the composite risk score.</p>
            </div>

            <div className="space-y-4">
              {/* Row 1: Checksum Validation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {checksum.is_valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-slate-800">
                      1. Checksum Validation ({doc_type === 'aadhaar' ? 'Verhoeff D₅' : 'PAN Format'})
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${checksum.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {checksum.is_valid ? 'VALID ✓' : 'FAILED ✕'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-7">{checksum.reason}</p>
                <div className="pl-7 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Risk Contribution (35% weight)</span>
                    <span className="font-semibold">{breakdown.checksum_contribution ?? 0} pts</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${checksum.is_valid ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${((breakdown.checksum_contribution || 0) / 35) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: QR Code Cross-Check */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {!qr_check.qr_found ? (
                      <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : qr_check.qr_matches_input ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-slate-800">
                      2. QR Cross-Check (Offline)
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${!qr_check.qr_found ? 'bg-slate-200 text-slate-700' : qr_check.qr_matches_input ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {!qr_check.qr_found ? 'UNAVAILABLE' : qr_check.qr_matches_input ? 'MATCH ✓' : 'MISMATCH ✕'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-7">{qr_check.reason}</p>
                <div className="pl-7 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Risk Contribution ({qr_check.qr_found ? '25% weight' : '0% - skipped'})</span>
                    <span className="font-semibold">{breakdown.qr_contribution ?? 0} pts</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${qr_check.qr_matches_input ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: qr_check.qr_found ? `${((breakdown.qr_contribution || 0) / 25) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Image Forensics Score */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {forensics.forensic_score > 0.45 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-slate-800">
                      3. Image Forensics (ELA & Noise)
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${forensics.forensic_score > 0.45 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    Index: {Math.round((forensics.forensic_score || 0) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 pl-7">
                  {suspicious_regions.length > 0
                    ? `${suspicious_regions.length} anomalous localized block(s) detected with high ELA compression disparity.`
                    : 'Natural compression profile without localized splice boundaries.'}
                </p>
                <div className="pl-7 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Risk Contribution ({qr_check.qr_found ? '40% weight' : '55% weight'})</span>
                    <span className="font-semibold">{breakdown.forensic_contribution ?? 0} pts</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-dark transition-all"
                      style={{ width: `${Math.min(100, ((breakdown.forensic_contribution || 0) / (qr_check.qr_found ? 40 : 55)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Final Decision Card */}
            <div className={`p-4 rounded-xl text-center border font-semibold text-sm ${risk_score <= 33 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : risk_score <= 66 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              Final Disposition: {risk_score <= 33 ? 'PASSED — Identity document is genuine and structurally valid.' : risk_score <= 66 ? 'MANUAL REVIEW REQUIRED — Document has anomalies or unverified signals.' : 'REJECTED — Significant evidence of document tampering or checksum failure.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
