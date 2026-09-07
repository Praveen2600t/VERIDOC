import React, { useState, useEffect } from 'react';
import { X, Mic, MicOff, Volume2, Sparkles, RefreshCw } from 'lucide-react';
import { chatCopilot } from '../services/api';

export default function VoiceAssistantModal({ isOpen, onClose, verificationData, onDownloadReport }) {
  if (!isOpen) return null;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const sampleCommands = [
    "Why is this document suspicious?",
    "What is the risk score?",
    "Generate my report"
  ];

  const handleVoiceCommand = async (commandText) => {
    const cmd = commandText.trim();
    if (!cmd) return;

    setTranscript(cmd);
    setIsThinking(true);
    setReply('');

    // Check direct command: Generate report
    if (cmd.toLowerCase().includes("report") || cmd.toLowerCase().includes("download")) {
      if (onDownloadReport) {
        onDownloadReport();
        const msg = "Generating and downloading your official VeriDoc security verification report now.";
        setReply(msg);
        speak(msg);
        setIsThinking(false);
        return;
      }
    }

    try {
      const res = await chatCopilot(cmd, verificationData?.verification_id, verificationData);
      const cleanAnswer = res.response.replace(/\*\*/g, '').replace(/#/g, '');
      setReply(cleanAnswer);
      speak(cleanAnswer);
    } catch (e) {
      setReply("Could not process voice request: " + e.message);
    } finally {
      setIsThinking(false);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  const startListeningSimulation = () => {
    // Try browser SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e) => {
        const spoken = e.results[0][0].transcript;
        setIsListening(false);
        handleVoiceCommand(spoken);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      // If browser doesn't permit mic, toggle simulate prompt
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        handleVoiceCommand("Why is this document suspicious?");
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0c1322] border border-emerald-500/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-scaleUp text-center p-6">
        
        <button
          onClick={() => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            onClose();
          }}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mic Pulse Graphic */}
        <div className="flex flex-col items-center mt-2 mb-4">
          <div className="relative">
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
            )}
            <button
              onClick={startListeningSimulation}
              className={`w-20 h-20 rounded-full flex items-center justify-center relative z-10 transition-all ${
                isListening
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/50 scale-110'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              <Mic className="w-8 h-8" />
            </button>
          </div>
          <h3 className="text-base font-bold text-white mt-4">
            {isListening ? 'Listening for your question...' : 'VeriDoc Voice Assistant'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click mic or pick a sample question below
          </p>
        </div>

        {/* Sample Voice Commands */}
        <div className="space-y-2 mb-5">
          {sampleCommands.map((sc, i) => (
            <button
              key={i}
              onClick={() => handleVoiceCommand(sc)}
              className="w-full text-left px-3.5 py-2 rounded-xl bg-[#070b14] hover:bg-emerald-500/10 border border-cyber-border hover:border-emerald-500/30 text-xs text-slate-300 hover:text-emerald-300 transition-all flex items-center justify-between"
            >
              <span>"{sc}"</span>
              <Sparkles className="w-3 h-3 text-emerald-400" />
            </button>
          ))}
        </div>

        {/* Real-time Query / Answer Output */}
        {transcript && (
          <div className="text-left bg-[#070b14] border border-cyber-border rounded-xl p-3 mb-3 text-xs">
            <span className="text-[10px] text-slate-500 font-mono block mb-1">YOU SAID:</span>
            <p className="text-slate-200 font-semibold">{transcript}</p>
          </div>
        )}

        {isThinking && (
          <div className="flex items-center justify-center space-x-2 text-xs text-emerald-400 font-mono my-3">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing evidence & speaking response...</span>
          </div>
        )}

        {reply && (
          <div className="text-left bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 text-xs text-slate-200 max-h-40 overflow-y-auto">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-mono mb-1">
              <span>VERIDOC VOICE RESPONSE</span>
              <Volume2 className="w-3 h-3" />
            </div>
            <p className="leading-relaxed">{reply}</p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={() => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            onClose();
          }}
          className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
        >
          Done
        </button>

      </div>
    </div>
  );
}
