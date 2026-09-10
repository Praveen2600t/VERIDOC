import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Layers, Sparkles, RefreshCw } from 'lucide-react';
import { TRANSLATIONS } from '../accessibility/translations';

export default function UploadBox({ onVerify, isProcessing, currentLang = 'en' }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  
  const [isMultiDoc, setIsMultiDoc] = useState(false);
  const [primaryFile, setPrimaryFile] = useState(null);
  const [secondaryFile, setSecondaryFile] = useState(null);
  const [primaryPreview, setPrimaryPreview] = useState(null);
  const [secondaryPreview, setSecondaryPreview] = useState(null);
  const [dragOverPrimary, setDragOverPrimary] = useState(false);
  const [dragOverSecondary, setDragOverSecondary] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);

  const fileInputRef = useRef(null);
  const secondaryInputRef = useRef(null);

  const stages = [
    { label: "Uploading Document...", desc: "Streaming payload to secure sandbox" },
    { label: "Scanning...", desc: "Detecting document boundary & type" },
    { label: "Extracting...", desc: "High-clarity OCR field parsing & masking" },
    { label: "Analyzing...", desc: "Running Verhoeff checksum & ELA forensics" },
    { label: "Verification Complete", desc: "Generating explainable risk assessment" }
  ];

  const handleFileDrop = (e, isSec = false) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;

    if (isSec) {
      setSecondaryFile(droppedFile);
      setSecondaryPreview(URL.createObjectURL(droppedFile));
      setDragOverSecondary(false);
    } else {
      setPrimaryFile(droppedFile);
      setPrimaryPreview(URL.createObjectURL(droppedFile));
      setDragOverPrimary(false);
    }
  };

  const handleFileInputChange = (e, isSec = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isSec) {
      setSecondaryFile(file);
      setSecondaryPreview(URL.createObjectURL(file));
    } else {
      setPrimaryFile(file);
      setPrimaryPreview(URL.createObjectURL(file));
    }
  };

  const loadDemoSample = async (sampleType) => {
    try {
      let filename = 'aadhaar_clean.png';
      if (sampleType === 'original_eaadhaar') filename = 'original_eaadhaar_tamil.jpg';
      else if (sampleType === 'clean_aadhaar') filename = 'aadhaar_clean.png';
      else if (sampleType === 'edited_aadhaar') filename = 'aadhaar_edited.png';
      else if (sampleType === 'clean_pan') filename = 'pan_clean.png';
      else if (sampleType === 'mismatched_pan') filename = 'pan_mismatched.png';
      else if (sampleType === 'duplicate_silhouette') filename = 'duplicate_1_silhouette_not_original.jpg';
      else if (sampleType === 'duplicate_16digit') filename = 'duplicate_2_16digit_mock_pvc.jpg';
      else if (sampleType === 'duplicate_cartoon') filename = 'duplicate_3_cartoon_000011112222.jpg';
      else if (sampleType === 'duplicate_composite') filename = 'duplicate_4_dualsided_composite.jpg';
      else if (sampleType === 'duplicate_samarth') filename = 'duplicate_5_samarth_123456789012.jpg';


      // Fetch file from /sample_docs/
      let res = await fetch(`/sample_docs/${filename}`).catch(() => null);
      if (!res || !res.ok) {
        res = await fetch(`/uploads/${filename}`).catch(() => null);
      }
      const blob = await res.blob();
      const demoFile = new File([blob], filename, { type: "image/png" });

      if (sampleType === 'mismatched_pan' || sampleType === 'clean_pan') {
        setIsMultiDoc(true);
        setSecondaryFile(demoFile);
        setSecondaryPreview(URL.createObjectURL(demoFile));
        
        // Ensure primary is loaded with clean Aadhaar
        if (!primaryFile) {
          let pRes = await fetch(`/sample_docs/aadhaar_clean.png`).catch(() => null);
          if (!pRes || !pRes.ok) pRes = await fetch(`/uploads/aadhaar_clean.png`).catch(() => null);
          const pBlob = await pRes.blob();
          const pFile = new File([pBlob], "aadhaar_clean.png", { type: "image/png" });
          setPrimaryFile(pFile);
          setPrimaryPreview(URL.createObjectURL(pFile));
        }
      } else {
        setPrimaryFile(demoFile);
        setPrimaryPreview(URL.createObjectURL(demoFile));
      }
    } catch (err) {
      console.error("Demo load error:", err);
    }
  };

  const handleSubmit = async () => {
    if (!primaryFile) return;

    // Trigger visual stage animation
    setStageIndex(0);
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        if (prev < 3) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      await onVerify({
        primaryFile,
        secondaryFile: isMultiDoc ? secondaryFile : null
      });
      setStageIndex(4);
    } finally {
      clearInterval(interval);
    }
  };

  return (
    <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
      
      {/* Background Cyber Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-cyber-border/70 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Identity Document Ingestion</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.dropzoneSubtitle}</p>
        </div>

        {/* Multi-Document Toggle */}
        <div className="flex items-center space-x-2 bg-[#070b14] p-1 rounded-xl border border-cyber-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsMultiDoc(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isMultiDoc ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Single Document
          </button>
          <button
            type="button"
            onClick={() => setIsMultiDoc(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isMultiDoc ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cross-Document (2 IDs)</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzones */}
      <div className={`grid gap-5 ${isMultiDoc ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* Primary Document Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOverPrimary(true); }}
          onDragLeave={() => setDragOverPrimary(false)}
          onDrop={(e) => handleFileDrop(e, false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative ${
            dragOverPrimary
              ? 'border-cyan-400 bg-cyan-500/10'
              : primaryFile
              ? 'border-emerald-500/40 bg-emerald-500/5'
              : 'border-cyber-border hover:border-slate-500 bg-[#070b14]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileInputChange(e, false)}
            className="hidden"
          />

          {primaryFile ? (
            <div className="flex flex-col items-center">
              {primaryPreview ? (
                <img
                  src={primaryPreview}
                  alt="Primary Doc Preview"
                  className="w-full max-h-48 object-contain rounded-lg border border-cyber-border mb-3 shadow-md"
                />
              ) : (
                <FileText className="w-12 h-12 text-emerald-400 mb-2" />
              )}
              <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{primaryFile.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Click or drag another file to replace</p>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-sm font-semibold text-slate-200">{t.dropzoneTitle}</p>
              <p className="text-xs text-slate-400 mt-1">Aadhaar, PAN, Passport or Driving Licence</p>
              <span className="inline-block mt-3 px-3 py-1 bg-slate-800 text-slate-300 text-[11px] rounded-full font-mono border border-slate-700">
                Primary Document
              </span>
            </div>
          )}
        </div>

        {/* Secondary Document Zone (Multi-doc mode) */}
        {isMultiDoc && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOverSecondary(true); }}
            onDragLeave={() => setDragOverSecondary(false)}
            onDrop={(e) => handleFileDrop(e, true)}
            onClick={() => secondaryInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative ${
              dragOverSecondary
                ? 'border-cyan-400 bg-cyan-500/10'
                : secondaryFile
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-cyber-border hover:border-slate-500 bg-[#070b14]/50'
            }`}
          >
            <input
              ref={secondaryInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileInputChange(e, true)}
              className="hidden"
            />

            {secondaryFile ? (
              <div className="flex flex-col items-center">
                {secondaryPreview ? (
                  <img
                    src={secondaryPreview}
                    alt="Secondary Doc Preview"
                    className="w-full max-h-48 object-contain rounded-lg border border-cyber-border mb-3 shadow-md"
                  />
                ) : (
                  <FileText className="w-12 h-12 text-emerald-400 mb-2" />
                )}
                <div className="flex items-center space-x-2 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{secondaryFile.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Click or drag another file to replace</p>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Layers className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-slate-200">Upload Secondary Identity Document</p>
                <p className="text-xs text-slate-400 mt-1">PAN Card or Passport to cross-verify</p>
                <span className="inline-block mt-3 px-3 py-1 bg-blue-900/40 text-blue-300 text-[11px] rounded-full font-mono border border-blue-700/50">
                  Cross-Verification ID
                </span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Quick Hackathon Demo Loaders */}
      <div className="mt-6 pt-5 border-t border-cyber-border/70">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.orSelectDemo}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            type="button"
            onClick={() => loadDemoSample('original_eaadhaar')}
            className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-emerald-500/40 rounded-lg text-xs transition-all hover:border-emerald-400"
          >
            <div className="text-emerald-400 font-bold text-[11px]">✓ Original e-Aadhaar</div>
            <div className="text-[10px] text-slate-400 truncate">Tamil e-Letter Specimen</div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoSample('clean_aadhaar')}
            className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-cyber-border rounded-lg text-xs transition-all hover:border-emerald-500/40"
          >
            <div className="text-emerald-400 font-bold text-[11px]">✓ Valid Card</div>
            <div className="text-[10px] text-slate-400 truncate">Clean ELA & Checksum</div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoSample('edited_aadhaar')}
            className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-cyber-border rounded-lg text-xs transition-all hover:border-red-500/40"
          >
            <div className="text-red-400 font-bold text-[11px]">⚠️ Tampered Aadhaar</div>
            <div className="text-[10px] text-slate-400 truncate">Edited Photo + Bad Digits</div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoSample('clean_pan')}
            className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-cyber-border rounded-lg text-xs transition-all hover:border-cyan-500/40"
          >
            <div className="text-cyan-400 font-bold text-[11px]">✓ Matching PAN</div>
            <div className="text-[10px] text-slate-400 truncate">Dual Document Match</div>
          </button>

          <button
            type="button"
            onClick={() => loadDemoSample('mismatched_pan')}
            className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-cyber-border rounded-lg text-xs transition-all hover:border-amber-500/40"
          >
            <div className="text-amber-400 font-bold text-[11px]">⚠️ Mismatched PAN</div>
            <div className="text-[10px] text-slate-400 truncate">Cross-Doc Demographic Mismatch</div>
          </button>
        </div>

        {/* Duplicate Aadhaar Detectors Row */}
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-rose-400 flex items-center space-x-1.5 mb-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Trained Duplicate & Mock Aadhaar Datasets:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => loadDemoSample('duplicate_silhouette')}
              className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-rose-500/30 hover:border-rose-500/60 rounded-lg text-xs transition-all"
            >
              <div className="text-rose-400 font-bold text-[11px]">✕ Silhouette Avatar</div>
              <div className="text-[10px] text-slate-400 truncate">Gray Vector & XXXX Mask</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoSample('duplicate_16digit')}
              className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-rose-500/30 hover:border-rose-500/60 rounded-lg text-xs transition-all"
            >
              <div className="text-rose-400 font-bold text-[11px]">✕ 16-Digit PVC Mock</div>
              <div className="text-[10px] text-slate-400 truncate">4444 3333 6666 8888</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoSample('duplicate_cartoon')}
              className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-rose-500/30 hover:border-rose-500/60 rounded-lg text-xs transition-all"
            >
              <div className="text-rose-400 font-bold text-[11px]">✕ Cartoon 0000-1111</div>
              <div className="text-[10px] text-slate-400 truncate">Clip-Art & Bad Prefix</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoSample('duplicate_samarth')}
              className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-rose-500/30 hover:border-rose-500/60 rounded-lg text-xs transition-all"
            >
              <div className="text-rose-400 font-bold text-[11px]">✕ Sequential 1234</div>
              <div className="text-[10px] text-slate-400 truncate">1234 5678 9012 Mock</div>
            </button>

            <button
              type="button"
              onClick={() => loadDemoSample('duplicate_composite')}
              className="px-2.5 py-2 text-left bg-[#070b14] hover:bg-slate-800/80 border border-amber-500/30 hover:border-amber-500/60 rounded-lg text-xs transition-all"
            >
              <div className="text-amber-400 font-bold text-[11px]">⚠️ Stitched Composite</div>
              <div className="text-[10px] text-slate-400 truncate">Front & Back Seam Cut</div>
            </button>
          </div>
        </div>
      </div>


      {/* Multi-Stage Animated Scan Progress */}
      {isProcessing && (
        <div className="mt-6 bg-[#070b14] border border-cyan-500/40 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-cyan-400 font-bold flex items-center space-x-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{stages[stageIndex].label}</span>
            </span>
            <span className="text-slate-400 font-semibold">{stageIndex + 1} / 5</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((stageIndex + 1) / 5) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-mono">{stages[stageIndex].desc}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          disabled={!primaryFile || isProcessing}
          onClick={handleSubmit}
          className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center space-x-2 ${
            !primaryFile || isProcessing
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black border border-cyan-300/40 shadow-cyan-500/20 hover:shadow-cyan-500/30'
          }`}
        >
          <span>{t.verifyNowBtn}</span>
          <span className="text-xs">→</span>
        </button>
      </div>

    </div>
  );
}
