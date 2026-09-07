import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import Results from './pages/Results';
import History from './pages/History';
import ReferenceIntelligence from './pages/ReferenceIntelligence';
import AuditLogs from './pages/AuditLogs';
import AIAssistant from './pages/AIAssistant';
import ReportPreview from './pages/ReportPreview';
import AdaptPanel from './components/AdaptPanel';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import { getSavedProfile, applyAdaptProfile } from './accessibility/adaptEngine';
import { getVerificationDetails } from './services/api';

const DEFAULT_DEMO_DOSSIER = {
  verification_id: "VD-1001",
  document_id: "DOC-DEMO-01",
  document_type: "Aadhaar",
  risk_score: 12,
  risk_level: "LOW",
  final_decision: "PASSED",
  document_hash: "8f4a2107b399d8e5229c9914e9f733bd1a80c94627d3b2e5331398bbfa3292bd",
  extractions: {
    name: "Demo Person",
    father_name: "Demo Father",
    date_of_birth: "15/08/1998",
    year_of_birth: "1998",
    gender: "Male",
    document_number_masked: "XXXX XXXX 1234",
    document_number: "5432 8765 4320",
    address: "Kollam Sub District, Kollam, Kerala - 691001",
    state: "Kerala",
    district: "Kollam",
    pincode: "691001",
    ocr_confidence: 96.2,
    field_confidences: {
      name: { value: "Demo Person", confidence: 96.2, status: "✓ Verified" },
      father_name: { value: "Demo Father", confidence: 93.8, status: "✓ Verified" },
      year_of_birth: { value: "1998", confidence: 97.4, status: "✓ Verified" },
      gender: { value: "Male", confidence: 98.5, status: "✓ Verified" },
      aadhaar_number: { value: "XXXX XXXX 1234", confidence: 95.1, status: "✓ Verified" },
      address: { value: "Kollam Sub District, Kollam, Kerala - 691001", confidence: 89.4, status: "✓ Verified" },
      pincode: { value: "691001", confidence: 94.0, status: "✓ Verified" }
    }
  },
  validation: {
    is_valid: true,
    format_valid: true,
    checksum_passed: true,
    aadhaar_format: "PASS",
    checksum_status: "PASS",
    masked_number: "XXXX XXXX 1234"
  },
  qr_analysis: {
    qr_detected: true,
    qr_readable: true,
    qr_detection_status: "✓",
    qr_readability_status: "✓",
    qr_ocr_consistency_status: "✓ Consistent",
    notice: "QR code verified against demographic anchors."
  },
  ai_tampering: {
    tampering_probability: 12,
    authenticity_probability: 88
  },
  forensics: {
    suspicious_boxes: [],
    forensic_score: 0.1,
    preview_url: "/uploads/aadhaar_clean.png",
    redacted_preview_url: "/uploads/aadhaar_clean.png"
  },
  reference_intelligence: {
    district: "Kollam",
    state: "Kerala",
    observed_enrolment_activity: "High",
    historical_rejection_ratio: 2.4,
    sample_count: 1240,
    matched_level: "District (Kollam)"
  },
  mistakes_and_issues: [
    {
      field: "Aadhaar Format & Checksum",
      severity: "PASSED",
      status: "✓ Format Valid",
      description: "12-digit structure and mathematical Verhoeff checksum algorithm verified."
    },
    {
      field: "QR Code Verification",
      severity: "PASSED",
      status: "✓ QR Detected & Consistent",
      description: "QR code safely scanned and metadata cross-referenced against extracted text."
    },
    {
      field: "Image Integrity",
      severity: "PASSED",
      status: "✓ Natural Compression",
      description: "Error Level Analysis shows uniform noise variance across document canvas."
    }
  ]
};

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentLang, setCurrentLang] = useState('en');
  const [adaptProfileId, setAdaptProfileId] = useState('standard');
  const [isAdaptOpen, setIsAdaptOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [activeVerification, setActiveVerification] = useState(DEFAULT_DEMO_DOSSIER);

  // Initialize accessibility profile on mount
  useEffect(() => {
    const saved = getSavedProfile();
    setAdaptProfileId(saved);
    applyAdaptProfile(saved);
  }, []);

  const handleVerificationComplete = (resultData) => {
    setActiveVerification(resultData);
    setCurrentTab('results');
  };

  const handleInspectDossier = async (verificationId) => {
    try {
      const details = await getVerificationDetails(verificationId);
      setActiveVerification(details);
      setCurrentTab('results');
    } catch (e) {
      console.error(e);
      setCurrentTab('results');
    }
  };

  const handleDownloadReport = () => {
    const vId = activeVerification?.verification_id || "VD-1001";
    window.open(`/api/reports/${vId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans cyber-grid-bg">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentLang={currentLang}
        setCurrentLang={setCurrentLang}
        onOpenAdapt={() => setIsAdaptOpen(true)}
        onOpenVoice={() => setIsVoiceOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. Home / Dashboard */}
        {currentTab === 'dashboard' && (
          <Dashboard
            onStartVerify={() => setCurrentTab('verify')}
            onViewResult={handleInspectDossier}
            currentLang={currentLang}
          />
        )}

        {/* 2. Upload Document */}
        {currentTab === 'verify' && (
          <Verify
            onVerificationComplete={handleVerificationComplete}
            currentLang={currentLang}
          />
        )}

        {/* 3 & 4. Document Analysis & Verification Results */}
        {currentTab === 'results' && (
          <Results
            verificationData={activeVerification}
            onBackToVerify={() => setCurrentTab('verify')}
            onViewAudit={() => setCurrentTab('audit')}
            onOpenAssistant={() => setCurrentTab('assistant')}
            onOpenReportPreview={() => setCurrentTab('report')}
            currentLang={currentLang}
            onOpenVoiceModal={() => setIsVoiceOpen(true)}
          />
        )}

        {/* 5. AI Assistant */}
        {currentTab === 'assistant' && (
          <AIAssistant
            verificationData={activeVerification}
            onDownloadReport={handleDownloadReport}
            onNavigateToResults={() => setCurrentTab('results')}
          />
        )}

        {/* 6. Verification History */}
        {currentTab === 'history' && (
          <History
            onViewResult={handleInspectDossier}
          />
        )}

        {/* 7. Analytics (Reference Intelligence) */}
        {currentTab === 'reference' && (
          <ReferenceIntelligence />
        )}

        {/* 8. Cryptographic Audit Trail */}
        {currentTab === 'audit' && (
          <AuditLogs />
        )}

        {/* 9. Report Preview */}
        {currentTab === 'report' && (
          <ReportPreview
            verificationData={activeVerification}
            onBackToResults={() => setCurrentTab('results')}
            onDownloadReport={handleDownloadReport}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-border bg-[#070b14]/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VeriDoc 2.0 — Smart India Hackathon 2026 | Blockchain & Cybersecurity</span>
          <span className="text-[11px] text-cyan-400">Adaptive AI & Explainable Document Forensics</span>
        </div>
      </footer>

      {/* ADAPT Accessibility Panel */}
      <AdaptPanel
        isOpen={isAdaptOpen}
        onClose={() => setIsAdaptOpen(false)}
        currentProfileId={adaptProfileId}
        onProfileChanged={(id) => setAdaptProfileId(id)}
      />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        verificationData={activeVerification}
        onDownloadReport={handleDownloadReport}
      />

    </div>
  );
}
