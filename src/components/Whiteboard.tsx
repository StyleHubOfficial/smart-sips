import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { AIGeneratorModal } from './AIGeneratorModal';
import { 
  Pen, Eraser, Undo, Redo, Square, Circle, Minus, Type, Download, Trash2, X, Highlighter, 
  ArrowUpRight, Maximize2, Minimize2, Sparkles, MousePointer2, Wand2, ScanText, Scissors,
  Layers, Palette, Settings, Share2, Save, MoreVertical, ChevronUp, ChevronDown,
  Monitor, Smartphone, Tablet, Layout, Grid, Image as ImageIcon, FileText,
  MousePointer, Lasso, Square as RectIcon, Circle as CircleIcon, Type as TextIcon,
  Eraser as EraserIcon, Highlighter as HighlighterIcon, ArrowRight, MousePointerClick,
  Hand, ZoomIn, ZoomOut, Search
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  tool: string;
  points: Point[];
  color: string;
  lineWidth: number;
  type: 'path' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'lasso';
  text?: string;
  startPos?: Point;
  endPos?: Point;
  opacity?: number;
  rotation?: number;
  scale?: { x: number, y: number };
  center?: Point;
  startTime?: number;
}

interface WhiteboardProps {
  onClose?: () => void;
  className?: string;
  initialData?: string; // Changed to string (base64 or JSON)
  onSave?: (data: string) => void;
  theme?: 'dark' | 'light' | 'grid' | 'transparent';
  backgroundImage?: string;
}

export default function Whiteboard({ onClose, className = '', initialData, onSave, theme: initialTheme = 'dark', backgroundImage }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'select' | 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'laser' | 'lasso' | 'smart-pen' | 'ai-ocr' | 'pan'>('pen');
  const [eraserMode, setEraserMode] = useState<'pixel' | 'stroke' | 'all' | 'lasso-stroke' | 'lasso-pixel'>('pixel');
  
  // Pan and Zoom state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  const [showEraserMenu, setShowEraserMenu] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeProgress, setWipeProgress] = useState(0);
  const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [color, setColor] = useState('#00F0FF');
  const [lineWidth, setLineWidth] = useState(3);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentPointsRef = useRef<Point[]>([]);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const hasExpired = strokes.some(s => s.tool === 'highlighter' && s.startTime && (now - s.startTime > 7000));
      if (hasExpired) {
        setStrokes(prev => prev.filter(s => !(s.tool === 'highlighter' && s.startTime && (now - s.startTime > 7000))));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [strokes]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [initialSelectedStrokes, setInitialSelectedStrokes] = useState<Stroke[]>([]);
  const [initialBounds, setInitialBounds] = useState<{ minX: number, minY: number, maxX: number, maxY: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'grid' | 'transparent'>(initialTheme);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBackgroundMenu, setShowBackgroundMenu] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'none' | 'grid' | 'dots' | 'lines'>('none');
  const dragControls = useDragControls();
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const laserPathRef = useRef<Point[]>([]);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        bgImageRef.current = img;
        redrawBackground();
      };
      img.src = backgroundImage;
    } else {
      bgImageRef.current = null;
      redrawBackground();
    }
  }, [backgroundImage]);

  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        if (Array.isArray(parsed)) {
          setStrokes(parsed);
          setHistory([parsed]);
          setHistoryStep(0);
        }
      } catch (e) {
        console.error("Failed to parse initial whiteboard data", e);
      }
    }
  }, [initialData]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !bgCanvas || !container) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      [canvas, bgCanvas].forEach(c => {
        // We use a fixed internal resolution of 1920x1080 for consistent coordinates across devices
        c.width = 1920;
        c.height = 1080;
        c.style.width = '100%';
        c.style.height = '100%';
        c.style.objectFit = 'contain';
        const ctx = c.getContext('2d');
        if (ctx) {
          // Reset transform
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
      });
      
      redrawBackground();
      redraw();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen, backgroundImage, theme, backgroundType]);

  const redrawBackground = () => {
    const canvas = bgCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const w = 1920;
    const h = 1080;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    renderBackground(ctx, w / scale, h / scale);

    if (bgImageRef.current) {
      const img = bgImageRef.current;
      const canvasW = w;
      const canvasH = h;
      const imgScale = Math.min(canvasW / img.width, canvasH / img.height);
      const x = (canvasW - img.width * imgScale) / 2;
      const y = (canvasH - img.height * imgScale) / 2;
      ctx.drawImage(img, x, y, img.width * imgScale, img.height * imgScale);
    }

    strokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });

    ctx.restore();
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    ctx.save();
    
    if (stroke.center && (stroke.rotation || stroke.scale)) {
      ctx.translate(stroke.center.x, stroke.center.y);
      if (stroke.rotation) ctx.rotate(stroke.rotation);
      if (stroke.scale) ctx.scale(stroke.scale.x, stroke.scale.y);
      ctx.translate(-stroke.center.x, -stroke.center.y);
    }

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = stroke.opacity || 1;

    if (selectedStrokeIds.includes(stroke.id)) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00F0FF';
    } else if (stroke.tool === 'highlighter' && stroke.startTime) {
      const elapsed = Date.now() - stroke.startTime;
      if (elapsed < 7000) {
        const time = Date.now() / 1000;
        const pulse = (Math.sin(time * 3) + 1) / 2;
        const glow = pulse * 15 + 5;
        ctx.shadowBlur = glow;
        ctx.shadowColor = stroke.color;
        const fadeStart = 5000;
        if (elapsed > fadeStart) {
          const fadeProgress = (elapsed - fadeStart) / (7000 - fadeStart);
          ctx.globalAlpha = (stroke.opacity || 0.3) * (1 - fadeProgress * 0.5);
          ctx.shadowBlur *= (1 - fadeProgress);
        } else {
          ctx.globalAlpha = (stroke.opacity || 0.3) + (pulse * 0.2);
        }
      } else {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = stroke.opacity || 0.3;
      }
    }

    if (stroke.type === 'path' || stroke.type === 'lasso') {
      if (stroke.points.length < 2) {
        ctx.restore();
        return;
      }
      if (stroke.type === 'lasso') {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 1;
      }
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      if (stroke.type === 'lasso') ctx.setLineDash([]);
    } else if (stroke.type === 'rect' && stroke.startPos && stroke.endPos) {
      ctx.strokeRect(stroke.startPos.x, stroke.startPos.y, stroke.endPos.x - stroke.startPos.x, stroke.endPos.y - stroke.startPos.y);
    } else if (stroke.type === 'circle' && stroke.startPos && stroke.endPos) {
      const radius = Math.sqrt(Math.pow(stroke.endPos.x - stroke.startPos.x, 2) + Math.pow(stroke.endPos.y - stroke.startPos.y, 2));
      ctx.arc(stroke.startPos.x, stroke.startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.type === 'line' && stroke.startPos && stroke.endPos) {
      ctx.moveTo(stroke.startPos.x, stroke.startPos.y);
      ctx.lineTo(stroke.endPos.x, stroke.endPos.y);
      ctx.stroke();
    } else if (stroke.type === 'arrow' && stroke.startPos && stroke.endPos) {
      drawArrow(ctx, stroke.startPos.x, stroke.startPos.y, stroke.endPos.x, stroke.endPos.y);
    } else if (stroke.type === 'text' && stroke.startPos && stroke.text) {
      ctx.font = `${stroke.lineWidth * 5}px Inter, sans-serif`;
      ctx.fillStyle = stroke.color;
      ctx.fillText(stroke.text, stroke.startPos.x, stroke.startPos.y);
    }
    ctx.restore();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const w = 1920;
    const h = 1080;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    if (currentStroke) {
      // Use currentPointsRef for live drawing paths to avoid state-driven lag
      if (currentStroke.type === 'path' || currentStroke.type === 'lasso') {
        drawStroke(ctx, { ...currentStroke, points: currentPointsRef.current });
      } else {
        drawStroke(ctx, currentStroke);
      }
    }

    const lPath = laserPathRef.current;
    if (lPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff4444';
      ctx.moveTo(lPath[0].x, lPath[0].y);
      lPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();

    if (selectedStrokeIds.length > 0) {
      const selectedStrokes = strokes.filter(s => selectedStrokeIds.includes(s.id));
      if (selectedStrokes.length > 0) {
        drawSelectionHandles(ctx, selectedStrokes);
      }
    }
  };

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, selectedStrokes: Stroke[]) => {
    if (selectedStrokes.length === 0) return;

    // Calculate combined bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedStrokes.forEach(stroke => {
      const bounds = getStrokeBounds(stroke);
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    });

    const padding = 15;
    const handleSize = 10;
    
    ctx.save();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
    
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const x = minX - padding;
    const y = minY - padding;

    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Handles
    ctx.fillStyle = '#00F0FF';
    
    // Resize handles (Corners)
    const handles = [
      { x: x, y: y, id: 'tl' },
      { x: x + width, y: y, id: 'tr' },
      { x: x, y: y + height, id: 'bl' },
      { x: x + width, y: y + height, id: 'br' },
    ];

    handles.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleSize/2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Rotation handle
    const rotX = x + width / 2;
    const rotY = y - 40;
    ctx.beginPath();
    ctx.moveTo(rotX, y);
    ctx.lineTo(rotX, rotY);
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(rotX, rotY, handleSize/2 + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Multi-select indicator
    if (selectedStrokes.length > 1) {
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText(`${selectedStrokes.length} items selected`, x, y - 10);
    }

    ctx.restore();
  };

  const getStrokeBounds = (stroke: Stroke) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    if (stroke.type === 'path' || stroke.type === 'lasso') {
      stroke.points.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    } else if (stroke.startPos && stroke.endPos) {
      minX = Math.min(stroke.startPos.x, stroke.endPos.x);
      maxX = Math.max(stroke.startPos.x, stroke.endPos.x);
      minY = Math.min(stroke.startPos.y, stroke.endPos.y);
      maxY = Math.max(stroke.startPos.y, stroke.endPos.y);
    } else if (stroke.startPos) {
      minX = stroke.startPos.x;
      maxX = stroke.startPos.x + 100;
      minY = stroke.startPos.y - 20;
      maxY = stroke.startPos.y;
    }
    
    return { minX, maxX, minY, maxY };
  };

  const getStrokeCenter = (stroke: Stroke) => {
    const bounds = getStrokeBounds(stroke);
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2
    };
  };

  useEffect(() => {
    redrawBackground();
    redraw(); // Ensure main canvas is cleared/updated when strokes change
  }, [strokes, offset, scale, selectedStrokeIds]);

  useEffect(() => {
    let animationFrame: number;
    let lastDrawTime = 0;
    const animate = (time: number) => {
      // Only redraw if we are actively drawing, panning, or have something dynamic (like highlighter pulse)
      // For a smart panel, we want to minimize unnecessary redraws to save CPU/GPU.
      // Since we clear the canvas every frame, we only need to redraw if there's an active stroke, laser, or selection.
      if (isDrawing || isPanning || currentStroke || laserPathRef.current.length > 0 || selectedStrokeIds.length > 0) {
        redraw();
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [currentStroke, selectedStrokeIds, scale, offset, isDrawing, isPanning]);

  const downloadAsImage = () => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Fill background color
    if (theme === 'dark' || theme === 'grid') {
      tempCtx.fillStyle = '#1a1b26';
    } else if (theme === 'light') {
      tempCtx.fillStyle = '#ffffff';
    } else {
      tempCtx.fillStyle = '#000000';
    }
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw background canvas (includes grid and background image and finished strokes)
    tempCtx.drawImage(bgCanvas, 0, 0);

    // Draw main canvas (active stroke if any)
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
  };

  const downloadAsPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Fill background color
    if (theme === 'dark' || theme === 'grid') {
      tempCtx.fillStyle = '#1a1b26';
    } else if (theme === 'light') {
      tempCtx.fillStyle = '#ffffff';
    } else {
      tempCtx.fillStyle = '#000000';
    }
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(bgCanvas, 0, 0);
    tempCtx.drawImage(canvas, 0, 0);

    const imgData = tempCanvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`whiteboard-${Date.now()}.pdf`);
  };

  const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (backgroundType === 'none') return;

    ctx.save();
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;

    if (backgroundType === 'grid') {
      const size = 40;
      for (let x = 0; x <= width; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (backgroundType === 'dots') {
      const size = 30;
      ctx.fillStyle = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      for (let x = 0; x <= width; x += size) {
        for (let y = 0; y <= height; y += size) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (backgroundType === 'lines') {
      const size = 30;
      for (let y = 0; y <= height; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const saveToHistory = (newStrokes: Stroke[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newStrokes);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    if (onSave) onSave(JSON.stringify(newStrokes));
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      setStrokes(history[prevStep]);
      if (onSave) onSave(JSON.stringify(history[prevStep]));
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      setStrokes(history[nextStep]);
      if (onSave) onSave(JSON.stringify(history[nextStep]));
    }
  };

  const clear = () => {
    setIsWiping(true);
    let p = 0;
    const animate = () => {
      p += 0.05;
      if (p >= 1) {
        setStrokes([]);
        saveToHistory([]);
        setIsWiping(false);
        setWipeProgress(0);
      } else {
        setWipeProgress(p);
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  const isPointNearPath = (point: Point, path: Point[], threshold: number) => {
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dist = distToSegment(point, p1, p2);
      if (dist < threshold) return true;
    }
    return false;
  };

  const distToSegment = (p: Point, v: Point, w: Point) => {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 === 0) return Math.sqrt(Math.pow(p.x - v.x, 2) + Math.pow(p.y - v.y, 2));
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt(Math.pow(p.x - (v.x + t * (w.x - v.x)), 2) + Math.pow(p.y - (v.y + t * (w.y - v.y)), 2));
  };

  const findStrokeAt = (pos: Point) => {
    // Search from top to bottom (reverse strokes)
    for (let i = strokes.length - 1; i >= 0; i--) {
      const stroke = strokes[i];
      const threshold = stroke.lineWidth + 5;
      
      if (stroke.type === 'path') {
        if (isPointNearPath(pos, stroke.points, threshold)) return stroke;
      } else if (stroke.type === 'rect' && stroke.startPos && stroke.endPos) {
        const minX = Math.min(stroke.startPos.x, stroke.endPos.x);
        const maxX = Math.max(stroke.startPos.x, stroke.endPos.x);
        const minY = Math.min(stroke.startPos.y, stroke.endPos.y);
        const maxY = Math.max(stroke.startPos.y, stroke.endPos.y);
        if (pos.x >= minX - 5 && pos.x <= maxX + 5 && pos.y >= minY - 5 && pos.y <= maxY + 5) return stroke;
      } else if (stroke.type === 'circle' && stroke.startPos && stroke.endPos) {
        const radius = Math.sqrt(Math.pow(stroke.endPos.x - stroke.startPos.x, 2) + Math.pow(stroke.endPos.y - stroke.startPos.y, 2));
        const dist = Math.sqrt(Math.pow(pos.x - stroke.startPos.x, 2) + Math.pow(pos.y - stroke.startPos.y, 2));
        if (Math.abs(dist - radius) < threshold) return stroke;
      } else if (stroke.type === 'line' && stroke.startPos && stroke.endPos) {
        if (distToSegment(pos, stroke.startPos, stroke.endPos) < threshold) return stroke;
      }
    }
    return null;
  };

  const isPointInPolygon = (point: Point, polygon: Point[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const isStrokeInLasso = (stroke: Stroke, lassoPoints: Point[]) => {
    if (stroke.type === 'path') {
      return stroke.points.some(p => isPointInPolygon(p, lassoPoints));
    } else if (stroke.startPos && stroke.endPos) {
      return isPointInPolygon(stroke.startPos, lassoPoints) || isPointInPolygon(stroke.endPos, lassoPoints);
    }
    return false;
  };

  const recognizeShape = (points: Point[]): Stroke | null => {
    if (points.length < 5) return null;

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    const start = points[0];
    const end = points[points.length - 1];
    const distStartEnd = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

    // Heuristic for Circle
    const isClosed = distStartEnd < Math.max(width, height) * 0.2;
    if (isClosed) {
      const radius = (width + height) / 4;
      // Check if points are roughly at radius distance from center
      let avgDist = 0;
      points.forEach(p => {
        avgDist += Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2));
      });
      avgDist /= points.length;
      
      if (Math.abs(avgDist - radius) < radius * 0.3) {
        return {
          id: Date.now().toString(),
          tool: 'circle',
          type: 'circle',
          points: [],
          color,
          lineWidth,
          startPos: center,
          endPos: { x: center.x + radius, y: center.y }
        };
      }
    }

    // Heuristic for Rectangle
    if (isClosed && width > 20 && height > 20) {
      return {
        id: Date.now().toString(),
        tool: 'rect',
        type: 'rect',
        points: [],
        color,
        lineWidth,
        startPos: { x: minX, y: minY },
        endPos: { x: maxX, y: maxY }
      };
    }

    // Heuristic for Arrow
    if (!isClosed && distStartEnd > 30) {
      // Check if it's a line or arrow
      // For now, let's just make it an arrow if it's long enough
      return {
        id: Date.now().toString(),
        tool: 'arrow',
        type: 'arrow',
        points: [],
        color,
        lineWidth,
        startPos: start,
        endPos: end
      };
    }

    return null;
  };

  const performOCR = async (lassoPoints: Point[]) => {
    const canvas = canvasRef.current;
    if (!canvas || lassoPoints.length < 3) return;

    setIsOCRProcessing(true);
    try {
      // Calculate bounding box of lasso
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      lassoPoints.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      const width = maxX - minX;
      const height = maxY - minY;
      if (width < 10 || height < 10) return;

      // Create a temporary canvas to capture the area
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // Draw the main canvas onto the temp canvas, offset by minX, minY
      tempCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);
      const base64Image = tempCanvas.toDataURL('image/png').split(',')[1];

      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing API Key");
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: [
          { text: "Extract all text from this image. Return ONLY the text found, nothing else. If no text is found, return an empty string." },
          { inlineData: { data: base64Image, mimeType: "image/png" } }
        ]
      });

      const extractedText = response.text?.trim();
      if (extractedText) {
        const newStroke: Stroke = {
          id: 'ocr-' + Date.now(),
          tool: 'text',
          type: 'text',
          points: [],
          color,
          lineWidth: 4,
          startPos: { x: minX, y: minY + 20 },
          text: extractedText
        };
        const newStrokes = [...strokes, newStroke];
        setStrokes(newStrokes);
        saveToHistory(newStrokes);
      }
    } catch (error) {
      console.error("OCR failed:", error);
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    // Calculate scale and offset due to object-fit: contain
    const canvasRatio = 1920 / 1080;
    const rectRatio = rect.width / rect.height;
    let drawWidth = rect.width;
    let drawHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (rectRatio > canvasRatio) {
      drawWidth = rect.height * canvasRatio;
      offsetX = (rect.width - drawWidth) / 2;
    } else {
      drawHeight = rect.width / canvasRatio;
      offsetY = (rect.height - drawHeight) / 2;
    }

    const scaleX = 1920 / drawWidth;
    const scaleY = 1080 / drawHeight;

    return {
      x: ((clientX - rect.left - offsetX) * scaleX - offset.x) / scale,
      y: ((clientY - rect.top - offsetY) * scaleY - offset.y) / scale
    };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) => {
    const headlen = 15;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) {
      e.preventDefault();
    }

    if (tool === 'pan' || (e as React.MouseEvent).button === 1) {
      setIsPanning(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      setLastPanPos({ x: clientX, y: clientY });
      return;
    }

    const pos = getPos(e);
    setStartPos(pos);
    setIsDrawing(true);
    currentPointsRef.current = [pos];

    if (tool === 'select') {
      if (selectedStrokeIds.length > 0) {
        const selectedStrokes = strokes.filter(s => selectedStrokeIds.includes(s.id));
        if (selectedStrokes.length > 0) {
          // Calculate combined bounds
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          selectedStrokes.forEach(stroke => {
            const bounds = getStrokeBounds(stroke);
            minX = Math.min(minX, bounds.minX);
            minY = Math.min(minY, bounds.minY);
            maxX = Math.max(maxX, bounds.maxX);
            maxY = Math.max(maxY, bounds.maxY);
          });

          const padding = 15;
          const handleSize = 12;
          
          const handles = [
            { x: minX - padding, y: minY - padding, id: 'tl' },
            { x: maxX + padding, y: minY - padding, id: 'tr' },
            { x: minX - padding, y: maxY + padding, id: 'bl' },
            { x: maxX + padding, y: maxY + padding, id: 'br' },
          ];
          
          const clickedHandle = handles.find(h => 
            Math.abs(pos.x - h.x) < handleSize && Math.abs(pos.y - h.y) < handleSize
          );
          
          if (clickedHandle) {
            setIsResizing(true);
            setResizeHandle(clickedHandle.id);
            setInitialSelectedStrokes(selectedStrokes.map(s => ({ ...s })));
            setInitialBounds({ minX, minY, maxX, maxY });
            return;
          }
          
          const rotX = (minX + maxX) / 2;
          const rotY = minY - padding - 40;
          if (Math.abs(pos.x - rotX) < handleSize && Math.abs(pos.y - rotY) < handleSize) {
            setIsRotating(true);
            setInitialSelectedStrokes(selectedStrokes.map(s => ({ ...s })));
            setInitialBounds({ minX, minY, maxX, maxY });
            return;
          }

          // Check if click is inside the bounds of the selected strokes
          const isInsideSelection = pos.x >= minX - padding && pos.x <= maxX + padding && pos.y >= minY - padding && pos.y <= maxY + padding;
          if (isInsideSelection) {
            setIsDragging(true);
            setInitialSelectedStrokes(selectedStrokes.map(s => ({ ...s })));
            setInitialBounds({ minX, minY, maxX, maxY });
            // Use the first selected stroke's center as reference for dragging offset
            const center = getStrokeCenter(selectedStrokes[0]);
            setDragOffset({ x: pos.x - center.x, y: pos.y - center.y });
            return;
          }
        }
      }

      const stroke = findStrokeAt(pos);
      if (stroke) {
        setSelectedStrokeIds([stroke.id]);
        setIsDragging(true);
        const center = getStrokeCenter(stroke);
        setDragOffset({ x: pos.x - center.x, y: pos.y - center.y });
      } else {
        setSelectedStrokeIds([]);
        setTool('lasso');
        const newStroke: Stroke = {
          id: 'lasso-' + Date.now(),
          tool: 'lasso',
          points: [pos],
          color: '#00F0FF',
          lineWidth: 1,
          type: 'lasso',
          startPos: pos,
          opacity: 0.5
        };
        setCurrentStroke(newStroke);
      }
      return;
    }

    if (tool === 'eraser' && (eraserMode === 'lasso-stroke' || eraserMode === 'lasso-pixel')) {
      const newStroke: Stroke = {
        id: 'lasso-eraser-' + Date.now(),
        tool: 'eraser',
        points: [pos],
        color: '#ff4444',
        lineWidth: 1,
        type: 'lasso',
        startPos: pos,
        opacity: 0.5
      };
      setCurrentStroke(newStroke);
      return;
    }

    if (tool === 'eraser' && eraserMode === 'stroke') {
      const stroke = findStrokeAt(pos);
      if (stroke) {
        const newStrokes = strokes.filter(s => s.id !== stroke.id);
        setStrokes(newStrokes);
        saveToHistory(newStrokes);
      }
      return;
    }

    if (tool === 'text') {
      const text = prompt('Enter text:');
      if (text) {
        const newStroke: Stroke = {
          id: Date.now().toString(),
          tool: 'text',
          points: [pos],
          color,
          lineWidth,
          type: 'text',
          text,
          startPos: pos
        };
        const newStrokes = [...strokes, newStroke];
        setStrokes(newStrokes);
        saveToHistory(newStrokes);
      }
      setIsDrawing(false);
      return;
    }

    const newStroke: Stroke = {
      id: Date.now().toString(),
      tool,
      points: [pos],
      color: tool === 'eraser' ? (theme === 'light' ? '#ffffff' : '#1a1b26') : color,
      lineWidth: tool === 'eraser' ? lineWidth * 5 : lineWidth,
      type: (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') ? 'path' : tool as any,
      startPos: pos,
      endPos: pos,
      opacity: tool === 'highlighter' ? 0.3 : 1,
      startTime: Date.now()
    };

    setCurrentStroke(newStroke);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if ('touches' in e) {
      e.preventDefault();
    }

    const pos = getPos(e);

    if (isPanning) {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      
      const dx = clientX - lastPanPos.x;
      const dy = clientY - lastPanPos.y;
      
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPanPos({ x: clientX, y: clientY });
      return;
    }

    if (!isDrawing) return;

    if (tool === 'eraser' && eraserMode === 'stroke') {
      const stroke = findStrokeAt(pos);
      if (stroke) {
        const newStrokes = strokes.filter(s => s.id !== stroke.id);
        if (newStrokes.length !== strokes.length) {
          setStrokes(newStrokes);
          saveToHistory(newStrokes);
        }
      }
      return;
    }

    if (tool === 'select' && selectedStrokeIds.length > 0) {
      if (isDragging && initialBounds) {
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;

        setStrokes(prev => prev.map(s => {
          const initial = initialSelectedStrokes.find(is => is.id === s.id);
          if (initial) {
            return {
              ...initial,
              points: initial.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
              startPos: initial.startPos ? { x: initial.startPos.x + dx, y: initial.startPos.y + dy } : undefined,
              endPos: initial.endPos ? { x: initial.endPos.x + dx, y: initial.endPos.y + dy } : undefined,
              center: initial.center ? { x: initial.center.x + dx, y: initial.center.y + dy } : undefined
            };
          }
          return s;
        }));
      } else if (isResizing && resizeHandle && initialBounds) {
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;
        
        const initialWidth = Math.max(20, initialBounds.maxX - initialBounds.minX);
        const initialHeight = Math.max(20, initialBounds.maxY - initialBounds.minY);
        
        let scaleX = 1;
        let scaleY = 1;
        
        if (resizeHandle.includes('r')) scaleX = (initialWidth + dx) / initialWidth;
        if (resizeHandle.includes('l')) scaleX = (initialWidth - dx) / initialWidth;
        if (resizeHandle.includes('b')) scaleY = (initialHeight + dy) / initialHeight;
        if (resizeHandle.includes('t')) scaleY = (initialHeight - dy) / initialHeight;
        
        // Keep aspect ratio if shift is pressed (simulated here)
        // scaleX = scaleY = Math.max(scaleX, scaleY);

        setStrokes(prev => prev.map(s => {
          const initial = initialSelectedStrokes.find(is => is.id === s.id);
          if (initial) {
            const center = initial.center || getStrokeCenter(initial);
            return {
              ...initial,
              scale: { 
                x: (initial.scale?.x || 1) * scaleX, 
                y: (initial.scale?.y || 1) * scaleY 
              },
              center
            };
          }
          return s;
        }));
      } else if (isRotating && initialBounds) {
        const center = {
          x: (initialBounds.minX + initialBounds.maxX) / 2,
          y: (initialBounds.minY + initialBounds.maxY) / 2
        };
        const initialAngle = Math.atan2(startPos.y - center.y, startPos.x - center.x);
        const currentAngle = Math.atan2(pos.y - center.y, pos.x - center.x);
        const deltaAngle = currentAngle - initialAngle;

        setStrokes(prev => prev.map(s => {
          const initial = initialSelectedStrokes.find(is => is.id === s.id);
          if (initial) {
            return {
              ...initial,
              rotation: (initial.rotation || 0) + deltaAngle,
              center: initial.center || getStrokeCenter(initial)
            };
          }
          return s;
        }));
      }
      return;
    }

    currentPointsRef.current.push(pos);

    if (tool === 'lasso' || tool === 'ai-ocr' || (tool === 'eraser' && (eraserMode === 'lasso-stroke' || eraserMode === 'lasso-pixel'))) {
      // No need to setCurrentStroke here, redraw uses currentPointsRef
      return;
    }

    if (tool === 'laser') {
      laserPathRef.current.push(pos);
      return;
    }

    if (!currentStroke) return;

    if (currentStroke.type === 'path') {
      // No need to setCurrentStroke here, redraw uses currentPointsRef
    } else {
      setCurrentStroke({
        ...currentStroke,
        endPos: pos
      });
    }
  };

  const stopDrawing = () => {
    setIsPanning(false);
    if (!isDrawing) return;
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);

    if (tool === 'lasso') {
      if (currentStroke && currentStroke.points.length > 3) {
        const lassoedIds = strokes.filter(s => isStrokeInLasso(s, currentStroke.points)).map(s => s.id);
        if (lassoedIds.length > 0) {
          setSelectedStrokeIds(lassoedIds);
        }
      }
      setCurrentStroke(null);
      currentPointsRef.current = [];
      setTool('select');
      return;
    }

    if (tool === 'ai-ocr') {
      if (currentStroke && currentStroke.points.length > 3) {
        performOCR(currentStroke.points);
      }
      setCurrentStroke(null);
      currentPointsRef.current = [];
      setTool('select');
      return;
    }

    if (tool === 'eraser' && (eraserMode === 'lasso-stroke' || eraserMode === 'lasso-pixel')) {
      if (currentStroke && currentStroke.points.length > 3) {
        const newStrokes = strokes.filter(s => !isStrokeInLasso(s, currentStroke.points));
        setStrokes(newStrokes);
        saveToHistory(newStrokes);
      }
      setCurrentStroke(null);
      currentPointsRef.current = [];
      return;
    }

    if (tool === 'laser') {
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
      laserTimeoutRef.current = setTimeout(() => {
        laserPathRef.current = [];
        currentPointsRef.current = [];
      }, 1000);
      return;
    }

    if (currentStroke) {
      let strokeToSave = { ...currentStroke, points: [...currentPointsRef.current] };
      
      if (tool === 'smart-pen') {
        const recognized = recognizeShape(currentPointsRef.current);
        if (recognized) {
          strokeToSave = recognized;
        }
      }

      const newStrokes = [...strokes, strokeToSave];
      setStrokes(newStrokes);
      saveToHistory(newStrokes);
      setCurrentStroke(null);
      currentPointsRef.current = [];
    } else if (tool === 'select' || (tool === 'eraser' && eraserMode === 'stroke')) {
      saveToHistory(strokes);
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
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const delta = -e.deltaY;
      const newScale = Math.max(0.1, Math.min(5, scale + delta * zoomSpeed));
      
      // Zoom towards cursor
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = (mouseX - offset.x) / scale;
        const worldY = (mouseY - offset.y) / scale;
        
        const newOffsetX = mouseX - worldX * newScale;
        const newOffsetY = mouseY - worldY * newScale;
        
        setScale(newScale);
        setOffset({ x: newOffsetX, y: newOffsetY });
      }
    } else {
      // Normal scroll translates
      setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const gridBg = `bg-[#1a1b26] bg-[url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L0 0 0 20' fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.1'/%3E%3C/svg%3E")]`;

  return (
    <>
      <div 
        ref={containerRef}
        onWheel={handleWheel}
        className={`relative flex flex-col h-full ${theme === 'transparent' ? 'bg-transparent' : 'bg-[#1a1b26]'} rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''} ${className}`}
        style={{ touchAction: 'none', transform: 'translateZ(0)' }}
      >
        {/* Canvas Area */}
        <div className={`flex-1 relative ${theme === 'light' ? 'bg-white' : theme === 'grid' ? gridBg : theme === 'transparent' ? 'bg-transparent' : 'bg-[#1a1b26]'}`}>
          <canvas
            ref={bgCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={() => { stopDrawing(); }}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="absolute inset-0 w-full h-full"
          />

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
          
            {isOCRProcessing && (
              <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#00F0FF]/20 border-t-[#00F0FF] rounded-full animate-spin" />
                    <ScanText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#00F0FF] animate-pulse" />
                </div>
                <p className="mt-4 text-[#00F0FF] font-medium animate-pulse">AI Extracting Text...</p>
                <p className="text-white/40 text-xs mt-1">Using Gemini 2.5 Flash Lite</p>
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
      </div>

      {/* Floating Toolbar Toggle */}
      <button 
        onClick={() => setIsToolbarOpen(!isToolbarOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] flex items-center justify-center z-[100] hover:scale-110 transition-transform active:scale-95"
      >
        <Settings className={`w-6 h-6 transition-transform duration-500 ${isToolbarOpen ? 'rotate-90' : ''}`} />
      </button>

      {/* Floating Draggable Toolbar */}
      <AnimatePresence>
        {isToolbarOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-24 md:w-auto flex flex-col p-4 bg-black/40 border border-white/10 backdrop-blur-2xl rounded-3xl z-[100] pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 group"
          >
            <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-move flex items-center justify-between pb-3 border-b border-white/10 mb-3"
            >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                  <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Premium Toolbar</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                  <div className="w-1 h-1 rounded-full bg-white/20" />
                </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {/* Tool Selection */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'select', icon: MousePointer2, label: 'Select' },
                  { id: 'lasso', icon: Lasso, label: 'Lasso' },
                  { id: 'smart-pen', icon: Wand2, label: 'Smart Pen' },
                  { id: 'ai-ocr', icon: ScanText, label: 'AI OCR' },
                  { id: 'pan', icon: Hand, label: 'Pan' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id as any)}
                    className={`p-2.5 rounded-xl transition-all duration-300 relative group ${
                      tool === t.id 
                        ? 'bg-[#00F0FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={t.label}
                  >
                    <t.icon className="w-5 h-5" />
                    {tool === t.id && (
                      <motion.div
                        layoutId="activeTool"
                        className="absolute inset-0 bg-[#00F0FF] rounded-xl -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
                
                <div className="w-px h-6 bg-white/10 mx-1" />
                
                <button
                  onClick={() => setShowAIGenerator(true)}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    showAIGenerator ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'text-indigo-400 hover:bg-indigo-500/10'
                  }`}
                  title="AI Object Generator"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>

              {/* Selection Actions */}
              {selectedStrokeIds.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="flex items-center gap-3 bg-white/5 rounded-2xl p-2 border border-white/10"
                >
                  <button 
                    onClick={() => {
                      const newStrokes = strokes.filter(s => !selectedStrokeIds.includes(s.id));
                      setStrokes(newStrokes);
                      saveToHistory(newStrokes);
                      setSelectedStrokeIds([]);
                    }}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="w-px h-4 bg-white/10" />
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        const newStrokes = strokes.map(s => {
                          if (!selectedStrokeIds.includes(s.id)) return s;
                          const scale = (s.scale?.x || 1) * 1.1;
                          return { ...s, scale: { x: scale, y: scale } };
                        });
                        setStrokes(newStrokes);
                        saveToHistory(newStrokes);
                      }}
                      className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        const newStrokes = strokes.map(s => {
                          if (!selectedStrokeIds.includes(s.id)) return s;
                          const scale = (s.scale?.x || 1) * 0.9;
                          return { ...s, scale: { x: scale, y: scale } };
                        });
                        setStrokes(newStrokes);
                        saveToHistory(newStrokes);
                      }}
                      className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Utility Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-1">
                  <button onClick={undo} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Undo">
                    <Undo className="w-4 h-4" />
                  </button>
                  <button onClick={redo} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Redo">
                    <Redo className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={clear} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all" title="Clear All">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={downloadAsPDF} className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-xl transition-all" title="Download PDF">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showAIGenerator && (
      <AIGeneratorModal 
        onClose={() => setShowAIGenerator(false)} 
        onInsert={(content) => {
          const newStroke: Stroke = {
            id: Date.now().toString(),
            tool: 'text',
            points: [{ x: 100, y: 100 }],
            color: '#ffffff',
            lineWidth: 2,
            type: 'text',
            text: content,
            startPos: { x: 100, y: 100 }
          };
          const newStrokes = [...strokes, newStroke];
          setStrokes(newStrokes);
          saveToHistory(newStrokes);
        }}
      />
    )}
    </>
  );
}

