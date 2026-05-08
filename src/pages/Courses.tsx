import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GrammarTextarea } from "../components/GrammarTextarea";
import { BookOpen, ChevronLeft, ChevronRight, FileText, PlayCircle, Sparkles, BrainCircuit, Loader2, ArrowLeft } from "lucide-react";
import { ContentCard, ContentItem, getFileIcon } from "../components/ContentCard";
import { SkeletonGrid } from "../components/SkeletonLoader";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { BackButton } from "../components/BackButton";
import axios from "axios";

// Mock Data for classes and subjects
const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "English", "Hindi", "History", "Geography", "Economics", "Accountancy", "Business Studies"];

export default function Courses() {
  const [selectedClass, setSelectedClass] = useState<string | null>(() => localStorage.getItem('sunrise_last_class'));
  const [selectedSubject, setSelectedSubject] = useState<string | null>(() => localStorage.getItem('sunrise_last_subject'));
  const [showAllContent, setShowAllContent] = useState(false);
  const [showAIGenerated, setShowAIGenerated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'classes' | 'all' | 'ai'>('classes');
  
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    teacher: "",
    className: "",
    subject: "",
    description: "",
    fileType: "",
    tags: ""
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      localStorage.setItem('sunrise_last_class', selectedClass);
    } else {
      localStorage.removeItem('sunrise_last_class');
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      localStorage.setItem('sunrise_last_subject', selectedSubject);
    } else {
      localStorage.removeItem('sunrise_last_subject');
    }
  }, [selectedSubject]);

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

  const handleEdit = (item: ContentItem) => {
    const meta: any = item.context?.custom || item.context || {};
    setEditFormData({
      title: meta.title || "",
      teacher: meta.teacher || "",
      className: meta.class || "Class 10",
      subject: meta.subject || "Mathematics",
      description: meta.description || "",
      fileType: meta.fileType || "PDF",
      tags: meta.tags || ""
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
                fileType: editFormData.fileType,
                tags: editFormData.tags
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

  const handleBack = () => {
    if (selectedSubject) {
      setSelectedSubject(null);
    } else if (selectedClass) {
      setSelectedClass(null);
    } else if (showAllContent) {
      setShowAllContent(false);
    } else if (showAIGenerated) {
      setShowAIGenerated(false);
    }
  };

  const filteredContent = content.filter((item) => {
    const meta: any = item.context?.custom || item.context || {};
    
    if (showAIGenerated) {
      const isAI = meta.teacher === 'AI Assistant' || 
                   meta.description?.toLowerCase().includes('ai-generated') ||
                   meta.tags?.toLowerCase().includes('ai') ||
                   meta.title?.toLowerCase().includes('ai');
      if (!isAI) return false;
    } else if (!showAllContent) {
      const matchesClass = selectedClass ? meta.class?.trim() === selectedClass : true;
      const matchesSubject = selectedSubject ? meta.subject?.trim() === selectedSubject : true;
      if (selectedClass && !matchesClass) return false;
      if (selectedSubject && !matchesSubject) return false;
      if (!selectedClass && !selectedSubject) return false; // Don't show anything in initial view if not "All Content"
    }

    const matchesSearch = searchQuery 
      ? meta.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        meta.tags?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    const matchesFileType = fileTypeFilter ? meta.fileType === fileTypeFilter : true;
    
    return matchesSearch && matchesFileType;
  });

  return (
    <div className="min-h-screen pb-32 pt-24 px-6 max-w-[1920px] mx-auto 2xl:px-12">
      <div className="mb-8">
        <BackButton label="Back" />
      </div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight">
            Classroom <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF]">Content</span>
          </h1>
          <p className="text-gray-400 text-lg">Structured learning materials and AI resources.</p>
        </div>
        
        <AnimatePresence>
          {(selectedClass || selectedSubject || showAllContent || showAIGenerated) && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={handleBack}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-8 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F0FF] via-[#B026FF] to-[#00F0FF] rounded-xl blur opacity-0 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200 animate-gradient-xy"></div>
        <input
          type="text"
          placeholder="Search content by title or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full relative bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white focus:border-transparent outline-none transition-all duration-300"
        />
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {!selectedClass && !showAllContent && !showAIGenerated && (
            <motion.div
              key="classes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {CLASSES.map((cls, idx) => {
                  const classContent = content.filter(item => {
                    const meta: any = item.context?.custom || item.context || {};
                    return meta.class === cls;
                  });
                  const count = classContent.length;
                  
                  // Calculate new content (last 24 hours)
                  const now = new Date();
                  const newCount = classContent.filter(item => {
                    const createdAt = new Date(item.created_at);
                    return (now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
                  }).length;

                  return (
                    <motion.button
                      key={cls}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedClass(cls)}
                      className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-[#00F0FF]/50 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,240,255,0.15)] relative overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      {/* New Content Badge */}
                      {newCount > 0 && (
                        <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-[#00F0FF] text-black text-[10px] font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)] z-20 animate-pulse">
                          +{newCount} NEW
                        </div>
                      )}

                      <BookOpen className="w-10 h-10 text-gray-400 group-hover:text-[#00F0FF] mb-4 transition-colors relative z-10" />
                      <h3 className="text-xl font-bold text-white relative z-10">{cls}</h3>
                      <p className="text-xs text-gray-500 mt-2 relative z-10">{count} {count === 1 ? 'Item' : 'Items'}</p>
                    </motion.button>
                  );
                })}
                
                {/* All Content Card */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: CLASSES.length * 0.05 }}
                  onClick={() => setShowAllContent(true)}
                  className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-[#B026FF]/50 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(176,38,255,0.15)] relative overflow-hidden flex flex-col items-center justify-center text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B026FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <FileText className="w-10 h-10 text-gray-400 group-hover:text-[#B026FF] mb-4 transition-colors relative z-10" />
                  <h3 className="text-xl font-bold text-white relative z-10">All Content</h3>
                  <p className="text-xs text-gray-500 mt-2 relative z-10">{content.length} {content.length === 1 ? 'Item' : 'Items'}</p>
                </motion.button>

                {/* AI Generated Content Card */}
                {(() => {
                  const aiContent = content.filter(item => {
                    const meta: any = item.context?.custom || item.context || {};
                    return meta.teacher === 'AI Assistant' || 
                           meta.description?.toLowerCase().includes('ai-generated') ||
                           meta.tags?.toLowerCase().includes('ai') ||
                           meta.title?.toLowerCase().includes('ai');
                  });
                  const aiCount = aiContent.length;

                  return (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (CLASSES.length + 1) * 0.05 }}
                      onClick={() => setShowAIGenerated(true)}
                      className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-emerald-400/50 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(52,211,153,0.15)] relative overflow-hidden flex flex-col items-center justify-center text-center"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Sparkles className="w-10 h-10 text-gray-400 group-hover:text-emerald-400 mb-4 transition-colors relative z-10" />
                      <h3 className="text-xl font-bold text-white relative z-10">AI Generated</h3>
                      <p className="text-xs text-gray-500 mt-2 relative z-10">{aiCount} {aiCount === 1 ? 'Item' : 'Items'}</p>
                    </motion.button>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {(showAllContent || showAIGenerated) && (
            <motion.div
              key="special-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-8 text-gray-300 flex items-center gap-3">
                <span className={showAIGenerated ? "text-emerald-400" : "text-[#B026FF]"}>
                  {showAIGenerated ? "AI Generated Content" : "All Content"}
                </span>
              </h2>

              <div className="flex flex-wrap gap-3 mb-8">
                {['PDF', 'Video', 'Image', 'PPT', 'Other'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFileTypeFilter(fileTypeFilter === type ? null : type)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      fileTypeFilter === type 
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              
              {loading ? (
                <div className="py-8 w-full">
                  <SkeletonGrid count={10} />
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-2xl border border-white/10">
                  <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Content Found</h3>
                  <p className="text-gray-400">No resources found matching this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredContent.map((item, idx) => (
                    <div key={`special-item-${item.public_id}-${idx}`}>
                      <ContentCard
                        item={item}
                        viewMode="grid"
                        isAuthenticated={isAuthenticated}
                        deletingId={deletingId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {selectedClass && !selectedSubject && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-8 text-gray-300 flex items-center gap-3">
                <span className="text-[#00F0FF]">{selectedClass}</span>
                <ChevronRight className="w-5 h-5 text-gray-600" />
                Select Subject
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {SUBJECTS.map((sub, idx) => {
                  const subjectContent = content.filter(item => {
                    const meta: any = item.context?.custom || item.context || {};
                    return meta.class?.trim() === selectedClass && meta.subject?.trim() === sub;
                  });
                  const count = subjectContent.length;
                  
                  // Calculate new content (last 24 hours)
                  const now = new Date();
                  const newCount = subjectContent.filter(item => {
                    const createdAt = new Date(item.created_at);
                    return (now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000;
                  }).length;

                  return (
                    <motion.button
                      key={sub}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedSubject(sub)}
                      className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-[#B026FF]/50 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(176,38,255,0.15)] relative overflow-hidden text-left"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#B026FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      {/* New Content Badge */}
                      {newCount > 0 && (
                        <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-[#B026FF] text-white text-[10px] font-bold shadow-[0_0_10px_rgba(176,38,255,0.5)] z-20 animate-pulse">
                          +{newCount} NEW
                        </div>
                      )}

                      <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{sub}</h3>
                      <p className="text-gray-400 text-sm relative z-10 group-hover:text-gray-300 transition-colors">
                        {count} {count === 1 ? 'Resource' : 'Resources'} available
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {selectedClass && selectedSubject && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-8 text-gray-300 flex items-center gap-3 flex-wrap">
                <span className="text-[#00F0FF]">{selectedClass}</span>
                <ChevronRight className="w-5 h-5 text-gray-600" />
                <span className="text-[#B026FF]">{selectedSubject}</span>
                <ChevronRight className="w-5 h-5 text-gray-600" />
                Content
              </h2>
              
              {loading ? (
                <div className="py-8 w-full">
                  <SkeletonGrid count={10} />
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-20 glass-panel rounded-2xl border border-white/10">
                  <BookOpen className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Content Found</h3>
                  <p className="text-gray-400">There are currently no resources available for this subject.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                  {filteredContent.map((item, idx) => (
                    <div key={`class-subject-item-${item.public_id}-${idx}`}>
                      <ContentCard
                        item={item}
                        viewMode="grid"
                        isAuthenticated={isAuthenticated}
                        deletingId={deletingId}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Edit Content</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Class</label>
                    <select
                      value={editFormData.className}
                      onChange={e => setEditFormData({...editFormData, className: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none"
                    >
                      {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                    <select
                      value={editFormData.subject}
                      onChange={e => setEditFormData({...editFormData, subject: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none"
                    >
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <div className="relative h-24">
                    <GrammarTextarea
                      value={editFormData.description}
                      onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                      className="w-full h-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none resize-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editFormData.tags}
                    onChange={e => setEditFormData({...editFormData, tags: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-6 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
