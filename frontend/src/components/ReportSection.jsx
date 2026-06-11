import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

const ACCENTS = {
  coral: { dot: 'bg-accent-coral', text: 'text-accent-coral' },
  high:  { dot: 'bg-risk-high',    text: 'text-risk-high' },
  low:   { dot: 'bg-risk-low',     text: 'text-risk-low' },
  blue:  { dot: 'bg-accent-blue',  text: 'text-accent-blue' },
};

export default function ReportSection({ content, title, accent = 'coral' }) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  const a = ACCENTS[accent] || ACCENTS.coral;

  const handleCopy = async (e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mb-10 animate-fade-in border-b border-border-soft pb-8 last:border-0 last:mb-0">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2.5 text-[12px] font-mono uppercase tracking-[0.12em] text-text-muted">
            <span className={`w-2 h-2 rounded-full ${a.dot}`} />
            {title}
          </h3>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-border bg-bg-elevated shadow-card opacity-0 group-hover:opacity-100 transition-opacity hover:border-accent-coral/40"
            title="Copy section"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-risk-low" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
          </button>
        </div>
      )}

      <div className="markdown-content text-[15px] leading-relaxed text-text-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
