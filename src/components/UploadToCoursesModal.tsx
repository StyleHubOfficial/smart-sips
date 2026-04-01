import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, BookOpen, GraduationCap, CheckCircle2, Loader2 } from 'lucide-react';

interface UploadToCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { class: string; subject: string }) => Promise<void>;
  title?: string;
}

const CLASSES = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'College', 'Competitive Exams'];
const SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'English', 'History', 'Geography', 'Economics', 'Other'];

import { usePracticeStore } from '../store/usePracticeStore';

export default function UploadToCoursesModal({ isOpen, onClose, onUpload, title = "Upload to Courses" }: UploadToCoursesModalProps) {
  const { isSmartPanelMode } = usePracticeStore();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedClass || !selectedSubject) return;
    setIsUploading(true);
    try {
      await onUpload({ class: selectedClass, subject: selectedSubject });
      onClose();
    } catch (error) {
      console.error("Upload Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={isSmartPanelMode ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={isSmartPanelMode ? undefined : { opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={isSmartPanelMode ? false : { scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={isSmartPanelMode ? undefined : { scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#0E0E12] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF]">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-display font-bold text-white">{title}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Class Selection */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <GraduationCap className="w-4 h-4" />
                  Select Class
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CLASSES.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedClass === cls 
                          ? 'bg-[#00F0FF] text-black border-[#00F0FF]' 
                          : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Selection */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <BookOpen className="w-4 h-4" />
                  Select Subject
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUBJECTS.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        selectedSubject === sub 
                          ? 'bg-[#B026FF] text-white border-[#B026FF]' 
                          : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleUpload}
                  disabled={!selectedClass || !selectedSubject || isUploading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold text-lg hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      Confirm Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
