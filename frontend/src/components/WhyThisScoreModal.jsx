import React from 'react';
import { X, HelpCircle, ShieldAlert, CheckCircle2, AlertTriangle, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function WhyThisScoreModal({ isOpen, onClose, verificationData }) {
  if (!isOpen || !verificationData) return null;

  const score = verificationData.risk_score ?? 0;
  const level = verificationData.risk_level ?? 'LOW';
  const items = verificationData.evidence_items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#0c1322] border border-cyan-500/40 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative animate-scaleUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-[#070b14]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Why This Score? — Explainable AI Attribution</h3>
              <p className="text-xs text-slate-400">VeriDoc Evidence Attribution Model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Banner */}
        <div className="px-6 py-4 bg-[#070b14]/50 border-b border-cyber-border flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono">CALCULATED COMPOSITE RISK</div>
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-3xl font-extrabold text-white font-mono">{score}</span>
              <span className="text-slate-400 font-mono text-sm">/ 100</span>
              <span className={`text-xs px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ml-2 ${
                level === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {level} RISK
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            <div>Neutral Baseline: +20</div>
            <div>Active Signals: {items.length}</div>
          </div>
        </div>

        {/* Evidence Items Breakdown */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          <p className="text-xs text-slate-300 font-semibold mb-2">
            Detailed breakdown of factors impacting this document's screening rating:
          </p>

          {items.map((item, idx) => {
            const isPositive = item.risk_delta > 0;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  isPositive
                    ? 'bg-red-950/20 border-red-500/30 text-slate-200'
                    : 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                    isPositive ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {isPositive ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {item.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                    {item.plain_text && (
                      <p className="text-[11px] text-cyan-300/80 italic mt-1">
                        Cognitive summary: "{item.plain_text}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Delta Badge */}
                <div className={`flex items-center space-x-0.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex-shrink-0 ${
                  isPositive ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{item.risk_delta > 0 ? `+${item.risk_delta}` : item.risk_delta} risk</span>
                </div>
              </div>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              No individual anomaly signals recorded. Document passed baseline verification.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyber-border bg-[#070b14] flex justify-between items-center text-[11px] text-slate-400">
          <span>Formula: Baseline + Forensics + Checksums + References ± OCR Quality</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
