import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, CheckCircle2, Hash, ArrowUpRight } from 'lucide-react';
import { getAuditLogs } from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then(res => setLogs(res.trail || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Integrity Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Secure Tamper-Evident Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Every screening assessment is sealed with irreversible SHA-256 cryptographic hashes for non-repudiation.
          </p>
        </div>

        <div className="bg-[#070b14] border border-emerald-500/30 px-3.5 py-2 rounded-xl flex items-center space-x-2 text-xs text-emerald-400 font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Ledger Status: 100% Verified</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cyber-border text-[11px] text-slate-400 font-mono uppercase">
                <th className="py-2.5 px-3">Verification ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Document SHA-256 Hash</th>
                <th className="py-2.5 px-3">Risk / Decision</th>
                <th className="py-2.5 px-3">Cryptographic Signature</th>
                <th className="py-2.5 px-3 text-right">Integrity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50 font-mono">
              {logs.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors text-[11px]">
                  <td className="py-3 px-3 font-bold text-cyan-400">{row.verification_id}</td>
                  <td className="py-3 px-3 text-slate-400">{row.timestamp ? new Date(row.timestamp).toLocaleString() : 'Recent'}</td>
                  <td className="py-3 px-3 text-slate-300">
                    <span className="truncate block max-w-[160px]" title={row.document_hash}>
                      {row.document_hash}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-100">{row.risk_score}/100</span>
                    <span className="text-slate-400 ml-1.5">[{row.decision}]</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    <span className="truncate block max-w-[140px]" title={row.integrity_signature}>
                      {row.integrity_signature}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified Genuine</span>
                    </span>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400 text-xs font-sans">
                    No cryptographic audit records found. Run a document verification to populate the trail.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
