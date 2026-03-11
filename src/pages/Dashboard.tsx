import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, FileText, Video, Image as ImageIcon, Download, Eye, File, MoreVertical, Edit2, Trash2, Loader2, X, Save, Bell, LayoutGrid, List, BrainCircuit, MonitorPlay, GitGraph, Sparkles, Presentation, Activity, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAppStore } from "../store/useAppStore";
import { useCoPilotStore } from "../store/useCoPilotStore";
import AutoSuggestModal from "../components/AutoSuggestModal";
import { Link } from "react-router-dom";
import axios from "axios";

interface DashboardProps {
  isSmartPanelMode: boolean;
}

interface ContentItem {
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
    }
  }
}

const ContentCard = React.memo(({ 
  item, 
  viewMode, 
  isAuthenticated, 
  deletingId, 
  onEdit, 
  onDelete, 
  getFileIcon 
}: { 
  item: ContentItem, 
  viewMode: 'grid' | 'list', 
  isAuthenticated: boolean, 
  deletingId: string | null, 
  onEdit: (item: ContentItem) => void, 
  onDelete: (id: string, type: string) => void,
  getFileIcon: (type: string) => React.ReactNode
}) => {
  // Cloudinary context can be flat or nested in custom depending on API version/method
  const meta: any = item.context?.custom || item.context || {};
  
  // Improved title derivation
  const deriveTitle = () => {
    const rawTitle = meta.title || "";
    const fileName = item.public_id.split('/').pop() || "";
    
    // Simple heuristic for random hashes
    const isHash = (text: string) => {
      if (!text) return false;
      // If it's a long string with no spaces/dashes and looks like a hash
      return text.length > 15 && !text.includes(' ') && !text.includes('-') && !text.includes('_') && !/[aeiouy]{2,}/i.test(text);
    };

    // 1. Use title if it exists and isn't just a hash
    if (rawTitle && rawTitle.length > 1) return rawTitle;
    
    // 2. Try to extract from description
    if (meta.description && meta.description.length > 5 && !isHash(meta.description)) {
      const firstLine = meta.description.split('\n')[0].split('.')[0].trim();
      if (firstLine.length > 3 && firstLine.length < 60) return firstLine;
    }

    // 3. Use cleaned fileName if not a hash
    if (fileName && !isHash(fileName)) {
      const cleanName = fileName.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\.[^/.]+$/, "");
      if (cleanName.length > 2) {
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    }
    
    // 4. Fallback to subject or generic
    if (meta.subject && meta.subject !== 'All') return `${meta.subject} Resource`;
    return "Educational Resource";
  };

  const title = deriveTitle();
  const fileType = meta.fileType || item.format?.toUpperCase() || "Document";
  const date = new Date(item.created_at);
  const openCoPilotModal = useCoPilotStore(state => state.openModal);
  
  // Stricter AI detection: Only if explicitly marked as AI Assistant
  const isAiGenerated = meta.teacher === 'AI Assistant' || (meta.description?.includes('AI-generated') && !meta.teacher);

  // Dynamic background colors based on subject
  const getSubjectColor = (subject?: string) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('physics')) return 'from-blue-600/40 to-cyan-400/40';
    if (s.includes('chemistry')) return 'from-purple-600/40 to-pink-400/40';
    if (s.includes('math')) return 'from-emerald-600/40 to-teal-400/40';
    if (s.includes('bio')) return 'from-green-600/40 to-lime-400/40';
    return 'from-[#00F0FF]/30 to-[#B026FF]/40';
  };

  const subjectColor = getSubjectColor(meta.subject);

  // Thumbnail logic
  const renderThumbnail = (size: 'sm' | 'lg') => {
    const isImage = item.resource_type === 'image';
    const isVideo = item.resource_type === 'video';
    const isPdf = item.format === 'pdf';
    
    const neonBorderClass = size === 'lg' ? 'shadow-[0_0_20px_rgba(0,240,255,0.2)] border-[#00F0FF]/40' : 'border-white/10';
    
    if (isImage) {
      return <img src={item.secure_url} alt={title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 border ${neonBorderClass}`} referrerPolicy="no-referrer" />;
    }
    
    if (isVideo) {
      const thumbUrl = item.secure_url.replace(/\.[^/.]+$/, '.jpg');
      return <img src={thumbUrl} alt={title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 border ${neonBorderClass}`} referrerPolicy="no-referrer" />;
    }
    
    if (isPdf) {
      const thumbUrl = item.secure_url.replace(/\.pdf$/, '.jpg');
      return <img src={thumbUrl} alt={title} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 border ${neonBorderClass}`} referrerPolicy="no-referrer" />;
    }

    // Fallback for AI or other files
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
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            {getFileIcon(fileType)}
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-widest">{fileType}</span>
        </div>
        
        {isAiGenerated && (
          <div className="absolute top-3 right-3 z-20">
            <Sparkles className="w-5 h-5 text-[#00F0FF] drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
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
        className="glass-panel rounded-xl overflow-hidden border border-white/10 group hover:border-[#00F0FF]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300 relative flex flex-col sm:flex-row items-start sm:items-center p-4 gap-4"
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
              // Direct opening for most files, special handling for HTML if needed
              const url = item.secure_url;
              const isHtml = item.resource_type === 'raw' && (url.includes('.html') || fileType.includes('HTML'));
              
              if (isHtml) {
                e.preventDefault();
                fetch(url)
                  .then(res => res.text())
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
          <a 
            href={item.secure_url.includes('/upload/') ? item.secure_url.replace('/upload/', '/upload/fl_attachment/') : item.secure_url} 
            download={title}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 hover:from-[#00F0FF]/40 hover:to-[#B026FF]/40 border border-[#00F0FF]/30 transition-colors text-white"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
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
      className="glass-panel rounded-2xl overflow-hidden border border-white/10 group hover:border-[#00F0FF]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300 relative flex flex-col"
    >
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
        <p className="text-sm text-gray-400 mb-4 truncate">{meta.subject || "General"} • {meta.class || "All Classes"}</p>
        
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
              
              if (isHtml) {
                try {
                  const response = await fetch(url);
                  if (!response.ok) throw new Error('Fetch failed');
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
              try {
                const response = await fetch(item.secure_url);
                if (!response.ok) throw new Error('Network response was not ok');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = title + '.' + (item.format || 'pdf');
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                window.open(item.secure_url, '_blank');
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 hover:from-[#00F0FF]/40 hover:to-[#B026FF]/40 border border-[#00F0FF]/30 py-2 rounded-xl transition-all duration-300 text-sm font-medium text-white"
            title="Download Content"
          >
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default function Dashboard({ isSmartPanelMode }: DashboardProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState(() => localStorage.getItem("sunrise_filter_class") || "All");
  const [selectedSubject, setSelectedSubject] = useState(() => localStorage.getItem("sunrise_filter_subject") || "All");
  const [selectedType, setSelectedType] = useState(() => localStorage.getItem("sunrise_filter_type") || "All");
  const [sortBy, setSortBy] = useState(() => localStorage.getItem("sunrise_sort_by") || "newest");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    teacher: "",
    className: "",
    subject: "",
    description: "",
    fileType: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { notifications: siteNotifications } = useAppStore();

  useEffect(() => {
    localStorage.setItem("sunrise_filter_class", selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    localStorage.setItem("sunrise_filter_subject", selectedSubject);
  }, [selectedSubject]);

  useEffect(() => {
    localStorage.setItem("sunrise_filter_type", selectedType);
  }, [selectedType]);

  useEffect(() => {
    localStorage.setItem("sunrise_sort_by", sortBy);
  }, [sortBy]);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content");
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.details || errorData.error || `Server error: ${res.status}`;
        throw new Error(msg);
      }
      const data = await res.json();
      if (data.resources) {
        setContent(data.resources);
      }
    } catch (error: any) {
      console.error("Failed to fetch content", error);
      addNotification('error', `Failed to load content: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (public_id: string, resource_type: string) => {
    if (!window.confirm("Are you sure you want to delete this content?")) return;
    
    setDeletingId(public_id);
    try {
      const res = await axios.delete(`/api/content?public_id=${encodeURIComponent(public_id)}&resource_type=${resource_type}`);
      if (res.data.success) {
        setContent(content.filter(item => item.public_id !== public_id));
        addNotification('success', 'Content deleted successfully');
      }
    } catch (error) {
      console.error("Failed to delete", error);
      addNotification('error', 'Failed to delete content');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (item: ContentItem) => {
    const meta: any = item.context?.custom || item.context || {};
    setEditFormData({
      title: meta.title || "",
      teacher: meta.teacher || "",
      className: meta.class || "Class 10",
      subject: meta.subject || "Mathematics",
      description: meta.description || "",
      fileType: meta.fileType || "PDF"
    });
    setEditingItem(item);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setSavingEdit(true);
    try {
      const res = await axios.put("/api/content", {
        public_id: editingItem.public_id,
        resource_type: editingItem.resource_type,
        ...editFormData
      });

      if (res.data.success) {
        // Update local state
        setContent(content.map(item => {
          if (item.public_id === editingItem.public_id) {
            const currentMeta: any = item.context?.custom || item.context || {};
            return {
              ...item,
              context: {
                ...currentMeta,
                title: editFormData.title,
                teacher: editFormData.teacher,
                class: editFormData.className,
                subject: editFormData.subject,
                description: editFormData.description,
                fileType: editFormData.fileType
              }
            };
          }
          return item;
        }));
        addNotification('success', 'Content updated successfully');
        setEditingItem(null);
      }
    } catch (error) {
      console.error("Failed to update", error);
      addNotification('error', 'Failed to update content');
    } finally {
      setSavingEdit(false);
    }
  };

  const [vlsCases, setVlsCases] = useState(1);
  const [showVlsCasesDropdown, setShowVlsCasesDropdown] = useState(false);

  const filteredContent = content.filter((item) => {
    const meta: any = item.context?.custom || item.context || {};
    const title = meta.title || item.public_id || "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "All" || meta.class === selectedClass;
    const matchesSubject = selectedSubject === "All" || meta.subject === selectedSubject;
    const matchesType = selectedType === "All" || meta.fileType === selectedType;
    
    return matchesSearch && matchesClass && matchesSubject && matchesType;
  }).sort((a, b) => {
    const metaA: any = a.context?.custom || a.context || {};
    const metaB: any = b.context?.custom || b.context || {};
    const titleA = (metaA.title || a.public_id || "").toLowerCase();
    const titleB = (metaB.title || b.public_id || "").toLowerCase();
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();

    if (sortBy === 'newest') return dateB - dateA;
    if (sortBy === 'oldest') return dateA - dateB;
    if (sortBy === 'a-z') return titleA.localeCompare(titleB);
    if (sortBy === 'z-a') return titleB.localeCompare(titleA);
    return 0;
  });

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "pdf": return <FileText className="w-6 h-6 text-red-400" />;
      case "video": return <Video className="w-6 h-6 text-blue-400" />;
      case "image": return <ImageIcon className="w-6 h-6 text-green-400" />;
      case "ppt": return <File className="w-6 h-6 text-orange-400" />;
      default: return <File className="w-6 h-6 text-gray-400" />;
    }
  };

  const gridCols = isSmartPanelMode 
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" 
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-10 max-w-[1600px] mx-auto pb-32"
    >
      {/* Hero Section */}
      <div className="mb-12 text-center md:text-left">
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl font-display font-bold mb-4"
        >
          Smart Classroom <span className="text-gradient">Content Hub</span>
        </motion.h2>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100px" }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="h-1 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-full md:mx-0 mx-auto"
        />
      </div>

      {/* Announcements Section */}
      {siteNotifications.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 space-y-4"
        >
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Bell className="w-5 h-5 text-[#00F0FF]" /> Announcements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siteNotifications.slice(0, 3).map((notif, index) => (
              <div key={`${notif.id}-${index}`} className="glass-panel rounded-xl p-5 border border-[#00F0FF]/30 bg-gradient-to-br from-[#00F0FF]/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#00F0FF]"></div>
                <h4 className="font-bold text-white mb-1">{notif.title}</h4>
                <p className="text-sm text-gray-300 mb-3">{notif.message}</p>
                <div className="text-[10px] text-gray-500 flex justify-between">
                  <span>From: {notif.senderRole}</span>
                  <span>{format(new Date(notif.timestamp), "MMM d, h:mm a")}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick Tools Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-[#B026FF]" /> AI Powered Tools
          </h3>
          <p className="text-sm text-gray-500">Boost your learning with AI</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/practice" className="group">
            <div className="glass-panel rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-[#00F0FF]/5 to-transparent hover:border-[#00F0FF]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.1)] transition-all duration-500 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[#00F0FF]/10 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/20 flex items-center justify-center mb-4 border border-[#00F0FF]/30 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6 text-[#00F0FF]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#00F0FF] transition-colors">Practice Arena</h4>
              <p className="text-sm text-gray-400">Generate authentic competitive exam questions with deep AI reasoning.</p>
            </div>
          </Link>

          <Link to="/simulator" className="group">
            <div className="glass-panel rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-[#B026FF]/5 to-transparent hover:border-[#B026FF]/50 hover:shadow-[0_0_30px_rgba(176,38,255,0.1)] transition-all duration-500 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B026FF]/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[#B026FF]/10 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-[#B026FF]/20 flex items-center justify-center mb-4 border border-[#B026FF]/30 group-hover:scale-110 transition-transform">
                <MonitorPlay className="w-6 h-6 text-[#B026FF]" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#B026FF] transition-colors">Simulator Generator</h4>
              <p className="text-sm text-gray-400">Create interactive 2D & 3D physics simulations for complex concepts.</p>
            </div>
          </Link>

          <Link to="/flowchart" className="group">
            <div className="glass-panel rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-[#00F0FF]/5 to-[#B026FF]/5 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/20 group-hover:scale-110 transition-transform">
                <GitGraph className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#00F0FF] transition-colors">FlowChart Generator</h4>
              <p className="text-sm text-gray-400">Transform processes into logical, AI-powered diagrams and flowcharts.</p>
            </div>
          </Link>

          <Link to="/visualizer" className="group">
            <div className="glass-panel rounded-2xl p-6 border border-white/10 bg-gradient-to-br from-[#00F0FF]/5 to-[#B026FF]/5 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-500 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-white/10 transition-all"></div>
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/20 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#00F0FF] transition-colors">Concept Visualizer</h4>
              <p className="text-sm text-gray-400">Convert scientific concepts into interactive visual explanations.</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Filter Section */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass-panel rounded-2xl p-6 mb-10 flex flex-col md:flex-row gap-4 items-center justify-between border border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/5 to-[#B026FF]/5 pointer-events-none"></div>
        
        <div className="relative w-full md:w-1/3 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#00F0FF] transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Classes</option>
              <option value="Class 1">Class 1</option>
              <option value="Class 2">Class 2</option>
              <option value="Class 3">Class 3</option>
              <option value="Class 4">Class 4</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 11">Class 11</option>
              <option value="Class 12">Class 12</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
              <option value="Economics">Economics</option>
              <option value="Accountancy">Accountancy</option>
              <option value="Business Studies">Business Studies</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
              title="Filter by Type"
            >
              <option value="All">All Types</option>
              <option value="PDF">PDF</option>
              <option value="Video">Video</option>
              <option value="PPT">PPT</option>
              <option value="Image">Image</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
              title="Sort Content"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="a-z">Title (A-Z)</option>
              <option value="z-a">Title (Z-A)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 ml-auto">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      {loading ? (
        <div className={viewMode === 'grid' ? `grid ${gridCols}` : 'flex flex-col gap-4'}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`glass-panel rounded-2xl animate-pulse border border-white/5 relative overflow-hidden ${viewMode === 'grid' ? 'h-72' : 'h-24'}`}>
               <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            </div>
          ))}
        </div>
      ) : filteredContent.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="relative w-48 h-48 mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-[#00F0FF]/30"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute inset-4 rounded-full border border-[#B026FF]/30"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00F0FF]/10 to-[#B026FF]/10 flex items-center justify-center border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                <FileText className="w-10 h-10 text-[#00F0FF] opacity-80" />
              </div>
            </div>
            
            {/* Floating particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -20, 0], 
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  delay: i * 0.6,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 rounded-full bg-[#00F0FF]"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  boxShadow: "0 0 10px #00F0FF"
                }}
              />
            ))}
          </div>
          <h3 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3">No Content Found</h3>
          <p className="text-gray-500 max-w-md">The digital vault is empty. Adjust your filters or upload new educational resources to populate the dashboard.</p>
        </motion.div>
      ) : (
        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
          initial="hidden"
          animate="show"
          className={viewMode === 'grid' ? `grid ${gridCols}` : 'flex flex-col gap-4'}
        >
          {filteredContent.map((item, index) => (
            <ContentCard 
              key={`${item.public_id}-${index}`}
              item={item}
              viewMode={viewMode}
              isAuthenticated={isAuthenticated}
              deletingId={deletingId}
              onEdit={handleEditClick}
              onDelete={handleDelete}
              getFileIcon={getFileIcon}
            />
          ))}
        </motion.div>
      )}

      {/* Visual Learning Simulations (VLS) Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
              <Presentation className="w-8 h-8 text-[#00F0FF]" />
              Visual Learning <span className="text-gradient">Simulations</span> (VLS)
            </h2>
            <p className="text-gray-400">Interactive 3D and 2D simulations for complex concepts</p>
          </div>
          <div className="flex items-center gap-4 relative">
            <button className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all">
              View All
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowVlsCasesDropdown(!showVlsCasesDropdown)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 text-[#00F0FF] font-bold hover:from-[#00F0FF]/30 hover:to-[#B026FF]/30 transition-all flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Cases: {vlsCases}
              </button>
              {showVlsCasesDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-black/90 border border-white/10 rounded-xl p-2 z-50 min-w-[100px] shadow-2xl backdrop-blur-md">
                  {[1, 2, 3, 4].map(num => (
                    <button 
                      key={num}
                      onClick={() => {
                        setVlsCases(num);
                        setShowVlsCasesDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold transition-all ${vlsCases === num ? 'bg-[#00F0FF] text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      {num} {num === 1 ? 'Case' : 'Cases'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Quantum Mechanics", subject: "Physics", icon: <Sparkles className="w-6 h-6" />, color: "from-blue-500/20 to-indigo-500/20" },
            { title: "Organic Synthesis", subject: "Chemistry", icon: <Activity className="w-6 h-6" />, color: "from-emerald-500/20 to-teal-500/20" },
            { title: "Neural Networks", subject: "Biology/CS", icon: <BrainCircuit className="w-6 h-6" />, color: "from-purple-500/20 to-pink-500/20" },
            { title: "Calculus Visualizer", subject: "Mathematics", icon: <LayoutGrid className="w-6 h-6" />, color: "from-orange-500/20 to-red-500/20" }
          ].map((vls, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5, scale: 1.02 }}
              className="glass-panel rounded-2xl p-6 border border-white/10 group cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${vls.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-[#00F0FF] group-hover:scale-110 transition-transform duration-300">
                  {vls.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-1 group-hover:text-[#00F0FF] transition-colors">{vls.title}</h3>
                <p className="text-sm text-gray-400">{vls.subject}</p>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-[#00F0FF]" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Auto Suggest Modal */}
      <AutoSuggestModal />

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel rounded-3xl p-6 md:p-8 w-full max-w-2xl relative z-10 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden max-h-[90vh] overflow-y-auto bg-black/40 backdrop-blur-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/10 to-[#B026FF]/10 pointer-events-none"></div>
              
              <button 
                onClick={() => setEditingItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 relative z-10">
                <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-3">
                  <Edit2 className="w-6 h-6 text-[#00F0FF]" />
                  Edit Content Details
                </h2>
                <p className="text-gray-400 text-sm">Update metadata for this resource</p>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Content Title</label>
                    <input 
                      required
                      type="text" 
                      value={editFormData.title}
                      onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Teacher Name</label>
                    <input 
                      required
                      type="text" 
                      value={editFormData.teacher}
                      onChange={e => setEditFormData({...editFormData, teacher: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Class</label>
                    <input 
                      required
                      type="text" 
                      value={editFormData.className}
                      onChange={e => setEditFormData({...editFormData, className: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</label>
                    <input 
                      required
                      type="text" 
                      value={editFormData.subject}
                      onChange={e => setEditFormData({...editFormData, subject: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={editFormData.description}
                    onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all resize-none h-24"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-6 py-3 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={savingEdit}
                    className="px-8 py-3 rounded-xl font-display font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
