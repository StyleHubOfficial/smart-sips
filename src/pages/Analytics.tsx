import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Users, UploadCloud, MessageSquare, Bell } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export default function Analytics() {
  const [stats, setStats] = useState({
    users: 0,
    content: 0,
    messages: 0,
    notifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const msgsSnap = await getDocs(collection(db, 'messages'));
        const notifsSnap = await getDocs(collection(db, 'notifications'));
        
        let contentCount = 0;
        try {
          const contentRes = await fetch('/api/content');
          if (contentRes.ok) {
            const contentData = await contentRes.json();
            contentCount = contentData.resources?.length || 0;
          }
        } catch (e) {
          console.error("Content fetch error", e);
        }
        
        setStats({
          users: usersSnap.size,
          content: contentCount,
          messages: msgsSnap.size,
          notifications: notifsSnap.size
        });
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 max-w-7xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-8">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={loading ? "..." : stats.users.toString()} icon={<Users className="w-6 h-6" />} color="text-blue-400" />
        <StatCard title="Content Uploads" value={loading ? "..." : stats.content.toString()} icon={<UploadCloud className="w-6 h-6" />} color="text-green-400" />
        <StatCard title="Messages Sent" value={loading ? "..." : stats.messages.toString()} icon={<MessageSquare className="w-6 h-6" />} color="text-purple-400" />
        <StatCard title="Active Notifications" value={loading ? "..." : stats.notifications.toString()} icon={<Bell className="w-6 h-6" />} color="text-yellow-400" />
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10">
      <div className={`mb-4 ${color}`}>{icon}</div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
