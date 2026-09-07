import React from 'react';
import { 
  ShieldCheck, Activity, FileSearch, Database, 
  History, Lock, Accessibility, Volume2, Globe, Cpu, Bot, FileText 
} from 'lucide-react';
import { TRANSLATIONS } from '../accessibility/translations';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentLang, 
  setCurrentLang,
  onOpenAdapt,
  onOpenVoice
}) {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const navItems = [
    { id: 'dashboard', label: t.dashboard || 'Home', icon: Activity },
    { id: 'verify', label: 'Upload', icon: FileSearch },
    { id: 'results', label: 'Analysis', icon: ShieldCheck },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'history', label: t.history || 'History', icon: History },
    { id: 'reference', label: 'Analytics', icon: Database },
    { id: 'report', label: 'Report', icon: FileText },
  ];

  return (
    <header className="border-b border-cyber-border bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-emerald-400 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-[#0c1322] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-white">VERIDOC</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-semibold border border-cyan-500/30">2.0</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-mono">AI Identity & Document Forensics</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active 
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls: ADAPT, Voice, Language */}
        <div className="flex items-center space-x-2">
          
          {/* Voice Assistant Trigger */}
          <button
            onClick={onOpenVoice}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all shadow-sm shadow-emerald-500/10"
            title="Start Voice Assistant"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice AI</span>
          </button>

          {/* ADAPT Accessibility Button */}
          <button
            onClick={onOpenAdapt}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all shadow-sm shadow-cyan-500/10"
            title="ADAPT Accessibility Settings"
          >
            <Accessibility className="w-3.5 h-3.5" />
            <span className="font-bold">ADAPT</span>
          </button>

          {/* Language Selector */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              className="pl-7 pr-2 py-1.5 bg-[#0c1322] text-xs text-slate-200 border border-cyber-border rounded-lg focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              <option value="en">EN (English)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>

        </div>

      </div>

      {/* Mobile navigation bar */}
      <div className="md:hidden border-t border-cyber-border bg-[#070b14] px-2 py-1.5 flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[11px] ${
                active ? 'text-cyan-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
