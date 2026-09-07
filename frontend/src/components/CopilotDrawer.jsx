import React, { useState } from 'react';
import { X, Send, Bot, User, Sparkles, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';
import { chatCopilot } from '../services/api';

export default function CopilotDrawer({ isOpen, onClose, verificationData }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am VeriDoc Copilot. I analyze all pipeline evidence (Verhoeff checksums, ELA forensics, reference dataset, cross-document metrics) to assist your inspection. Ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    "Recognize Name, DOB & Aadhaar Number",
    "What is the holder's Name?",
    "What is the Date of Birth (DOB)?",
    "Is the Aadhaar number valid?",
    "What information was extracted?",
    "Why is this document suspicious?",
    "Generate a summary."
  ];

  const handleSend = async (queryText) => {
    const q = (queryText || input).trim();
    if (!q) return;

    const userMsg = { sender: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await chatCopilot(q, verificationData?.verification_id, verificationData);
      const botMsg = { sender: 'bot', text: res.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Error contacting verification engine: " + err.message }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Strip markdown asterisks
      const clean = text.replace(/\*\*/g, '').replace(/#/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#0c1322] border-l border-cyber-border h-full flex flex-col shadow-2xl animate-slideLeft"
      >
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-cyber-border bg-[#070b14] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px]">
              <div className="w-full h-full bg-[#0c1322] rounded-[6px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-bold text-white">VeriDoc Copilot</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono">Zero-Hallucination Grounded AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2.5 bg-[#070b14]/70 border-b border-cyber-border/70 overflow-x-auto whitespace-nowrap flex gap-1.5 scrollbar-none">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-cyber-border transition-all flex items-center space-x-1"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>{qp}</span>
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                msg.sender === 'user' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-cyan-400 border border-cyber-border'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-2xl p-3 text-xs max-w-[82%] relative group ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/20 text-slate-100 border border-cyan-500/40 rounded-tr-none'
                  : 'bg-[#070b14] text-slate-200 border border-cyber-border rounded-tl-none leading-relaxed'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.sender === 'bot' && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="mt-2 text-slate-400 hover:text-cyan-400 flex items-center space-x-1 text-[10px]"
                    title="Speak answer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Listen</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Grounding evidence & formulating response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-cyber-border bg-[#070b14]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this document verification..."
              className="flex-1 bg-[#0c1322] border border-cyber-border rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
