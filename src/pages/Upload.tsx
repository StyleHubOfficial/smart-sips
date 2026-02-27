import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, CheckCircle, XCircle, File as FileIcon, Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    teacher: "",
    className: "Class 10",
    subject: "Mathematics",
    description: "",
    fileType: "PDF"
  });

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
    setError(null);

    const data = new FormData();
    data.append("file", file);
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value));
    });

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Upload failed");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setFormData({
          title: "",
          teacher: "",
          className: "Class 10",
          subject: "Mathematics",
          description: "",
          fileType: "PDF"
        });
      }, 3000);
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

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
            <label className="text-sm font-medium text-gray-300 uppercase tracking-wider">File Upload</label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
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
                    <p className="text-lg font-medium text-white mb-1">{file.name}</p>
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
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3"
              >
                <XCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5" />
                <p className="text-sm">File uploaded successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

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
