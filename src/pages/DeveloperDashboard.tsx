import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Activity, MessageSquare, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';

interface Feedback {
  id: number;
  text: string;
  senderRole: string;
  date: string;
  status: 'unread' | 'read';
}

export default function DeveloperDashboard() {
  const { role, isAuthenticated } = useAuthStore();
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('sunrise_feedback') || '[]');
    setFeedback(stored.sort((a: Feedback, b: Feedback) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const markAsRead = (id: number) => {
    const updated = feedback.map(f => f.id === id ? { ...f, status: 'read' as const } : f);
    setFeedback(updated);
    localStorage.setItem('sunrise_feedback', JSON.stringify(updated));
  };

  const deleteFeedback = (id: number) => {
    const updated = feedback.filter(f => f.id !== id);
    setFeedback(updated);
    localStorage.setItem('sunrise_feedback', JSON.stringify(updated));
  };

  if (!isAuthenticated || role !== 'developer') {
    return <Navigate to="/" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-10 max-w-6xl mx-auto pb-32"
    >
      <div className="mb-10 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
          <Shield className="w-8 h-8 text-[#00F0FF]" />
        </div>
        <div>
          <h2 className="text-3xl md:text-5xl font-display font-bold">
            Developer <span className="text-gradient">Control Panel</span>
          </h2>
          <p className="text-gray-400">System status, logs, and user feedback</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <Activity className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">System Status</p>
            <p className="text-xl font-bold text-white">Online & Stable</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#00F0FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
            <MessageSquare className="w-6 h-6 text-[#00F0FF]" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Feedback</p>
            <p className="text-xl font-bold text-white">{feedback.length}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Active Alerts</p>
            <p className="text-xl font-bold text-white">0</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-8 border border-white/10">
        <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#B026FF]" />
          User Feedback & Ideas
        </h3>

        {feedback.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No feedback received yet.
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map(f => (
              <div key={f.id} className={`p-5 rounded-2xl border transition-colors ${f.status === 'unread' ? 'bg-white/5 border-[#00F0FF]/30' : 'bg-black/40 border-white/10'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      f.senderRole === 'teacher' ? 'bg-blue-500/20 text-blue-400' :
                      f.senderRole === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {f.senderRole.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(f.date).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {f.status === 'unread' && (
                      <button onClick={() => markAsRead(f.id)} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors" title="Mark as Read">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => deleteFeedback(f.id)} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
