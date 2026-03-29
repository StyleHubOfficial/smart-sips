import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pen, Eraser, Undo, Redo, Square, Circle, Minus, Type, Download, Trash2, X, Highlighter, ArrowUpRight, Maximize2, Minimize2, Sparkles, MousePointer2 } from 'lucide-react';

interface WhiteboardProps {
  onClose?: () => void;
  className?: string;
  initialData?: ImageData;
  onSave?: (data: ImageData) => void;
  theme?: 'dark' | 'light' | 'grid' | 'transparent';
}

export default function Whiteboard({ onClose, className = '', initialData, onSave, theme: initialTheme = 'dark' }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pointer' | 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'selection-erase' | 'laser'>('pen');
  const [eraserMode, setEraserMode] = useState<'pixel' | 'stroke' | 'lasso' | 'all'>('pixel');
  const [showEraserMenu, setShowEraserMenu] = useState(false);
  const [lassoPath, setLassoPath] = useState<{x: number, y: number}[]>([]);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeProgress, setWipeProgress] = useState(0);
  const [laserPath, setLaserPath] = useState<{x: number, y: number}[]>([]);
  const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [color, setColor] = useState('#00F0FF');
  const [lineWidth, setLineWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'grid' | 'transparent'>(initialTheme);

  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const getBackgroundStyle = () => {
    switch (theme) {
      case 'light': return 'bg-white';
      case 'grid': return 'bg-white bg-[size:20px_20px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]';
      case 'transparent': return 'bg-transparent';
      default: return 'bg-[#1a1b26]';
    }
  };

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

    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setIsWiping(true);
    let p = 0;
    const animate = () => {
      p += 0.05;
      if (p >= 1) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveState();
        setIsWiping(false);
        setWipeProgress(0);
      } else {
        ctx.putImageData(snap, 0, 0);
        ctx.clearRect(0, 0, canvas.width * p, canvas.height);
        setWipeProgress(p);
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
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
    if (tool === 'pointer') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const pos = getPos(e);
    setStartPos(pos);
    setCursorPos(pos);
    setIsDrawing(true);
    
    // Take snapshot for shape drawing
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    if (tool === 'pen' || tool === 'highlighter' || tool === 'selection-erase' || tool === 'laser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (tool === 'laser') {
        setLaserPath([{x: pos.x, y: pos.y}]);
      }
    } else if (tool === 'eraser') {
      if (eraserMode === 'all') {
        setIsWiping(true);
        setWipeProgress(0);
        return;
      } else if (eraserMode === 'lasso') {
        setLassoPath([pos]);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      } else {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
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
    if (!isDrawing || tool === 'pointer') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx || !snapshot) return;

    const pos = getPos(e);
    setCursorPos(pos);

    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.globalAlpha = tool === 'highlighter' ? 0.3 : 1.0;
    ctx.globalCompositeOperation = 'source-over';

    if (tool === 'pen' || tool === 'highlighter' || tool === 'laser') {
      if (tool === 'laser') {
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff4444';
        setLaserPath(prev => [...prev, {x: pos.x, y: pos.y}]);
      }
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    } else if (tool === 'eraser') {
      if (eraserMode === 'all') {
        if (isWiping) {
          const progress = Math.max(0, Math.min(1, (pos.x - startPos.x) / canvas.width));
          setWipeProgress(progress);
          ctx.putImageData(snapshot, 0, 0);
          ctx.clearRect(0, 0, canvas.width * progress, canvas.height);
        }
        return;
      } else if (eraserMode === 'lasso') {
        ctx.putImageData(snapshot, 0, 0);
        setLassoPath(prev => [...prev, pos]);
        ctx.beginPath();
        if (lassoPath.length > 0) {
          ctx.moveTo(lassoPath[0].x, lassoPath[0].y);
          for (let i = 1; i < lassoPath.length; i++) {
            ctx.lineTo(lassoPath[i].x, lassoPath[i].y);
          }
        }
        ctx.lineTo(pos.x, pos.y);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        return;
      } else {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = eraserMode === 'stroke' ? lineWidth * 15 : lineWidth * 8;
        ctx.shadowBlur = eraserMode === 'stroke' ? 15 : 8;
        ctx.shadowColor = 'black';
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = 'source-over'; // Reset immediately
      }
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
      
      if (tool === 'eraser') {
        if (eraserMode === 'all' && isWiping) {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (wipeProgress > 0.4) {
            if (canvas && ctx && snapshot) {
              let p = wipeProgress;
              const animate = () => {
                p += 0.05;
                if (p >= 1) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  saveState();
                  setIsWiping(false);
                  setWipeProgress(0);
                } else {
                  ctx.putImageData(snapshot, 0, 0);
                  ctx.clearRect(0, 0, canvas.width * p, canvas.height);
                  setWipeProgress(p);
                  requestAnimationFrame(animate);
                }
              };
              requestAnimationFrame(animate);
            }
          } else {
            if (canvas && ctx && snapshot) {
              ctx.putImageData(snapshot, 0, 0);
            }
            setIsWiping(false);
            setWipeProgress(0);
          }
          return;
        } else if (eraserMode === 'lasso') {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx && snapshot && lassoPath.length > 0) {
            ctx.putImageData(snapshot, 0, 0);
            ctx.beginPath();
            ctx.moveTo(lassoPath[0].x, lassoPath[0].y);
            for (let i = 1; i < lassoPath.length; i++) {
              ctx.lineTo(lassoPath[i].x, lassoPath[i].y);
            }
            ctx.closePath();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            saveState();
            setLassoPath([]);
          }
          return;
        }
      }

      if (tool !== 'laser') {
        saveState();
      } else {
        // Clear laser after a delay
        if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
        laserTimeoutRef.current = setTimeout(() => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx && historyStep >= 0) {
            ctx.putImageData(history[historyStep], 0, 0);
          } else if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          setLaserPath([]);
        }, 1000);
      }
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
      className={`flex flex-col h-full ${theme === 'transparent' ? 'bg-transparent' : 'bg-[#1a1b26]'} rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''} ${tool === 'pointer' ? 'pointer-events-none' : ''} ${className}`}
    >
      {/* Canvas Area */}
      <div className={`flex-1 relative ${tool === 'pointer' ? '' : 'cursor-none touch-none'} ${getBackgroundStyle()}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={() => { stopDrawing(); setCursorPos({x: -100, y: -100}); }}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />

        {/* Custom Cursor for Eraser/Pen feedback */}
        {!isWiping && tool !== 'pointer' && (
          <div 
            className="absolute pointer-events-none z-40 rounded-full border border-white/30 bg-white/10"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              width: tool === 'eraser' ? (eraserMode === 'stroke' ? lineWidth * 15 : lineWidth * 8) : lineWidth,
              height: tool === 'eraser' ? (eraserMode === 'stroke' ? lineWidth * 15 : lineWidth * 8) : lineWidth,
              transform: 'translate(-50%, -50%)',
              display: cursorPos.x < 0 ? 'none' : 'block'
            }}
          />
        )}
        
        {isWiping && (
          <div 
            className="absolute top-0 bottom-0 left-0 border-r-2 border-[#00F0FF] shadow-[5px_0_15px_rgba(0,240,255,0.5)] z-50 pointer-events-none"
            style={{ width: `${wipeProgress * 100}%` }}
          />
        )}
        {tool === 'eraser' && eraserMode === 'all' && !isWiping && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 text-white/80 pointer-events-none animate-pulse">
            Slide from left to right to clear entire board
          </div>
        )}
        
        {isFullscreen && (
          <div className="absolute top-4 right-4 pointer-events-none">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white/60">
              Smart Panel Mode Active • High Precision Drawing
            </div>
          </div>
        )}
      </div>

      {/* Toolbar (Shifted to Bottom, higher to avoid nav bar) */}
      <div className="absolute bottom-28 left-4 right-4 flex items-center justify-between p-3 bg-black/60 border border-white/10 backdrop-blur-md rounded-2xl z-10 pointer-events-auto">
        <div className="flex items-center gap-1 flex-wrap overflow-visible pr-4">
          <button onClick={() => setTool('pointer')} className={`p-2 rounded-lg transition-colors ${tool === 'pointer' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Pointer (Interact with background)">
            <MousePointer2 className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <button onClick={() => setTool('pen')} className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Pen">
            <Pen className="w-5 h-5" />
          </button>
          <button onClick={() => {
            setTheme(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'grid' : prev === 'grid' ? 'transparent' : 'dark');
          }} className={`p-2 rounded-lg transition-colors ${theme === 'transparent' ? 'text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Toggle Theme">
            <Sparkles className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('highlighter')} className={`p-2 rounded-lg transition-colors ${tool === 'highlighter' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:bg-white/5'}`} title="Highlighter">
            <Highlighter className="w-5 h-5" />
          </button>
          
          {/* Advanced Eraser */}
          <div className="relative flex items-center">
            <button 
              onClick={() => {
                if (tool === 'eraser') {
                  setShowEraserMenu(!showEraserMenu);
                } else {
                  setTool('eraser');
                  setShowEraserMenu(false);
                }
              }} 
              className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} 
              title="Eraser (Click again for options)"
            >
              <Eraser className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showEraserMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-2 flex flex-col bg-[#0f172a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 min-w-[160px]"
                >
                  <button onClick={() => { setTool('eraser'); setEraserMode('pixel'); setLineWidth(5); setShowEraserMenu(false); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div> Pixel Eraser
                  </button>
                  <button onClick={() => { setTool('eraser'); setEraserMode('stroke'); setShowEraserMenu(false); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap flex items-center gap-2">
                    <Minus className="w-3 h-3" /> Stroke Eraser
                  </button>
                  <button onClick={() => { setTool('eraser'); setEraserMode('lasso'); setShowEraserMenu(false); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap flex items-center gap-2">
                    <Circle className="w-3 h-3 border-dashed" /> Lasso Eraser
                  </button>
                  <button onClick={() => { setTool('eraser'); setEraserMode('all'); setShowEraserMenu(false); }} className="px-4 py-2 text-xs text-red-400 hover:bg-red-400/10 text-left whitespace-nowrap border-t border-white/5 flex items-center gap-2">
                    <Trash2 className="w-3 h-3" /> Slide to Erase All
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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

