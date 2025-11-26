
import React, { useState, useRef, useEffect } from 'react';

interface ImageUploaderProps {
  onImageUpload: (base64: string) => void;
  onMaskChange?: (base64: string | null) => void;
  currentImage: string | null;
  isDrawingMode: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  onMaskChange, 
  currentImage, 
  isDrawingMode 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset mask when image changes or drawing mode is disabled
  useEffect(() => {
    if (!isDrawingMode || !currentImage) {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            if (onMaskChange) onMaskChange(null);
        }
    }
  }, [currentImage, isDrawingMode]);

  // Initialize canvas size to match image natural size
  useEffect(() => {
    if (currentImage && imageRef.current && canvasRef.current) {
        const img = imageRef.current;
        const canvas = canvasRef.current;
        
        // Wait for image to load to get dimensions
        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
        };
    }
  }, [currentImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      onImageUpload(result);
    };
    reader.readAsDataURL(file);
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode || !canvasRef.current) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (!isDrawingMode) return;
    setIsDrawing(false);
    saveMask();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawingMode || !canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate position relative to the canvas (which matches image natural size)
    // We need to map client coordinates to the displayed image size, then to natural size
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    // Scale factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize * scaleX; // Scale brush size
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'white';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const saveMask = () => {
    if (canvasRef.current && onMaskChange) {
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        
        if (tCtx) {
            // Fill black
            tCtx.fillStyle = 'black';
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            // Draw the drawing (white)
            tCtx.drawImage(canvas, 0, 0);
            onMaskChange(tempCanvas.toDataURL('image/png'));
        }
    }
  };

  const clearMask = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        if (onMaskChange) onMaskChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Brush Controls Toolbar - Outside the image area */}
      {isDrawingMode && currentImage && (
        <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-2 border border-slate-600">
            <div className="flex items-center gap-4">
                <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Brush Size</label>
                <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-32 h-1.5 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
            <button 
                onClick={clearMask}
                className="text-xs bg-slate-600 hover:bg-red-500/20 hover:text-red-300 text-white px-3 py-1 rounded-md border border-slate-500 hover:border-red-500/50 transition-colors flex items-center gap-1"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Clear Mask
            </button>
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative w-full h-96 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 overflow-hidden select-none ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : isDrawingMode ? 'border-indigo-500/50 bg-slate-900' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {currentImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black/20">
            <img
              ref={imageRef}
              src={currentImage}
              alt="Original Upload"
              className="max-w-full max-h-full object-contain z-10 pointer-events-none"
            />
            
            {/* Canvas Overlay for Drawing Mask */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-20 touch-none max-w-full max-h-full m-auto object-contain ${isDrawingMode ? 'cursor-crosshair' : 'pointer-events-none'}`}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
            />

            {/* Mask Hint */}
            {isDrawingMode && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 text-xs text-white/90 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full pointer-events-none border border-white/10">
                    Paint over areas to edit
                </div>
            )}
          </div>
        ) : (
          <div className="text-center p-6 z-10 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-300 text-lg font-medium">Drop your image here</p>
            <p className="text-slate-500 text-sm mt-1">or click to browse</p>
          </div>
        )}

        {!currentImage && (
            <input
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            onChange={handleFileChange}
            title=" " 
            />
        )}
        
        {currentImage && !isDrawingMode && (
             <div className="absolute bottom-4 right-4 z-30">
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
                    }}
                    className="bg-slate-900/80 hover:bg-black text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-slate-700 transition-colors">
                    Replace Image
                 </button>
                 <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
             </div>
        )}
      </div>
      
      <div className="text-center">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            {isDrawingMode ? 'Draw Mask' : 'Source Image'}
        </span>
      </div>
    </div>
  );
};

export default ImageUploader;
