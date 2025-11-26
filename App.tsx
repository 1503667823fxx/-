
import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ResultViewer from './components/ResultViewer';
import PoseSelector from './components/PoseSelector';
import { editImage } from './services/geminiService';
import { EditMode } from './types';

const DEFAULT_PROMPT = "给我换位三七分、大波浪，头发别在耳后的美国白人女性模特；去掉耳环、手环和眼镜；换个适配风格的打底衣换短裤和白色深U口衬衫；换个经典展示动作，保留原披肩衣服的高饱和度、高鲜艳度、高对比度、金属质感和高反光度";

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [selectedPose, setSelectedPose] = useState<string | null>(null);
  const [mode, setMode] = useState<EditMode>('general');
  const [prompt, setPrompt] = useState<string>(DEFAULT_PROMPT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (base64: string) => {
    setOriginalImage(base64);
    setGeneratedImage(null);
    setMaskImage(null);
    setError(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }

    // Prompt check is skipped for upscale as it's automatic
    if (mode !== 'upscale' && !prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    if (mode === 'inpainting' && !maskImage) {
        setError("Please draw a mask on the image for inpainting.");
        return;
    }

    if (mode === 'pose' && !selectedPose) {
        setError("Please select a target pose.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine additional image based on mode
      let additionalImage = null;
      if (mode === 'inpainting') additionalImage = maskImage;
      if (mode === 'pose') additionalImage = selectedPose;

      const resultImage = await editImage(originalImage, prompt, mode, additionalImage);
      setGeneratedImage(resultImage);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, mode, maskImage, selectedPose]);

  return (
    <div className="min-h-screen bg-[#0f0f13] text-slate-200 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f0f13]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Fashion<span className="text-indigo-500">AI</span> Studio</h1>
          </div>
          <a href="https://ai.google.dev" target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-500 hover:text-indigo-400 transition-colors">
            Powered by Gemini 2.5
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mode Selector */}
        <div className="mb-8 flex justify-center w-full overflow-x-auto">
            <div className="bg-slate-800/50 p-1 rounded-xl flex border border-slate-700 whitespace-nowrap">
                <button 
                    onClick={() => setMode('general')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'general' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Global Edit
                </button>
                <button 
                    onClick={() => setMode('inpainting')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'inpainting' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Inpainting
                </button>
                <button 
                    onClick={() => setMode('pose')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'pose' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Pose Control
                </button>
                <button 
                    onClick={() => setMode('upscale')}
                    className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${mode === 'upscale' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    Upscale HD
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column: Inputs */}
          <div className="flex flex-col space-y-6">
            
            {/* Step 1: Upload & Interaction */}
            <section className="bg-slate-800/30 rounded-2xl p-1 border border-slate-800">
                <div className="p-4 pb-0 flex justify-between items-center">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">1</span>
                        {mode === 'inpainting' ? 'Source & Mask' : 'Source Image'}
                    </h2>
                </div>
                <div className="p-4 pt-2">
                    <ImageUploader 
                        onImageUpload={handleImageUpload} 
                        onMaskChange={setMaskImage}
                        currentImage={originalImage} 
                        isDrawingMode={mode === 'inpainting'}
                    />
                </div>
            </section>

            {/* Step 1.5: Pose Selection (Only visible in Pose mode) */}
            {mode === 'pose' && (
                <section className="bg-slate-800/30 rounded-2xl p-1 border border-slate-800">
                    <div className="p-4 pb-0">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">P</span>
                            Select Skeleton Pose
                        </h2>
                    </div>
                    <div className="p-4 pt-2">
                        <PoseSelector selectedPose={selectedPose} onSelectPose={setSelectedPose} />
                    </div>
                </section>
            )}

            {/* Step 2: Prompt (Hidden in Upscale mode) */}
            {mode !== 'upscale' ? (
                <section className="bg-slate-800/30 rounded-2xl p-1 border border-slate-800 flex flex-col flex-grow">
                    <div className="p-4 pb-0">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">2</span>
                            Instruction
                        </h2>
                    </div>
                    <div className="p-4 pt-2 flex-grow flex flex-col">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full flex-grow min-h-[150px] bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none leading-relaxed shadow-inner transition-all"
                            placeholder={mode === 'inpainting' ? "Describe what should appear in the masked area..." : "Describe the changes you want to make..."}
                        />
                        <div className="mt-2 text-xs text-slate-500 flex justify-between">
                            <span>{mode === 'inpainting' ? 'Only masked areas will change.' : mode === 'pose' ? 'Model will adopt selected pose.' : 'Be specific about textures.'}</span>
                            <span>{prompt.length} chars</span>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="bg-slate-800/30 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center items-center text-center h-40">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <h3 className="text-slate-200 font-semibold">AI Upscale Enhancement</h3>
                    <p className="text-slate-500 text-sm mt-1">Automatically enhance resolution, sharpness, and details.</p>
                </section>
            )}
          
            {/* Action Button */}
            <button
                onClick={handleGenerate}
                disabled={isLoading || !originalImage}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3
                    ${isLoading || !originalImage 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
                    }`}
            >
                {isLoading ? (
                   <>Processing...</>
                ) : (
                    <>
                       {mode === 'upscale' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                       ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                       )}
                       {mode === 'inpainting' ? 'Generate Inpainting' : mode === 'pose' ? 'Transfer Pose' : mode === 'upscale' ? 'Upscale to 4K' : 'Generate Transformation'}
                    </>
                )}
            </button>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col h-full">
            <section className="bg-slate-800/30 rounded-2xl p-1 border border-slate-800 h-full flex flex-col">
                 <div className="p-4 pb-0">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">3</span>
                        Result
                    </h2>
                </div>
                <div className="p-4 pt-2 flex-grow">
                     <ResultViewer 
                        imageUrl={generatedImage} 
                        isLoading={isLoading} 
                        error={error} 
                    />
                </div>
            </section>
            
            {/* Tips / Legend */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-300">Inpainting</p>
                        <p className="text-[10px] text-slate-500">Mask & edit specific areas</p>
                    </div>
                 </div>
                 <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-300">Pose Control</p>
                        <p className="text-[10px] text-slate-500">Match skeleton structure</p>
                    </div>
                 </div>
                 <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-pink-900/50 flex items-center justify-center text-pink-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-300">HD Upscale</p>
                        <p className="text-[10px] text-slate-500">Enhance details & clarity</p>
                    </div>
                 </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
