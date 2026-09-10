import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, Sparkles, AlertCircle, CheckCircle, 
  ArrowRight, Shield, ShieldCheck, RefreshCw, Download
} from 'lucide-react';

export default function UploadView({ onAnalyze, isLoading, error }) {
  const [docType, setDocType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG/PNG).');
      return;
    }
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Quick load synthetic specimen from backend
  const handleLoadSpecimen = async (layout, tampered = false) => {
    setSampleLoading(true);
    try {
      const res = await fetch(`/api/generate-sample?layout=${layout}&tampered=${tampered}&format=json`);
      if (!res.ok) throw new Error('Failed to generate specimen');
      const data = await res.json();
      const s = data.specimen_data;

      // Update form
      setDocType(s.doc_type || (layout === 'pan' ? 'pan' : 'aadhaar'));
      setIdNumber(s.id_number || '');
      setName(s.name || '');
      setDob(s.dob || '');
      setPreviewUrl(data.image_base64);

      // Convert base64 data to File object
      const blobRes = await fetch(data.image_base64);
      const blob = await blobRes.blob();
      const specimenFile = new File([blob], `specimen_${layout}_${tampered ? 'tampered' : 'clean'}.png`, { type: 'image/png' });
      setFile(specimenFile);
    } catch (err) {
      console.error('Error loading specimen:', err);
      alert('Could not load specimen from /api/generate-sample: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please upload or select an identity document image.');
      return;
    }
    if (!idNumber.trim()) {
      alert('Please enter the ID number shown on the document.');
      return;
    }
    onAnalyze({ file, docType, idNumber, name, dob, previewUrl });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Specimen Quick-Loader Bar */}
      <div className="bg-navy-soft/60 border border-navy/15 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-navy text-cyan flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
              SIH Hackathon Specimen Test Bench
            </h4>
            <p className="text-xs text-slate-600">
              Load 100% synthetic specimen cards to test format diversity & tamper detection:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={sampleLoading || isLoading}
            onClick={() => handleLoadSpecimen('old_pvc', false)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-cyan hover:text-navy transition shadow-2xs"
          >
            Aadhaar PVC (Clean)
          </button>
          <button
            type="button"
            disabled={sampleLoading || isLoading}
            onClick={() => handleLoadSpecimen('old_pvc', true)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition shadow-2xs"
          >
            Aadhaar PVC (Tampered)
          </button>
          <button
            type="button"
            disabled={sampleLoading || isLoading}
            onClick={() => handleLoadSpecimen('my_aadhaar', false)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-cyan hover:text-navy transition shadow-2xs"
          >
            MyAadhaar Modern
          </button>
          <button
            type="button"
            disabled={sampleLoading || isLoading}
            onClick={() => handleLoadSpecimen('dual_sided', false)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-cyan hover:text-navy transition shadow-2xs"
          >
            Dual-Sided e-Aadhaar
          </button>
          <button
            type="button"
            disabled={sampleLoading || isLoading}
            onClick={() => handleLoadSpecimen('masked', false)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-cyan hover:text-navy transition shadow-2xs"
          >
            Masked Aadhaar
          </button>
          <button
            type="button"
            disabled={sampleLoading || isLoading}
            onClick={() => handleLoadSpecimen('pan', false)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-700 hover:border-cyan hover:text-navy transition shadow-2xs"
          >
            PAN Card
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Upload Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drag-and-Drop Area & Preview */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan" />
              <span>Document Image Capture</span>
            </h3>
            {file && (
              <button
                type="button"
                onClick={() => { setFile(null); setPreviewUrl(null); }}
                className="text-xs text-rose-600 hover:underline"
              >
                Remove image
              </button>
            )}
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[320px] ${
              isDragging
                ? 'border-cyan bg-cyan-light/40 ring-4 ring-cyan/20'
                : previewUrl
                ? 'border-slate-300 bg-slate-900/5 hover:border-navy'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />

            {previewUrl ? (
              <div className="space-y-3 w-full">
                <img
                  src={previewUrl}
                  alt="Document Preview"
                  className="max-h-64 mx-auto rounded-xl shadow-xs object-contain border border-slate-200"
                />
                <p className="text-xs text-slate-500 font-medium">
                  {file?.name || 'Specimen loaded'} • Click to change image
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-navy/5 text-navy mx-auto flex items-center justify-center">
                  <Upload className="w-7 h-7 text-navy" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    Drag and drop your document photo here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports JPG, PNG (Aadhaar or PAN Card photo/scan)
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy text-white hover:bg-navy-light transition shadow-xs"
                >
                  Browse Files
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Form Inputs & Submit CTA */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Document Credentials</h3>
              <p className="text-xs text-slate-500">
                Enter the fields shown on the physical/digital card for cross-validation.
              </p>
            </div>

            {/* Document Type Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Document Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-cyan focus:border-cyan outline-none transition"
              >
                <option value="aadhaar">Aadhaar Card (12-Digit UID)</option>
                <option value="pan">PAN Card (10-Character Alphanumeric)</option>
              </select>
            </div>

            {/* ID Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {docType === 'aadhaar' ? 'Aadhaar Number' : 'PAN Number'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder={docType === 'aadhaar' ? 'e.g. 2401 9279 8531 or XXXX XXXX 8531' : 'e.g. ABCPN1234F'}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:ring-2 focus:ring-cyan focus:border-cyan outline-none transition"
              />
              <p className="text-[11px] text-slate-400">
                {docType === 'aadhaar' ? 'Checked using Verhoeff Dihedral (D₅) algorithm' : 'Validated against Income Tax AAAAA9999A standard'}
              </p>
            </div>

            {/* Cardholder Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Cardholder Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AARAV SHARMA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan focus:border-cyan outline-none transition"
              />
              <p className="text-[11px] text-slate-400">Cross-verified against printed offline QR payload</p>
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Date of Birth (DOB)
              </label>
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="DD/MM/YYYY e.g. 15/08/1998"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-cyan focus:border-cyan outline-none transition"
              />
              <p className="text-[11px] text-slate-400">Standard DD/MM/YYYY format</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isLoading || sampleLoading}
              className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                isLoading
                  ? 'bg-navy/70 cursor-not-allowed'
                  : 'bg-navy hover:bg-navy-light active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan" />
                  <span>Executing Forensics & Checksums...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-cyan" />
                  <span>Analyze Document</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
