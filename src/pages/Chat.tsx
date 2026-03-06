import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Users, Send, Check, CheckCheck, Menu, X, Plus, Settings, Search } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { Navigate } from 'react-router-dom';

export default function Chat() {
  const { role, isAuthenticated } = useAuthStore();
  const { messages, addMessage, onlineTimes } = useAppStore();
  
  const [selectedReceiver, setSelectedReceiver] = useState(role === 'teacher' ? 'admin' : 'teacher');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [customGroups, setCustomGroups] = useState<string[]>([]);

  if (!isAuthenticated) {
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

  const currentChatMessages = messages.filter(m => 
    (m.senderRole === role && m.receiverRole === selectedReceiver) || 
    (m.senderRole === selectedReceiver && m.receiverRole === role)
  );

  const contacts = role === 'teacher' 
    ? ['admin', 'developer'] 
    : ['teacher', 'admin', 'developer', 'Group: Class 10', 'Group: Science Teachers', ...customGroups].filter(r => r !== role);

  const filteredContacts = contacts.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      setCustomGroups(prev => [...prev, `Group: ${newGroupName.trim()}`]);
      setIsNewGroupModalOpen(false);
      setNewGroupName('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-4 md:p-6 max-w-7xl mx-auto pb-32 h-[calc(100vh-100px)]"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
            <MessageSquare className="w-6 h-6 text-[#00F0FF]" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold">
              Communication <span className="text-gradient">Hub</span>
            </h2>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden p-2 rounded-xl bg-white/5 text-white"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <div className="flex h-[calc(100%-80px)] gap-6 relative">
        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 768) && (
            <motion.div 
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className={`absolute md:relative z-20 w-72 h-full glass-panel !bg-black/95 md:!bg-[var(--color-glass)] backdrop-blur-2xl md:backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col overflow-hidden ${!isSidebarOpen ? 'hidden md:flex' : 'flex'}`}
            >
              <div className="p-4 border-b border-white/10 bg-black/40 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Conversations</h3>
                  {(role === 'admin' || role === 'developer') && (
                    <button 
                      onClick={() => setIsNewGroupModalOpen(true)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#00F0FF]" 
                      title="New Group"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search chats..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredContacts.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-4">No chats found</div>
                ) : (
                  filteredContacts.map(r => (
                    <button 
                      key={r}
                    onClick={() => {
                      setSelectedReceiver(r);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${selectedReceiver === r ? 'bg-[#00F0FF]/20 text-white border border-[#00F0FF]/30' : 'text-gray-400 hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0">
                      {r.includes('Group') ? <Users className="w-5 h-5 text-purple-400" /> : <MessageSquare className="w-5 h-5 text-[#00F0FF]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="capitalize font-medium truncate text-sm">{r}</div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {onlineTimes[r] ? `Available: ${onlineTimes[r]}` : 'Online'}
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 flex items-center justify-center border border-[#00F0FF]/30">
                {selectedReceiver.includes('Group') ? <Users className="w-5 h-5 text-[#00F0FF]" /> : <MessageSquare className="w-5 h-5 text-[#00F0FF]" />}
              </div>
              <div>
                <h3 className="font-bold capitalize">{selectedReceiver}</h3>
                <p className="text-xs text-gray-400">{onlineTimes[selectedReceiver] ? `Available: ${onlineTimes[selectedReceiver]}` : 'Online'}</p>
              </div>
            </div>
            {selectedReceiver.includes('Group') && (role === 'admin' || role === 'developer') && (
              <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/20">
            {currentChatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              currentChatMessages.map(msg => {
                const isMe = msg.senderRole === role;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 rounded-tr-sm' : 'bg-white/5 border border-white/10 rounded-tl-sm'}`}>
                      <p className="text-sm text-white mb-1">{msg.text}</p>
                      <div className={`text-[10px] flex items-center justify-end gap-1 ${isMe ? 'text-[#00F0FF]/70' : 'text-gray-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-[#00F0FF]" /> : 
                          msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-gray-400" /> :
                          <Check className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="relative flex items-center">
              <input 
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="absolute right-2 p-2 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white disabled:opacity-50"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Group Modal */}
      <AnimatePresence>
        {isNewGroupModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-2xl border border-white/10 p-6 w-full max-w-md relative"
            >
              <button 
                onClick={() => setIsNewGroupModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold mb-6">Create New Group</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Group Name</label>
                  <input 
                    type="text" 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF]/50 transition-colors"
                    placeholder="e.g., Class 10 Science"
                  />
                </div>
                
                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Create Group
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
