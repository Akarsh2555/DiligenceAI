import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, TrendingUp, Scale, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AGENTS = [
  { icon: ShieldCheck, label: 'Risk', color: 'text-risk-high' },
  { icon: TrendingUp, label: 'Growth', color: 'text-risk-low' },
  { icon: Scale, label: 'Legal', color: 'text-accent-blue' },
  { icon: Sparkles, label: 'Summary', color: 'text-accent-coral' },
];

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) console.error('OAuth error:', error.message);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Image Panel */}
      <div className="relative hidden lg:flex flex-col justify-between bg-[url('/handshake-bg.png')] bg-cover bg-center p-12 overflow-hidden">
        {/* Subtle dark overlay to ensure logo is visible if image is bright */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl bg-accent-coral flex items-center justify-center">
            <span className="text-white font-display text-lg">D</span>
          </div>
          <span className="text-xl font-display text-white drop-shadow-md">DiligenceAI</span>
        </div>

        <p className="relative text-[11px] font-mono uppercase tracking-[0.15em] text-white/70 drop-shadow-sm z-10">
          Gemini · LangGraph · Supabase
        </p>
      </div>

      {/* Right — auth */}
      <div className="relative flex items-center justify-center bg-bg-primary px-6 py-12">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-accent-coral flex items-center justify-center shadow-coral">
              <span className="text-white font-display text-lg">D</span>
            </div>
            <span className="text-xl font-display">DiligenceAI</span>
          </div>

          <span className="block text-center text-[11px] font-mono tracking-[0.18em] text-accent-coral uppercase mb-3">
            Welcome back
          </span>
          <h1 className="text-4xl font-display text-text-primary text-center mb-2">Sign in</h1>
          <p className="text-text-secondary text-center text-[15px] mb-8">
            Continue to your due-diligence workspace.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-pill
              bg-bg-dark text-text-on-dark font-medium text-[15px]
              hover:bg-bg-dark-soft transition-all duration-200 shadow-card disabled:opacity-50"
          >
            <svg className="w-5 h-5 bg-white rounded-full p-[2px]" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Authenticating…' : 'Continue with Google'}
          </button>

          <p className="text-center text-[12px] text-text-muted mt-6 leading-relaxed">
            By continuing you agree to our Terms of Service & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
