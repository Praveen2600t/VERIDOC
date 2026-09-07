import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Search, Filter, Download, ArrowUpRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getHistory } from '../services/api';

export default function History({ onViewResult }) {
  const [items, setItems] = useState([]);
  const [riskFilter, setRiskFilter] = useState('');
  const [docFilter, setDocFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    const params = {};
    if (riskFilter) params.risk = riskFilter;
    if (docFilter) params.doc_type = docFilter;
    getHistory(params)
      .then(res => setItems(res.history || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, [riskFilter, docFilter]);

  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.verification_id || '').toLowerCase().includes(q) ||
      (item.name || '').toLowerCase().includes(q) ||
      (item.document_number_masked || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Verification Audit Log</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Verification History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and filter historical screening records, risk scores, and generated reports.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, number..."
            className="pl-9 pr-4 py-2 bg-[#070b14] border border-cyber-border rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0c1322] p-3 rounded-xl border border-cyber-border text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400 font-mono">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-[#070b14] border border-cyber-border px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
        >
          <option value="">All Risk Tiers</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="CRITICAL">Critical Risk</option>
        </select>

        <select
          value={docFilter}
          onChange={(e) => setDocFilter(e.target.value)}
          className="bg-[#070b14] border border-cyber-border px-3 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
        >
          <option value="">All Document Types</option>
          <option value="Aadhaar">Aadhaar</option>
          <option value="PAN">PAN</option>
          <option value="Passport">Passport</option>
        </select>

        <div className="flex-1" />
        <span className="text-slate-400 font-mono text-[11px]">
          Showing {filteredItems.length} Record{filteredItems.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* History Table */}
      <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cyber-border text-[11px] text-slate-400 font-mono uppercase">
                <th className="py-2.5 px-3">Verification ID</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Document</th>
                <th className="py-2.5 px-3">Subject / Masked ID</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {filteredItems.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">{row.verification_id}</td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">{row.timestamp}</td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{row.document_type}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-100 block">{row.name}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{row.document_number_masked}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-slate-100">{row.risk_score} / 100</span>
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      row.risk_level === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      row.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {row.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-300 font-semibold">{row.status}</td>
                  <td className="py-3 px-3 text-right space-x-2">
                    <button
                      onClick={() => onViewResult(row.verification_id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black text-cyan-400 font-semibold text-[11px] transition-all"
                    >
                      View
                    </button>
                    <a
                      href={`/api/reports/${row.verification_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] transition-all inline-block"
                      title="Download PDF Report"
                    >
                      <Download className="w-3.5 h-3.5 inline" />
                    </a>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400 text-xs">
                    No verification records matching selected criteria.
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
