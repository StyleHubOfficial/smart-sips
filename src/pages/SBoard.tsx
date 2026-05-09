import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Presentation, ChevronRight, ChevronLeft, Play, Trash2, Settings, Sparkles, Info, Database, Pen, Eraser, Undo, Redo, MousePointer2, Wand2, ScanText, Crosshair, Type, Square, Circle, Minus, Download, X, Search, Maximize2, Minimize2, ZoomIn, ZoomOut, Hash, Layers, Monitor, ChevronUp, ChevronDown, List, Eye, Highlighter, Plus, ArrowUpRight, Zap, Hand } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { useTeacherStore } from '../store/useTeacherStore';
import Whiteboard, { WhiteboardRef } from '../components/Whiteboard';
import { DashboardFileSelector } from '../components/DashboardFileSelector';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { OperationType, handleFirestoreError } from '../lib/firestoreErrorHandler';

// Set up PDF.js worker
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function SBoard() {
  const { slides, currentSlideIndex, setSlides: storeSetSlides, setCurrentSlideIndex, updateSlideWhiteboardData: storeUpdateSlideWhiteboardData, clearSlides: storeClearSlides } = useTeacherStore();
  const { user } = useAuthStore();
  const { setIsGeneratingContent } = useAppStore();

  const whiteboardRef = useRef<WhiteboardRef>(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#00F0FF');
  const [lineWidth, setLineWidth] = useState(3);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [isSmartPanelMode, setIsSmartPanelMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Sync state to Whiteboard when it changes locally
  useEffect(() => {
    if (whiteboardRef.current) {
      whiteboardRef.current.setTool(tool as any);
      whiteboardRef.current.setColor(color);
      whiteboardRef.current.setLineWidth(lineWidth);
    }
  }, [tool, color, lineWidth]);
  useEffect(() => {
    const fetchSlides = async () => {
      if (!user) return;
      try {
        const querySnapshot = await getDocs(collection(db, `users/${user.uid}/slides`));
        const userSlides: any[] = [];
        querySnapshot.forEach((doc) => {
          userSlides.push(doc.data());
        });
        
        userSlides.sort((a, b) => a.id?.localeCompare(b.id) || 0);
        
        if (userSlides.length > 0) {
          const formattedSlides = userSlides.map(s => ({
            id: s.slideId,
            imageUrl: s.imageUrl,
            whiteboardData: s.whiteboardData,
            annotatedImageUrl: s.annotatedImageUrl
          }));
          storeSetSlides(formattedSlides);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/slides`);
      }
    };
    fetchSlides();
  }, [user, storeSetSlides]);

  const setSlides = async (newSlides: any[]) => {
    storeSetSlides(newSlides);
    if (!user) return;

    try {
      // Chunk up batch writes to 500 at a time
      const chunks = [];
      for(let i = 0; i < newSlides.length; i += 500) {
        chunks.push(newSlides.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(data => {
            const ref = doc(db, `users/${user.uid}/slides`, data.id);
            const slideData: any = {
              userId: user.uid,
              slideId: data.id,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            if(data.imageUrl) slideData.imageUrl = data.imageUrl;
            if(data.whiteboardData) slideData.whiteboardData = data.whiteboardData;
            if(data.annotatedImageUrl) slideData.annotatedImageUrl = data.annotatedImageUrl;
            
            batch.set(ref, slideData);
        });
        await batch.commit();
      }
    } catch(err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/slides`);
    }
  };

  const clearSlides = async () => {
    storeClearSlides();
    if (!user) return;
    try {
      const querySnapshot = await getDocs(collection(db, `users/${user.uid}/slides`));
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(document.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/slides`);
    }
  };

  const updateSlideWhiteboardData = async (index: number, data: string, dataUrl: string) => {
    storeUpdateSlideWhiteboardData(index, data, dataUrl);
    if (!user || slides.length === 0) return;
    const currentSlide = slides[index];
    if(!currentSlide) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/slides`, currentSlide.id), {
        whiteboardData: data,
        annotatedImageUrl: dataUrl,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/slides/${currentSlide.id}`);
    }
  };
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [importSettings, setImportSettings] = useState({
    quality: 2, // Scale factor
    renderAnnotations: true,
  });

  useEffect(() => {
    setIsGeneratingContent(isProcessing);
  }, [isProcessing, setIsGeneratingContent]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessProgress(0);
    try {
      if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
        alert("PPTX support is currently experimental. For best results, please save your PowerPoint as a PDF and upload the PDF instead.");
        setIsProcessing(false);
        return;
      }
      
      if (file.type === 'application/pdf') {
        await clearSlides();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const newSlides = [];
        setTotalItems(pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          
          // Calculate scale to fit a standard HD resolution if needed, 
          // but we use the quality setting as base scale.
          const viewport = page.getViewport({ scale: importSettings.quality });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          // We want to ensure the canvas is large enough for high quality
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
              canvas: canvas,
            } as any).promise;

            newSlides.push({
              id: `slide-${Date.now()}-${i}`,
              imageUrl: canvas.toDataURL('image/jpeg', 0.8),
              whiteboardData: '',
            });
            
            // Yield to main thread to prevent lag and allow progress bar to animate
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          setProcessProgress(i);
        }
        setSlides(newSlides);
      } else if (file.type.startsWith('image/')) {
        await clearSlides();
        setTotalItems(1);
        const reader = new FileReader();
        reader.onload = (e) => {
          setSlides([{
            id: `slide-${Date.now()}`,
            imageUrl: e.target?.result as string,
            whiteboardData: '',
          }]);
          setProcessProgress(1);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    multiple: false
  });

  const handleStartTeaching = () => {
    if (slides.length > 0) {
      setShowWhiteboard(true);
    }
  };

  const handleExportAllPDF = async () => {
    if (slides.length === 0) return;
    setIsProcessing(true);
    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080]
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const imgData = slide.annotatedImageUrl || slide.imageUrl;
        
        if (i > 0) {
          pdf.addPage([1920, 1080], 'landscape');
        } else {
          pdf.deletePage(1);
          pdf.addPage([1920, 1080], 'landscape');
        }

        pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
      }

      pdf.save(`presentation-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveWhiteboard = (data: string, imageData?: string) => {
    updateSlideWhiteboardData(currentSlideIndex, data, imageData);
  };

  const [showSlidePreview, setShowSlidePreview] = useState(false);

  if (showWhiteboard) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#0A0A0A] text-white flex overflow-hidden">
        {/* LEFT SIDEBAR - Slides & Content */}
        <AnimatePresence>
          {showLeftSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full bg-[#111] border-r border-white/10 flex flex-col shrink-0"
            >
              <div className="h-14 border-b border-white/10 flex items-center justify-between pl-4 pr-2">
                <span className="font-bold text-sm tracking-wide">SLIDES</span>
                <button onClick={() => setShowLeftSidebar(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {slides.map((slide, idx) => (
                  <div 
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`relative w-full aspect-[16/9] rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${
                      idx === currentSlideIndex ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                    {slide.imageUrl ? (
                      <img src={slide.imageUrl} className="w-full h-full object-cover" alt={`Slide ${idx + 1}`} />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <span className="text-white/30 text-xs text-center font-mono">Blank</span>
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-black/60 w-5 h-5 flex items-center justify-center rounded text-[10px] text-white backdrop-blur-sm font-bold">
                      {idx + 1}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSlides = [...slides];
                        newSlides.splice(idx + 1, 0, { id: `slide-copy-${Date.now()}`, imageUrl: slide.imageUrl, whiteboardData: slide.whiteboardData });
                        setSlides(newSlides);
                      }}
                      className="absolute top-1 right-1 bg-black/80 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-indigo-500/80 rounded text-white backdrop-blur-sm transition-all"
                      title="Duplicate Slide"
                    >
                      <Layers className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-white/10 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    const newSlides = [...slides];
                    newSlides.splice(currentSlideIndex + 1, 0, { id: `slide-blank-${Date.now()}`, imageUrl: '', whiteboardData: '' });
                    setSlides(newSlides);
                    setCurrentSlideIndex(currentSlideIndex + 1);
                  }}
                  className="flex items-center justify-center gap-2 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs hover:bg-indigo-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
                <button 
                  onClick={async () => {
                    const slideToDelete = slides[currentSlideIndex];
                    const newSlides = [...slides];
                    newSlides.splice(currentSlideIndex, 1);
                    setSlides(newSlides);
                    if (user && slideToDelete) {
                      try { await deleteDoc(doc(db, `users/${user.uid}/slides`, slideToDelete.id)); } 
                      catch (err) { handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/slides/${slideToDelete.id}`); }
                    }
                    if (newSlides.length === 0) setShowWhiteboard(false);
                    else if (currentSlideIndex >= newSlides.length) setCurrentSlideIndex(newSlides.length - 1);
                  }}
                  className="flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* TOP HEADER */}
          <div className="h-14 bg-[#111] border-b border-white/10 flex items-center justify-between px-4 z-10 shrink-0">
            <div className="flex items-center gap-3">
              {!showLeftSidebar && (
                <button onClick={() => setShowLeftSidebar(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                  <List className="w-4 h-4" />
                </button>
              )}
              <h1 className="text-sm font-bold text-gray-300 font-display flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                SBoard
              </h1>
            </div>

            {/* Download & Zoom Tools */}
            <div className="flex items-center gap-2">
              <button onClick={() => whiteboardRef.current?.setScale((whiteboardRef.current.getScale() || 1) - 0.1)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10" title="Zoom Out">
                 <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={() => whiteboardRef.current?.setScale((whiteboardRef.current.getScale() || 1) + 0.1)} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10" title="Zoom In">
                 <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-white/10 mx-1 sm:mx-2"></div>
              <button onClick={handleExportAllPDF} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold px-3">
                 <Download className="w-4 h-4" />
                 <span className="hidden sm:inline">Export</span>
              </button>
              <button onClick={() => setShowWhiteboard(false)} className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors ml-2 font-bold text-xs px-4 border border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                 Quit
              </button>
            </div>
          </div>

          {/* INNER WORKSPACE CONTAINER */}
          <div className="flex-1 flex overflow-hidden">
            {/* CANVAS WRAPPER */}
            <div 
              className="flex-1 relative bg-[#0e0e12]"
              onPointerDown={() => {
                if (showLeftSidebar) setShowLeftSidebar(false);
                if (showRightSidebar) setShowRightSidebar(false);
              }}
            >
               <Whiteboard 
                  ref={whiteboardRef}
                  key={slides[currentSlideIndex].id}
                  initialData={slides[currentSlideIndex].whiteboardData}
                  onSave={handleSaveWhiteboard}
                  className="h-full w-full border-none rounded-none outline-none"
                  theme="dark"
                  backgroundImage={slides[currentSlideIndex].imageUrl}
                  hideToolbar={true}
                />

                {/* FLOATING BOTTOM TOOLBAR */}
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/95 backdrop-blur-3xl border border-white/10 p-2 rounded-2xl flex items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 pointer-events-auto"
                  >
                     {/* Colors & Thickness */}
                     <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                        {['#ef4444', '#3b82f6', '#ffffff'].map(c => (
                          <button 
                            key={c}
                            onClick={() => setColor(c)}
                            style={{ backgroundColor: c }}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'border-gray-900 scale-110 ring-2 ring-white' : 'border-transparent hover:scale-110'}`}
                          />
                        ))}
                        <button className="w-6 h-6 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center hover:border-white transition-colors relative overflow-hidden">
                           <Plus className="w-3 h-3 text-gray-400" />
                           <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-[-10px] w-[200%] h-[200%] opacity-0 cursor-pointer" />
                        </button>
                        
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex items-center gap-1">
                          {[2, 4, 8, 16].map(w => (
                            <button 
                              key={w}
                              onClick={() => setLineWidth(w)}
                              className={`w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ${lineWidth === w ? 'bg-white/20' : ''}`}
                            >
                              <div className="bg-white rounded-full bg-current text-white" style={{ width: Math.max(3, w/1.5), height: Math.max(3, w/1.5) }} />
                            </button>
                          ))}
                        </div>
                     </div>

                     {/* Main Tools */}
                     <div className="flex items-center gap-1 px-4 relative">
                        {[
                          { id: 'select', icon: Sparkles, iconClass: 'rotate-180 -scale-x-100', title: 'Neon Pointer' },
                          { id: 'pen', icon: Pen, title: 'Pen' },
                          { id: 'eraser', icon: Eraser, title: 'Eraser' },
                          { id: 'highlighter', icon: Highlighter, title: 'Highlighter' },
                          { id: 'line', icon: Minus, title: 'Lines & Arrows' },
                          { id: 'rect', icon: Square, title: 'Shapes' },
                          { id: 'pan', icon: Hand, title: 'Pan Canvas' },
                        ].map(t => (
                          <button 
                            key={t.id}
                            onClick={() => {
                              setTool(t.id);
                              // We could toggle expandable sub-menus here if needed
                            }} 
                            className={`relative p-3 rounded-xl transition-all hover:scale-105 active:scale-95 group ${tool === t.id ? 'bg-white/20 shadow-inner' : 'bg-transparent text-white/70 hover:text-white hover:bg-white/10'}`}
                            title={t.title}
                          >
                             <t.icon className={`w-5 h-5 ${t.iconClass || ''}`} style={{ color: tool === t.id ? color : undefined }} />
                             {tool === t.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: color }}></div>}
                          </button>
                        ))}
                     </div>

                     {/* Expandable Tools Placeholder */}
                     <div className="pl-4 border-l border-white/10 flex items-center gap-2">
                        <button onClick={() => setTool('text')} className={`p-3 rounded-xl transition-all hover:scale-105 ${tool === 'text' ? 'bg-white/20' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                           <Type className="w-5 h-5" />
                        </button>
                        <button className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"><MoreVertical className="w-5 h-5" /></button>
                     </div>
                  </motion.div>

                  {/* BOTTOM LEFT: Undo, Redo, Sidebar Toggle */}
                  <div className="absolute bottom-6 left-4 flex items-center gap-2 z-50">
                     <button onClick={() => setShowLeftSidebar(!showLeftSidebar)} className="p-3 bg-[#111]/90 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-xl text-gray-400 transition-colors shadow-lg">
                        <List className="w-5 h-5" />
                     </button>
                     <div className="flex bg-[#111]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg">
                        <button onClick={() => whiteboardRef.current?.undo()} className="p-3 hover:bg-white/10 text-gray-400 transition-colors border-r border-white/10"><Undo className="w-5 h-5" /></button>
                        <button onClick={() => whiteboardRef.current?.redo()} className="p-3 hover:bg-white/10 text-gray-400 transition-colors"><Redo className="w-5 h-5" /></button>
                     </div>
                  </div>

                  {/* BOTTOM RIGHT: Slide Navigation & Settings Toggle */}
                  <div className="absolute bottom-6 right-4 flex items-center gap-2 z-50">
                     <div className="flex flex-row items-center bg-[#111]/90 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg h-[46px]">
                        <button onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} disabled={currentSlideIndex === 0} className="px-3 h-full text-gray-400 hover:bg-white/10 disabled:opacity-30 border-r border-white/10 flex items-center"><ChevronLeft className="w-5 h-5" /></button>
                        <div className="px-4 text-sm font-mono text-gray-300 font-bold flex items-center">{currentSlideIndex + 1} / {slides.length}</div>
                        <button onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))} disabled={currentSlideIndex === slides.length - 1} className="px-3 h-full text-gray-400 hover:bg-white/10 disabled:opacity-30 border-l border-white/10 flex items-center"><ChevronRight className="w-5 h-5" /></button>
                     </div>
                     <button onClick={() => setShowRightSidebar(!showRightSidebar)} className="p-3 bg-[#111]/90 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-xl text-gray-400 transition-colors shadow-lg">
                        <Settings className="w-5 h-5" />
                     </button>
                  </div>
            </div>

            {/* RIGHT SIDEBAR - Tools & Properties */}
            <AnimatePresence>
               {showRightSidebar && (
                 <motion.div
                   initial={{ width: 0, opacity: 0 }}
                   animate={{ width: 260, opacity: 1 }}
                   exit={{ width: 0, opacity: 0 }}
                   className="h-full bg-[#111] border-l border-white/10 flex flex-col shrink-0"
                 >
                    <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
                      <span className="font-bold text-sm tracking-wide">SETTINGS</span>
                      <button onClick={() => setShowRightSidebar(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                       
                       <div className="space-y-4">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Canvas Background</span>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                               { id: 'none', label: 'Blank', icon: Square },
                               { id: 'grid', label: 'Grid', icon: Grid },
                               { id: 'dots', label: 'Dots', icon: Circle },
                               { id: 'lines', label: 'Lines', icon: FileText }
                            ].map(bg => (
                               <button 
                                 key={bg.id}
                                 onClick={() => {
                                   whiteboardRef.current?.setBackgroundType(bg.id as any);
                                 }}
                                 className="flex flex-col items-center gap-2 p-3 rounded-xl bg-black border border-white/5 hover:bg-white/5 transition-colors text-gray-400 hover:text-white hover:border-white/20"
                               >
                                 <bg.icon className="w-5 h-5" />
                                 <span className="text-[10px]">{bg.label}</span>
                               </button>
                            ))}
                          </div>
                          <button 
                            onClick={() => whiteboardRef.current?.setBackgroundType('none')}
                            className="w-full text-xs text-gray-400 hover:text-white py-2"
                          >
                            Reset to Default
                          </button>
                       </div>

                       <div className="w-full h-px bg-white/10"></div>
                       
                       <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Actions</span>
                          <button onClick={() => {
                            if (window.confirm("Are you sure you want to clear the canvas?")) {
                              whiteboardRef.current?.clear()
                            }
                          }} className="w-full py-3 text-xs font-bold text-red-500 bg-red-500/5 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-2">
                             <Trash2 className="w-4 h-4" /> Clear Canvas
                          </button>
                          <button onClick={handleExportAllPDF} className="w-full py-3 text-xs font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2">
                             <Download className="w-4 h-4" /> Export Document
                          </button>
                       </div>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-white">SBoard</h1>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-widest">Smart Board</span>
            </div>
            <p className="text-gray-400 text-lg">Convert your teaching materials into interactive AI slides.</p>
          </div>
          
          {slides.length > 0 && (
            <div className="flex items-center gap-4">
              <button 
                onClick={clearSlides}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-bold"
              >
                <Trash2 className="w-5 h-5" />
                Clear All
              </button>
              <button 
                onClick={handleExportAllPDF}
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all font-bold disabled:opacity-50"
              >
                <FileText className="w-5 h-5" />
                Export PDF
              </button>
              <button 
                onClick={handleStartTeaching}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                <Play className="w-5 h-5" />
                Start Teaching
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {slides.length === 0 ? (
              <div 
                {...getRootProps()} 
                className={`relative group cursor-pointer rounded-[2rem] border-2 border-dashed transition-all duration-500 min-h-[400px] flex flex-col items-center justify-center p-12 text-center ${
                  isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <input {...getInputProps()} />
                
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-30 transform-gpu group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative w-24 h-24 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-indigo-400" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  {isProcessing ? 'Processing your file...' : 'Upload Teaching Material'}
                </h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  Drag and drop your PDF or images here. We'll convert them into high-quality interactive slides. (For PPTX, please save as PDF first).
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDashboardSelector(true);
                  }}
                  className="mb-8 flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 transition-all font-medium z-10 relative"
                >
                  <Database className="w-5 h-5" />
                  Select from Dashboard
                </button>

                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
                    <FileText className="w-4 h-4" /> PDF
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
                    <Sparkles className="w-4 h-4" /> Images
                  </div>
                </div>

                {isProcessing && (
                  <div className="absolute inset-x-0 bottom-0 p-8">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Processing Pages</span>
                      <span className="text-xs font-mono text-indigo-400">{processProgress} / {totalItems}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                      <motion.div 
                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(processProgress / totalItems) * 100}%` }}
                        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {slides.map((slide, index) => (
                  <motion.div 
                    key={slide.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative aspect-[16/9] rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      currentSlideIndex === index ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setCurrentSlideIndex(index)}
                  >
                    <img src={slide.imageUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-[#111] text-[10px] font-bold text-white border border-white/10">
                      Page {index + 1}
                    </div>
                  </motion.div>
                ))}
                
                <div 
                  {...getRootProps()}
                  className="aspect-[16/9] rounded-2xl border-2 border-dashed border-white/10 hover:border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer transition-all"
                >
                  <input {...getInputProps()} />
                  <Upload className="w-6 h-6 text-gray-500 mb-2" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Add More</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Import Settings</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-gray-400">Render Quality (HD)</label>
                    <span className="text-sm font-mono text-indigo-400">{importSettings.quality}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="4" 
                    step="0.5"
                    value={importSettings.quality}
                    onChange={(e) => setImportSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between mt-1 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    <span>Standard</span>
                    <span>Ultra HD</span>
                  </div>
                </div>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Render Annotations</span>
                  <div 
                    onClick={() => setImportSettings(prev => ({ ...prev, renderAnnotations: !prev.renderAnnotations }))}
                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${importSettings.renderAnnotations ? 'bg-indigo-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${importSettings.renderAnnotations ? 'left-6' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-white/10 bg-indigo-500/5">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Pro Tips</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Use 2x or higher quality for 4K writing experience.",
                  "PDFs work best for multi-page slide conversion.",
                  "Your whiteboard annotations are saved per slide.",
                  "Use the Smart Pen in whiteboard for perfect shapes."
                ].map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <DashboardFileSelector
        isOpen={showDashboardSelector}
        onClose={() => setShowDashboardSelector(false)}
        onSelect={async (file) => {
          try {
            setIsProcessing(true);
            setProcessProgress(0);
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(file.url || file.fileUrl)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`Proxy fetch failed: ${res.statusText}`);
            
            const blob = await res.blob();
            const fileObj = new File([blob], file.name || 'document.pdf', { type: blob.type });
            await onDrop([fileObj]);
          } catch (error) {
            console.error("Failed to load file from dashboard:", error);
            alert("Failed to load file from dashboard.");
          } finally {
            setIsProcessing(false);
            setShowDashboardSelector(false);
          }
        }}
        allowMultiple={false}
      />
    </div>
  );
}
