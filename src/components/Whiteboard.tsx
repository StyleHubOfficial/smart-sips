import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Pen, Eraser, Undo, Redo, Square, Circle, Minus, Type, Download, Trash2, X, Highlighter, ArrowUpRight, Maximize2, Minimize2 } from 'lucide-react';

interface WhiteboardProps {
  onClose?: () => void;
  className?: string;
  initialData?: ImageData;
  onSave?: (data: ImageData) => void;
}

export default function Whiteboard({ onClose, className = '', initialData, onSave }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'selection-erase'>('pen');
  const [color, setColor] = useState('#00F0FF');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        const tempImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.putImageData(tempImageData, 0, 0);
      }
    };

    resizeCanvas();
    
    if (initialData) {
      ctx.putImageData(initialData, 0, 0);
    }

    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [initialData]);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    
    if (onSave) {
      onSave(imageData);
    }
  };

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      ctx.putImageData(history[prevStep], 0, 0);
      if (onSave) onSave(history[prevStep]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      ctx.putImageData(history[nextStep], 0, 0);
      if (onSave) onSave(history[nextStep]);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);
    
    // Take snapshot for shape drawing
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser' || tool === 'selection-erase') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        ctx.font = `${lineWidth * 5}px Inter, sans-serif`;
        ctx.fillStyle = color;
        ctx.fillText(text, pos.x, pos.y);
        saveState();
      }
      setIsDrawing(false);
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx || !snapshot) return;

    const pos = getPos(e);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = tool === 'highlighter' ? 0.3 : 1.0;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      if (tool === 'eraser') ctx.lineWidth = lineWidth * 5;
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'selection-erase') {
      ctx.putImageData(snapshot, 0, 0);
      ctx.fillStyle = '#1a1b26';
      ctx.fillRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else {
      // For shapes, restore snapshot first
      ctx.putImageData(snapshot, 0, 0);
      
      if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(ctx, startPos.x, startPos.y, pos.x, pos.y);
      }
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
      setSnapshot(null);
    }
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#1a1b26';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      
      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full bg-[#1a1b26] rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''} ${className}`}
    >
      {/* Canvas Area */}
      <div className="flex-1 relative cursor-crosshair touch-none bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]">
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
        
        {isFullscreen && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white/60">
              Smart Panel Mode Active • High Precision Drawing
            </div>
          </div>
        )}
      </div>

      {/* Toolbar (Shifted to Bottom) */}
      <div className="flex items-center justify-between p-3 bg-black/40 border-t border-white/10 backdrop-blur-md z-10">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pr-4">
          <button onClick={() => setTool('pen')} className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Pen">
            <Pen className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('highlighter')} className={`p-2 rounded-lg transition-colors ${tool === 'highlighter' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-white/5'}`} title="Highlighter">
            <Highlighter className="w-5 h-5" />
          </button>
          
          {/* Advanced Eraser */}
          <div className="relative group flex items-center">
            <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Eraser">
              <Eraser className="w-5 h-5" />
            </button>
            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col bg-[#0f172a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <button onClick={() => { setTool('eraser'); setLineWidth(20); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap">
                Large Eraser
              </button>
              <button onClick={() => { setTool('eraser'); setLineWidth(5); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap">
                Small Eraser
              </button>
              <button onClick={() => setTool('selection-erase')} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap">
                Selection Erase
              </button>
              <button onClick={clear} className="px-4 py-2 text-xs text-red-400 hover:bg-red-400/10 text-left whitespace-nowrap border-t border-white/5">
                Erase All
              </button>
            </div>
          </div>

          <button onClick={() => setTool('text')} className={`p-2 rounded-lg transition-colors ${tool === 'text' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Text">
            <Type className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1"></div>

          <button onClick={() => setTool('rect')} className={`p-2 rounded-lg transition-colors ${tool === 'rect' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Rectangle">
            <Square className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('circle')} className={`p-2 rounded-lg transition-colors ${tool === 'circle' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Circle">
            <Circle className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('line')} className={`p-2 rounded-lg transition-colors ${tool === 'line' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Line">
            <Minus className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('arrow')} className={`p-2 rounded-lg transition-colors ${tool === 'arrow' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Arrow">
            <ArrowUpRight className="w-5 h-5" />
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          
          <div className="flex items-center gap-2 px-2">
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
              className="w-20 accent-[#00F0FF]"
              title="Stroke Thickness"
            />
          </div>
          
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          
          <button onClick={undo} disabled={historyStep <= 0} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-50 transition-colors" title="Undo">
            <Undo className="w-5 h-5" />
          </button>
          <button onClick={redo} disabled={historyStep >= history.length - 1} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 disabled:opacity-50 transition-colors" title="Redo">
            <Redo className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={toggleFullscreen} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors" title="Toggle Fullscreen">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button onClick={clear} className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors" title="Clear All">
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={download} className="p-2 rounded-lg text-green-400 hover:bg-green-400/10 transition-colors" title="Download">
            <Download className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors ml-1" title="Close Whiteboard">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

