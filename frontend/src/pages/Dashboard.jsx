import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, ShieldAlert, 
  TrendingUp, FileText, ArrowUpRight, ArrowRight, Activity, Database
} from 'lucide-react';
import { getHistory, getReferenceStats } from '../services/api';
import { TRANSLATIONS } from '../accessibility/translations';

export default function Dashboard({ onStartVerify, onViewResult, currentLang = 'en' }) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [historyItems, setHistoryItems] = useState([]);
  const [refStats, setRefStats] = useState(null);

  useEffect(() => {
    getHistory({ limit: 6 })
      .then(res => setHistoryItems(res.history || []))
      .catch(err => console.error(err));

    getReferenceStats()
      .then(res => setRefStats(res))
      .catch(err => console.error(err));
  }, []);

  // Dashboard baseline stats (matching Section 25: 1,284 verified, 86 high, 142 medium, 1,056 low)
  const stats = [
    { label: t.docsVerified, value: "1,284", icon: FileText, change: "+12% this week", color: "text-cyan-400", border: "border-cyan-500/30" },
    { label: t.highRisk, value: "86", icon: ShieldAlert, change: "6.7% flag rate", color: "text-red-400", border: "border-red-500/30" },
    { label: t.mediumRisk, value: "142", icon: AlertTriangle, change: "11.1% review rate", color: "text-amber-400", border: "border-amber-500/30" },
    { label: t.lowRisk, value: "1,056", icon: CheckCircle, change: "82.2% pass rate", color: "text-emerald-400", border: "border-emerald-500/30" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-r from-[#0c1322] via-[#111b30] to-[#070b14] border border-cyber-border shadow-2xl">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Cybersecurity Forensics Engine Active</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            AI-Powered Identity & Document Screening Platform
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
            Multi-signal fraud screening combining high-precision OCR, mathematical Verhoeff checksums, 
            Error Level Analysis (ELA) image forensics, reference intelligence analytics, and dynamic ADAPT accessibility.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartVerify}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center space-x-2"
            >
              <span>{t.verify}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-400 font-mono flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#070b14] border border-cyber-border">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Reference Records Indexed: {refStats?.total_records?.toLocaleString() || '33,429'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className={`bg-[#0c1322] rounded-2xl p-5 border ${s.border} shadow-lg relative overflow-hidden transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{s.label}</span>
                <div className={`p-2 rounded-xl bg-[#070b14] border border-cyber-border ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{s.value}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">{s.change}</p>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Threat Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Distribution Breakdown */}
        <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-base font-bold text-white flex items-center space-x-2 mb-4">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Risk Distribution Profile</span>
          </h3>

          {/* SVG Donut Visual */}
          <div className="flex items-center justify-center my-4 relative">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background track */}
              <circle cx="50" cy="50" r="40" stroke="#1b2a4a" strokeWidth="12" fill="transparent" />
              {/* Low risk (82.2%) */}
              <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="12" fill="transparent"
                strokeDasharray="251.2" strokeDashoffset="44.7" strokeLinecap="round" />
              {/* Medium risk (11.1%) */}
              <circle cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="12" fill="transparent"
                strokeDasharray="251.2" strokeDashoffset="223.3" />
              {/* High risk (6.7%) */}
              <circle cx="50" cy="50" r="40" stroke="#ef4444" strokeWidth="12" fill="transparent"
                strokeDasharray="251.2" strokeDashoffset="234.3" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-white font-mono">1,284</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Total Verified</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Low Risk (Passed)</span>
              </span>
              <span className="font-bold">1,056 (82.2%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Medium Risk (Review)</span>
              </span>
              <span className="font-bold">142 (11.1%)</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>High / Critical (Flagged)</span>
              </span>
              <span className="font-bold">86 (6.7%)</span>
            </div>
          </div>
        </div>

        {/* Verification Volume Trends */}
        <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Verification Volume & Threat Indicators</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Last 7 Days</span>
            </div>

            {/* Simulated Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-cyber-border">
              {[
                { day: 'Mon', total: 140, threat: 8 },
                { day: 'Tue', total: 185, threat: 14 },
                { day: 'Wed', total: 210, threat: 11 },
                { day: 'Thu', total: 195, threat: 16 },
                { day: 'Fri', total: 240, threat: 19 },
                { day: 'Sat', total: 160, threat: 9 },
                { day: 'Sun', total: 154, threat: 9 },
              ].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex flex-col items-center gap-0.5">
                    {/* Threat portion (red) */}
                    <div 
                      className="w-full max-w-[28px] bg-red-500 rounded-t-sm"
                      style={{ height: `${(d.threat / 240) * 120}px` }}
                      title={`Threats: ${d.threat}`}
                    />
                    {/* Clean portion (cyan) */}
                    <div 
                      className="w-full max-w-[28px] bg-cyan-500/80 rounded-b-sm"
                      style={{ height: `${((d.total - d.threat) / 240) * 120}px` }}
                      title={`Clean: ${d.total - d.threat}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-cyan-500/80" />
                <span>Standard Scans</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-500" />
                <span>Detected Anomalies</span>
              </span>
            </div>
            <span>Average Analysis Latency: 420ms</span>
          </div>
        </div>

      </div>

      {/* Recent Verifications Table */}
      <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>{t.recentScans}</span>
          </h3>
          <button
            onClick={() => onStartVerify()}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
          >
            <span>Scan New Document</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cyber-border text-[11px] text-slate-400 font-mono uppercase">
                <th className="py-2.5 px-3">Verification ID</th>
                <th className="py-2.5 px-3">Document Type</th>
                <th className="py-2.5 px-3">Subject / Masked ID</th>
                <th className="py-2.5 px-3">Risk Rating</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {historyItems.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">{row.verification_id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{row.document_type}</td>
                  <td className="py-3 px-3 text-slate-300 font-mono">{row.document_number_masked}</td>
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
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs text-slate-300">{row.status}</span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onViewResult(row.verification_id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black text-cyan-400 font-semibold text-[11px] transition-all"
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
