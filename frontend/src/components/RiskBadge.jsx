import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function RiskBadge({ score, label, size = 'md' }) {
  const normScore = typeof score === 'number' ? score : 0;
  const normLabel = label || (normScore <= 33 ? 'Low' : normScore <= 66 ? 'Medium' : 'High');

  let colorConfig = {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-600 text-white',
    icon: ShieldCheck,
    ring: 'ring-emerald-500/20'
  };

  if (normLabel.toLowerCase() === 'medium' || (normScore > 33 && normScore <= 66)) {
    colorConfig = {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      badge: 'bg-amber-500 text-white',
      icon: AlertTriangle,
      ring: 'ring-amber-500/20'
    };
  } else if (normLabel.toLowerCase() === 'high' || normScore > 66) {
    colorConfig = {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      badge: 'bg-rose-600 text-white',
      icon: ShieldAlert,
      ring: 'ring-rose-500/20'
    };
  }

  const Icon = colorConfig.icon;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorConfig.bg} ${colorConfig.border} ${colorConfig.text}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{normScore}/100</span>
        <span>•</span>
        <span>{normLabel} Risk</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-xs ${colorConfig.bg} ${colorConfig.border} ${colorConfig.ring} ring-2`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs ${colorConfig.badge}`}>
        {normScore}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <Icon className={`w-4 h-4 ${colorConfig.text}`} />
          <span className={`font-bold text-sm uppercase tracking-wider ${colorConfig.text}`}>
            {normLabel} Risk
          </span>
        </div>
        <p className="text-[11px] text-slate-500 font-medium">
          {normScore <= 33 ? 'Passed verification criteria' : normScore <= 66 ? 'Discrepancy detected — inspect' : 'Critical tamper / validation failure'}
        </p>
      </div>
    </div>
  );
}
