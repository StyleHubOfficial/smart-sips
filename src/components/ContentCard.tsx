import React from "react";
import { motion } from "motion/react";
import { FileText, Video, Image as ImageIcon, Download, Eye, File, Edit2, Trash2, Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useCoPilotStore } from "../store/useCoPilotStore";

export interface ContentItem {
  public_id: string;
  secure_url: string;
  created_at: string;
  resource_type: string;
  format: string;
  context?: {
    custom?: {
      title?: string;
      teacher?: string;
      subject?: string;
      class?: string;
      description?: string;
      fileType?: string;
      tags?: string;
    }
  }
}

export const getFileIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case "pdf": return <FileText className="w-6 h-6 text-red-400" />;
    case "video": return <Video className="w-6 h-6 text-blue-400" />;
    case "image": return <ImageIcon className="w-6 h-6 text-green-400" />;
    case "ppt": return <File className="w-6 h-6 text-orange-400" />;
    default: return <File className="w-6 h-6 text-gray-400" />;
  }
};

export const ContentCard = React.memo(({ 
  item, 
  viewMode, 
  isAuthenticated, 
  deletingId, 
  onEdit, 
  onDelete 
}: { 
  item: ContentItem, 
  viewMode: 'grid' | 'list', 
  isAuthenticated: boolean, 
  deletingId: string | null, 
  onEdit: (item: ContentItem) => void, 
  onDelete: (id: string, type: string) => void
}) => {
  const meta: any = item.context?.custom || item.context || {};
  
  const deriveTitle = () => {
    const rawTitle = meta.title || "";
    const fileName = item.public_id.split('/').pop() || "";
    
    const isHash = (text: string) => {
      if (!text) return false;
      return text.length > 15 && !text.includes(' ') && !text.includes('-') && !text.includes('_') && !/[aeiouy]{2,}/i.test(text);
    };

    if (rawTitle && rawTitle.length > 1) return rawTitle;
    
    if (meta.description && meta.description.length > 5 && !isHash(meta.description)) {
      const firstLine = meta.description.split('\n')[0].split('.')[0].trim();
      if (firstLine.length > 3 && firstLine.length < 60) return firstLine;
    }

    if (fileName && !isHash(fileName)) {
      const cleanName = fileName
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\.[^/.]+$/, "")
        .replace(/\d{10,}/g, '')
        .trim();
      if (cleanName.length > 2) {
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    }
    
    if (meta.subject && meta.subject !== 'All') return `${meta.subject} Resource`;
    return "Educational Resource";
  };

  const title = deriveTitle();
  const fileType = meta.fileType || item.format?.toUpperCase() || "Document";
  const date = new Date(item.created_at);
  const openCoPilotModal = useCoPilotStore(state => state.openModal);
  
  const isAiGenerated = meta.teacher === 'AI Assistant' || 
                        meta.description?.toLowerCase().includes('ai-generated') ||
                        meta.tags?.toLowerCase().includes('ai') ||
                        meta.title?.toLowerCase().includes('ai');

  const renderThumbnail = (size: 'sm' | 'lg') => {
    const isPdf = item.format === 'pdf';
    const isImage = item.resource_type === 'image' && !isPdf;
    const isVideo = item.resource_type === 'video';
    
    const neonBorderClass = size === 'lg' ? 'shadow-[0_0_20px_rgba(0,240,255,0.2)] border-[#00F0FF]/40' : 'border-white/10';
    
    if (isPdf) {
      const thumbUrl = item.secure_url.replace(/\.pdf$/, '.jpg').replace('/upload/', '/upload/w_400,h_600,c_fill,g_north,pg_1/');
      return <img src={thumbUrl} alt={title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 border ${neonBorderClass}`} referrerPolicy="no-referrer" />;
    }

    if (isImage) {
      return <img src={item.secure_url} alt={title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 border ${neonBorderClass}`} referrerPolicy="no-referrer" />;
    }
    
    if (isVideo) {
      const thumbUrl = item.secure_url.replace(/\.[^/.]+$/, '.jpg').replace('/upload/', '/upload/w_400,h_225,c_fill,so_1/');
      return <img src={thumbUrl} alt={title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 border ${neonBorderClass}`} referrerPolicy="no-referrer" />;
    }

    const getNeonGradient = (subject?: string) => {
      const s = subject?.toLowerCase() || '';
      if (s.includes('physic')) return 'from-[#00F0FF] to-[#0066FF]';
      if (s.includes('chem')) return 'from-[#FF00E5] to-[#B026FF]';
      if (s.includes('math')) return 'from-[#00FF85] to-[#00A3FF]';
      if (s.includes('bio')) return 'from-[#FFD600] to-[#FF8A00]';
      return 'from-[#00F0FF] to-[#B026FF]';
    };

    const neonGradient = getNeonGradient(meta.subject);

    return (
      <div className={`w-full h-full bg-gradient-to-br ${neonGradient} p-4 flex flex-col items-center justify-center text-center relative overflow-hidden group border ${neonBorderClass}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        
        {/* Futuristic Grid for AI Content */}
        {isAiGenerated && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00F0FF] rounded-full mix-blend-screen filter blur-[50px] opacity-50 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#B026FF] rounded-full mix-blend-screen filter blur-[50px] opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </>
        )}
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {getFileIcon(fileType)}
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md">{fileType}</span>
        </div>
        
        {isAiGenerated && (
          <div className="absolute top-3 right-3 z-20 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-[#00F0FF]/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00F0FF] drop-shadow-[0_0_5px_rgba(0,240,255,0.8)]" />
            <span className="text-[8px] font-bold text-[#00F0FF] uppercase tracking-wider">AI Generated</span>
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <motion.div 
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0 }
        }}
        whileHover={{ scale: 1.01 }}
        className="glass-panel rounded-xl overflow-hidden border border-white/10 group hover:border-[#00F0FF]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-colors transition-shadow duration-300 relative flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4"
      >
        <div className="flex items-center gap-4 w-full sm:w-auto flex-1 min-w-0">
          <div className="w-16 h-16 rounded-lg bg-black/50 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden relative">
            {renderThumbnail('sm')}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-lg truncate text-white group-hover:text-[#00F0FF] transition-colors" title={title}>{title}</h3>
            <p className="text-sm text-gray-400 truncate">{meta.subject || "General"} • {meta.class || "All Classes"} • By {meta.teacher || "Teacher"} • {format(date, "MMM d, yyyy")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/10 sm:border-0">
          <button 
            onClick={() => openCoPilotModal(item)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 hover:from-[#00F0FF]/20 hover:to-[#B026FF]/20 border border-[#00F0FF]/30 transition-all text-[#00F0FF] text-xs font-bold uppercase tracking-wider"
            title="AI Classroom Co-Pilot"
          >
            <Sparkles className="w-3 h-3" /> Auto Suggest (AI)
          </button>
          <a 
            href={item.secure_url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => {
              const url = item.secure_url;
              const isHtml = item.resource_type === 'raw' && (url.includes('.html') || fileType.includes('HTML'));
              const isPdf = url.toLowerCase().endsWith('.pdf') || item.format === 'pdf';
              
              if (isPdf) {
                e.preventDefault();
                const pdfUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                window.open(pdfUrl, '_blank');
              } else if (isHtml) {
                e.preventDefault();
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
                fetch(proxyUrl)
                  .then(res => {
                    if (!res.ok) throw new Error(`Proxy fetch failed: ${res.statusText}`);
                    return res.text();
                  })
                  .then(text => {
                    const blob = new Blob([text], { type: 'text/html' });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                  })
                  .catch(() => window.open(url, '_blank'));
              }
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </a>
          <button 
            onClick={async (e) => {
              e.preventDefault();
              const url = item.secure_url;
              const isPdf = url.toLowerCase().endsWith('.pdf') || item.format === 'pdf';
              const downloadUrl = isPdf && url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
              window.open(downloadUrl, '_blank');
            }}
            className="p-2 rounded-lg bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 hover:from-[#00F0FF]/40 hover:to-[#B026FF]/40 border border-[#00F0FF]/30 transition-all duration-300 text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          {isAuthenticated && (
            <>
              <button 
                onClick={() => onEdit(item)}
                className="p-2 rounded-lg bg-white/5 hover:bg-[#00F0FF]/20 text-gray-400 hover:text-[#00F0FF] transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete(item.public_id, item.resource_type)}
                disabled={deletingId === item.public_id}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                {deletingId === item.public_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass-panel rounded-2xl overflow-hidden border border-white/10 group hover:border-transparent hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-colors transition-shadow duration-300 relative flex flex-col"
    >
      {/* Animated Neon Border */}
      <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-[#00F0FF] via-[#B026FF] to-[#00F0FF] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy pointer-events-none z-50" style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00F0FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      {isAuthenticated && (
        <div className="absolute top-3 left-3 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
          <button 
            onClick={() => onEdit(item)}
            className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(item.public_id, item.resource_type)}
            disabled={deletingId === item.public_id}
            className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
            title="Delete"
          >
            {deletingId === item.public_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      )}

      <div className="h-40 bg-black/50 relative flex items-center justify-center overflow-hidden border-b border-white/5">
        {renderThumbnail('lg')}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2 z-20">
          {getFileIcon(fileType)}
          {fileType}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col relative z-10">
        <div className="flex items-start gap-3 mb-1">
          <div className="mt-1 opacity-70">
            {getFileIcon(fileType)}
          </div>
          <h3 className="font-display font-semibold text-lg truncate text-white group-hover:text-[#00F0FF] transition-colors flex-1" title={title}>{title}</h3>
        </div>
        <p className="text-sm text-gray-400 mb-2 truncate">{meta.subject || "General"} • {meta.class || "All Classes"}</p>
        
        {meta.tags && (
          <div className="flex flex-wrap gap-1 mb-4 overflow-hidden h-6">
            {meta.tags.split(',').map((tag: string, idx: number) => (
              <span key={idx} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#00F0FF] uppercase tracking-wider whitespace-nowrap">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-auto flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>By {meta.teacher || "Teacher"}</span>
          <span>{format(date, "MMM d, yyyy")}</span>
        </div>

        <button 
          onClick={() => openCoPilotModal(item)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 hover:from-[#00F0FF]/20 hover:to-[#B026FF]/20 border border-[#00F0FF]/30 transition-all text-[#00F0FF] text-sm font-bold uppercase tracking-wider group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <Sparkles className="w-4 h-4 animate-pulse" /> Auto Suggest (AI)
        </button>

        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <a 
            href={item.secure_url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={async (e) => {
              e.preventDefault();
              const url = item.secure_url;
              const isHtml = item.resource_type === 'raw' && (url.includes('.html') || fileType.includes('HTML'));
              const isPdf = url.toLowerCase().endsWith('.pdf') || item.format === 'pdf';
              
              if (isPdf) {
                const pdfUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
                window.open(pdfUrl, '_blank');
              } else if (isHtml) {
                try {
                  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
                  const response = await fetch(proxyUrl);
                  if (!response.ok) throw new Error(`Proxy fetch failed: ${response.statusText}`);
                  const text = await response.text();
                  const blob = new Blob([text], { type: 'text/html' });
                  const blobUrl = URL.createObjectURL(blob);
                  window.open(blobUrl, '_blank');
                } catch (err) {
                  const win = window.open(url, '_blank');
                  if (win) win.focus();
                }
              } else {
                const win = window.open(url, '_blank');
                if (win) win.focus();
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-sm font-medium"
            title="View Content"
          >
            <Eye className="w-4 h-4" /> View
          </a>
          <button 
            onClick={async (e) => {
              e.preventDefault();
              const url = item.secure_url;
              const isPdf = url.toLowerCase().endsWith('.pdf') || item.format === 'pdf';
              const downloadUrl = isPdf && url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
              window.open(downloadUrl, '_blank');
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 hover:from-[#00F0FF]/40 hover:to-[#B026FF]/40 border border-[#00F0FF]/30 py-2 rounded-xl transition-all duration-300 text-sm font-medium text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(0,240,255,0.5)]"
            title="Download Content"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </motion.div>
  );
});
