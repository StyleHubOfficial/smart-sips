import { create } from 'zustand';
import axios from 'axios';
import { useNotificationStore } from './useNotificationStore';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  contextStr: string;
}

interface UploadState {
  uploads: UploadItem[];
  addUpload: (file: File, contextStr: string) => Promise<void>;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  uploads: [],
  addUpload: async (file, contextStr) => {
    const id = Math.random().toString(36).substring(7);
    
    // Add to store
    set((state) => ({
      uploads: [...state.uploads, { id, file, progress: 0, status: 'uploading', contextStr }]
    }));

    try {
      // 1. Get signature
      const signRes = await axios.get("/api/sign-upload", {
        params: { context: contextStr }
      });
      const { signature, timestamp, cloudName, apiKey, folder } = signRes.data;

      // 2. Prepare FormData
      const data = new FormData();
      data.append("file", file);
      data.append("api_key", apiKey);
      data.append("timestamp", timestamp);
      data.append("signature", signature);
      data.append("folder", folder);
      data.append("context", contextStr);

      // 3. Upload
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      
      await axios.post(uploadUrl, data, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total) 
            : 0;
          
          set((state) => ({
            uploads: state.uploads.map(u => 
              u.id === id ? { ...u, progress } : u
            )
          }));
        }
      });

      // Update status to completed
      set((state) => ({
        uploads: state.uploads.map(u => 
          u.id === id ? { ...u, status: 'completed', progress: 100 } : u
        )
      }));

      // Notify success
      useNotificationStore.getState().addNotification('success', `Upload complete: ${file.name}`);

    } catch (error: any) {
      console.error("Upload failed:", error);
      
      // Update status to error
      set((state) => ({
        uploads: state.uploads.map(u => 
          u.id === id ? { ...u, status: 'error', error: error.message || 'Upload failed' } : u
        )
      }));

      // Notify error
      useNotificationStore.getState().addNotification('error', `Upload failed: ${file.name}`);
    }
  },
  removeUpload: (id) => set((state) => ({
    uploads: state.uploads.filter(u => u.id !== id)
  })),
  clearCompleted: () => set((state) => ({
    uploads: state.uploads.filter(u => u.status !== 'completed')
  }))
}));
