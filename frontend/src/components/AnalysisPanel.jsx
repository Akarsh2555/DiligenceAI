import { useState } from 'react';
import { Play, Loader2, ShieldAlert, Scale, Sparkles } from 'lucide-react';
import LoadingGraph from './LoadingGraph';

const MODES = [
  { value: 'full', label: 'Full Analysis', desc: 'Risk · Growth · Legal · Summary', icon: Sparkles },
  { value: 'risk_only', label: 'Risk Only', desc: 'Focus on risk factors', icon: ShieldAlert },
  { value: 'legal_only', label: 'Legal Only', desc: 'Contract & legal review', icon: Scale },
];

export default function AnalysisPanel({ onAnalyze, analyzing, steps, hasDocuments }) {
  const [mode, setMode] = useState('full');

  return (
    <div className="bg-bg-surface rounded-[22px] p-7 border border-border">
      {/* Console header */}
      <div className="flex items-center gap-2.5 mb-1">
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-risk-high/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-risk-medium/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-risk-low/70" />
        </span>
        <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-muted">
          Agent Console
        </span>
      </div>
      <h3 className="font-display text-2xl text-text-primary mb-6">Run due-diligence analysis</h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-2.5">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                disabled={analyzing}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-accent-coral bg-accent-coral/10'
                    : 'border-border bg-bg-elevated hover:border-accent-coral/40'
                } ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-accent-coral text-white' : 'bg-bg-surface text-text-muted'}`}>
                  <Icon className="w-4.5 h-4.5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-text-primary">{m.label}</span>
                  <span className="block text-xs text-text-secondary mt-0.5">{m.desc}</span>
                </span>
                <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${active ? 'border-accent-coral bg-accent-coral' : 'border-border'}`}>
                  {active && <span className="block w-full h-full rounded-full ring-2 ring-bg-surface ring-inset" />}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onAnalyze(mode)}
          disabled={analyzing || !hasDocuments}
          className={`w-full py-4 px-6 rounded-pill font-medium text-[15px] flex items-center justify-center gap-2 transition-all duration-300 ${
            analyzing || !hasDocuments
              ? 'bg-bg-elevated text-text-muted cursor-not-allowed border border-border'
              : 'bg-accent-coral hover:bg-accent-coral-hover text-white shadow-coral'
          }`}
        >
          {analyzing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing…</>
          ) : (
            <><Play className="w-4.5 h-4.5 fill-current" /> Run analysis</>
          )}
        </button>

        {(analyzing || steps.length > 0) && <LoadingGraph steps={steps} />}

        {!hasDocuments && !analyzing && (
          <p className="text-center text-text-muted text-sm">
            Upload documents first to enable analysis.
          </p>
        )}
      </div>
    </div>
  );
}
