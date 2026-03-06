import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, MessageSquare, Bell, Activity, Shield, Users, Clock, Send, Check, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { Navigate } from 'react-router-dom';
import Upload from './Upload';

export default function Manage() {
  const { role, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upload' | 'notifications' | 'status' | 'maintenance'>('upload');
  
  const { 
    messages, addMessage, markMessagesAsRead, 
    notifications, addSiteNotification, deleteSiteNotification,
    maintenanceAlerts, setMaintenanceAlert, removeMaintenanceAlert,
    onlineTimes, setOnlineTime
  } = useAppStore();
  
  const addToast = useNotificationStore(state => state.addNotification);

  const [messageInput, setMessageInput] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('teacher');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [onlineTimeInput, setOnlineTimeInput] = useState(onlineTimes[role] || '');
  const [maintSection, setMaintSection] = useState('');
  const [maintMsg, setMaintMsg] = useState('');

  if (!isAuthenticated || (role !== 'admin' && role !== 'developer')) {
    return <Navigate to="/" />;
  }

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    addMessage({
      senderRole: role,
      receiverRole: selectedReceiver,
      text: messageInput.trim()
    });
    setMessageInput('');
  };

  const handleSendNotification = () => {
    if (!notifTitle.trim() || !notifMsg.trim()) return;
    addSiteNotification({
      title: notifTitle.trim(),
      message: notifMsg.trim(),
      senderRole: role
    });
    setNotifTitle('');
    setNotifMsg('');
    addToast('success', 'Notification broadcasted successfully');
  };

  const handleSetOnlineTime = () => {
    setOnlineTime(role, onlineTimeInput);
    addToast('success', 'Online time updated');
  };

  const handleAddMaintenance = () => {
    if (!maintSection.trim() || !maintMsg.trim()) return;
    setMaintenanceAlert({
      id: Date.now().toString(),
      section: maintSection.trim(),
      message: maintMsg.trim(),
      isActive: true
    });
    setMaintSection('');
    setMaintMsg('');
    addToast('success', 'Maintenance alert added');
  };

  const currentChatMessages = messages.filter(m => 
    (m.senderRole === role && m.receiverRole === selectedReceiver) || 
    (m.senderRole === selectedReceiver && m.receiverRole === role)
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 md:p-10 max-w-7xl mx-auto pb-32"
    >
      <div className="mb-10 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
          <Shield className="w-8 h-8 text-[#00F0FF]" />
        </div>
        <div>
          <h2 className="text-3xl md:text-5xl font-display font-bold">
            {role === 'developer' ? 'Developer' : 'Admin'} <span className="text-gradient">Manage</span>
          </h2>
          <p className="text-gray-400">Control panel and communications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} title="Upload Content">
          <UploadCloud className="w-4 h-4" /> Upload Content
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'notifications' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} title="Notifications">
          <Bell className="w-4 h-4" /> Notifications
        </button>
        <button onClick={() => setActiveTab('status')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'status' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} title="System Status">
          <Activity className="w-4 h-4" /> System Status
        </button>
        {role === 'developer' && (
          <button onClick={() => setActiveTab('maintenance')} className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${activeTab === 'maintenance' ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} title="Maintenance">
            <Shield className="w-4 h-4" /> Maintenance
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'upload' && (
          <div className="-mx-6 md:-mx-10 -mt-10">
            <Upload onOpenLogin={() => {}} />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Bell className="w-5 h-5 text-[#00F0FF]" /> Broadcast Notification</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Title</label>
                  <input type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none" placeholder="e.g. Holiday Announcement" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Message</label>
                  <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none h-32 resize-none" placeholder="Enter notification details..." />
                </div>
                <button onClick={handleSendNotification} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all">
                  Send to All Teachers
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-[#B026FF]" /> Set Online Time</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Let teachers know when you are available to reply to messages.</p>
                <div>
                  <input type="text" value={onlineTimeInput} onChange={e => setOnlineTimeInput(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#00F0FF]/50 outline-none" placeholder="e.g. 9:00 AM - 5:00 PM" />
                </div>
                <button onClick={handleSetOnlineTime} className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all">
                  Update Availability
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel rounded-2xl p-6 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <Activity className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Database Status</p>
                  <p className="text-xl font-bold text-white">Online & Stable</p>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-6 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#00F0FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
                  <UploadCloud className="w-6 h-6 text-[#00F0FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Cloudinary API</p>
                  <p className="text-xl font-bold text-white">Connected</p>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-6 border border-white/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#B026FF]/20 flex items-center justify-center border border-[#B026FF]/30">
                  <MessageSquare className="w-6 h-6 text-[#B026FF]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">AI Helper (Gemini)</p>
                  <p className="text-xl font-bold text-white">Active</p>
                </div>
              </div>
            </div>

            {maintenanceAlerts.length > 0 && (
              <div className="glass-panel rounded-2xl p-6 border border-yellow-500/30 bg-yellow-500/5">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">Active Maintenance Alerts</h3>
                <div className="space-y-3">
                  {maintenanceAlerts.map(alert => (
                    <div key={alert.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">{alert.section}</span>
                        <p className="text-gray-300 mt-1">{alert.message}</p>
                      </div>
                      {role === 'developer' && (
                        <button onClick={() => removeMaintenanceAlert(alert.id)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg bg-red-500/10">Resolve</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && role === 'developer' && (
          <div className="glass-panel rounded-2xl p-6 border border-white/10 max-w-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" /> Add Maintenance Alert</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Section / Feature</label>
                <input type="text" value={maintSection} onChange={e => setMaintSection(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500/50 outline-none" placeholder="e.g. Video Uploads" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Message</label>
                <textarea value={maintMsg} onChange={e => setMaintMsg(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500/50 outline-none h-24 resize-none" placeholder="e.g. Video uploads are currently degraded. We are investigating." />
              </div>
              <button onClick={handleAddMaintenance} className="w-full py-3 rounded-xl bg-green-500/20 text-green-400 font-bold hover:bg-green-500/30 transition-all border border-green-500/30">
                Publish Alert
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
