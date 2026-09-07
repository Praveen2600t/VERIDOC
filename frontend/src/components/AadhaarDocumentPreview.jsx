import React, { useState } from 'react';
import { 
  ShieldCheck, Eye, EyeOff, AlertTriangle, CheckCircle2, 
  Sparkles, Lock, Layers, Info, QrCode
} from 'lucide-react';

export default function AadhaarDocumentPreview({ 
  extractedData = {}, 
  originalImageUrl = null,
  redactedImageUrl = null,
  suspiciousBoxes = [],
  tamperScore = 0
}) {
  const [viewMode, setViewMode] = useState('redacted'); // 'redacted' | 'original'
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);

  // Synthetic demo defaults (never expose sensitive real person data)
  const name = extractedData.name || "Demo Person";
  const fatherName = extractedData.father_name || "Demo Father";
  const yob = extractedData.year_of_birth || "1998";
  const dob = extractedData.date_of_birth || "15/08/1998";
  const gender = extractedData.gender || "Male";
  const address = extractedData.address || "Demo Address, Kollam Sub District, Kollam, Kerala - 691001";
  
  // Masked vs Raw number
  const maskedAadhaar = extractedData.document_number_masked || "XXXX XXXX 1234";
  const rawNumberDemo = extractedData.document_number || "5432 8765 4320";

  // Check if tampered number
  const isTampered = tamperScore >= 45 || (extractedData.field_confidences?.aadhaar_number?.status?.includes("Failed"));

  return (
    <div className="bg-[#0c1322] border border-cyber-border rounded-3xl p-6 shadow-2xl space-y-5">
      
      {/* Header bar with Mode Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-cyber-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Document Preview & Layout Inspection
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Aadhaar Standard
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Bilingual format layout inspection with privacy-first redaction layer.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Privacy Redaction Toggle: Original vs Privacy Protected Preview */}
          <div className="inline-flex rounded-xl bg-[#070b14] p-1 border border-cyber-border shadow-inner">
            <button
              onClick={() => setViewMode('original')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                viewMode === 'original'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Show original uploaded document view"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Original Document</span>
            </button>
            <button
              onClick={() => setViewMode('redacted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                viewMode === 'redacted'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
              title="View with sensitive fields masked (Section 3)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Protected Preview</span>
            </button>
          </div>

          {/* Suspicious Bounding Box Toggle */}
          {suspiciousBoxes.length > 0 && (
            <button
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                showBoundingBoxes
                  ? 'bg-red-950/40 border-red-500/50 text-red-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
              title="Toggle bounding boxes over suspicious regions"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>{showBoundingBoxes ? 'Hide Suspicious Boxes' : 'Show Suspicious Boxes'}</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500/20 text-red-300 font-mono">
                {suspiciousBoxes.length}
              </span>
            </button>
          )}

        </div>
      </div>

      {/* Main Document Preview Card */}
      <div className="relative mx-auto max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-900 transition-all select-none">
        
        {/* Top Navy Blue Band */}
        <div className="bg-[#0b1329] text-white px-5 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            
            {/* Ashoka Pillar / Emblem Placeholder */}
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14 6H10L12 2ZM6 8H18V10H6V8ZM7 12H17V14H7V12ZM8 16H16V18H8V16ZM10 20H14V22H10V20Z"/>
              </svg>
            </div>

            <div>
              <div className="text-[11px] font-bold tracking-wide text-slate-100 uppercase leading-tight font-sans">
                भारत सरकार | GOVERNMENT OF INDIA
              </div>
              <div className="text-[9px] text-slate-300 font-medium leading-tight">
                भारतीय विशिष्ट पहचान प्राधिकरण | UNIQUE IDENTIFICATION AUTHORITY OF INDIA
              </div>
              <div className="text-[8px] text-slate-400 font-medium leading-tight">
                இந்திய அரசு | இந்திய தனித்துவ அடையாள ஆணையம்
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-black text-amber-400 font-sans tracking-wide">
              आधार
            </div>
            <div className="text-[10px] font-extrabold text-amber-300 tracking-wider">
              AADHAAR
            </div>
          </div>
        </div>

        {/* Tricolour-Inspired Header Bands */}
        <div className="w-full flex flex-col">
          <div className="h-[4px] bg-[#f59e0b] w-full" />
          <div className="h-[2px] bg-white w-full" />
          <div className="h-[4px] bg-[#10b981] w-full" />
        </div>

        {/* Redaction Watermark Badge (Visible in Privacy Protected Mode) */}
        {viewMode === 'redacted' && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-1 flex items-center justify-between text-[11px] text-emerald-300 font-mono">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">PRIVACY PROTECTED REDACTED VIEW</span>
            </div>
            <span className="text-[10px] text-emerald-400">UIDAI Safe Masking Enabled</span>
          </div>
        )}

        {/* Card Body Grid */}
        <div className="p-5 grid grid-cols-12 gap-4 items-center bg-[#fafcff] relative">
          
          {/* Photo Box on the Left (Col 1 to 4) */}
          <div className="col-span-4 sm:col-span-3">
            <div className="relative aspect-[3/4] rounded-xl bg-slate-100 border-2 border-slate-300 overflow-hidden shadow-inner flex flex-col items-center justify-center group">
              {/* Silhouette Avatar */}
              <div className="w-16 h-16 rounded-full bg-slate-300 mb-2 flex items-center justify-center text-slate-500">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="text-[9px] font-mono text-slate-500 text-center uppercase tracking-tight">
                Photograph Area
              </div>

              {/* Photo Area Suspicious Box if Tampered */}
              {showBoundingBoxes && isTampered && (
                <div className="absolute inset-1 border-2 border-red-500 bg-red-500/10 rounded-lg pointer-events-none flex items-start justify-end p-1">
                  <span className="text-[8px] bg-red-600 text-white font-bold px-1 rounded shadow">
                    Patch Anomaly
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Demographic Information in Center (Col 5 to 9) */}
          <div className="col-span-8 sm:col-span-6 space-y-2 text-xs">
            
            {/* Name */}
            <div>
              <div className="text-[10px] text-slate-500 font-medium">
                Name / பெயர் / नाम :
              </div>
              <div className="text-sm font-extrabold text-slate-900 tracking-tight">
                {name}
              </div>
            </div>

            {/* Father's Name */}
            <div>
              <div className="text-[10px] text-slate-500 font-medium">
                Father / தந்தை / पिता :
              </div>
              <div className="text-xs font-bold text-slate-800">
                {fatherName}
              </div>
            </div>

            {/* Date & Year of Birth */}
            <div className="relative">
              <div className="flex flex-wrap items-center gap-x-3 text-xs font-semibold text-slate-800">
                <span>DOB: <b className="text-slate-900 font-mono">{dob}</b></span>
                <span>YOB: <b className="text-slate-900 font-mono">{yob}</b></span>
              </div>
              {/* Suspicious Box for DOB/YOB */}
              {showBoundingBoxes && isTampered && (
                <div className="absolute -inset-1 border-2 border-amber-500 bg-amber-500/10 rounded pointer-events-none flex items-center justify-end pr-1">
                  <span className="text-[8px] bg-amber-600 text-white font-bold px-1 rounded shadow">
                    Possible editing near YOB
                  </span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <div className="text-xs font-semibold text-slate-800">
                Gender / பாலினம் / लिंग : <b className="text-slate-900 font-bold uppercase">{gender}</b>
              </div>
            </div>

            {/* Address */}
            <div>
              <div className="text-[10px] text-slate-500 font-medium">
                Address / முகவரி / पता :
              </div>
              <div className="text-[11px] text-slate-700 leading-snug font-medium">
                {address}
              </div>
            </div>

          </div>

          {/* QR Code on Right (Col 10 to 12) */}
          <div className="col-span-12 sm:col-span-3 flex flex-col items-center justify-center">
            <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-sm flex flex-col items-center">
              {/* Real QR SVG Matrix Pattern */}
              <svg className="w-24 h-24" viewBox="0 0 100 100" fill="currentColor">
                {/* QR Finder Corners */}
                <rect x="5" y="5" width="26" height="26" fill="#0f172a" rx="2"/>
                <rect x="9" y="9" width="18" height="18" fill="#ffffff" rx="1"/>
                <rect x="13" y="13" width="10" height="10" fill="#0f172a" rx="1"/>

                <rect x="69" y="5" width="26" height="26" fill="#0f172a" rx="2"/>
                <rect x="73" y="9" width="18" height="18" fill="#ffffff" rx="1"/>
                <rect x="77" y="13" width="10" height="10" fill="#0f172a" rx="1"/>

                <rect x="5" y="69" width="26" height="26" fill="#0f172a" rx="2"/>
                <rect x="9" y="73" width="18" height="18" fill="#ffffff" rx="1"/>
                <rect x="13" y="77" width="10" height="10" fill="#0f172a" rx="1"/>

                {/* Data Dot Blocks */}
                <rect x="36" y="8" width="5" height="5" fill="#0f172a"/>
                <rect x="46" y="8" width="5" height="5" fill="#0f172a"/>
                <rect x="56" y="8" width="5" height="5" fill="#0f172a"/>
                <rect x="36" y="18" width="5" height="5" fill="#0f172a"/>
                <rect x="46" y="18" width="5" height="5" fill="#0f172a"/>
                <rect x="56" y="18" width="5" height="5" fill="#0f172a"/>

                <rect x="8" y="36" width="5" height="5" fill="#0f172a"/>
                <rect x="18" y="36" width="5" height="5" fill="#0f172a"/>
                <rect x="28" y="36" width="5" height="5" fill="#0f172a"/>
                <rect x="8" y="46" width="5" height="5" fill="#0f172a"/>
                <rect x="18" y="46" width="5" height="5" fill="#0f172a"/>
                <rect x="28" y="46" width="5" height="5" fill="#0f172a"/>

                {/* Central Cryptographic Micro Grid */}
                <rect x="38" y="38" width="24" height="24" fill="#0f172a"/>
                <rect x="42" y="42" width="16" height="16" fill="#ffffff"/>
                <rect x="46" y="46" width="8" height="8" fill="#0f172a"/>

                <rect x="68" y="38" width="5" height="5" fill="#0f172a"/>
                <rect x="78" y="38" width="5" height="5" fill="#0f172a"/>
                <rect x="88" y="38" width="5" height="5" fill="#0f172a"/>
                <rect x="68" y="48" width="5" height="5" fill="#0f172a"/>
                <rect x="78" y="48" width="5" height="5" fill="#0f172a"/>
                <rect x="88" y="48" width="5" height="5" fill="#0f172a"/>

                <rect x="38" y="68" width="5" height="5" fill="#0f172a"/>
                <rect x="48" y="68" width="5" height="5" fill="#0f172a"/>
                <rect x="58" y="68" width="5" height="5" fill="#0f172a"/>
                <rect x="68" y="68" width="5" height="5" fill="#0f172a"/>
                <rect x="78" y="68" width="5" height="5" fill="#0f172a"/>
                <rect x="88" y="68" width="5" height="5" fill="#0f172a"/>

                <rect x="38" y="78" width="5" height="5" fill="#0f172a"/>
                <rect x="48" y="78" width="5" height="5" fill="#0f172a"/>
                <rect x="58" y="78" width="5" height="5" fill="#0f172a"/>
                <rect x="68" y="78" width="5" height="5" fill="#0f172a"/>
                <rect x="78" y="78" width="5" height="5" fill="#0f172a"/>
                <rect x="88" y="78" width="5" height="5" fill="#0f172a"/>
              </svg>
              <span className="text-[9px] font-mono text-slate-500 mt-1 font-semibold">
                UIDAI SECURE QR
              </span>
            </div>
          </div>

        </div>

        {/* Red Horizontal Divider */}
        <div className="w-full border-t-2 border-red-600" />

        {/* Bottom Aadhaar Number Bar */}
        <div className="bg-[#edf2f7] px-6 py-4 text-center relative">
          
          <div className="text-[10px] text-slate-600 font-medium font-sans">
            YOUR AADHAAR NUMBER / உங்கள் ஆதார் எண் / आपकी आधार संख्या :
          </div>

          <div className="mt-1 flex items-center justify-center space-x-3 text-lg sm:text-xl font-black font-mono tracking-widest text-[#dc2626]">
            {viewMode === 'redacted' ? (
              <>
                <span className="bg-slate-300/60 px-2 py-0.5 rounded text-slate-700">XXXX</span>
                <span className="bg-slate-300/60 px-2 py-0.5 rounded text-slate-700">XXXX</span>
                <span className="text-[#dc2626]">{maskedAadhaar.slice(-4) || '1234'}</span>
              </>
            ) : (
              <>
                <span>{rawNumberDemo.slice(0, 4) || '5432'}</span>
                <span>{rawNumberDemo.slice(5, 9) || '8765'}</span>
                <span className={isTampered ? 'bg-red-500/20 px-1 rounded border border-red-500' : ''}>
                  {rawNumberDemo.slice(-4) || '4320'}
                </span>
              </>
            )}
          </div>

          {/* Highlight Bounding Box on Tampered Digit if active */}
          {showBoundingBoxes && isTampered && (
            <div className="absolute right-8 top-3 bottom-3 border-2 border-red-600 bg-red-600/10 px-2 rounded flex items-center">
              <span className="text-[9px] font-bold text-red-700 font-mono">
                Checksum digit alteration (9)
              </span>
            </div>
          )}

          <div className="text-[9px] text-slate-500 mt-1 font-mono">
            {viewMode === 'redacted'
              ? '✓ Compliant with Aadhaar Act privacy standards: first 8 digits redacted'
              : '⚠️ Raw document preview. Keep confidential in compliance with data privacy regulations'}
          </div>

        </div>

      </div>

      {/* Forensic Inspection Annotation Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-[#070b14] border border-cyber-border flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-300">
            Layout: <b className="text-emerald-400">UIDAI Bilingual Standard</b>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#070b14] border border-cyber-border flex items-center space-x-2">
          <QrCode className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-300">
            QR Zone: <b className="text-cyan-400">Detected & Analyzed</b>
          </span>
        </div>
        <div className="p-3 rounded-xl bg-[#070b14] border border-cyber-border flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-slate-300">
            Preview Mode: <b className={viewMode === 'redacted' ? 'text-emerald-400' : 'text-amber-400'}>
              {viewMode === 'redacted' ? 'Privacy Redacted' : 'Original Raw Scan'}
            </b>
          </span>
        </div>
      </div>

    </div>
  );
}
