import { useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, RotateCw, Maximize, Minimize, Search, ChevronDown } from 'lucide-react';
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
  const [inputPage, setInputPage] = useState('1');
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Reset page and rotation when URL changes
  useEffect(() => {
    setPageNumber(1);
    setInputPage('1');
    setRotation(0);
  }, [url]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
    setInputPage('1');
  }

  const changePage = (offset) => {
    setPageNumber((prevPageNumber) => {
      const newPage = Math.min(Math.max(1, prevPageNumber + offset), numPages || 1);
      setInputPage(newPage.toString());
      return newPage;
    });
  };

  const handlePageInput = (e) => {
    setInputPage(e.target.value);
  };

  const submitPageInput = () => {
    const newPage = parseInt(inputPage, 10);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    } else {
      setInputPage(pageNumber.toString());
    }
  };

  const handlePageKeyDown = (e) => {
    if (e.key === 'Enter') {
      submitPageInput();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleZoomChange = (e) => {
    setScale(parseFloat(e.target.value));
  };

  if (!url) return null;

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col relative bg-[#f2f2f2] overflow-hidden ${isFullscreen ? 'w-screen h-screen' : 'h-full w-full'}`}
    >
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
        
        {/* Pagination Left */}
        <div className="flex items-center gap-2 text-gray-600">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 text-[14px]">
            <input
              type="text"
              value={inputPage}
              onChange={handlePageInput}
              onBlur={submitPageInput}
              onKeyDown={handlePageKeyDown}
              className="w-10 text-center border border-gray-200 rounded py-0.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-500">/ {numPages || '--'}</span>
          </div>

          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Controls Right */}
        <div className="flex items-center gap-4 text-gray-600">
          <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
            <Search className="w-4 h-4" />
          </button>
          
          <div className="flex items-center text-[14px] font-medium relative group">
            <select 
              value={scale} 
              onChange={handleZoomChange}
              className="appearance-none bg-transparent hover:bg-gray-100 py-1 pl-2 pr-6 rounded cursor-pointer focus:outline-none"
            >
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1.0">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2.0">200%</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-gray-400" />
          </div>

          <button 
            onClick={() => setRotation(prev => (prev + 90) % 360)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Rotate 90 degrees"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div className="flex-1 overflow-auto flex justify-center pt-20 pb-10 px-4 relative h-full">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-full text-gray-500 mt-20">
              <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-[13px]">Loading document...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full text-red-500 mt-20 p-6 text-center">
              <p className="font-medium mb-2">Failed to load PDF</p>
              <p className="text-[13px] text-gray-500 max-w-sm">
                Make sure your Supabase Storage bucket has CORS configured correctly to allow GET requests from this origin.
              </p>
            </div>
          }
          className="pdf-document"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            className="shadow-xl"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
