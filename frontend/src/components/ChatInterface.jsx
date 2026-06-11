import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Loader2, Sparkles } from 'lucide-react';
import CitationCard from './CitationCard';

/* Smoothly reveals streamed text character-by-character regardless of how lumpy
   the network chunks arrive, with a blinking caret — a real typewriter feel.
   When streaming ends (`active` false) it snaps to the full text. */
function StreamingMarkdown({ content, active }) {
  const [shown, setShown] = useState(active ? 0 : content.length);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    if (!active) {
      setShown(content.length);
      return;
    }
    let raf;
    const tick = () => {
      setShown((s) => {
        if (s >= content.length) return s;
        const remaining = content.length - s;
        // Catch up faster when far behind, but always move smoothly.
        const step = Math.max(1, Math.floor(remaining / 8));
        return Math.min(content.length, s + step);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [content, active]);

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(id);
  }, [active]);

  const caret = active ? (blink ? ' ▍' : '  ') : '';
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.slice(0, shown) + caret}</ReactMarkdown>
    </div>
  );
}

const SUGGESTIONS = [
  'Summarize the key risks',
  'What are the growth drivers?',
  'Flag any unusual legal clauses',
];

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1.5" aria-label="DiligenceAI is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
        />
      ))}
    </span>
  );
}

export default function ChatInterface({ messages, onSend, streaming }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const submit = (text) => {
    if (!text.trim() || streaming) return;
    onSend(text.trim());
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(input);
  };

  return (
    <div className="flex flex-col h-full bg-bg-primary relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
            <div className="w-12 h-12 bg-accent-coral/10 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-accent-coral" />
            </div>
            <h2 className="text-2xl font-display text-text-primary mb-2">How can I help?</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-6">
              Ask DiligenceAI to summarize documents, surface risks, or find a specific clause — grounded in your data room.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => submit(s)}
                  className="text-left text-[13px] text-text-secondary px-4 py-2.5 rounded-xl border border-border bg-bg-elevated hover:border-accent-coral/40 hover:text-text-primary transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isStreaming = streaming && i === messages.length - 1 && !isUser;

          return (
            <div key={i} className={`flex flex-col animate-fade-in ${isUser ? 'items-end' : 'items-start'}`}>
              {!isUser && (
                <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-text-muted mb-1.5 ml-1">
                  <Sparkles className="w-3 h-3 text-accent-coral" /> DiligenceAI
                </span>
              )}
              <div className={`text-[14px] leading-relaxed ${
                isUser
                  ? 'max-w-[88%] px-4 py-3 bg-bg-dark text-text-on-dark rounded-2xl rounded-br-md'
                  : 'w-full text-text-primary'
              }`}>
                {isUser ? (
                  <div className="markdown-content on-accent" style={{ fontSize: 14 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                ) : isStreaming && !msg.content ? (
                  <TypingDots />
                ) : (
                  <StreamingMarkdown content={msg.content} active={isStreaming} />
                )}
              </div>
              {msg.citations?.length > 0 && !isUser && (
                <div className="mt-2 space-y-2 w-[88%]">
                  {msg.citations.slice(0, 3).map((c, j) => (
                    <CitationCard key={j} citation={c} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-bg-elevated border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents…"
            disabled={streaming}
            className="w-full bg-bg-primary border border-border rounded-pill pl-5 pr-12 py-3 text-[14px]
              placeholder:text-text-muted focus:outline-none focus:border-accent-coral focus:ring-4 focus:ring-accent-coral/10 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-accent-coral hover:bg-accent-coral-hover text-white rounded-full
              disabled:opacity-40 disabled:hover:bg-accent-coral disabled:cursor-not-allowed transition-colors"
          >
            {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
