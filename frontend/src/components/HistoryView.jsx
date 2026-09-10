import React, { useState, useEffect } from 'react';
import { History, Trash2, ExternalLink, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function HistoryView({ onSelectScan }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('veridoc_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load veridoc_history:', e);
    }
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Clear all local screening history?')) {
      localStorage.removeItem('veridoc_history');
      setHistory([]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-navy flex items-center gap-2">
            <History className="w-5 h-5 text-cyan" />
            <span>Screening Audit History</span>
          </h2>
          <p className="text-xs text-slate-500">
            Client-side browser records (stored in <code className="bg-slate-100 px-1 py-0.5 rounded text-navy">localStorage</code>, capped at 20 entries).
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No Scans Recorded Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload and analyze any identity document in the Analyze tab or run a synthetic specimen to see audit records appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Filename / Document</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">ID Number</th>
                  <th className="py-3 px-4">Risk Evaluation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item, idx) => (
                  <tr key={item.scan_id || idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="truncate max-w-[200px]" title={item.filename || 'uploaded_document.png'}>
                        {item.filename || 'uploaded_document.png'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.entered_fields?.name || item.name || 'N/A'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs uppercase px-2 py-0.5 rounded-md bg-slate-100 font-mono text-slate-700 font-semibold">
                        {item.doc_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {item.entered_fields?.id_number || item.id_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge score={item.risk_score} label={item.risk_label} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {onSelectScan && (
                        <button
                          onClick={() => onSelectScan(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-dark hover:text-navy transition"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
