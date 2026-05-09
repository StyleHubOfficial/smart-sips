import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Presentation, ChevronRight, ChevronLeft, Trash2, Settings, Sparkles, Database, Download, Plus, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Image as ImageIcon, Sparkles as MagicWand, LayoutTemplate, Layers, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { useTeacherStore } from '../store/useTeacherStore';
import Whiteboard from '../components/Whiteboard';
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
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [importSettings, setImportSettings] = useState({ quality: 2, renderAnnotations: true });

  // Sidebar Layout States
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);

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
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const newSlides = [...slides];
        setTotalItems(pdf.numPages);

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: importSettings.quality });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
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
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          setProcessProgress(i);
        }
        setSlides(newSlides);
      } else if (file.type.startsWith('image/')) {
        setTotalItems(1);
        const reader = new FileReader();
        reader.onload = (e) => {
          const newSlides = [...slides, {
            id: `slide-${Date.now()}`,
            imageUrl: e.target?.result as string,
            whiteboardData: '',
          }];
          setSlides(newSlides);
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
    multiple: false,
    noClick: slides.length > 0 // Don't trigger on click if workspace is active
  });

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

        if (imgData) {
            pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
        } else {
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, 1920, 1080, "F");
        }
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

  const addBlankSlide = () => {
    const newSlides = [...slides];
    const index = currentSlideIndex >= 0 ? currentSlideIndex + 1 : newSlides.length;
    newSlides.splice(index, 0, {
      id: `slide-blank-${Date.now()}`,
      imageUrl: '', 
      whiteboardData: ''
    });
    setSlides(newSlides);
    setCurrentSlideIndex(index);
  };

  const deleteSlide = async (idx: number) => {
    const slideToDelete = slides[idx];
    const newSlides = [...slides];
    newSlides.splice(idx, 1);
    setSlides(newSlides);
    if (user && slideToDelete) {
      try {
          await deleteDoc(doc(db, `users/${user.uid}/slides`, slideToDelete.id));
      } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/slides/${slideToDelete.id}`);
      }
    }
    if (currentSlideIndex >= newSlides.length) {
        setCurrentSlideIndex(Math.max(0, newSlides.length - 1));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[#0a0a0a] text-white overflow-hidden font-sans pt-14">
      {/* Top Application Bar */}
      <header className="fixed top-14 left-0 right-0 h-14 bg-[#111] border-b border-white/10 flex items-center justify-between px-4 z-40 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowLeftSidebar(!showLeftSidebar)} 
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {showLeftSidebar ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>

          <div className="w-px h-6 bg-white/10" />

          {/* File Operations */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => {
                const el = document.getElementById("sboard-file-upload");
                if(el) el.click();
              }} 
              className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Import Content
              <input id="sboard-file-upload" type="file" className="hidden" accept=".pdf,image/*,.pptx" onChange={(e) => { if(e.target.files) onDrop(Array.from(e.target.files)); }} />
            </button>
            <button 
              onClick={() => setShowDashboardSelector(true)}
              className="hidden sm:flex px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm font-medium text-gray-300 hover:text-white transition-colors items-center gap-2"
            >
              <Database className="w-4 h-4" /> From Dashboard
            </button>
            {slides.length > 0 && (
              <button 
                onClick={handleExportAllPDF} 
                className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
            )}
          </div>
        </div>
        
        {/* Slide Navigation (Center) */}
        {slides.length > 0 && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-[#1a1a1a] border border-white/10 rounded-xl p-1 shadow-inner">
            <button 
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))} 
              disabled={currentSlideIndex === 0} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="px-4 text-sm font-mono text-gray-300 cursor-pointer hover:text-white">
              {currentSlideIndex + 1} <span className="opacity-50">/ {slides.length}</span>
            </div>
            <button 
              onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))} 
              disabled={currentSlideIndex === slides.length - 1} 
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Right Tools */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:flex px-4 py-1.5 rounded-lg bg-[#b026ff]/10 border border-[#b026ff]/30 text-[#b026ff] hover:bg-[#b026ff]/20 text-sm font-bold transition-all items-center gap-2 shadow-[0_0_15px_rgba(176,38,255,0.15)]">
            <MagicWand className="w-4 h-4" /> Slide AI
          </button>
          <div className="w-px h-6 bg-white/10" />
          <button 
            onClick={() => setShowRightSidebar(!showRightSidebar)} 
            className={`p-2 rounded-lg transition-colors ${showRightSidebar ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {showRightSidebar ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative mt-14">
        
        {/* Left Sidebar - Slides Thumbnails */}
        <AnimatePresence>
          {showLeftSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111] border-r border-white/5 flex flex-col shrink-0 z-30 overflow-hidden shadow-2xl relative"
            >
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col relative" {...getRootProps()}>
                {/* Enable drag-and-drop on the sidebar too */}
                <input {...getInputProps()} />

                {slides.map((slide, idx) => (
                  <div 
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`relative group shrink-0 aspect-[16/9] bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                      currentSlideIndex === idx ? 'border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)]' : 'border-transparent hover:border-white/20'
                    }`}
                  >
                     <img src={slide.imageUrl || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='} alt={`Slide ${idx + 1}`} className="w-full h-full object-contain" />
                     <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center gap-2 ${currentSlideIndex === idx ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                        <button 
                          className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg shadow-lg transform active:scale-95 transition-all" 
                          onClick={(e) => { e.stopPropagation(); deleteSlide(idx); }}
                          title="Delete Slide"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                     </div>
                     <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${currentSlideIndex === idx ? 'bg-[#00f0ff] text-black' : 'bg-black/60 text-white'}`}>
                       {idx + 1}
                     </div>
                  </div>
                ))}

                <button 
                  onClick={addBlankSlide} 
                  className="w-full shrink-0 aspect-[16/9] border-2 border-dashed border-white/10 hover:border-white/30 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Plus className="w-6 h-6 mb-1" />
                  <span className="text-[10px] uppercase tracking-widest font-bold">New Slide</span>
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Central Whiteboard Canvas */}
        <main className="flex-1 relative bg-[#0a0a0a] outline-none overflow-hidden flex items-center justify-center">
          {isDragActive && (
            <div className="absolute inset-0 z-50 bg-[#00F0FF]/10 backdrop-blur-sm border-2 border-[#00F0FF] border-dashed rounded-3xl m-4 flex flex-col items-center justify-center pointer-events-none">
              <Upload className="w-20 h-20 text-[#00F0FF] mb-6 animate-bounce" />
              <h2 className="text-4xl font-display font-bold text-white tracking-widest text-center uppercase mb-2">Drop to Import</h2>
              <p className="text-[#00F0FF] text-xl">Instantly convert PDFs and Images into interactive slides</p>
            </div>
          )}

          {slides.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 max-w-2xl w-full" {...getRootProps()}>
              <input {...getInputProps()} />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-[#111] border border-white/5 rounded-3xl p-12 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-50" />
                
                <div className="w-24 h-24 bg-gradient-to-br from-[#00f0ff]/20 to-[#b026ff]/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <Presentation className="w-12 h-12 text-white" />
                </div>
                
                <h1 className="text-4xl font-display font-bold text-white mb-4">Classroom Workspace</h1>
                <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                  A premium environment for interactive teaching. Drag and drop your PDFs, PPTXs or images to instantly create a fully feature-rich presentation board.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => {
                        const el = document.getElementById("sboard-file-upload");
                        if(el) el.click();
                    }}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" /> Upload File
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addBlankSlide(); }}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <LayoutTemplate className="w-5 h-5" /> Blank Canvas
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
             <div className="w-full h-full relative" {...getRootProps()}>
               {/* We don't want click on the canvas to trigger dropzone, so we use noClick: true */}
               <Whiteboard 
                  key={slides[currentSlideIndex].id}
                  initialData={slides[currentSlideIndex].whiteboardData}
                  onSave={handleSaveWhiteboard}
                  className="h-full w-full !border-0 !rounded-none !shadow-none"
                  theme="dark"
                  backgroundImage={slides[currentSlideIndex].imageUrl}
                />
             </div>
          )}

          {/* Processing Overlay */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center"
              >
                <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-[#00F0FF] animate-pulse" /> Processing Content
                    </h3>
                    <span className="text-[#00F0FF] font-mono font-bold">{Math.round((processProgress / Math.max(1, totalItems)) * 100)}%</span>
                  </div>
                  <div className="h-3 w-full bg-black rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#00F0FF] to-[#b026ff]"
                      initial={{ width: "0%" }}
                      animate={{ width: `${(processProgress / Math.max(1, totalItems)) * 100}%` }}
                      transition={{ bounce: 0, duration: 0.2 }}
                    />
                  </div>
                  <p className="text-center text-gray-500 text-sm mt-4 font-medium uppercase tracking-widest">
                    Page {processProgress} of {totalItems}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Sidebar - Properties & Tools */}
        <AnimatePresence>
          {showRightSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111] border-l border-white/5 flex flex-col shrink-0 z-30 overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Properties</h3>
              </div>
              <div className="p-4 space-y-6">
                
                {/* Advanced Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <MagicWand className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Dashboard Controls</span>
                  </div>
                  <div className="bg-black/50 rounded-xl p-3 border border-white/5 space-y-3">
                    <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-white/5 rounded-lg transition-colors group">
                      <div className="flex items-center gap-2">
                        <LayoutTemplate className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        <span className="text-sm text-gray-300 group-hover:text-white">Smart Auto-Layout</span>
                      </div>
                      <div className="w-8 h-4 rounded-full bg-[#00F0FF]/20 relative">
                        <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[#00F0FF]" />
                      </div>
                    </button>
                    <button className="w-full flex items-center justify-between px-2 py-2 hover:bg-white/5 rounded-lg transition-colors group">
                      <div className="flex items-center gap-2">
                        <Presentation className="w-4 h-4 text-gray-400 group-hover:text-white" />
                        <span className="text-sm text-gray-300 group-hover:text-white">Classroom Mode</span>
                      </div>
                      <div className="w-8 h-4 rounded-full bg-white/10 relative">
                        <div className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-gray-400" />
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Assistant</span>
                  </div>
                  <div className="bg-gradient-to-br from-[#00f0ff]/10 to-[#b026ff]/10 rounded-xl p-3 border border-white/10 space-y-2">
                    <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                      Use AI to analyze this slide, suggest diagrams, or automatically clean up messy annotations.
                    </p>
                    <button className="w-full py-2 bg-black/40 hover:bg-black/60 border border-white/5 text-sm font-medium rounded-lg text-gray-300 hover:text-white transition-colors">
                      Clean Up Strokes
                    </button>
                    <button className="w-full py-2 bg-black/40 hover:bg-black/60 border border-white/5 text-sm font-medium rounded-lg text-gray-300 hover:text-white transition-colors">
                      Suggest Diagram
                    </button>
                  </div>
                </div>

                {/* Import Quality Settings */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Settings className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Asset Resolution</span>
                  </div>
                  <div className="bg-black/50 rounded-xl p-3 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Render Quality</span>
                      <span className="text-sm font-mono text-[#00F0FF]">{importSettings.quality}x</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="4" 
                      step="0.5"
                      value={importSettings.quality}
                      onChange={(e) => setImportSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                      className="w-full accent-[#00F0FF]"
                    />
                    <div className="flex justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                      <span>SD</span>
                      <span>4K Ultra</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Slide Info</span>
                  </div>
                  {slides.length > 0 ? (
                    <div className="bg-black/50 rounded-xl p-3 border border-white/5 space-y-2">
                       <div className="flex justify-between items-center border-b border-white/5 pb-2">
                         <span className="text-xs text-gray-500">Current Slide</span>
                         <span className="text-xs font-medium text-white">{currentSlideIndex + 1}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-2 pt-1">
                         <span className="text-xs text-gray-500">Total Slides</span>
                         <span className="text-xs font-medium text-white">{slides.length}</span>
                       </div>
                       <div className="flex justify-between items-center pt-1">
                         <span className="text-xs text-gray-500">Auto-saved</span>
                         <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                           <Database className="w-3 h-3" /> Synced
                         </span>
                       </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-4">No active presentation.</p>
                  )}
                </div>

                {slides.length > 0 && (
                  <button 
                    onClick={clearSlides}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-bold mt-8"
                  >
                    <Trash2 className="w-4 h-4" /> Force Clear Workspace
                  </button>
                )}
                
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
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
