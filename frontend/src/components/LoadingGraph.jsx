export default function LoadingGraph({ steps }) {
  const nodes = [
    { id: 'retrieve', label: 'Retrieve', icon: '🔍' },
    { id: 'risk_assessment', label: 'Risk', icon: '🛡️' },
    { id: 'growth_opportunities', label: 'Growth', icon: '📈' },
    { id: 'legal_analysis', label: 'Legal', icon: '⚖️' },
    { id: 'executive_summary', label: 'Summary', icon: '📋' },
    { id: 'assemble_report', label: 'Report', icon: '📄' },
  ];

  const completedSteps = steps
    .filter((s) => s.event === 'node_complete')
    .map((s) => s.node);

  const activeStep = steps.length > 0 ? steps[steps.length - 1]?.node : null;

  return (
    <div className="relative pt-5 mt-1 border-t border-border overflow-x-auto">
      <div className="flex items-center gap-1 min-w-max justify-center pb-1">
        {nodes.map((node, i) => {
          const isComplete = completedSteps.includes(node.id);
          const isActive = activeStep === node.id && !isComplete;

          return (
            <div key={node.id} className="flex items-center">
              <div className={`relative flex flex-col items-center gap-1.5 px-2.5 py-2 rounded-lg transition-all duration-500 min-w-[64px] ${
                isComplete ? 'bg-risk-low/15 border border-risk-low/30'
                  : isActive ? 'bg-accent-coral/15 border border-accent-coral/40 animate-pulse-glow'
                  : 'bg-bg-elevated border border-border'
              }`}>
                <span className="text-base leading-none">{isComplete ? '✅' : node.icon}</span>
                <span className={`text-[9px] font-semibold tracking-wide uppercase ${
                  isComplete ? 'text-risk-low'
                    : isActive ? 'text-accent-coral'
                    : 'text-text-muted'
                }`}>
                  {node.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-accent-coral animate-ping" />
                )}
              </div>
              {i < nodes.length - 1 && (
                <div className={`w-5 h-0.5 mx-0.5 transition-colors duration-500 ${
                  isComplete ? 'bg-risk-low' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
