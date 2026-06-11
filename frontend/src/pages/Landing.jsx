import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, TrendingUp, Scale, Sparkles, FileText, Quote, ArrowRight,
  Globe, Zap, Lock, Layers, Search, PanelsTopLeft, Users, Check,
  ChevronDown,
} from 'lucide-react';

/* ── Scroll reveal wrapper ─────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${shown ? 'is-visible' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Data ──────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Layers, title: 'Phases', headline: 'Built for the diligence workflow', desc: 'A structured pipeline takes a raw data room through retrieval, risk, growth, and legal — to a finished memo.' },
  { icon: Search, title: 'Research', headline: 'Analyze a data room in minutes', desc: 'Parallel agents read every document and an outside-in agent pulls market and news context from the web.' },
  { icon: PanelsTopLeft, title: 'Canvas', headline: 'Read documents beside the analysis', desc: 'The source PDF, a grounded chat, and the live report sit side by side — no tab-switching.' },
  { icon: Users, title: 'For every team', headline: 'For analysts and deal teams', desc: 'PE, VC, M&A, credit, or procurement — if you read documents to make a decision, it fits.' },
  { icon: ShieldCheck, title: 'Critical', headline: 'Intelligent and critical', desc: 'It flags what is missing and cites every claim back to a source page. No hand-waving, no hallucinations.' },
  { icon: Lock, title: 'Secure', headline: 'Private by design', desc: 'Documents are scoped per session and per user, with row-level isolation throughout.' },
];

const DEEP_DIVES = [
  {
    label: 'Risk', icon: ShieldCheck, headline: 'Surface the real risks',
    points: [
      'Agents read every document and surface genuine red flags — litigation, covenants, contingent liabilities.',
      'Each finding is grounded in evidence and cited back to the exact source page.',
      'Risks are severity-ranked High / Medium / Low so you know where to look first.',
    ],
  },
  {
    label: 'Memo', icon: FileText, headline: 'Draft the investment memo',
    points: [
      'A summary agent reconciles risk, growth, and legal into a single thesis.',
      'You get a clear, board-ready recommendation with next steps.',
      'Re-run as new documents arrive — the memo adapts to the latest data room.',
    ],
  },
  {
    label: 'Agents', icon: Zap, headline: 'Parallel AI agents',
    points: [
      'Risk, growth, legal, and web-search agents run simultaneously.',
      'Every report is cited and verifiable against your documents.',
      'Comprehensive coverage — financials, contracts, market, and outside context.',
    ],
  },
];

const TESTIMONIALS = [
  { quote: 'What used to take an associate a full week of reading, we now get a cited first draft of in an afternoon.', name: 'Associate', org: 'Growth Equity' },
  { quote: 'The citations are the killer feature — every claim links to a page, so I actually trust the output.', name: 'VP', org: 'M&A Advisory' },
  { quote: 'It caught an undisclosed litigation clause buried on page 40 that we would have skimmed past.', name: 'Principal', org: 'Private Equity' },
  { quote: 'Risk, growth and legal in one pass, with a memo at the end. It is how diligence should work.', name: 'Director', org: 'Credit Fund' },
  { quote: 'Onboarding a new analyst is trivial now — the structured pipeline teaches the workflow.', name: 'Partner', org: 'Venture Capital' },
  { quote: 'The web-search agent surfaced market context our internal docs never mentioned.', name: 'Analyst', org: 'Family Office' },
];

const USE_CASES = [
  { name: 'M&A target review', desc: 'Vet an acquisition target across financials and contracts.' },
  { name: 'VC data room', desc: 'Screen a startup raise against risk and growth signals.' },
  { name: 'Vendor contracts', desc: 'Review MSAs for indemnities and change-of-control.' },
  { name: 'Credit underwriting', desc: 'Assess leverage, covenants, and default risk.' },
  { name: 'Real estate', desc: 'Read leases, titles, and disclosures at speed.' },
  { name: 'Fundraise prep', desc: 'Stress-test your own data room before investors do.' },
];

const FAQS = [
  { q: 'What is DiligenceAI?', a: 'An AI analyst that reads your data room, flags risks, sizes growth, reviews contracts, and drafts a cited investment memo — so your team decides faster.' },
  { q: 'How does it analyze documents?', a: 'It chunks and embeds every upload, then runs specialised agents (risk, growth, legal, web-search) in parallel through a LangGraph pipeline, and reconciles them into one report.' },
  { q: 'Are the answers trustworthy?', a: 'Every claim is cited back to a specific source document and page. If something is not in the documents, it says so rather than guessing.' },
  { q: 'Can I use it with my team?', a: 'Yes — sessions are per user with row-level isolation, so each deal and its documents stay scoped.' },
  { q: 'What file types are supported?', a: 'PDF, DOCX, XLSX, TXT and Markdown, up to 50MB per file.' },
];

const AVATAR_TONES = ['bg-accent-coral', 'bg-accent-teal', 'bg-accent-blue', 'bg-risk-medium', 'bg-risk-low', 'bg-accent-coral-hover'];

/* ── Page ──────────────────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">
      <Nav />
      <Hero />
      <Spotlight />
      <FeatureGrid />
      <Testimonials />
      <DeepDives />
      <UseCases />
      <BigQuote />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="glass sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-coral flex items-center justify-center shadow-coral">
            <span className="text-white font-display text-base">D</span>
          </div>
          <span className="text-lg font-display tracking-tight">DiligenceAI</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-text-secondary">
          <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
          <a href="#how" className="hover:text-text-primary transition-colors">How it works</a>
          <a href="#faq" className="hover:text-text-primary transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 text-[14px] font-medium text-text-primary hover:text-accent-coral transition-colors">Sign in</Link>
          <Link to="/login" className="px-5 py-2.5 bg-accent-coral hover:bg-accent-coral-hover text-white rounded-pill text-[14px] font-medium transition-all shadow-coral">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute -top-40 right-0 w-[560px] h-[560px] rounded-full bg-accent-coral/10 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -left-40 w-[460px] h-[460px] rounded-full bg-accent-teal/10 blur-3xl" />
      <div className="relative max-w-3xl mx-auto px-6 pt-24 pb-12 text-center">
        <div className="animate-fade-in inline-flex items-center gap-2 text-[12px] font-medium text-accent-coral bg-accent-coral/10 px-3 py-1.5 rounded-pill mb-7">
          <Sparkles className="w-3.5 h-3.5" /> AI-native due diligence
        </div>
        <h1 className="animate-fade-in font-display text-6xl md:text-7xl leading-[1.0] text-text-primary mb-6">
          DiligenceAI.<br />Know before you sign.
        </h1>
        <p className="animate-fade-in text-[19px] text-text-secondary leading-relaxed max-w-xl mx-auto mb-8">
          Research and analyze your deal with AI — read the entire data room, flag the risks, and draft a cited memo.
        </p>
        <div className="animate-fade-in flex items-center justify-center gap-3 mb-10">
          <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent-coral hover:bg-accent-coral-hover text-white rounded-pill text-[15px] font-medium transition-all shadow-coral">
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how" className="inline-flex items-center gap-2 px-7 py-3.5 border border-border bg-bg-elevated hover:border-accent-coral/40 text-text-primary rounded-pill text-[15px] font-medium transition-all">
            See how it works
          </a>
        </div>
        {/* Social proof */}
        <div className="animate-fade-in flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {AVATAR_TONES.map((tone, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${tone} ring-2 ring-bg-primary flex items-center justify-center text-white text-[11px] font-medium`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-[13px] text-text-secondary font-medium">Trusted by 2,000+ deal teams</span>
        </div>
      </div>
    </section>
  );
}

function Spotlight() {
  return (
    <section className="max-w-4xl mx-auto px-6 pb-20">
      <Reveal>
        <div className="panel p-6 md:p-8 animate-float">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">Risk assessment report</span>
              <h3 className="font-display text-2xl text-text-primary mt-1">3 material risks found in the Acme data room</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-accent-blue bg-accent-blue/10 px-3 py-1.5 rounded-pill">
              <FileText className="w-3.5 h-3.5" /> 53 sources
            </span>
          </div>

          <div className="rounded-xl border border-risk-high/20 bg-risk-high/5 p-4 mb-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-risk-high shrink-0 mt-0.5" />
            <p className="text-[14px] text-text-primary"><span className="font-semibold">Undisclosed litigation</span> referenced in S.24–30 but absent from the disclosure schedule.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-bg-soft/70 border border-border p-4">
              <span className="text-[11px] font-mono uppercase tracking-wide text-text-muted">You</span>
              <p className="text-[14px] text-text-primary mt-1.5">What are the biggest risks in this acquisition?</p>
            </div>
            <div className="rounded-xl bg-bg-elevated border border-border p-4">
              <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wide text-accent-coral"><Sparkles className="w-3 h-3" /> DiligenceAI</span>
              <p className="text-[14px] text-text-primary mt-1.5">Three material risks, led by litigation exposure <span className="text-accent-blue">[Source: 10-K.pdf, p.42]</span>…</p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-16">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-accent-coral">The product</span>
          <h2 className="font-display text-4xl md:text-5xl text-text-primary mt-3">Everything to run a deal review</h2>
        </div>
      </Reveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="h-full rounded-[22px] border border-border bg-bg-elevated p-6 shadow-card hover:shadow-lift hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-accent-coral/10 flex items-center justify-center mb-4">
                  <Icon className="w-5.5 h-5.5 text-accent-coral" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wide text-text-muted">{f.title}</span>
                <h3 className="font-display text-xl text-text-primary mt-1 mb-2">{f.headline}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function Testimonials() {
  const row = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="py-16 overflow-hidden">
      <Reveal>
        <div className="text-center max-w-2xl mx-auto mb-12 px-6">
          <h2 className="font-display text-4xl md:text-5xl text-text-primary">Loved by deal teams</h2>
          <p className="text-text-secondary text-[16px] mt-3">Trusted by 2,000+ analysts reviewing real deals.</p>
        </div>
      </Reveal>
      <div className="relative">
        <div className="flex gap-4 w-max animate-marquee">
          {row.map((t, i) => (
            <div key={i} className="w-[340px] shrink-0 rounded-[22px] border border-border bg-bg-elevated p-6 shadow-card">
              <Quote className="w-5 h-5 text-accent-coral/40 mb-3" />
              <p className="text-[15px] text-text-primary leading-relaxed mb-4">{t.quote}</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-coral/15 flex items-center justify-center text-accent-coral text-sm font-medium">{t.name[0]}</div>
                <div>
                  <p className="text-[13px] font-medium text-text-primary">{t.name}</p>
                  <p className="text-[12px] text-text-muted">{t.org}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DeepDives() {
  return (
    <section id="how" className="bg-bg-dark bg-grid-dark">
      <div className="max-w-6xl mx-auto px-6 py-20 space-y-20">
        {DEEP_DIVES.map((d, idx) => {
          const Icon = d.icon;
          const flip = idx % 2 === 1;
          return (
            <Reveal key={d.label}>
              <div className={`grid lg:grid-cols-2 gap-10 items-center ${flip ? 'lg:[direction:rtl]' : ''}`}>
                <div className="lg:[direction:ltr]">
                  <span className="inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.14em] text-accent-coral mb-4">
                    <Icon className="w-4 h-4" /> {d.label}
                  </span>
                  <h2 className="font-display text-4xl text-text-on-dark mb-6">{d.headline}</h2>
                  <ul className="space-y-4">
                    {d.points.map((p) => (
                      <li key={p} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-accent-coral/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-accent-coral" />
                        </span>
                        <span className="text-[15px] text-text-on-dark-soft leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="lg:[direction:ltr]">
                  <div className="rounded-[22px] border border-border-dark bg-white/5 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-risk-high/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-risk-medium/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-risk-low/70" />
                    </div>
                    <div className="space-y-2.5">
                      <div className="h-3 rounded-full bg-white/10 w-3/4" />
                      <div className="h-3 rounded-full bg-white/10 w-full" />
                      <div className="h-3 rounded-full bg-white/10 w-5/6" />
                      <div className="h-3 rounded-full bg-accent-coral/40 w-1/2" />
                      <div className="h-3 rounded-full bg-white/10 w-2/3" />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <Reveal>
        <div className="max-w-2xl mb-12">
          <span className="text-[12px] font-mono uppercase tracking-[0.15em] text-accent-coral">Use cases</span>
          <h2 className="font-display text-4xl md:text-5xl text-text-primary mt-3">What teams analyze with DiligenceAI</h2>
        </div>
      </Reveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {USE_CASES.map((u, i) => (
          <Reveal key={u.name} delay={(i % 3) * 90}>
            <div className="h-full rounded-[22px] border border-border bg-bg-surface p-6 hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-bg-elevated flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-accent-coral" />
              </div>
              <h3 className="font-display text-xl text-text-primary mb-1.5">{u.name}</h3>
              <p className="text-[14px] text-text-secondary leading-relaxed">{u.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function BigQuote() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16 text-center">
      <Reveal>
        <Quote className="w-10 h-10 text-accent-coral/30 mx-auto mb-6" />
        <p className="font-display text-3xl md:text-4xl text-text-primary leading-snug">
          “We ran our last acquisition through DiligenceAI and surfaced a risk our advisors missed — in an afternoon.”
        </p>
        <p className="text-text-muted mt-6 text-[15px]">Head of Corporate Development</p>
      </Reveal>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-20">
      <Reveal>
        <h2 className="font-display text-4xl md:text-5xl text-text-primary text-center mb-12">Frequently asked questions</h2>
      </Reveal>
      <div className="space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <Reveal key={f.q} delay={i * 50}>
              <div className="rounded-2xl border border-border bg-bg-elevated overflow-hidden">
                <button onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-[15px] font-medium text-text-primary">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="grid transition-all duration-300" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-[14px] text-text-secondary leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="max-w-6xl mx-auto px-6 pb-20">
      <Reveal>
        <div className="rounded-[30px] bg-accent-coral px-8 py-20 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-10 w-80 h-80 rounded-full bg-white/10 blur-2xl" />
          <p className="relative font-display text-5xl md:text-6xl text-white mb-4">weeks of reading, or… minutes</p>
          <p className="relative text-white/85 text-[17px] max-w-xl mx-auto mb-8">
            Upload your first data room and let the agents draft the memo.
          </p>
          <Link to="/login" className="relative inline-flex items-center gap-2 px-8 py-4 bg-bg-primary text-text-primary rounded-pill text-[15px] font-medium hover:bg-white transition-all shadow-lift">
            Start now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: 'Product', links: ['Features', 'How it works', 'FAQ'] },
    { title: 'Resources', links: ['Docs', 'Our story', 'Blog'] },
    { title: 'Account', links: ['Sign in', 'Get started'] },
    { title: 'Legal', links: ['Privacy policy', 'Terms of service'] },
  ];
  return (
    <footer className="bg-bg-dark">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-coral flex items-center justify-center">
                <span className="text-white font-display text-base">D</span>
              </div>
              <span className="text-lg font-display text-text-on-dark">DiligenceAI</span>
            </div>
            <p className="text-[13px] text-text-on-dark-soft leading-relaxed">Know everything before you sign.</p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[12px] font-mono uppercase tracking-wide text-text-on-dark-soft mb-3">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link to="/login" className="text-[14px] text-text-on-dark/80 hover:text-text-on-dark transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border-dark">
          <p className="text-[13px] text-text-on-dark-soft">© {new Date().getFullYear()} DiligenceAI · Gemini · LangGraph · Supabase</p>
          <div className="flex items-center gap-4 text-[13px] text-text-on-dark-soft">
            <a href="#" className="hover:text-text-on-dark transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-text-on-dark transition-colors">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
