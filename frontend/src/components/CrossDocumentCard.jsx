import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function CrossDocumentCard({ crossData }) {
  if (!crossData || !crossData.is_evaluated) {
    return (
      <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-5 text-center text-xs text-slate-400">
        <Layers className="w-8 h-8 mx-auto text-slate-600 mb-2" />
        <p className="font-semibold text-slate-300">Single Document Mode</p>
        <p className="text-[11px] mt-1">To verify cross-document consistency (e.g. Aadhaar vs PAN), upload two documents.</p>
      </div>
    );
  }

  const score = crossData.consistency_score ?? 100;
  const isConsistent = score >= 80;
  const matrix = crossData.comparison_matrix || [];

  return (
    <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-cyber-border/70 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>Cross-Document Consistency Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comparing demographics across {crossData.doc1_type} & {crossData.doc2_type}
          </p>
        </div>

        {/* Score Badge */}
        <div className="flex items-center space-x-2 bg-[#070b14] px-3.5 py-1.5 rounded-xl border border-cyber-border">
          <span className="text-[10px] text-slate-400 font-mono">CONSISTENCY SCORE:</span>
          <span className={`text-base font-extrabold font-mono ${
            isConsistent ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {score}%
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-cyber-border text-[11px] text-slate-400 font-mono uppercase">
              <th className="py-2.5 px-3">Field</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Confidence</th>
              <th className="py-2.5 px-3 text-center">Outcome</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border/50">
            {matrix.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 font-semibold text-slate-200">{row.field}</td>
                <td className="py-3 px-3 text-slate-300 font-mono">{row.status}</td>
                <td className="py-3 px-3 text-right text-slate-400 font-mono">{row.confidence}%</td>
                <td className="py-3 px-3 text-center">
                  {row.is_match ? (
                    <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>MATCH</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3" />
                      <span>MISMATCH</span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Note */}
      <div className="mt-4 p-3 bg-[#070b14] border border-cyber-border rounded-xl text-xs text-slate-300">
        <span className="font-semibold text-cyan-400">Analysis Summary: </span>
        <span>{crossData.summary}</span>
      </div>

    </div>
  );
}
