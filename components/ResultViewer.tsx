import React from 'react';

interface ResultViewerProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ imageUrl, isLoading, error }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="relative w-full h-96 border-2 border-slate-700 rounded-2xl flex flex-col items-center justify-center bg-slate-900/30 overflow-hidden">
        
        {isLoading ? (
            <div className="flex flex-col items-center space-y-4 z-10">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-indigo-300 font-medium animate-pulse">AI is crafting the look...</p>
            </div>
        ) : error ? (
            <div className="text-center p-6 max-w-xs z-10">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-400 font-medium">Generation Failed</p>
                <p className="text-red-500/70 text-sm mt-2">{error}</p>
            </div>
        ) : imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="AI Generated Result"
              className="w-full h-full object-contain z-10"
            />
            <a 
                href={imageUrl} 
                download="fashion-ai-edit.png"
                className="absolute bottom-4 right-4 z-20 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center space-x-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download</span>
            </a>
          </>
        ) : (
          <div className="text-center p-6 z-10 opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <p className="text-slate-300 font-medium">Result will appear here</p>
          </div>
        )}
      </div>
      <div className="mt-2 text-center">
        <span className="text-xs text-indigo-400 uppercase tracking-wider font-semibold">
            {isLoading ? 'Processing...' : 'Generated Output'}
        </span>
      </div>
    </div>
  );
};

export default ResultViewer;
