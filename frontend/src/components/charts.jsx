/* Lightweight, dependency-free SVG charts tuned to the DiligenceAI palette. */

/* Donut / ring chart. segments: [{ label, value, color }] */
export function DonutChart({ segments = [], size = 132, thickness = 16, centerLabel, centerSub }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const frac = total > 0 ? seg.value / total : 0;
    const dash = frac * circumference;
    const arc = (
      <circle
        key={i}
        cx={c} cy={c} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dasharray .6s ease' }}
      />
    );
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--color-border)" strokeWidth={thickness} />
      {total > 0 && arcs}
      <text x={c} y={c - 2} textAnchor="middle" dominantBaseline="middle"
        style={{ fontFamily: 'var(--font-display)', fontSize: 26, fill: 'var(--color-text-primary)' }}>
        {centerLabel}
      </text>
      {centerSub && (
        <text x={c} y={c + 18} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', fill: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          {centerSub}
        </text>
      )}
    </svg>
  );
}

/* Horizontal bar list. items: [{ label, value, color }] */
export function BarList({ items = [], unit = '' }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-text-secondary">{it.label}</span>
            <span className="text-[13px] font-mono font-medium text-text-primary">{it.value}{unit}</span>
          </div>
          <div className="h-2 rounded-full bg-bg-surface overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(it.value / max) * 100}%`, background: it.color, transition: 'width .6s ease' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Compact legend for the donut. */
export function Legend({ segments = [] }) {
  return (
    <div className="space-y-2">
      {segments.map((s, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
          <span className="text-[13px] text-text-secondary flex-1">{s.label}</span>
          <span className="text-[13px] font-mono font-medium text-text-primary">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
