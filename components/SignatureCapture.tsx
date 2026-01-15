import React, { useRef, useState, useEffect } from 'react';

interface SignatureCaptureProps {
  title?: string;
  description?: string;
  onSave: (base64: string) => void;
  onCancel: () => void;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({ 
  title = "Xác nhận chữ ký", 
  description = "Người bệnh ký tên xác nhận", 
  onSave, 
  onCancel 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Initialize Canvas with High DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual size in memory
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Scale context
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
            ctx.lineJoin = 'round';
        }

        // Set visible size
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault(); // Prevent scrolling
    setIsDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.beginPath();
    ctx?.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.lineTo(pos.x, pos.y);
    ctx?.stroke();
    setHasSignature(true);
  };

  const endDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      ctx.beginPath();
    }
  };

  const handleSave = () => {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl shadow-2xl flex flex-col h-[80vh] sm:h-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        
        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-slate-100 flex flex-col justify-center">
          <div className="bg-white rounded-xl shadow-inner border border-slate-300 relative h-64 w-full touch-none overflow-hidden">
             {!hasSignature && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span className="text-slate-300 font-bold text-2xl uppercase select-none opacity-50">Ký vào đây</span>
                 </div>
             )}
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none block"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex gap-3 bg-white pb-safe">
            <button 
              onClick={handleClear}
              className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition flex items-center gap-2"
            >
              <i className="fa-solid fa-eraser"></i>
              Ký lại
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasSignature}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30 transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-file-signature"></i>
              Xác nhận & Lưu
            </button>
        </div>
      </div>
    </div>
  );
};