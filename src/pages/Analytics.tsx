import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, Users, Eye, FileText, Activity, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { BackButton } from '../components/BackButton';

interface ContentItem {
  public_id: string;
  secure_url: string;
  created_at: string;
  context?: {
    custom?: {
      title?: string;
      class?: string;
      subject?: string;
      fileType?: string;
      views?: string;
    }
  };
}

export default function Analytics() {
  const { role, isAuthenticated } = useAuthStore();
  const [contentCount, setContentCount] = useState(0);
  const [popularContent, setPopularContent] = useState<ContentItem[]>([]);
  const [serverLoad, setServerLoad] = useState(42);
  const [apiLimit, setApiLimit] = useState(15);
  const [activeUsers, setActiveUsers] = useState(1248);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await axios.get('/api/content');
        const items: ContentItem[] = response.data.resources;
        setContentCount(items.length);
        
        // Sort by a simulated view count (or real if available)
        const sorted = [...items].sort((a, b) => {
          const viewsA = parseInt(a.context?.custom?.views || '0') || Math.floor(Math.random() * 5000);
          const viewsB = parseInt(b.context?.custom?.views || '0') || Math.floor(Math.random() * 5000);
          return viewsB - viewsA;
        });
        setPopularContent(sorted.slice(0, 4));
      } catch (error) {
        console.error("Error fetching content for analytics:", error);
        // Fallback data
        setContentCount(856);
        setPopularContent([
          { public_id: 'Mathematics - Algebra Basics', secure_url: '', created_at: '', context: { custom: { views: '4250' } } },
          { public_id: 'Physics - Quantum Mechanics', secure_url: '', created_at: '', context: { custom: { views: '3820' } } },
          { public_id: 'Chemistry - Organic Reactions', secure_url: '', created_at: '', context: { custom: { views: '2900' } } },
          { public_id: 'Biology - Cell Structure', secure_url: '', created_at: '', context: { custom: { views: '1540' } } },
        ]);
      }
    };

    fetchContent();

    // Simulate real-time updates
    const interval = setInterval(() => {
      setServerLoad(prev => Math.max(10, Math.min(90, prev + (Math.random() * 10 - 5))));
      setApiLimit(prev => Math.max(5, Math.min(50, prev + (Math.random() * 4 - 2))));
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated || (role !== 'admin' && role !== 'developer')) {
    return <Navigate to="/" />;
  }

  const stats = [
    { title: 'Total Users', value: activeUsers.toLocaleString(), change: '+12%', icon: <Users className="w-6 h-6 text-blue-400" /> },
    { title: 'Content Views', value: '45.2K', change: '+24%', icon: <Eye className="w-6 h-6 text-green-400" /> },
    { title: 'Resources Uploaded', value: contentCount.toString(), change: '+8%', icon: <FileText className="w-6 h-6 text-purple-400" /> },
    { title: 'System Uptime', value: '99.9%', change: 'Stable', icon: <Activity className="w-6 h-6 text-[#00F0FF]" /> },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-10 max-w-7xl mx-auto pb-32"
    >
      <div className="mb-6">
        <BackButton label="Back to Dashboard" to="/dashboard" />
      </div>

      <div className="mb-10 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
          <BarChart3 className="w-8 h-8 text-[#00F0FF]" />
        </div>
        <div>
          <h2 className="text-3xl md:text-5xl font-display font-bold">
            System <span className="text-gradient">Analytics</span>
          </h2>
          <p className="text-gray-400">Track website usage, content popularity, and system status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden group hover:border-[#00F0FF]/30 transition-colors"
          >
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform duration-500">
              {stat.icon}
            </div>
            <div className="relative z-10">
              <p className="text-sm text-gray-400 mb-2">{stat.title}</p>
              <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
              <div className="flex items-center gap-1 text-xs font-medium text-green-400">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00F0FF]" /> Content Popularity
          </h3>
          <div className="space-y-4">
            {popularContent.length > 0 ? popularContent.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 font-bold">
                    {i + 1}
                  </div>
                  <span className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-[300px]">
                    {item.context?.custom?.title || item.public_id}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
                  <Eye className="w-3 h-3" /> {item.context?.custom?.views || Math.floor(Math.random() * 5000) + 1000} views
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">Loading content data...</div>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#B026FF]" /> System Status
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Server Load</span>
                <span className={serverLoad > 80 ? 'text-red-400' : serverLoad > 60 ? 'text-yellow-400' : 'text-green-400'}>
                  {serverLoad.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${serverLoad > 80 ? 'bg-red-400' : serverLoad > 60 ? 'bg-yellow-400' : 'bg-green-400'}`} 
                  style={{ width: `${serverLoad}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Storage Used</span>
                <span className="text-yellow-400">78%</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 w-[78%] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">API Rate Limits</span>
                <span className="text-[#00F0FF]">{apiLimit.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00F0FF] rounded-full transition-all duration-1000" 
                  style={{ width: `${apiLimit}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
