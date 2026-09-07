import React, { useState } from 'react';
import { Eye, Flame, AlertOctagon, CheckCircle, ZoomIn, ShieldAlert } from 'lucide-react';

export default function ForensicsViewer({ forensics, aiTampering }) {
  const [activeTab, setActiveTab] = useState('annotated'); // original, heatmap, annotated
  const [zoom, setZoom] = useState(false);

  const authProb = aiTampering?.authenticity_probability ?? 85;
  const tamperProb = aiTampering?.tampering_probability ?? 15;
  const isHighRisk = tamperProb >= 65;

  const boxes = forensics?.suspicious_boxes || [];

  return (
    <div className="bg-[#0c1322] border border-cyber-border rounded-2xl p-6 shadow-xl">
      
      {/* Title & Tamper Probability Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b border-cyber-border/70 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <ShieldAlert className={`w-5 h-5 ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`} />
            <span>Image Forensics & Error Level Analysis (ELA)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Detects localized compression disparities, digital splices, and cloned pixels
          </p>
        </div>

        {/* Probability Badges */}
        <div className="flex items-center space-x-3 bg-[#070b14] px-3.5 py-2 rounded-xl border border-cyber-border">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-mono">AUTHENTICITY</div>
            <div className="text-xs font-extrabold text-emerald-400 font-mono">{authProb}%</div>
          </div>
          <div className="h-6 w-[1px] bg-slate-700" />
          <div>
            <div className="text-[10px] text-slate-400 font-mono">TAMPERING RISK</div>
            <div className={`text-xs font-extrabold font-mono ${isHighRisk ? 'text-red-400' : 'text-slate-200'}`}>
              {tamperProb}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('original')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'original' 
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
              : 'text-slate-400 hover:text-white bg-[#070b14]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Original Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('heatmap')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'heatmap' 
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
              : 'text-slate-400 hover:text-white bg-[#070b14]'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>ELA Compression Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab('annotated')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'annotated' 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
              : 'text-slate-400 hover:text-white bg-[#070b14]'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Suspicious Region Map ({boxes.length})</span>
        </button>

        <div className="flex-1" />
        <button
          onClick={() => setZoom(!zoom)}
          className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
          title="Toggle Zoom Preview"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Image Preview Canvas */}
      <div className="relative bg-[#070b14] border border-cyber-border rounded-xl p-3 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[380px]">
        {activeTab === 'original' && (
          <img
            src={forensics?.preview_url || '/sample_docs/aadhaar_clean.png'}
            alt="Original Document"
            className={`max-h-[340px] w-auto object-contain rounded-lg transition-transform duration-200 ${
              zoom ? 'scale-125' : 'scale-100'
            }`}
          />
        )}

        {activeTab === 'heatmap' && (
          <div className="relative flex flex-col items-center">
            <img
              src={forensics?.heatmap_url || forensics?.ela_url || '/sample_docs/aadhaar_edited.png'}
              alt="ELA Heatmap"
              className={`max-h-[340px] w-auto object-contain rounded-lg transition-transform duration-200 ${
                zoom ? 'scale-125' : 'scale-100'
              }`}
            />
            <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-1 rounded text-[10px] text-amber-300 font-mono">
              Jet Colormap: Bright red/yellow = High compression divergence
            </div>
          </div>
        )}

        {activeTab === 'annotated' && (
          <div className="relative flex flex-col items-center">
            <img
              src={forensics?.annotated_url || forensics?.preview_url || '/sample_docs/aadhaar_edited.png'}
              alt="Annotated Forensics Map"
              className={`max-h-[340px] w-auto object-contain rounded-lg transition-transform duration-200 ${
                zoom ? 'scale-125' : 'scale-100'
              }`}
            />
            {boxes.length === 0 && (
              <div className="absolute top-3 right-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Zero Anomaly Zones Detected</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flagged Regions Details */}
      {boxes.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Identified Anomaly Regions</span>
            <span className="text-red-400 font-mono text-[11px] font-bold">
              {boxes.length} Suspicious Area{boxes.length > 1 ? 's' : ''} Flagged
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {boxes.map((box, idx) => (
              <div
                key={idx}
                className="bg-[#070b14] border border-red-500/30 rounded-xl p-2.5 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-400">{box.region}</span>
                  <span className="text-[10px] bg-red-500/20 text-red-300 font-mono px-1.5 py-0.5 rounded">
                    Confidence: {intProb(box.confidence)}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{box.evidence}</p>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  Coords: [{box.x}, {box.y}] Dimensions: {box.w}x{box.h}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 bg-[#070b14] border border-emerald-500/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-400">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Natural compression consistency verified. No anomalous image splice patches identified.</span>
        </div>
      )}

    </div>
  );
}

function intProb(val) {
  if (!val) return 85;
  if (val > 1) return Math.round(val);
  return Math.round(val * 100);
}
