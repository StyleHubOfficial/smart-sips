import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, Presentation, ChevronRight, ChevronLeft, Play, Trash2, Settings, Sparkles, Info, Database } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useTeacherStore } from '../store/useTeacherStore';
import { usePracticeStore } from '../store/usePracticeStore';
import Whiteboard from '../components/Whiteboard';
import { DashboardFileSelector } from '../components/DashboardFileSelector';

export default function Teacher() {
  const { slides, currentSlideIndex, setSlides, setCurrentSlideIndex, updateSlideWhiteboardData, clearSlides } = useTeacherStore();
  const isSmartPanelMode = usePracticeStore((state) => state.isSmartPanelMode);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [importSettings, setImportSettings] = useState({
    quality: 2, // Scale factor
    renderAnnotations: true,
  });

  const [showSlideGrid, setShowSlideGrid] = useState(false);
  const [showDashboardSelector, setShowDashboardSelector] = useState(false);

  const processFile = async (file: File | { url: string, type: string, name: string }) => {
    setIsProcessing(true);
    setProcessProgress(0);
    try {
      // Dynamic imports for heavy PDF libraries
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const pdfWorker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker.default;

      const isDashboardFile = 'url' in file;
      const fileType = isDashboardFile ? file.type : file.type;
      const fileName = isDashboardFile ? file.name : file.name;

      if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        let arrayBuffer: ArrayBuffer;
        if (isDashboardFile) {
          const response = await fetch(file.url);
          arrayBuffer = await response.arrayBuffer();
        } else {
          arrayBuffer = await (file as File).arrayBuffer();
        }

        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const newSlides = [];
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
              imageUrl: canvas.toDataURL('image/png'),
              whiteboardData: '',
            });
          }
          setProcessProgress(i);
        }
        setSlides(newSlides);
      } else if (fileType.startsWith('image/') || fileName.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/)) {
        setTotalItems(1);
        if (isDashboardFile) {
          setSlides([{
            id: `slide-${Date.now()}`,
            imageUrl: file.url,
            whiteboardData: '',
          }]);
          setProcessProgress(1);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            setSlides([{
              id: `slide-${Date.now()}`,
              imageUrl: e.target?.result as string,
              whiteboardData: '',
            }]);
            setProcessProgress(1);
          };
          reader.readAsDataURL(file as File);
        }
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process file. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (slides.length === 0) return;
    setIsExporting(true);

    try {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1920, 1080] // Standard HD format for consistency
      });

      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        if (i > 0) pdf.addPage([1920, 1080], 'landscape');

        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        // 1. Draw background (dark theme to match whiteboard)
        ctx.fillStyle = '#1a1b26';
        ctx.fillRect(0, 0, 1920, 1080);

        // 2. Draw slide image
        const img = new Image();
        if (!slide.imageUrl.startsWith('data:')) {
          img.crossOrigin = "anonymous";
        }
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = slide.imageUrl;
        });
        
        // Draw image maintaining aspect ratio
        const imgRatio = img.width / img.height;
        const canvasRatio = 1920 / 1080;
        let drawWidth = 1920;
        let drawHeight = 1080;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > canvasRatio) {
          drawHeight = 1920 / imgRatio;
          offsetY = (1080 - drawHeight) / 2;
        } else {
          drawWidth = 1080 * imgRatio;
          offsetX = (1920 - drawWidth) / 2;
        }
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // 3. Draw whiteboard strokes
        if (slide.whiteboardData) {
          try {
            const strokes = JSON.parse(slide.whiteboardData);
            strokes.forEach((stroke: any) => {
              ctx.save();
              
              // Handle rotation/scale if present
              if (stroke.center && (stroke.rotation || stroke.scale)) {
                ctx.translate(stroke.center.x, stroke.center.y);
                if (stroke.rotation) ctx.rotate(stroke.rotation);
                if (stroke.scale) ctx.scale(stroke.scale.x, stroke.scale.y);
                ctx.translate(-stroke.center.x, -stroke.center.y);
              }

              ctx.beginPath();
              ctx.strokeStyle = stroke.color;
              ctx.lineWidth = stroke.lineWidth || stroke.width || 3;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.globalAlpha = stroke.opacity || 1;

              if ((stroke.type === 'path' || stroke.type === 'lasso') && stroke.points && stroke.points.length > 0) {
                if (stroke.points.length === 1) {
                  ctx.fillStyle = stroke.color;
                  ctx.beginPath();
                  ctx.arc(stroke.points[0].x, stroke.points[0].y, (stroke.lineWidth || stroke.width || 3) / 2, 0, Math.PI * 2);
                  ctx.fill();
                } else {
                  if (stroke.type === 'lasso') {
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = '#00F0FF';
                    ctx.lineWidth = 1;
                  }
                  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
                  for (let j = 1; j < stroke.points.length; j++) {
                    ctx.lineTo(stroke.points[j].x, stroke.points[j].y);
                  }
                  ctx.stroke();
                  if (stroke.type === 'lasso') ctx.setLineDash([]);
                }
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
                // Simple arrow drawing
                const headlen = 15;
                const angle = Math.atan2(stroke.endPos.y - stroke.startPos.y, stroke.endPos.x - stroke.startPos.x);
                ctx.moveTo(stroke.startPos.x, stroke.startPos.y);
                ctx.lineTo(stroke.endPos.x, stroke.endPos.y);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(stroke.endPos.x, stroke.endPos.y);
                ctx.lineTo(stroke.endPos.x - headlen * Math.cos(angle - Math.PI / 6), stroke.endPos.y - headlen * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(stroke.endPos.x, stroke.endPos.y);
                ctx.lineTo(stroke.endPos.x - headlen * Math.cos(angle + Math.PI / 6), stroke.endPos.y - headlen * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
              } else if (stroke.type === 'text' && (stroke.startPos || (stroke.points && stroke.points[0])) && stroke.text) {
                const pos = stroke.startPos || stroke.points[0];
                const size = (stroke.lineWidth || stroke.width || 3) * 5;
                ctx.font = `${size}px Inter, sans-serif`;
                ctx.fillStyle = stroke.color;
                ctx.fillText(stroke.text, pos.x, pos.y);
              }
              ctx.restore();
            });
          } catch (e) {
            console.error("Failed to parse whiteboard data for export:", e);
          }
        }

        const slideData = canvas.toDataURL('image/png', 1.0); // Use PNG with max quality
        pdf.addImage(slideData, 'PNG', 0, 0, 1920, 1080);
      }

      pdf.save(`lecture-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    await processFile(file);
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

  const handleSaveWhiteboard = (data: string) => {
    updateSlideWhiteboardData(currentSlideIndex, data);
  };

  if (showWhiteboard) {
    return (
      <div className="fixed inset-0 z-[60] bg-black overflow-hidden">
        {/* Floating Slide Changer at Bottom Left */}
        <div className="absolute bottom-6 left-6 z-[100] flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
          <button 
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex === 0}
            className="p-2.5 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowSlideGrid(true)}
            className="px-4 py-2 text-white font-mono text-sm hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2"
          >
            <span className="opacity-50">Slide</span>
            <span className="font-bold">{currentSlideIndex + 1}</span>
            <span className="opacity-50">/</span>
            <span className="opacity-50">{slides.length}</span>
          </button>

          <button 
            onClick={() => setCurrentSlideIndex(Math.min(slides.length - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="p-2.5 text-white hover:bg-white/10 rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Exit Button at Top Right */}
        <button 
          onClick={() => setShowWhiteboard(false)}
          className="absolute top-6 right-6 z-[100] px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-2xl font-bold text-sm transition-all backdrop-blur-xl"
        >
          Exit Session
        </button>

        {/* Slide Grid Overlay */}
        <AnimatePresence>
          {showSlideGrid && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl p-8 overflow-y-auto"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                  <h2 className="text-3xl font-display font-bold text-white">All Slides</h2>
                  <button 
                    onClick={() => setShowSlideGrid(false)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-colors"
                  >
                    <Trash2 className="w-6 h-6 rotate-45" /> {/* Using Trash2 rotated as a close icon for simplicity or just X */}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {slides.map((slide, idx) => (
                    <motion.div
                      key={slide.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCurrentSlideIndex(idx);
                        setShowSlideGrid(false);
                      }}
                      className={`relative aspect-[16/9] rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                        currentSlideIndex === idx ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <img src={slide.imageUrl} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                        Page {idx + 1}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
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
          isSmartPanelMode={isSmartPanelMode}
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
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-white">Teacher Mode</h1>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-widest">Beta</span>
            </div>
            <p className="text-gray-400 text-lg">Convert your teaching materials into interactive AI slides.</p>
          </div>
          
          {slides.length > 0 && (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-bold disabled:opacity-50"
              >
                <FileText className="w-5 h-5 text-[#00F0FF]" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button 
                onClick={clearSlides}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-bold"
              >
                <Trash2 className="w-5 h-5" />
                Clear All
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
            {isProcessing && (
              <div className="glass-panel rounded-[2rem] p-8 border border-indigo-500/30 bg-indigo-500/5 mb-8">
                <div className="flex justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white">Processing Material</span>
                      <p className="text-xs text-gray-400">Converting pages to high-quality interactive slides...</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono text-indigo-400 font-bold">{processProgress} / {totalItems}</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <motion.div 
                    className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${(processProgress / Math.max(1, totalItems)) * 100}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  />
                </div>
              </div>
            )}

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
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                  Drag and drop your PDF, PPTX or images here. We'll convert them into high-quality interactive slides.
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
                    <FileText className="w-4 h-4" /> PDF
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
                    <Presentation className="w-4 h-4" /> PPTX
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400">
                    <Sparkles className="w-4 h-4" /> Images
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 w-full max-w-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDashboardSelector(true);
                    }}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    <Database className="w-5 h-5 text-indigo-400" />
                    Select from Dashboard
                  </button>
                </div>
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
                  "Use the Pen tool for smooth writing experience."
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
        <DashboardFileSelector 
          isOpen={showDashboardSelector}
          onClose={() => setShowDashboardSelector(false)}
          onSelect={(file) => {
            processFile({
              url: file.url,
              type: file.resource_type === 'image' ? 'image/png' : 'application/pdf',
              name: file.name
            });
            setShowDashboardSelector(false);
          }}
        />
      </div>
    </div>
  );
}
