import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function CitationCard({ citation }) {
  const [expanded, setExpanded] = useState(false);

  const { text, source, page, doc_type, section_header } = citation;

  return (
    <div className="rounded-xl border border-border bg-bg-soft/60 hover:border-accent-blue/30 transition-all animate-slide-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        <FileText className="w-4 h-4 text-accent-blue mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-medium text-text-primary truncate">{source}</span>
            {page && <span className="text-[10px] font-mono text-text-muted">p.{page}</span>}
            {doc_type && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase bg-accent-blue/12 text-accent-blue">
                {doc_type}
              </span>
            )}
          </div>
          {!expanded && text && (
            <p className="text-xs text-text-muted mt-1 line-clamp-1 font-mono">{text}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border">
          <p className="text-xs font-mono text-text-secondary leading-relaxed mt-2 whitespace-pre-wrap">
            {text}
          </p>
          {section_header && (
            <p className="text-[10px] text-text-muted mt-2 italic">Section: {section_header}</p>
          )}
        </div>
      )}
    </div>
  );
}
