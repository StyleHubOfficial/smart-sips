import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useUploadStore } from '../store/useUploadStore';

export default function GlobalUploadProgress() {
  const { uploads, removeUpload } = useUploadStore();
  
  // Filter for active or recently completed uploads
  // We might want to auto-dismiss completed ones after a delay, but for now let's just show them
  // The store has a clearCompleted method, but we can also let the user dismiss them
  
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {uploads.map((upload) => (
          <motion.div
            key={upload.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-xl w-72 flex items-center gap-3"
          >
            <div className="shrink-0">
              {upload.status === 'uploading' && (
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#333"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="3"
                      strokeDasharray={`${upload.progress}, 100`}
                    />
                  </svg>
                  <div className="absolute text-[8px] font-bold">{upload.progress}%</div>
                </div>
              )}
              {upload.status === 'completed' && <CheckCircle className="w-8 h-8 text-green-500" />}
              {upload.status === 'error' && <XCircle className="w-8 h-8 text-red-500" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{upload.file.name}</p>
              <p className="text-[10px] text-gray-400 truncate">
                {upload.status === 'uploading' ? 'Uploading...' : 
                 upload.status === 'completed' ? 'Completed' : 'Failed'}
              </p>
            </div>

            {upload.status !== 'uploading' && (
              <button 
                onClick={() => removeUpload(upload.id)}
                className="shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
