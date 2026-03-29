import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Database, 
  Loader2, 
  FileText, 
  ChevronRight, 
  Search, 
  Filter,
  LayoutGrid,
  Sparkles,
  BookOpen,
  FolderOpen
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface DashboardFile {
  id: string;
  name: string;
  type: string;
  url: string;
  createdAt: string;
  public_id: string;
  format?: string;
  resource_type?: string;
  context?: {
    custom?: {
      title?: string;
      teacher?: string;
      class?: string;
      subject?: string;
      description?: string;
      tags?: string;
      isAI?: boolean;
    }
  };
}

interface DashboardFileSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: any) => void;
  title?: string;
  description?: string;
  allowMultiple?: boolean;
  onSelectMultiple?: (files: any[]) => void;
}

export const DashboardFileSelector: React.FC<DashboardFileSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Select from Dashboard",
  description = "Choose a file from your library",
  allowMultiple = false,
  onSelectMultiple
}) => {
  const [files, setFiles] = useState<DashboardFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'categories' | 'subjects' | 'files'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<DashboardFile[]>([]);
  const { isAuthenticated } = useAuthStore();

  const CLASSES = ["Class 9", "Class 10", "Class 11", "Class 12"];
  const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "Computer Science"];

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      const resources = (data.resources || []).map((file: any) => {
        const meta = file.context?.custom || {};
        
        // Derive a better name if title is missing
        const deriveName = () => {
          if (meta.title && meta.title.length > 2) return meta.title;
          
          // Try to get name from public_id or filename
          const rawName = file.filename || file.public_id.split('/').pop() || "";
          
          // Check if it's likely a hash (long string of random chars)
          const isHash = (text: string) => {
            if (text.length < 15) return false;
            // If it has no spaces, underscores, or hyphens and is long, it's likely a hash
            return !/[_\-\s]/.test(text) && /[a-z]/.test(text) && /[0-9]/.test(text);
          };
          
          if (rawName && !isHash(rawName)) {
            const cleanName = rawName
              .replace(/_/g, ' ')
              .replace(/-/g, ' ')
              .replace(/\.[^/.]+$/, "") // Remove extension
              .replace(/\d{10,}/g, '') // Remove long numeric strings (timestamps)
              .trim();
              
            if (cleanName.length > 2) {
              return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
            }
          }
          
          // Fallback to subject or generic name
          if (meta.subject) return `${meta.subject} Resource`;
          if (meta.class) return `${meta.class} Material`;
          return "Educational Document";
        };

        return {
          ...file,
          id: file.public_id,
          name: deriveName(),
          type: meta.fileType || file.format?.toUpperCase() || "Document",
          url: file.secure_url,
          createdAt: file.created_at
        };
      });
      setFiles(resources);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFiles = () => {
    return files.filter(file => {
      const meta = file.context?.custom || {};
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (selectedCategory === 'AI Generated') {
        if (!meta.isAI) return false;
      } else if (selectedCategory && selectedCategory !== 'All Content') {
        if (meta.class !== selectedCategory) return false;
      }

      if (selectedSubject) {
        if (meta.subject !== selectedSubject) return false;
      }

      return matchesSearch;
    });
  };

  const handleFileClick = (file: DashboardFile) => {
    if (allowMultiple) {
      const isSelected = selectedFiles.find(f => f.id === file.id);
      if (isSelected) {
        setSelectedFiles(prev => prev.filter(f => f.id !== file.id));
      } else {
        setSelectedFiles(prev => [...prev, file]);
      }
    } else {
      onSelect(file);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    if (onSelectMultiple) {
      onSelectMultiple(selectedFiles);
    }
    onClose();
  };

  const resetSelection = () => {
    setView('categories');
    setSelectedCategory(null);
    setSelectedSubject(null);
    setSearchQuery('');
  };

  const filteredFiles = getFilteredFiles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#00F0FF]/10 text-[#00F0FF]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view !== 'categories' && (
              <button 
                onClick={() => setView(view === 'files' ? 'subjects' : 'categories')}
                className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
              >
                Back
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search & Selection Info */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/[0.01]">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (view !== 'files') setView('files');
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-[#00F0FF]/50 outline-none transition-all"
            />
          </div>
          
          {allowMultiple && selectedFiles.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#00F0FF] font-medium">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </span>
              <button 
                onClick={handleConfirmSelection}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold text-sm hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
              >
                Confirm Selection
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-[#00F0FF] animate-spin" />
              <p className="text-gray-400 animate-pulse">Accessing your secure vault...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {view === 'categories' && (
                <motion.div 
                  key="categories"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <CategoryCard 
                    title="All Content" 
                    icon={<FolderOpen className="w-6 h-6" />} 
                    color="from-blue-500/20 to-cyan-500/20"
                    onClick={() => {
                      setSelectedCategory('All Content');
                      setView('files');
                    }}
                  />
                  <CategoryCard 
                    title="AI Generated" 
                    icon={<Sparkles className="w-6 h-6" />} 
                    color="from-emerald-500/20 to-teal-500/20"
                    onClick={() => {
                      setSelectedCategory('AI Generated');
                      setView('subjects');
                    }}
                  />
                  {CLASSES.map(cls => (
                    <CategoryCard 
                      key={cls}
                      title={cls} 
                      icon={<LayoutGrid className="w-6 h-6" />} 
                      color="from-purple-500/20 to-pink-500/20"
                      onClick={() => {
                        setSelectedCategory(cls);
                        setView('subjects');
                      }}
                    />
                  ))}
                </motion.div>
              )}

              {view === 'subjects' && (
                <motion.div 
                  key="subjects"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {SUBJECTS.map(sub => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubject(sub);
                        setView('files');
                      }}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F0FF]/50 hover:bg-white/10 transition-all group text-center"
                    >
                      <BookOpen className="w-8 h-8 text-gray-500 group-hover:text-[#00F0FF] mx-auto mb-3 transition-colors" />
                      <span className="font-bold text-white">{sub}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedSubject(null);
                      setView('files');
                    }}
                    className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#00F0FF]/50 hover:bg-white/10 transition-all group text-center"
                  >
                    <Filter className="w-8 h-8 text-gray-500 group-hover:text-[#00F0FF] mx-auto mb-3 transition-colors" />
                    <span className="font-bold text-white">All Subjects</span>
                  </button>
                </motion.div>
              )}

              {view === 'files' && (
                <motion.div 
                  key="files"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-20">
                      <FileText className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-500">No files found in this section.</p>
                      <button 
                        onClick={resetSelection}
                        className="mt-4 text-[#00F0FF] hover:underline text-sm"
                      >
                        Browse all categories
                      </button>
                    </div>
                  ) : (
                    filteredFiles.map((file, index) => {
                      const isSelected = selectedFiles.find(f => f.id === file.id);
                      return (
                        <button
                          key={file.id || `file-${index}`}
                          onClick={() => handleFileClick(file)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${
                            isSelected 
                              ? 'bg-[#00F0FF]/10 border-[#00F0FF]/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]' 
                              : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                          }`}
                        >
                          <div className={`p-3 rounded-xl transition-colors ${
                            isSelected ? 'bg-[#00F0FF] text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'
                          }`}>
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white truncate">{file.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-white/5">{file.type || 'Document'}</span>
                              <span>•</span>
                              <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                              {file.context?.custom?.subject && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#B026FF]">{file.context.custom.subject}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {allowMultiple ? (
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-[#00F0FF] border-[#00F0FF]' : 'border-white/20'
                            }`}>
                              {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                            </div>
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                          )}
                        </button>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const CategoryCard = ({ title, icon, color, onClick }: any) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all group text-left relative overflow-hidden`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
    <div className="relative z-10">
      <div className="p-3 rounded-xl bg-white/5 text-gray-400 group-hover:text-white mb-4 w-fit transition-colors">
        {icon}
      </div>
      <h4 className="text-lg font-bold text-white">{title}</h4>
      <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Browse resources in this category</p>
    </div>
  </button>
);
