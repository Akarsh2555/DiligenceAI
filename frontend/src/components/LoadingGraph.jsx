import { Check, Loader2 } from 'lucide-react';

export default function LoadingGraph({ steps }) {
  const nodes = [
    { id: 'retrieve', label: 'Retrieve' },
    { id: 'risk_assessment', label: 'Risk' },
    { id: 'growth_opportunities', label: 'Growth' },
    { id: 'legal_analysis', label: 'Legal' },
    { id: 'executive_summary', label: 'Summary' },
    { id: 'assemble_report', label: 'Report' },
  ];

  const completedSteps = steps
    .filter((s) => s.event === 'node_complete')
    .map((s) => s.node);

  const activeStep = steps.length > 0 ? steps[steps.length - 1]?.node : null;
  const isFinished = activeStep === '__end__';

  return (
    <div className="w-full mt-6 pt-6 border-t border-gray-100/50">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[13px] font-semibold flex items-center gap-2.5">
          {isFinished ? (
            <>
              <span className="flex w-5 h-5 bg-green-500/20 text-green-600 rounded-full items-center justify-center">
                <Check className="w-3 h-3" strokeWidth={3} />
              </span>
              <span className="text-gray-800">Analysis Complete</span>
            </>
          ) : (
            <>
              <Loader2 className="w-4 h-4 text-accent-blue animate-spin" />
              <span className="text-accent-blue">Agents are analyzing...</span>
            </>
          )}
        </h4>
        <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase bg-gray-100/50 px-2 py-1 rounded-full">
          Live Trace
        </span>
      </div>

      <div className="relative flex justify-between w-full px-2">
        {/* Background Track */}
        <div className="absolute top-[11px] left-[20px] right-[20px] h-[2px] bg-gray-100 -z-10"></div>

        {nodes.map((node, i) => {
          const isComplete = completedSteps.includes(node.id) || isFinished;
          const isActive = activeStep === node.id && !isFinished;
          
          return (
            <div key={node.id} className="relative flex flex-col items-center w-full group">
              
              {/* Active/Completed Line Fill */}
              {i > 0 && (isComplete || isActive) && (
                <div 
                  className={`absolute top-[11px] right-[50%] h-[2px] -z-10 transition-all duration-700 ease-in-out ${
                    isComplete ? 'bg-accent-blue' : 'bg-accent-blue/50'
                  }`}
                  style={{ width: '100%' }}
                />
              )}

              {/* Node Indicator */}
              <div 
                className={`w-[24px] h-[24px] rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                  isComplete 
                    ? 'bg-accent-blue text-white shadow-md shadow-accent-blue/30 scale-100' 
                    : isActive 
                      ? 'bg-white border-[2.5px] border-accent-blue text-accent-blue scale-125 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'bg-white border-2 border-gray-200 text-gray-300 scale-90'
                }`}
              >
                {isComplete ? (
                  <Check className="w-3 h-3" strokeWidth={3} />
                ) : isActive ? (
                  <div className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-ping"></div>
                ) : (
                  <div className="w-1.5 h-1.5 bg-gray-200 rounded-full transition-colors group-hover:bg-gray-300"></div>
                )}
              </div>

              {/* Node Label */}
              <span 
                className={`absolute top-8 text-[10px] font-medium tracking-wide transition-colors duration-300 whitespace-nowrap ${
                  isComplete 
                    ? 'text-gray-800' 
                    : isActive 
                      ? 'text-accent-blue font-bold' 
                      : 'text-gray-400'
                }`}
              >
                {node.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-6"></div> {/* Bottom spacing for labels */}
    </div>
  );
}
