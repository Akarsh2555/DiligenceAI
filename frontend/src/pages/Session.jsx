import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, Download, UploadCloud, Activity, Layout } from 'lucide-react';
import api, { API_BASE } from '../lib/api';
import { useUpload } from '../hooks/useUpload';
import { useAnalysis } from '../hooks/useAnalysis';
import { useChat } from '../hooks/useChat';
import DocumentUploader from '../components/DocumentUploader';
import DocumentList from '../components/DocumentList';
import AnalysisPanel from '../components/AnalysisPanel';
import AnalysisInsights from '../components/AnalysisInsights';
import ReportSection from '../components/ReportSection';
import ChatInterface from '../components/ChatInterface';

export default function Session() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [savedReport, setSavedReport] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);

  const { upload, uploading, results } = useUpload(sessionId);
  const { analyze, analyzing, steps, report } = useAnalysis(sessionId);
  const { messages, sendMessage, streaming, loadHistory } = useChat(sessionId);

  useEffect(() => {
    if (sessionId) {
      loadSession();
      loadDocuments();
      loadHistory();
      loadSavedReport();
    }
  }, [sessionId]);

  useEffect(() => {
    if (report) setSavedReport(report);
  }, [report]);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  // Poll documents while any are processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'pending' || d.status === 'processing');
    if (!hasProcessing) return;
    const interval = setInterval(loadDocuments, 3000);
    return () => clearInterval(interval);
  }, [documents]);

  const loadSession = async () => {
    try { const res = await api.get(`/sessions/${sessionId}`); setSession(res.data); } catch {}
  };

  const loadDocuments = async () => {
    try { const res = await api.get(`/sessions/${sessionId}/documents`); setDocuments(res.data.documents || []); } catch {}
  };

  const loadSavedReport = async () => {
    try { const res = await api.get(`/sessions/${sessionId}/report`); setSavedReport(res.data); } catch {}
  };

  const handleUpload = async (files) => {
    await upload(files);
    setTimeout(loadDocuments, 1000);
  };

  const handleAnalyze = async (mode) => {
    await analyze(mode);
    loadDocuments();
  };

  const downloadDocx = async () => {
    try {
      const res = await api.get(`/sessions/${sessionId}/download-report`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Diligence_Report_${sessionId.slice(0, 8)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  const readyDocs = documents.filter((d) => d.status === 'ready');
  const displayReport = report || savedReport;

  // Stable iframe URL — only changes when the selected doc changes, so the PDF
  // doesn't reload on every re-render (chat streaming, doc polling, etc.).
  const docUrl = useMemo(
    () => (selectedDocId
      ? `${API_BASE}/sessions/${sessionId}/documents/${selectedDocId}/view`
      : null),
    [sessionId, selectedDocId],
  );

  return (
    <div className="h-screen bg-bg-primary flex flex-col overflow-hidden">
      {/* Header */}
      <header className="glass shrink-0 z-20">
        <div className="max-w-[1920px] mx-auto px-6 py-3.5 flex items-center gap-4">
          <Link to="/" className="p-2 rounded-full border border-border bg-bg-elevated hover:border-accent-coral/40 transition-colors">
            <ArrowLeft className="w-4.5 h-4.5 text-text-primary" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display text-text-primary truncate leading-tight">{session?.name || 'Loading…'}</h1>
            <div className="flex items-center gap-3 mt-0.5 text-[12px] text-text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${readyDocs.length ? 'bg-risk-low' : 'bg-text-muted'}`} />
                {readyDocs.length} docs ready
              </span>
              <span className="text-border">•</span>
              <span className="font-mono">{session?.total_chunks || 0} chunks indexed</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split Layout: 3 Panes */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 min-h-0 overflow-y-auto lg:overflow-hidden h-full">

        {/* Pane 1: Chatbot (Left) */}
        <section className="flex flex-col panel overflow-hidden lg:h-[calc(100vh-104px)] h-[600px] min-h-[600px]">
          <PaneHeader icon={<Activity className="w-4 h-4 text-accent-coral" />} title="Chat assistant" tag="Q&A" />
          <ChatInterface messages={messages} onSend={sendMessage} streaming={streaming} />
        </section>

        {/* Pane 2: Document Viewer (Middle) */}
        <section className="flex flex-col panel lg:h-[calc(100vh-104px)] h-[600px] min-h-[600px] relative overflow-hidden">
          <PaneHeader icon={<FileText className="w-4 h-4 text-accent-blue" />} title="Document source" tag="Data room">
            {documents.length > 0 && (
              <select
                value={selectedDocId || ''}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="text-[13px] border border-border rounded-lg px-3 py-1.5 bg-bg-primary text-text-primary focus:outline-none focus:border-accent-blue max-w-[200px]"
              >
                {documents.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.filename}</option>
                ))}
              </select>
            )}
          </PaneHeader>
          <div className="flex-1 overflow-y-auto bg-bg-primary p-4">
             {documents.length === 0 ? (
               <div className="max-w-md mx-auto space-y-8 py-8">
                 <DocumentUploader onUpload={handleUpload} uploading={uploading} results={results} />
               </div>
             ) : (
               <div className="h-full border border-border rounded-md bg-bg-elevated overflow-hidden shadow-card">
                 {docUrl && (
                   <iframe
                     key={selectedDocId}
                     src={docUrl}
                     className="w-full h-full border-0"
                     title="Document Viewer"
                   />
                 )}
               </div>
             )}
          </div>
        </section>

        {/* Pane 3: Editor / Report (Right) */}
        <section className="flex flex-col panel lg:h-[calc(100vh-104px)] h-[600px] min-h-[600px] relative overflow-hidden">
          <PaneHeader icon={<Layout className="w-4 h-4 text-risk-medium" />} title="Analysis & report" tag="Agents">
             {displayReport && (
               <button onClick={downloadDocx}
                 className="flex items-center gap-1.5 px-3.5 py-1.5 bg-bg-elevated border border-border hover:border-accent-coral/40 text-text-primary rounded-pill text-[12px] font-medium transition-all shadow-card">
                 <Download className="w-3.5 h-3.5" /> Export DOCX
               </button>
             )}
          </PaneHeader>
          <div className="flex-1 overflow-y-auto bg-bg-primary p-6 lg:p-8">
             {!displayReport ? (
               <div className="max-w-xl mx-auto py-4">
                 <AnalysisPanel onAnalyze={handleAnalyze} analyzing={analyzing} steps={steps} hasDocuments={readyDocs.length > 0} />
               </div>
             ) : (
               <div className="max-w-xl mx-auto py-2">
                 <AnalysisInsights report={displayReport} />
                 <ReportSection content={displayReport.executive_summary} title="Executive Summary" accent="coral" />
                 <ReportSection content={displayReport.risk_assessment} title="Risk Assessment" accent="high" />
                 <ReportSection content={displayReport.growth_opportunities} title="Growth Opportunities" accent="low" />
                 <ReportSection content={displayReport.legal_analysis} title="Legal Analysis" accent="blue" />
               </div>
             )}
          </div>
        </section>
      </main>
    </div>
  );
}

function PaneHeader({ icon, title, tag, children }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-bg-elevated shrink-0 h-[56px] rounded-t-[22px]">
      <h2 className="text-[14px] font-medium text-text-primary flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-bg-surface flex items-center justify-center">{icon}</span>
        {title}
        {tag && <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-wide text-text-muted bg-bg-surface px-2 py-0.5 rounded-pill ml-1">{tag}</span>}
      </h2>
      {children}
    </div>
  );
}
