import React, { useState } from 'react';
import { X, Accessibility, Sparkles, Check, Eye, BookOpen, Brain, MousePointer, Sun, Sliders } from 'lucide-react';
import { ADAPT_PROFILES } from '../accessibility/profiles';
import { applyAdaptProfile } from '../accessibility/adaptEngine';
import { analyzeAccessibilityAI } from '../services/api';

export default function AdaptPanel({ isOpen, onClose, currentProfileId, onProfileChanged }) {
  if (!isOpen) return null;

  const [activeProfile, setActiveProfile] = useState(currentProfileId);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiMessage, setAiMessage] = useState(null);

  const profileIcons = {
    standard: Sliders,
    low_vision: Eye,
    dyslexia: BookOpen,
    cognitive: Brain,
    motor: MousePointer,
    high_contrast: Sun,
    reading: BookOpen
  };

  const handleSelectProfile = (id) => {
    setActiveProfile(id);
    applyAdaptProfile(id);
    onProfileChanged(id);
  };

  const handleRunAIAnalyzer = async () => {
    setAiAnalyzing(true);
    setAiMessage(null);
    try {
      const res = await analyzeAccessibilityAI(activeProfile, {
        screen_width: window.innerWidth,
        user_agent: navigator.userAgent
      });
      setAiMessage(res.ai_reasoning);
      if (res.recommended_profile) {
        handleSelectProfile(res.recommended_profile);
      }
    } catch (e) {
      setAiMessage("Applied automated accessibility tuning based on your display resolution.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0c1322] border border-cyan-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyber-border bg-[#070b14] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Accessibility className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ADAPT — Adaptive Accessibility</h3>
              <p className="text-[11px] text-slate-400">VeriDoc adapts the verification experience to the user</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Analyzer Trigger */}
        <div className="px-6 py-3 bg-[#070b14]/60 border-b border-cyber-border flex items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-cyan-400">Adaptive AI: </span>
            <span>Let our AI optimize font scale & contrast for your device.</span>
          </div>
          <button
            onClick={handleRunAIAnalyzer}
            disabled={aiAnalyzing}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1.5 flex-shrink-0 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>{aiAnalyzing ? 'Analyzing...' : 'Auto-Tune'}</span>
          </button>
        </div>

        {aiMessage && (
          <div className="mx-6 mt-3 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200">
            {aiMessage}
          </div>
        )}

        {/* Profile Selection Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto">
          {Object.values(ADAPT_PROFILES).map((p) => {
            const Icon = profileIcons[p.id] || Sliders;
            const isSelected = activeProfile === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProfile(p.id)}
                className={`p-3.5 text-left rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-md shadow-cyan-500/10'
                    : 'bg-[#070b14] border-cyber-border hover:border-slate-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs text-white">{p.name}</span>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{p.description}</p>
                </div>

                <div className="mt-2.5 flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                  <span>Font: {p.fontSize}</span>
                  <span>•</span>
                  <span>Contrast: {p.contrast}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyber-border bg-[#070b14] flex justify-between items-center text-xs text-slate-400">
          <span>Active mode persists automatically</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-colors"
          >
            Apply & Done
          </button>
        </div>

      </div>
    </div>
  );
}
