import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Send, Users, User, Plus, Bell, MoreVertical, Check, CheckCheck, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore, ChatGroup } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { format } from 'date-fns';

export default function Chat() {
  const { role } = useAuthStore();
  const { messages, groups, addMessage, markMessagesAsRead, createGroup, updateGroup, deleteGroup, addSiteNotification } = useAppStore();
  const addNotification = useNotificationStore(state => state.addNotification);
  
  const [activeChat, setActiveChat] = useState<{ id: string, type: 'user' | 'group', name: string } | null>(null);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ChatGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const availableRoles = ['admin', 'developer', 'teacher', 'student'];

  useEffect(() => {
    if (activeChat) {
      markMessagesAsRead(role, activeChat.id, activeChat.type === 'group');
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat, messages.length, markMessagesAsRead, role]);

  const handleSend = () => {
    if (!input.trim() || !activeChat) return;

    addMessage({
      senderRole: role,
      receiverRole: activeChat.id,
      text: input.trim(),
      isGroup: activeChat.type === 'group'
    });
    setInput('');
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) {
      addNotification('error', 'Group name and at least one member required');
      return;
    }
    
    if (editingGroup) {
      updateGroup(editingGroup.id, {
        name: newGroupName.trim(),
        members: [...selectedMembers, role]
      });
      addNotification('success', 'Group updated successfully');
    } else {
      createGroup({
        name: newGroupName.trim(),
        members: [...selectedMembers, role],
        createdBy: role
      });
      addNotification('success', 'Group created successfully');
    }
    
    setShowNewGroup(false);
    setEditingGroup(null);
    setNewGroupName('');
    setSelectedMembers([]);
  };

  const openEditGroup = (group: ChatGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setSelectedMembers(group.members.filter(m => m !== role));
    setShowNewGroup(true);
  };

  const handleSendAnnouncement = () => {
    if (!input.trim() || !activeChat) return;
    
    addSiteNotification({
      title: `Announcement from ${role.toUpperCase()}`,
      message: input.trim(),
      senderRole: role
    });
    
    addMessage({
      senderRole: role,
      receiverRole: activeChat.id,
      text: `📢 ANNOUNCEMENT: ${input.trim()}`,
      isGroup: activeChat.type === 'group'
    });
    
    setInput('');
    addNotification('success', 'Announcement sent');
  };

  const currentMessages = messages.filter(m => {
    if (!activeChat) return false;
    if (activeChat.type === 'group') {
      return m.receiverRole === activeChat.id && m.isGroup;
    } else {
      return (m.senderRole === role && m.receiverRole === activeChat.id && !m.isGroup) || 
             (m.senderRole === activeChat.id && m.receiverRole === role && !m.isGroup);
    }
  });

  const myGroups = groups.filter(g => g.members.includes(role));
  const otherRoles = availableRoles.filter(r => r !== role);

  const filteredChats = [
    ...otherRoles.map(r => ({ id: r, type: 'user' as const, name: r.charAt(0).toUpperCase() + r.slice(1) })),
    ...myGroups.map(g => ({ id: g.id, type: 'group' as const, name: g.name }))
  ].filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 md:p-10 max-w-[1600px] mx-auto pb-32 h-[calc(100vh-80px)] flex gap-6"
    >
      {/* Sidebar */}
      <div className="w-1/3 max-w-sm glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-black/20">
          <h2 className="text-xl font-display font-bold mb-4">Messages</h2>
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
            />
          </div>
          {(role === 'admin' || role === 'developer' || role === 'teacher') && (
            <button 
              onClick={() => setShowNewGroup(true)}
              title="Create New Group"
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Group
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${activeChat?.id === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${chat.type === 'group' ? 'bg-[#B026FF]/20 text-[#B026FF]' : 'bg-[#00F0FF]/20 text-[#00F0FF]'}`}>
                {chat.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-white truncate">{chat.name}</p>
                <p className="text-xs text-gray-400 truncate">{chat.type === 'group' ? 'Group Chat' : 'Direct Message'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/10 flex flex-col overflow-hidden relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeChat.type === 'group' ? 'bg-[#B026FF]/20 text-[#B026FF]' : 'bg-[#00F0FF]/20 text-[#00F0FF]'}`}>
                  {activeChat.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{activeChat.name}</h3>
                  <p className="text-xs text-gray-400">
                    {activeChat.type === 'group' 
                      ? `${groups.find(g => g.id === activeChat.id)?.members.length || 0} members`
                      : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeChat.type === 'group' && (role === 'admin' || role === 'developer') && (
                  <>
                    <button 
                      onClick={() => openEditGroup(groups.find(g => g.id === activeChat.id)!)}
                      title="Edit Group"
                      className="p-2 rounded-lg hover:bg-[#00F0FF]/20 text-gray-400 hover:text-[#00F0FF] transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('Delete this group?')) {
                          deleteGroup(activeChat.id);
                          setActiveChat(null);
                        }
                      }}
                      title="Delete Group"
                      className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentMessages.map(msg => {
                const isMe = msg.senderRole === role;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${
                      isMe 
                        ? 'bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 border border-[#00F0FF]/30 text-white rounded-tr-sm' 
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm'
                    }`}>
                      {!isMe && activeChat.type === 'group' && (
                        <p className="text-xs text-[#00F0FF] mb-1 font-medium">{msg.senderRole}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'justify-end text-[#00F0FF]/70' : 'text-gray-500'}`}>
                        {format(new Date(msg.timestamp), 'HH:mm')}
                        {isMe && (
                          msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-[#00F0FF]" /> : 
                          msg.status === 'delivered' ? <CheckCheck className="w-3 h-3 text-gray-400" /> :
                          <Check className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00F0FF]/50"
                />
                {(role === 'admin' || role === 'developer' || role === 'teacher') && (
                  <button 
                    onClick={handleSendAnnouncement}
                    disabled={!input.trim()}
                    className="p-3 rounded-xl bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30 transition-colors disabled:opacity-50"
                    title="Send as Announcement"
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                )}
                <button 
                  onClick={handleSend}
                  title="Send Message"
                  disabled={!input.trim()}
                  className="p-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white disabled:opacity-50 transition-transform hover:scale-105 active:scale-95"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Users className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a chat to start messaging</p>
          </div>
        )}

        {/* New Group Modal */}
        <AnimatePresence>
          {showNewGroup && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-panel rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl"
              >
                <h3 className="text-xl font-display font-bold mb-4">{editingGroup ? 'Edit Group' : 'Create New Group'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Group Name</label>
                    <input 
                      type="text"
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#00F0FF]/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Select Members</label>
                    <div className="space-y-2">
                      {availableRoles.filter(r => r !== role).map(r => (
                        <label key={r} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedMembers.includes(r)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedMembers([...selectedMembers, r]);
                              else setSelectedMembers(selectedMembers.filter(m => m !== r));
                            }}
                            className="rounded border-white/20 bg-black/40 text-[#00F0FF] focus:ring-[#00F0FF]/50"
                          />
                          <span className="text-sm capitalize">{r}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => {
                        setShowNewGroup(false);
                        setEditingGroup(null);
                        setNewGroupName('');
                        setSelectedMembers([]);
                      }}
                      className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateGroup}
                      className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white text-sm font-medium transition-colors"
                    >
                      {editingGroup ? 'Save Changes' : 'Create'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
