import React, { useState } from 'react';
import UploadBox from '../components/UploadBox';
import { verifyDocuments } from '../services/api';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function Verify({ onVerificationComplete, currentLang = 'en' }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleVerify = async ({ primaryFile, secondaryFile }) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await verifyDocuments({
        file: primaryFile,
        secondaryFile: secondaryFile
      });
      onVerificationComplete(res);
    } catch (err) {
      setErrorMsg(err.message || 'Verification pipeline encountered an error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Stage 1 to 5 Multi-Signal Screening Pipeline</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Identity Document Verification</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-xl mx-auto">
          Upload Aadhaar, PAN, or Passport for simultaneous Verhoeff checksum validation, 
          image forensics, and reference intelligence checks.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Component */}
      <UploadBox
        onVerify={handleVerify}
        isProcessing={isProcessing}
        currentLang={currentLang}
      />

    </div>
  );
}
