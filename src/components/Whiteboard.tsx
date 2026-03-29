import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pen, Eraser, Undo, Redo, Square, Circle, Minus, Type, Download, Trash2, X, Highlighter, ArrowUpRight, Maximize2, Minimize2, Sparkles, MousePointer2 } from 'lucide-react';

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
}

export default function Whiteboard({ onClose, className = '', initialData, onSave, theme: initialTheme = 'dark' }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'select' | 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'line' | 'arrow' | 'text' | 'laser' | 'lasso'>('pen');
  const [eraserMode, setEraserMode] = useState<'pixel' | 'stroke' | 'all' | 'lasso'>('pixel');
  const [showEraserMenu, setShowEraserMenu] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeProgress, setWipeProgress] = useState(0);
  const [laserPath, setLaserPath] = useState<Point[]>([]);
  const laserTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [color, setColor] = useState('#00F0FF');
  const [lineWidth, setLineWidth] = useState(3);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'grid' | 'transparent'>(initialTheme);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

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

  const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
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

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    allStrokes.forEach(stroke => {
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
      } else if (stroke.tool === 'highlighter' && stroke.startTime && (Date.now() - stroke.startTime) < 7000) {
        // Blinking/Glow effect for highlighter
        const time = Date.now() / 1000;
        const glow = Math.sin(time * 2) * 5 + 10;
        ctx.shadowBlur = glow;
        ctx.shadowColor = stroke.color;
      } else {
        ctx.shadowBlur = 0;
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
        
        for (let i = 1; i < stroke.points.length - 2; i++) {
          const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
        }
        
        if (stroke.points.length > 2) {
          const last = stroke.points.length - 1;
          ctx.quadraticCurveTo(
            stroke.points[last - 1].x, 
            stroke.points[last - 1].y, 
            stroke.points[last].x, 
            stroke.points[last].y
          );
        }
        ctx.stroke();
        if (stroke.type === 'lasso') ctx.setLineDash([]);
      } else if (stroke.type === 'rect' && stroke.startPos && stroke.endPos) {
        ctx.strokeRect(
          stroke.startPos.x, 
          stroke.startPos.y, 
          stroke.endPos.x - stroke.startPos.x, 
          stroke.endPos.y - stroke.startPos.y
        );
      } else if (stroke.type === 'circle' && stroke.startPos && stroke.endPos) {
        const radius = Math.sqrt(
          Math.pow(stroke.endPos.x - stroke.startPos.x, 2) + 
          Math.pow(stroke.endPos.y - stroke.startPos.y, 2)
        );
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
    });

    // Draw selection handles if a stroke is selected
    selectedStrokeIds.forEach(id => {
      const selected = strokes.find(s => s.id === id);
      if (selected) {
        drawSelectionHandles(ctx, selected);
      }
    });

    // Draw laser path separately (not stored in strokes)
    if (laserPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff4444';
      ctx.moveTo(laserPath[0].x, laserPath[0].y);
      laserPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.globalAlpha = 1;
  };

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    const bounds = getStrokeBounds(stroke);
    const padding = 10;
    
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(bounds.minX - padding, bounds.minY - padding, bounds.maxX - bounds.minX + padding * 2, bounds.maxY - bounds.minY + padding * 2);
    ctx.setLineDash([]);

    // Handles
    ctx.fillStyle = '#00F0FF';
    const handleSize = 8;
    
    // Resize handles
    const handles = [
      { x: bounds.minX - padding, y: bounds.minY - padding, id: 'tl' },
      { x: bounds.maxX + padding, y: bounds.minY - padding, id: 'tr' },
      { x: bounds.minX - padding, y: bounds.maxY + padding, id: 'bl' },
      { x: bounds.maxX + padding, y: bounds.maxY + padding, id: 'br' },
    ];

    handles.forEach(h => {
      ctx.fillRect(h.x - handleSize/2, h.y - handleSize/2, handleSize, handleSize);
    });

    // Rotation handle
    const rotX = (bounds.minX + bounds.maxX) / 2;
    const rotY = bounds.minY - padding - 30;
    ctx.beginPath();
    ctx.moveTo(rotX, bounds.minY - padding);
    ctx.lineTo(rotX, rotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rotX, rotY, handleSize/2, 0, Math.PI * 2);
    ctx.fill();
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
    redraw();
  }, [strokes, currentStroke, laserPath, selectedStrokeIds]);

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

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setStartPos(pos);
    setCursorPos(pos);
    setIsDrawing(true);

    if (tool === 'select') {
      if (selectedStrokeIds.length > 0) {
        const selected = strokes.find(s => s.id === selectedStrokeIds[0]);
        if (selected) {
          const bounds = getStrokeBounds(selected);
          const padding = 10;
          const handleSize = 10;
          
          // Check handles
          const handles = [
            { x: bounds.minX - padding, y: bounds.minY - padding, id: 'tl' },
            { x: bounds.maxX + padding, y: bounds.minY - padding, id: 'tr' },
            { x: bounds.minX - padding, y: bounds.maxY + padding, id: 'bl' },
            { x: bounds.maxX + padding, y: bounds.maxY + padding, id: 'br' },
          ];
          
          const clickedHandle = handles.find(h => 
            Math.abs(pos.x - h.x) < handleSize && Math.abs(pos.y - h.y) < handleSize
          );
          
          if (clickedHandle) {
            setIsResizing(true);
            setResizeHandle(clickedHandle.id);
            return;
          }
          
          // Check rotation handle
          const rotX = (bounds.minX + bounds.maxX) / 2;
          const rotY = bounds.minY - padding - 30;
          if (Math.abs(pos.x - rotX) < handleSize && Math.abs(pos.y - rotY) < handleSize) {
            setIsRotating(true);
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
        // Start lasso selection
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

    if (tool === 'eraser' && eraserMode === 'lasso') {
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
    if (!isDrawing) return;
    const pos = getPos(e);
    setCursorPos(pos);

    if (tool === 'eraser' && eraserMode === 'stroke') {
      const stroke = findStrokeAt(pos);
      if (stroke) {
        const newStrokes = strokes.filter(s => s.id !== stroke.id);
        if (newStrokes.length !== strokes.length) {
          setStrokes(newStrokes);
          // Only save to history when a stroke is actually removed
          saveToHistory(newStrokes);
        }
      }
      return;
    }

    if (tool === 'select' && selectedStrokeIds.length > 0) {
      if (isDragging) {
        setStrokes(prev => prev.map(s => {
          if (selectedStrokeIds.includes(s.id)) {
            const dx = pos.x - cursorPos.x;
            const dy = pos.y - cursorPos.y;
            
            return {
              ...s,
              points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
              startPos: s.startPos ? { x: s.startPos.x + dx, y: s.startPos.y + dy } : undefined,
              endPos: s.endPos ? { x: s.endPos.x + dx, y: s.endPos.y + dy } : undefined,
              center: s.center ? { x: s.center.x + dx, y: s.center.y + dy } : undefined
            };
          }
          return s;
        }));
      } else if (isResizing && resizeHandle) {
        setStrokes(prev => prev.map(s => {
          if (selectedStrokeIds.includes(s.id)) {
            const center = s.center || getStrokeCenter(s);
            const dx = pos.x - center.x;
            const dy = pos.y - center.y;
            
            // Calculate scale based on distance from center
            const initialBounds = getStrokeBounds(s);
            const initialWidth = Math.max(20, initialBounds.maxX - initialBounds.minX);
            const initialHeight = Math.max(20, initialBounds.maxY - initialBounds.minY);
            
            const scaleX = Math.abs(dx * 2) / initialWidth;
            const scaleY = Math.abs(dy * 2) / initialHeight;
            
            return {
              ...s,
              scale: { x: scaleX, y: scaleY },
              center
            };
          }
          return s;
        }));
      } else if (isRotating) {
        setStrokes(prev => prev.map(s => {
          if (selectedStrokeIds.includes(s.id)) {
            const center = s.center || getStrokeCenter(s);
            const angle = Math.atan2(pos.y - center.y, pos.x - center.x) + Math.PI / 2;
            return {
              ...s,
              rotation: angle,
              center
            };
          }
          return s;
        }));
      }
      return;
    }

    if (tool === 'lasso' || (tool === 'eraser' && eraserMode === 'lasso')) {
      if (currentStroke) {
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, pos]
        });
      }
      return;
    }

    if (tool === 'laser') {
      setLaserPath(prev => [...prev, pos]);
      return;
    }

    if (tool === 'eraser' && eraserMode === 'stroke') {
      const stroke = findStrokeAt(pos);
      if (stroke) {
        setStrokes(prev => prev.filter(s => s.id !== stroke.id));
      }
      return;
    }

    if (!currentStroke) return;

    if (currentStroke.type === 'path') {
      setCurrentStroke({
        ...currentStroke,
        points: [...currentStroke.points, pos]
      });
    } else {
      setCurrentStroke({
        ...currentStroke,
        endPos: pos
      });
    }
  };

  const stopDrawing = () => {
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
      setTool('select');
      return;
    }

    if (tool === 'eraser' && eraserMode === 'lasso') {
      if (currentStroke && currentStroke.points.length > 3) {
        const newStrokes = strokes.filter(s => !isStrokeInLasso(s, currentStroke.points));
        setStrokes(newStrokes);
        saveToHistory(newStrokes);
      }
      setCurrentStroke(null);
      return;
    }

    if (tool === 'laser') {
      if (laserTimeoutRef.current) clearTimeout(laserTimeoutRef.current);
      laserTimeoutRef.current = setTimeout(() => setLaserPath([]), 1000);
      return;
    }

    if (currentStroke) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      saveToHistory(newStrokes);
      setCurrentStroke(null);
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
    setIsFullscreen(!isFullscreen);
  };

  const gridBg = `bg-[#1a1b26] bg-[url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L0 0 0 20' fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.1'/%3E%3C/svg%3E")]`;

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-full ${theme === 'transparent' ? 'bg-transparent' : 'bg-[#1a1b26]'} rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''} ${tool === 'select' ? 'pointer-events-none' : ''} ${className}`}
    >
      {/* Canvas Area */}
      <div className={`flex-1 relative ${tool === 'select' ? '' : 'cursor-none touch-none'} ${theme === 'light' ? 'bg-white' : theme === 'grid' ? gridBg : theme === 'transparent' ? 'bg-transparent' : 'bg-[#1a1b26]'}`}>
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
        {!isWiping && tool !== 'select' && (
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
          <button onClick={() => setTool('select')} className={`p-2 rounded-lg transition-colors ${tool === 'select' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Selector Tool">
            <MousePointer2 className="w-5 h-5" />
          </button>
          <button onClick={() => setTool('lasso')} className={`p-2 rounded-lg transition-colors ${tool === 'lasso' ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'text-gray-400 hover:bg-white/5'}`} title="Lasso Selection">
            <Sparkles className="w-5 h-5" />
          </button>
          {selectedStrokeIds.length > 0 && (
            <button onClick={() => {
              const newStrokes = strokes.filter(s => !selectedStrokeIds.includes(s.id));
              setStrokes(newStrokes);
              saveToHistory(newStrokes);
              setSelectedStrokeIds([]);
            }} className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors" title="Delete Selected">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
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
                  <button onClick={() => { setTool('eraser'); setEraserMode('pixel'); setShowEraserMenu(false); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div> Pixel Eraser
                  </button>
                  <button onClick={() => { setTool('eraser'); setEraserMode('stroke'); setShowEraserMenu(false); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap flex items-center gap-2">
                    <Minus className="w-3 h-3" /> Stroke Eraser
                  </button>
                  <button onClick={() => { setTool('eraser'); setEraserMode('lasso'); setShowEraserMenu(false); }} className="px-4 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white text-left whitespace-nowrap flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Lasso Eraser
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

