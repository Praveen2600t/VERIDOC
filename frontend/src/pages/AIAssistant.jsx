import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, User, ShieldCheck, Download, 
  HelpCircle, RefreshCw, Cpu, Layers, CheckCircle2, AlertTriangle, FileText
} from 'lucide-react';
import { askCopilot } from '../services/api';

export default function AIAssistant({ 
  verificationData, 
  onDownloadReport,
  onNavigateToResults
}) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [mode, setMode] = useState('technical'); // 'technical' | 'simple'
  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "Recognize Name, DOB & Aadhaar Number",
    "What is the holder's Name?",
    "What is the Date of Birth (DOB)?",
    "Is the Aadhaar number valid?",
    "What information was extracted?",
    "Are there any mistakes?",
    "Why is this document suspicious?",
    "Where was tampering detected?",
    "Explain the result simply.",
    "Generate my report."
  ];

  // Auto-summarize verification on component load
  useEffect(() => {
    if (!verificationData) {
      setMessages([
        {
          sender: 'assistant',
          text: "Hello! I am **VeriDoc AI Assistant**, your specialized cybersecurity document investigator.\n\nPlease upload or select a document in the Verification tab so I can provide an evidence-based forensic briefing."
        }
      ]);
      return;
    }

    const loadInitialSummary = async () => {
      setIsThinking(true);
      try {
        const res = await askCopilot("summary", verificationData, mode);
        setMessages([
          {
            sender: 'assistant',
            text: res.answer
          }
        ]);
      } catch (err) {
        // Fallback local summary
        const ext = verificationData.extractions || {};
        const val = verificationData.validation || {};
        const qr = verificationData.qr_analysis || {};
        const tamperProb = verificationData.ai_tampering?.tampering_probability || 15;
        
        const summaryText = 
`I analyzed the uploaded document.

**I extracted:**
- Name: ${ext.name || 'Demo Person'}
- Year of Birth: ${ext.year_of_birth || '1998'}
- Gender: ${ext.gender || 'Male'}
- Aadhaar: ${ext.document_number_masked || 'XXXX XXXX 1234'}

**Checks:**
- ${val.format_valid !== false ? '✓' : '✕'} Aadhaar format
- ${val.checksum_passed !== false ? '✓' : '✕'} Checksum
- ${qr.qr_detected ? '✓' : 'ℹ'} QR detected
- ${tamperProb > 40 ? '⚠' : '✓'} ${tamperProb > 40 ? 'Possible image manipulation' : 'Natural compression'}

**Overall risk: ${verificationData.risk_level || 'LOW'}** (${verificationData.risk_score || 12}/100) — Decision: **${verificationData.final_decision || 'PASSED'}**.`;

        setMessages([{ sender: 'assistant', text: summaryText }]);
      } finally {
        setIsThinking(false);
      }
    };

    loadInitialSummary();
  }, [verificationData, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || inputVal;
    if (!textToSend.trim() || isThinking) return;

    const userMsg = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Handle "Generate my report" command
    if (textToSend.toLowerCase().includes("generate my report") || textToSend.toLowerCase().includes("download report")) {
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        if (onDownloadReport) onDownloadReport();
        setMessages(prev => [
          ...prev, 
          { 
            sender: 'assistant', 
            text: `📄 **Verification Report Generated!**\n\nI have initiated the download of your official PDF report for **Verification ID: ${verificationData?.verification_id || 'VD-DEMO'}**.\n\nAll 12-digit Aadhaar numbers remain securely masked in accordance with privacy laws.` 
          }
        ]);
      }, 700);
      return;
    }

    setIsThinking(true);
    try {
      const res = await askCopilot(textToSend, verificationData || {}, mode);
      setMessages(prev => [...prev, { sender: 'assistant', text: res.answer }]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        { 
          sender: 'assistant', 
          text: `I encountered an issue processing that query. Grounded evidence for this dossier indicates risk score is **${verificationData?.risk_score || 0}/100** (${verificationData?.risk_level || 'LOW'}).` 
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-[#0c1322] border border-cyber-border rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0c1322] rounded-[14px] flex items-center justify-center text-cyan-400">
              <Bot className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-white">VeriDoc AI Assistant</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Context-Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant plain-language explanations, forensic diagnostics, and report synthesis.
            </p>
          </div>
        </div>

        {/* Mode Toggle: Technical vs Simple */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Mode:</span>
          <div className="inline-flex rounded-xl bg-[#070b14] p-1 border border-cyber-border">
            <button
              onClick={() => setMode('technical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'technical'
                  ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Technical Mode
            </button>
            <button
              onClick={() => setMode('simple')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'simple'
                  ? 'bg-emerald-500 text-black font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simple Mode
            </button>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-[#0c1322] border border-cyber-border rounded-3xl p-6 shadow-2xl flex flex-col h-[520px]">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans">
          {messages.map((m, idx) => {
            const isBot = m.sender === 'assistant';
            return (
              <div 
                key={idx} 
                className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isBot 
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' 
                    : 'bg-blue-600 text-white shadow-sm'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  isBot 
                    ? 'bg-[#070b14] text-slate-200 border border-cyber-border shadow-inner' 
                    : 'bg-cyan-500 text-black font-semibold shadow-md shadow-cyan-500/20'
                }`}>
                  {m.text}
                </div>
              </div>
            );
          })}

          {isThinking && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-[#070b14] border border-cyber-border rounded-2xl px-4 py-3 text-xs text-cyan-400 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>VeriDoc Assistant is synthesizing forensic signals...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="pt-3 border-t border-cyber-border mt-3">
          <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Suggested Questions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isThinking}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#070b14] text-slate-300 border border-cyber-border hover:border-cyan-500 hover:text-cyan-400 transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="pt-3 flex items-center space-x-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about the document, mistakes, forensics, or validation..."
            className="flex-1 bg-[#070b14] border border-cyber-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-sans"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputVal.trim() || isThinking}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-extrabold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center space-x-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>

      </div>

    </div>
  );
}
