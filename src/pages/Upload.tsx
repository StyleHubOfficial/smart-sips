import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, CheckCircle, XCircle, File as FileIcon, Loader2, PlayCircle, Eye, Lock } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { useNotificationStore } from "../store/useNotificationStore";

interface UploadProps {
  onOpenLogin: () => void;
}

export default function Upload({ onOpenLogin }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [formData, setFormData] = useState({
    title: "",
    teacher: "",
    className: "Class 10",
    subject: "Mathematics",
    description: "",
    fileType: "PDF"
  });

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      
      // Auto-detect file type
      const type = selectedFile.type;
      if (type.includes("pdf")) setFormData(prev => ({ ...prev, fileType: "PDF" }));
      else if (type.includes("video")) setFormData(prev => ({ ...prev, fileType: "Video" }));
      else if (type.includes("image")) setFormData(prev => ({ ...prev, fileType: "Image" }));
      else if (type.includes("presentation") || type.includes("powerpoint")) setFormData(prev => ({ ...prev, fileType: "PPT" }));
      else setFormData(prev => ({ ...prev, fileType: "Other" }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxFiles: 1
  } as any);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(0);

    const data = new FormData();
    data.append("file", file);
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value));
    });

    try {
      console.log("Starting upload for:", file.name);
      const res = await axios.post("/api/upload", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });

      console.log("Upload response received:", res.status, res.data);

      if (res.data && res.data.success) {
        addNotification('success', 'File uploaded successfully!');
        
        // Small delay before resetting to prevent UI glitches during transition
        setTimeout(() => {
          setFile(null);
          setProgress(0);
          setFormData({
            title: "",
            teacher: "",
            className: "Class 10",
            subject: "Mathematics",
            description: "",
            fileType: "PDF"
          });
        }, 500);
      } else {
        const errorMsg = res.data?.error || "Upload failed - Server returned success:false";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error("Upload error details:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to upload file";
      addNotification('error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-6 md:p-10 max-w-4xl mx-auto pb-32 flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 relative">
          <div className="absolute inset-0 rounded-full border border-[#00F0FF]/30 animate-ping"></div>
          <Lock className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-4">Authentication Required</h2>
        <p className="text-gray-400 mb-8 max-w-md">You need to be logged in as a teacher to upload content to the Sunrise Classroom Panel.</p>
        <button 
          onClick={onOpenLogin}
          className="px-8 py-3 rounded-xl font-display font-bold tracking-wide transition-all duration-300 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02]"
        >
          Login to Continue
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-10 max-w-4xl mx-auto pb-32"
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          Upload <span className="text-gradient">Content</span>
        </h2>
        <p className="text-gray-400">Add new resources to the classroom panel</p>
      </div>

      <div className="glass-panel rounded-3xl p-8 relative overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/5 to-[#B026FF]/5 pointer-events-none"></div>
        
        <form onSubmit={handleUpload} className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Content Title</label>
              <input 
                required
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                placeholder="e.g. Chapter 1: Thermodynamics"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Teacher Name</label>
              <input 
                required
                type="text" 
                value={formData.teacher}
                onChange={e => setFormData({...formData, teacher: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all"
                placeholder="e.g. Mr. Sharma"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Class</label>
              <select 
                value={formData.className}
                onChange={e => setFormData({...formData, className: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all appearance-none cursor-pointer"
              >
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Subject</label>
              <select 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
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
            <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">Description (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 focus:ring-1 focus:ring-[#00F0FF]/50 transition-all resize-none h-24"
              placeholder="Brief description of the content..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">File Upload</label>
              {file && (
                <button 
                  type="button" 
                  onClick={() => setFile(null)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove File
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 h-64 flex flex-col items-center justify-center ${
                  isDragActive ? 'border-[#00F0FF] bg-[#00F0FF]/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                } ${file ? 'border-[#B026FF]/50 bg-[#B026FF]/5' : ''}`}
              >
                <input {...getInputProps()} />
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div 
                      key="file"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center mb-4 border border-[#00F0FF]/30">
                        <FileIcon className="w-8 h-8 text-[#00F0FF]" />
                      </div>
                      <p className="text-lg font-medium text-white mb-1 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB • {formData.fileType}</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 group-hover:border-[#00F0FF]/50 transition-colors">
                        <UploadCloud className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-white mb-1">Drag & drop your file here</p>
                      <p className="text-sm text-gray-500">or click to browse from your computer</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* File Preview Area */}
              <div className="h-64 rounded-2xl border border-white/10 bg-black/40 overflow-hidden relative flex items-center justify-center">
                {file && previewUrl ? (
                  <>
                    {file.type.includes('image') ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    ) : file.type.includes('video') ? (
                      <video src={previewUrl} controls className="w-full h-full object-contain" />
                    ) : file.type.includes('pdf') ? (
                      <iframe src={previewUrl} className="w-full h-full border-none" title="PDF Preview" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Eye className="w-12 h-12 mb-3 opacity-50" />
                        <p>Preview not available for this file type</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-600">
                    <Eye className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">File preview will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Uploading to Cloudinary...</span>
                <span className="text-[#00F0FF] font-mono">{progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={!file || uploading}
            className={`w-full py-4 rounded-xl font-display font-bold text-lg tracking-wide transition-all duration-300 flex items-center justify-center gap-3 ${
              !file || uploading 
                ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:scale-[1.02]'
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="w-6 h-6" />
                Upload Content
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
