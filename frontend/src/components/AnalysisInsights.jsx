import { FileText, Layers, ShieldAlert, Quote } from 'lucide-react';
import { DonutChart, BarList, Legend } from './charts';

const RISK_COLORS = {
  High: 'var(--color-risk-high)',
  Medium: 'var(--color-risk-medium)',
  Low: 'var(--color-risk-low)',
};

/* Count whole-word severity mentions in the risk markdown. The risk chain
   emits "High / Medium / Low risk" tags, so this is a reliable derivation. */
function countSeverities(text) {
  const s = text || '';
  const count = (re) => (s.match(re) || []).length;
  return {
    High: count(/\bhigh\b/gi),
    Medium: count(/\bmedium\b/gi),
    Low: count(/\blow\b/gi),
  };
}

/* Count markdown list items (bullets) in a section as a rough signal volume. */
function countBullets(text) {
  return ((text || '').match(/^\s*[-*]\s+/gm) || []).length;
}

export default function AnalysisInsights({ report }) {
  if (!report) return null;

  const meta = report.report_metadata || report.metadata || {};
  const citations = report.citations || [];

  const sev = countSeverities(report.risk_assessment || '');
  const totalRisks = sev.High + sev.Medium + sev.Low;
  const segments = [
    { label: 'High', value: sev.High, color: RISK_COLORS.High },
    { label: 'Medium', value: sev.Medium, color: RISK_COLORS.Medium },
    { label: 'Low', value: sev.Low, color: RISK_COLORS.Low },
  ].filter((s) => s.value > 0);

  const signals = [
    { label: 'Risk factors', value: countBullets(report.risk_assessment), color: 'var(--color-risk-high)' },
    { label: 'Growth drivers', value: countBullets(report.growth_opportunities), color: 'var(--color-risk-low)' },
    { label: 'Legal findings', value: countBullets(report.legal_analysis), color: 'var(--color-accent-blue)' },
  ].filter((s) => s.value > 0);

  const stats = [
    { label: 'Documents', value: meta.documents_analyzed ?? '—', icon: FileText },
    { label: 'Chunks', value: meta.chunks_retrieved ?? '—', icon: Layers },
    { label: 'Risk tags', value: totalRisks || '—', icon: ShieldAlert },
    { label: 'Citations', value: citations.length || '—', icon: Quote },
  ];

  return (
    <div className="mb-10 animate-fade-in">
      <h3 className="flex items-center gap-2.5 text-[12px] font-mono uppercase tracking-[0.12em] text-text-muted mb-4">
        <span className="w-2 h-2 rounded-full bg-accent-coral" />
        Analysis at a glance
      </h3>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-bg-soft/60 p-3.5">
              <Icon className="w-4 h-4 text-text-muted mb-2" />
              <div className="font-display text-2xl text-text-primary leading-none">{s.value}</div>
              <div className="text-[11px] font-mono uppercase tracking-wide text-text-muted mt-1.5">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Risk severity donut */}
        <div className="rounded-xl border border-border bg-bg-elevated p-5 shadow-card">
          <p className="text-[13px] font-medium text-text-primary mb-4">Risk severity mix</p>
          {segments.length > 0 ? (
            <div className="flex items-center gap-5">
              <DonutChart segments={segments} centerLabel={totalRisks} centerSub="signals" />
              <div className="flex-1"><Legend segments={segments} /></div>
            </div>
          ) : (
            <p className="text-sm text-text-muted py-6 text-center">No severity tags detected.</p>
          )}
        </div>

        {/* Signal volume bars */}
        <div className="rounded-xl border border-border bg-bg-elevated p-5 shadow-card">
          <p className="text-[13px] font-medium text-text-primary mb-4">Signal coverage</p>
          {signals.length > 0 ? (
            <BarList items={signals} />
          ) : (
            <p className="text-sm text-text-muted py-6 text-center">No itemized signals found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
