import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Clock, FileText, Trash2, LogOut, User } from 'lucide-react';
import api from '../lib/api';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
    supabase.auth.getUser().then(({ data }) => setUser(data?.user));
  }, []);

  const loadSessions = async () => {
    try {
      const res = await api.get('/sessions');
      setSessions(res.data.sessions || []);
    } catch {} finally { setLoading(false); }
  };

  const createSession = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api.post('/sessions', { name: newName, description: newDesc });
      setShowNew(false);
      setNewName('');
      setNewDesc('');
      navigate(`/session/${res.data.id}`);
    } catch {}
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this session and all its data?')) return;
    try {
      await api.delete(`/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {}
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const STATUS_COLORS = {
    active: 'bg-accent-blue/10 text-accent-blue border border-accent-blue/20',
    analyzing: 'bg-risk-medium/10 text-risk-medium border border-risk-medium/20',
    completed: 'bg-risk-low/10 text-risk-low border border-risk-low/20',
    archived: 'bg-bg-surface text-text-muted border border-border',
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="glass sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-coral flex items-center justify-center shadow-coral">
              <span className="text-white font-display text-lg">D</span>
            </div>
            <span className="text-xl font-display tracking-tight">DiligenceAI</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-pill border border-border bg-bg-elevated">
                <div className="w-6 h-6 rounded-full bg-accent-coral/15 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-accent-coral" />
                </div>
                <span className="text-[13px] font-medium text-text-secondary">{user.email}</span>
              </div>
            )}
            <button onClick={handleLogout}
              title="Sign out"
              className="p-2.5 rounded-full border border-border bg-bg-elevated hover:border-risk-high/40 transition-colors text-text-muted hover:text-risk-high">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14">
        {/* Hero */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-mono tracking-[0.18em] text-accent-coral uppercase mb-4">
              Workspace
            </span>
            <h1 className="text-5xl font-display text-text-primary leading-[1.05] mb-4">
              Due diligence sessions
            </h1>
            <p className="text-text-secondary text-[17px] leading-relaxed">
              Upload a data room and let the agents read, cross-reference, and draft your investment memo.
            </p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="shrink-0 flex items-center gap-2 px-6 py-3.5 bg-accent-coral hover:bg-accent-coral-hover
              text-white rounded-pill text-[15px] font-medium transition-all shadow-coral">
            <Plus className="w-4 h-4" /> New session
          </button>
        </div>

        {/* New Session Dialog */}
        {showNew && (
          <div className="mb-10 panel p-8 animate-fade-in">
            <h3 className="font-display text-2xl mb-1">Create a new session</h3>
            <p className="text-text-secondary text-sm mb-6">Give it a name so you can find it later.</p>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Session name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createSession()}
              placeholder="e.g. Acme Corp — Series B" autoFocus
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm mb-4
                focus:outline-none focus:border-accent-coral focus:ring-4 focus:ring-accent-coral/10 transition-all" />
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">Description <span className="text-text-muted">(optional)</span></label>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
              placeholder="What are you evaluating?"
              className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm mb-6
                focus:outline-none focus:border-accent-coral focus:ring-4 focus:ring-accent-coral/10 transition-all" />
            <div className="flex gap-3">
              <button onClick={createSession} disabled={!newName.trim()}
                className="px-6 py-2.5 bg-accent-coral hover:bg-accent-coral-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-pill text-sm font-medium transition-colors">
                Create session
              </button>
              <button onClick={() => setShowNew(false)}
                className="px-6 py-2.5 bg-transparent hover:bg-bg-surface border border-border rounded-pill text-sm font-medium text-text-primary transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map((i) => (
              <div key={i} className="h-44 rounded-[22px] bg-bg-surface animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-[30px] bg-bg-soft/40">
            <div className="w-16 h-16 rounded-2xl bg-bg-surface flex items-center justify-center mx-auto mb-5">
              <FolderOpen className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-2xl font-display text-text-primary mb-2">No sessions yet</p>
            <p className="text-text-secondary mb-6">Create your first due diligence session to get started.</p>
            <button onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-coral hover:bg-accent-coral-hover text-white rounded-pill text-sm font-medium transition-all shadow-coral">
              <Plus className="w-4 h-4" /> New session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((s) => (
              <div key={s.id} onClick={() => navigate(`/session/${s.id}`)}
                className="group p-6 rounded-[22px] border border-border bg-bg-elevated
                  hover:border-accent-coral/40 hover:-translate-y-0.5 cursor-pointer
                  transition-all duration-300 animate-fade-in shadow-card hover:shadow-lift">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-coral/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-accent-coral" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-pill font-mono text-[10px] uppercase tracking-wide ${STATUS_COLORS[s.status] || STATUS_COLORS.active}`}>
                      {s.status}
                    </span>
                    <button onClick={(e) => deleteSession(s.id, e)}
                      className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-risk-high/10 transition-all">
                      <Trash2 className="w-4 h-4 text-risk-high" />
                    </button>
                  </div>
                </div>
                <h3 className="font-display text-xl text-text-primary truncate mb-1">{s.name}</h3>
                {s.description
                  ? <p className="text-sm text-text-secondary mb-5 line-clamp-2 leading-relaxed">{s.description}</p>
                  : <p className="text-sm text-text-muted mb-5 italic">No description</p>}
                <div className="flex items-center gap-5 pt-4 border-t border-border-soft">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                    <FileText className="w-3.5 h-3.5" /> {s.document_count} docs
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                    <Clock className="w-3.5 h-3.5" /> {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
