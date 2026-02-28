import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, FileText, Video, Image as ImageIcon, Download, Eye, File, MoreVertical, Edit2, Trash2, Loader2, X, Save } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
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

export default function Dashboard({ isSmartPanelMode }: DashboardProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
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
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/content");
      const data = await res.json();
      if (data.resources) {
        setContent(data.resources);
      }
    } catch (error) {
      console.error("Failed to fetch content", error);
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
    const meta = item.context?.custom || {};
    setEditFormData({
      title: meta.title || item.public_id,
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
            return {
              ...item,
              context: {
                ...item.context,
                custom: {
                  ...item.context?.custom,
                  title: editFormData.title,
                  teacher: editFormData.teacher,
                  class: editFormData.className,
                  subject: editFormData.subject,
                  description: editFormData.description,
                  fileType: editFormData.fileType
                }
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

  const filteredContent = content.filter((item) => {
    const meta = item.context?.custom || {};
    const title = meta.title || item.public_id;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === "All" || meta.class === selectedClass;
    const matchesSubject = selectedSubject === "All" || meta.subject === selectedSubject;
    const matchesType = selectedType === "All" || meta.fileType === selectedType;
    
    return matchesSearch && matchesClass && matchesSubject && matchesType;
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
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
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
            </select>
          </div>

          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-sm appearance-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="PDF">PDF</option>
              <option value="Video">Video</option>
              <option value="PPT">PPT</option>
              <option value="Image">Image</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      {loading ? (
        <div className={`grid ${gridCols}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-panel rounded-2xl h-72 animate-pulse border border-white/5 relative overflow-hidden">
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
          className={`grid ${gridCols}`}
        >
          {filteredContent.map((item) => {
            const meta = item.context?.custom || {};
            const title = meta.title || "Untitled Document";
            const fileType = meta.fileType || "Unknown";
            const date = new Date(item.created_at);

            return (
              <motion.div 
                key={item.public_id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-panel rounded-2xl overflow-hidden border border-white/10 group hover:border-[#00F0FF]/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-300 relative flex flex-col"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00F0FF]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                
                {isAuthenticated && (
                  <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <button 
                      onClick={() => handleEditClick(item)}
                      className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-[#00F0FF]/30 text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.public_id, item.resource_type)}
                      disabled={deletingId === item.public_id}
                      className="p-2 rounded-lg bg-black/60 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      {deletingId === item.public_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <div className="h-40 bg-black/50 relative flex items-center justify-center overflow-hidden border-b border-white/5">
                  {item.resource_type === 'image' ? (
                    <img src={item.secure_url} alt={title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  ) : item.resource_type === 'video' ? (
                    <video src={item.secure_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                  ) : (
                    <div className="transform group-hover:scale-110 transition-transform duration-500">
                      {getFileIcon(fileType)}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
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
                  <p className="text-sm text-gray-400 mb-4 truncate">{meta.subject} • {meta.class}</p>
                  
                  <div className="mt-auto flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>By {meta.teacher || "Unknown"}</span>
                    <span>{format(date, "MMM d, yyyy")}</span>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <a 
                      href={item.secure_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 py-2 rounded-xl transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" /> View
                    </a>
                    <a 
                      href={item.secure_url.replace('/upload/', '/upload/fl_attachment/')} 
                      download
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#00F0FF]/20 to-[#B026FF]/20 hover:from-[#00F0FF]/40 hover:to-[#B026FF]/40 border border-[#00F0FF]/30 py-2 rounded-xl transition-all duration-300 text-sm font-medium text-white"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

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
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel rounded-3xl p-8 w-full max-w-2xl relative z-10 border border-white/10 shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden max-h-[90vh] overflow-y-auto"
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
                    <select 
                      value={editFormData.className}
                      onChange={e => setEditFormData({...editFormData, className: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subject</label>
                    <select 
                      value={editFormData.subject}
                      onChange={e => setEditFormData({...editFormData, subject: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
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
