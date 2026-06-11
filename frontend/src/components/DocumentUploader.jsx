import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileSpreadsheet, File, AlertCircle, CheckCircle2 } from 'lucide-react';

const FILE_ICONS = {
  pdf: FileText,
  docx: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  txt: File,
  md: File,
};

const FILE_COLORS = {
  pdf: 'text-red-500',
  docx: 'text-blue-500',
  xlsx: 'text-green-500',
  xls: 'text-green-500',
  txt: 'text-gray-500',
  md: 'text-gray-500',
};

export default function DocumentUploader({ onUpload, uploading, results }) {
  const onDrop = useCallback((acceptedFiles) => {
    if (onUpload) onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    disabled: uploading,
    maxSize: 50 * 1024 * 1024,
  });

  return (
    <div className="space-y-5">
      <div className="text-center mb-2">
        <h3 className="font-display text-2xl text-text-primary mb-1">Add your data room</h3>
        <p className="text-text-secondary text-sm">Upload the documents you want the agents to analyze.</p>
      </div>

      <div
        {...getRootProps()}
        className={`relative border border-dashed rounded-[22px] p-10 text-center cursor-pointer transition-all duration-300 ease-out ${
          isDragActive
            ? 'border-accent-coral bg-accent-coral/5 scale-[1.01]'
            : 'border-border bg-bg-elevated hover:border-accent-coral/50 hover:bg-bg-soft/50'
        } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${isDragActive ? 'bg-accent-coral text-white' : 'bg-bg-surface text-text-muted'}`}>
          <Upload className="w-6 h-6" />
        </div>
        <p className="text-text-primary text-[15px] font-medium mb-1">
          {isDragActive ? 'Drop to upload' : 'Drag & drop, or click to browse'}
        </p>
        <p className="text-text-muted text-[13px] font-mono tracking-wide">
          PDF · DOCX · XLSX · TXT — max 50MB each
        </p>
        {uploading && (
          <div className="mt-6">
            <div className="h-1.5 bg-bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-accent-coral rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
            <p className="text-accent-coral font-medium text-sm mt-3">Uploading & processing…</p>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2.5 animate-fade-in">
          {results.map((r, i) => {
            const ext = r.filename?.split('.').pop()?.toLowerCase() || 'txt';
            const Icon = FILE_ICONS[ext] || File;
            const colorClass = FILE_COLORS[ext] || 'text-text-muted';
            const isOk = r.status === 'queued';

            return (
              <div key={i} className="flex items-center gap-3.5 p-3.5 rounded-xl bg-bg-elevated border border-border shadow-card">
                <div className="w-9 h-9 rounded-lg bg-bg-surface flex items-center justify-center shrink-0">
                  <Icon className={`w-4.5 h-4.5 ${colorClass}`} />
                </div>
                <span className="text-[14px] font-medium text-text-primary flex-1 truncate">{r.filename}</span>
                <span className={`px-2.5 py-1 rounded-pill text-[11px] font-mono font-medium ${
                  isOk ? 'bg-risk-low/10 text-risk-low border border-risk-low/20' : 'bg-risk-high/10 text-risk-high border border-risk-high/20'
                }`}>
                  {r.status}
                </span>
                {isOk ? <CheckCircle2 className="w-5 h-5 text-risk-low" /> : <AlertCircle className="w-5 h-5 text-risk-high" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
