import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, FileText, Video, Image as ImageIcon, Download, Eye, File, Edit2, Trash2, Loader2, X, Save, LayoutGrid, List } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import axios from "axios";
import Tooltip from "./Tooltip";

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

export default function ContentManager() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
      if (!res.ok) throw new Error("Failed to fetch");
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

  const getFileIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "pdf": return <FileText className="w-6 h-6 text-red-400" />;
      case "video": return <Video className="w-6 h-6 text-blue-400" />;
      case "image": return <ImageIcon className="w-6 h-6 text-green-400" />;
      case "ppt": return <File className="w-6 h-6 text-orange-400" />;
      default: return <File className="w-6 h-6 text-gray-400" />;
    }
  };

  const filteredContent = content.filter((item) => {
    const meta = item.context?.custom || {};
    const title = meta.title || item.public_id;
    const teacher = meta.teacher || "";
    const description = meta.description || "";
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      title.toLowerCase().includes(searchLower) ||
      teacher.toLowerCase().includes(searchLower) ||
      description.toLowerCase().includes(searchLower);

    const matchesClass = selectedClass === "All" || meta.class === selectedClass;
    const matchesSubject = selectedSubject === "All" || meta.subject === selectedSubject;
    const matchesType = selectedType === "All" || meta.fileType === selectedType;
    
    return matchesSearch && matchesClass && matchesSubject && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-1/3 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-[#00F0FF] transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Search content..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
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
            </select>
          </div>

          <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/10 text-[#00F0FF]' : 'text-gray-400 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-[#00F0FF]' : 'text-gray-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content List/Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#00F0FF]" />
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No content found.</div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
          {filteredContent.map((item) => {
            const meta = item.context?.custom || {};
            const title = meta.title || "Untitled Document";
            const fileType = meta.fileType || "Unknown";
            
            if (viewMode === 'list') {
              return (
                <motion.div 
                  key={item.public_id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel rounded-xl p-4 border border-white/10 flex items-center gap-4 hover:border-[#00F0FF]/30 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    {getFileIcon(fileType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{title}</h3>
                    <p className="text-sm text-gray-400 truncate">{meta.subject} • {meta.class} • {meta.teacher}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tooltip content="View Content">
                      <a href={item.secure_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Tooltip>
                    <Tooltip content="Download">
                      <a href={item.secure_url} download className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <Download className="w-4 h-4" />
                      </a>
                    </Tooltip>
                    {isAuthenticated && (
                      <>
                        <Tooltip content="Edit">
                          <button onClick={() => handleEditClick(item)} className="p-2 rounded-lg hover:bg-white/10 text-[#00F0FF]">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete">
                          <button onClick={() => handleDelete(item.public_id, item.resource_type)} className="p-2 rounded-lg hover:bg-white/10 text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            }

            return (
              <motion.div 
                key={item.public_id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel rounded-2xl overflow-hidden border border-white/10 group hover:border-[#00F0FF]/50 transition-all duration-300 flex flex-col"
              >
                <div className="h-40 bg-black/50 relative flex items-center justify-center overflow-hidden border-b border-white/5">
                  {item.resource_type === 'image' ? (
                    <img src={item.secure_url} alt={title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="transform group-hover:scale-110 transition-transform">
                      {getFileIcon(fileType)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Tooltip content="View">
                      <a href={item.secure_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-[#00F0FF]/20 text-white hover:text-[#00F0FF] transition-colors">
                        <Eye className="w-5 h-5" />
                      </a>
                    </Tooltip>
                    <Tooltip content="Download">
                      <a href={item.secure_url} download className="p-2 rounded-full bg-white/10 hover:bg-[#00F0FF]/20 text-white hover:text-[#00F0FF] transition-colors">
                        <Download className="w-5 h-5" />
                      </a>
                    </Tooltip>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-white truncate mb-1" title={title}>{title}</h3>
                  <p className="text-xs text-gray-400 mb-4">{meta.subject} • {meta.class}</p>
                  
                  {isAuthenticated && (
                    <div className="mt-auto flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                       <Tooltip content="Edit">
                         <button onClick={() => handleEditClick(item)} className="p-2 rounded-lg hover:bg-[#00F0FF]/10 text-[#00F0FF] transition-colors">
                           <Edit2 className="w-4 h-4" />
                         </button>
                       </Tooltip>
                       <Tooltip content="Delete">
                         <button onClick={() => handleDelete(item.public_id, item.resource_type)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </Tooltip>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel rounded-3xl p-8 w-full max-w-2xl relative z-10 border border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Content</h2>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Title</label>
                    <input 
                      type="text" 
                      value={editFormData.title} 
                      onChange={e => setEditFormData({...editFormData, title: e.target.value})} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 focus:outline-none transition-colors" 
                      placeholder="Title" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Teacher</label>
                    <input 
                      type="text" 
                      value={editFormData.teacher} 
                      onChange={e => setEditFormData({...editFormData, teacher: e.target.value})} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 focus:outline-none transition-colors" 
                      placeholder="Teacher" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Class</label>
                    <select 
                      value={editFormData.className} 
                      onChange={e => setEditFormData({...editFormData, className: e.target.value})} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="Class 10">Class 10</option>
                      <option value="Class 11">Class 11</option>
                      <option value="Class 12">Class 12</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Subject</label>
                    <select 
                      value={editFormData.subject} 
                      onChange={e => setEditFormData({...editFormData, subject: e.target.value})} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Description</label>
                  <textarea 
                    value={editFormData.description} 
                    onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 focus:outline-none transition-colors resize-none h-24" 
                    placeholder="Description" 
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
                  <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={savingEdit} className="px-6 py-2 rounded-xl bg-[#00F0FF] text-black font-bold hover:bg-[#00F0FF]/80 transition-colors flex items-center gap-2">
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {savingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
