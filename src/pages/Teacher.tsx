import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Presentation, ChevronRight, ChevronLeft, Play, Trash2, Settings, Sparkles, Info, Database } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { useTeacherStore } from '../store/useTeacherStore';
import Whiteboard from '../components/Whiteboard';
import { DashboardFileSelector } from '../components/DashboardFileSelector';

// Set up PDF.js worker
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Teacher() {
  const { slides, currentSlideIndex, setSlides, setCurrentSlideIndex, updateSlideWhiteboardData, clearSlides } = useTeacherStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);
  const [importSettings, setImportSettings] = useState({
    quality: 2, // Scale factor
    renderAnnotations: true,
  });

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
              imageUrl: canvas.toDataURL('image/png'),
              whiteboardData: '',
            });
          }
          setProcessProgress(i);
        }
        setSlides(newSlides);
      } else if (file.type.startsWith('image/')) {
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
      <div className="fixed inset-0 z-[60] bg-black">
        <div className="absolute bottom-4 left-4 z-[70] flex items-center gap-2 bg-black/50 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10">
          <button 
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            className="p-2 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowSlidePreview(!showSlidePreview)}
            className="px-4 py-2 text-white font-mono text-sm hover:bg-white/10 rounded-xl transition-colors"
          >
            {currentSlideIndex + 1} / {slides.length}
          </button>

          <button 
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <div className="w-[1px] h-6 bg-white/20 mx-2" />
          
          <button 
            onClick={() => {
              const newSlides = [...slides];
              newSlides.splice(currentSlideIndex + 1, 0, {
                id: `slide-blank-${Date.now()}`,
                imageUrl: '', // Blank slide
                whiteboardData: ''
              });
              setSlides(newSlides);
              setCurrentSlideIndex(currentSlideIndex + 1);
            }}
            className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-colors"
            title="Add Blank Slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>

          <div className="w-[1px] h-6 bg-white/20 mx-2" />
          
          <button 
            onClick={() => setShowWhiteboard(false)}
            className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg uppercase tracking-wider transition-colors"
          >
            Exit
          </button>
        </div>

        <AnimatePresence>
          {showSlidePreview && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 z-[70] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-4 overflow-x-auto max-w-[calc(100vw-2rem)] shadow-2xl"
            >
              {slides.map((slide, idx) => (
                <div 
                  key={slide.id}
                  onClick={() => {
                    setCurrentSlideIndex(idx);
                    setShowSlidePreview(false);
                  }}
                  className={`relative shrink-0 w-32 aspect-[16/9] rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    idx === currentSlideIndex ? 'border-indigo-500' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} className="w-full h-full object-cover" alt={`Slide ${idx + 1}`} />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="text-white/30 text-xs">Blank</span>
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white">
                    {idx + 1}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Whiteboard 
          key={slides[currentSlideIndex].id}
          initialData={slides[currentSlideIndex].whiteboardData}
          onSave={handleSaveWhiteboard}
          onClose={() => setShowWhiteboard(false)}
          className="h-full w-full"
          theme="dark"
          backgroundImage={slides[currentSlideIndex].imageUrl}
        />
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
                  <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
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
                    <img src={slide.imageUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
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
