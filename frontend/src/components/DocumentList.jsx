import { FileText, FileSpreadsheet, File, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const TYPE_BADGES = {
  '10-K': { label: '10-K', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  '10-Q': { label: '10-Q', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  'S-1': { label: 'S-1', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  'legal_contract': { label: 'Legal', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'earnings_call': { label: 'Earnings', color: 'bg-green-100 text-green-700 border-green-200' },
  'market_report': { label: 'Market', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  'investor_deck': { label: 'Deck', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  'financial_statement': { label: 'Financial', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'unknown': { label: 'Document', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const STATUS_ICONS = {
  pending: Clock,
  processing: Loader2,
  ready: CheckCircle2,
  error: AlertCircle,
};

export default function DocumentList({ documents }) {
  if (!documents?.length) {
    return (
      <div className="text-center py-10 bg-white border border-border rounded-2xl shadow-sm">
        <FileText className="w-12 h-12 mx-auto mb-3 text-border-dark opacity-30" />
        <p className="text-text-primary font-medium">No documents yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const ext = doc.file_type || doc.filename?.split('.').pop() || '';
        const badge = TYPE_BADGES[doc.doc_type] || TYPE_BADGES.unknown;
        const StatusIcon = STATUS_ICONS[doc.status] || Clock;
        const isProcessing = doc.status === 'processing';

        return (
          <div
            key={doc.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-white border border-border hover:border-accent-coral hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-bg-surface flex items-center justify-center shrink-0 border border-border">
              <FileText className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-text-primary truncate">{doc.filename}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${badge.color}`}>
                  {badge.label}
                </span>
                {doc.chunk_count > 0 && (
                  <span className="text-xs text-text-muted font-mono">
                    {doc.chunk_count} chunks • {doc.page_count} pages
                  </span>
                )}
              </div>
            </div>
            <StatusIcon className={`w-5 h-5 shrink-0 ${
              doc.status === 'ready' ? 'text-risk-low' :
              doc.status === 'error' ? 'text-risk-high' :
              isProcessing ? 'text-accent-coral animate-spin' : 'text-text-muted'
            }`} />
          </div>
        );
      })}
    </div>
  );
}
