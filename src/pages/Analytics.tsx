import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, FileText, Activity, TrendingUp, Clock, Server, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';

export default function Analytics() {
  const { role, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 1250,
    activeUsers: 342,
    totalContent: 856,
    systemUptime: '99.9%',
    serverLoad: '42%'
  });

  if (!isAuthenticated || (role !== 'admin' && role !== 'developer')) {
    return <Navigate to="/" replace />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="p-6 md:p-10 max-w-[1600px] mx-auto pb-32"
    >
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-[#00F0FF]" />
          Analytics & <span className="text-gradient">System Status</span>
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-[#00F0FF] to-[#B026FF] rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          icon={<Users className="w-6 h-6 text-[#00F0FF]" />}
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          trend="+12% this month"
          trendUp={true}
        />
        <StatCard 
          icon={<Activity className="w-6 h-6 text-green-400" />}
          title="Active Now"
          value={stats.activeUsers.toLocaleString()}
          trend="Peak hours"
          trendUp={true}
        />
        <StatCard 
          icon={<FileText className="w-6 h-6 text-[#B026FF]" />}
          title="Content Items"
          value={stats.totalContent.toLocaleString()}
          trend="+45 this week"
          trendUp={true}
        />
        <StatCard 
          icon={<Server className="w-6 h-6 text-orange-400" />}
          title="Server Load"
          value={stats.serverLoad}
          trend="Normal"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00F0FF]" />
            Content Popularity
          </h3>
          <div className="space-y-4">
            <PopularItem title="Introduction to Physics" type="Video" views={1245} />
            <PopularItem title="Advanced Mathematics Notes" type="PDF" views={982} />
            <PopularItem title="Chemistry Lab Guide" type="PDF" views={856} />
            <PopularItem title="History Chapter 4" type="Video" views={743} />
            <PopularItem title="Biology Diagrams" type="Image" views={612} />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#B026FF]" />
            System Status
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-medium">Main Database</span>
              </div>
              <span className="text-sm text-green-400">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-medium">Storage Server</span>
              </div>
              <span className="text-sm text-green-400">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="font-medium">Authentication</span>
              </div>
              <span className="text-sm text-green-400">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="font-medium">AI Services</span>
              </div>
              <span className="text-sm text-yellow-400">High Latency</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ icon, title, value, trend, trendUp }: { icon: React.ReactNode, title: string, value: string, trend: string, trendUp: boolean }) {
  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/10 hover:border-[#00F0FF]/30 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/5 rounded-xl">
          {icon}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${trendUp ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
          {trend}
        </span>
      </div>
      <h4 className="text-gray-400 text-sm font-medium mb-1">{title}</h4>
      <p className="text-3xl font-display font-bold text-white">{value}</p>
    </div>
  );
}

function PopularItem({ title, type, views }: { title: string, type: string, views: number }) {
  return (
    <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center border border-white/5">
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className="font-medium text-white text-sm">{title}</p>
          <p className="text-xs text-gray-500">{type}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-[#00F0FF]">{views.toLocaleString()}</p>
        <p className="text-xs text-gray-500">views</p>
      </div>
    </div>
  );
}
