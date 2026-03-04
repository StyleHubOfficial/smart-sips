import React from 'react';
import { motion } from 'motion/react';
import { Activity, Users, UploadCloud, MessageSquare, Shield } from 'lucide-react';

export default function Analytics() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 max-w-7xl mx-auto"
    >
      <h2 className="text-3xl font-bold mb-8">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value="1,234" icon={<Users className="w-6 h-6" />} color="text-blue-400" />
        <StatCard title="Content Uploads" value="567" icon={<UploadCloud className="w-6 h-6" />} color="text-green-400" />
        <StatCard title="Messages Sent" value="8,901" icon={<MessageSquare className="w-6 h-6" />} color="text-purple-400" />
        <StatCard title="System Status" value="Healthy" icon={<Activity className="w-6 h-6" />} color="text-emerald-400" />
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
