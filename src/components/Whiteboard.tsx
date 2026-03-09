import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Pen, Eraser, Undo, Redo, Square, Circle, Minus, Type, Download, Trash2, X } from 'lucide-react';

interface WhiteboardProps {
  onClose?: () => void;
  className?: string;
}

export default function Whiteboard({ onClose, className = '' }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'text'>('pen');
  const [color, setColor] = useState('#00F0FF');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      // Only resize if dimensions actually changed to prevent clearing
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        // Save current state before resize
        const ctx = canvas.getContext('2d');
        let tempImageData: ImageData | null = null;
        if (ctx && canvas.width > 0 && canvas.height > 0) {
          tempImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        canvas.width = rect.width;
        canvas.height = rect.height;

        // Restore state after resize
        if (ctx && tempImageData) {
          ctx.putImageData(tempImageData, 0, 0);
        } else if (ctx) {
          // Initial background
          ctx.fillStyle = 'transparent';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          saveState();
        }
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      setHistoryStep(historyStep - 1);
      ctx.putImageData(history[historyStep - 1], 0, 0);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      setHistoryStep(historyStep + 1);
      ctx.putImageData(history[historyStep + 1], 0, 0);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    
    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        ctx.font = `${lineWidth * 5}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, clientX - rect.left, clientY - rect.top);
        saveState();
      }
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.strokeStyle = tool === 'eraser' ? '#1a1b26' : color; // Assuming dark background
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 3 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      
      ctx.stroke();
    }
    // For shapes (rect, circle, line), we'd typically need a temporary canvas or redraw loop.
    // For simplicity in this implementation, we'll stick to freehand drawing and text.
    // A full implementation would use a library like Fabric.js or Konva for complex shapes.
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Create a temporary canvas to draw background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#1a1b26'; // Match background
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      
      const link = document.createElement('a');
      link.download = 'whiteboard-explanation.png';
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#1a1b26] rounded-2xl border border-white/10 overflow-hidden shadow-2xl ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-black/40 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setTool('pen')} className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Pen">
            <Pen className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Eraser">
            <Eraser className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('text')} className={`p-2 rounded-lg transition-colors ${tool === 'text' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Text">
            <Type className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            title="Color"
          />
          
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={lineWidth} 
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            className="w-24 accent-[#00F0FF]"
            title="Stroke Thickness"
          />
          
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          
          <button onClick={undo} disabled={historyStep <= 0} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-50 transition-colors" title="Undo">
            <Undo className="w-5 h-5" />
          </button>
          <button onClick={redo} disabled={historyStep >= history.length - 1} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-50 transition-colors" title="Redo">
            <Redo className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={clear} className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors" title="Clear All">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={download} className="p-2 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors" title="Download">
            <Download className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors" title="Close Whiteboard">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 relative cursor-crosshair touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
}
