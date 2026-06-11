import { useState, useEffect } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function PdfViewer({ url }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Reset page when URL changes
  useEffect(() => {
    setPageNumber(1);
  }, [url]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => {
      const newPage = prevPageNumber + offset;
      return Math.min(Math.max(1, newPage), numPages);
    });
  };

  const changeScale = (delta) => {
    setScale((prevScale) => {
      const newScale = prevScale + delta;
      return Math.min(Math.max(0.5, newScale), 3.0);
    });
  };

  if (!url) return null;

  return (
    <div className="flex flex-col h-full bg-bg-surface overflow-hidden relative">
      {/* PDF Controls Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-elevated shrink-0 absolute top-0 left-0 right-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded bg-bg-surface text-text-primary hover:bg-bg-primary disabled:opacity-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-text-primary font-medium min-w-[70px] text-center">
            {pageNumber} / {numPages || '--'}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1.5 rounded bg-bg-surface text-text-primary hover:bg-bg-primary disabled:opacity-50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeScale(-0.25)}
            className="p-1.5 rounded bg-bg-surface text-text-primary hover:bg-bg-primary transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-text-primary font-medium w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => changeScale(0.25)}
            className="p-1.5 rounded bg-bg-surface text-text-primary hover:bg-bg-primary transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="flex-1 overflow-auto flex justify-center pt-14 pb-6 px-4 bg-bg-primary relative h-full">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-full text-text-muted mt-20">
              <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mb-4" />
              <p className="text-[13px]">Loading document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full text-risk-high mt-20 p-6 text-center">
              <p className="font-medium mb-2">Failed to load PDF</p>
              <p className="text-[13px] text-text-muted max-w-sm">
                Make sure your Supabase Storage bucket has CORS configured correctly to allow GET requests from this origin.
              </p>
            </div>
          }
          className="pdf-document"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="shadow-lg border border-border mt-2"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
