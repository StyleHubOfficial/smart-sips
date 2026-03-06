import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatGroup {
  id: string;
  name: string;
  members: string[]; // roles
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderRole: string;
  receiverRole: string; // can be a role or a group id
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isGroup?: boolean;
}

export interface SiteNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  senderRole: string;
}

export interface MaintenanceAlert {
  id: string;
  section: string;
  message: string;
  isActive: boolean;
}

interface AppState {
  messages: ChatMessage[];
  groups: ChatGroup[];
  notifications: SiteNotification[];
  maintenanceAlerts: MaintenanceAlert[];
  onlineTimes: Record<string, string>;
  isSimpleMode: boolean;
  viewedContent: string[];
  
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>) => void;
  markMessagesAsRead: (receiverRole: string, senderRole: string, isGroup?: boolean) => void;
  
  createGroup: (group: Omit<ChatGroup, 'id' | 'createdAt'>) => void;
  updateGroup: (id: string, updates: Partial<ChatGroup>) => void;
  deleteGroup: (id: string) => void;
  
  addSiteNotification: (notif: Omit<SiteNotification, 'id' | 'timestamp'>) => void;
  deleteSiteNotification: (id: string) => void;
  
  setOnlineTime: (role: string, time: string) => void;
  
  setMaintenanceAlert: (alert: MaintenanceAlert) => void;
  removeMaintenanceAlert: (id: string) => void;
  toggleSimpleMode: () => void;
  markContentAsViewed: (contentId: string) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      messages: [],
      groups: [],
      notifications: [],
      maintenanceAlerts: [],
      onlineTimes: {},
      isSimpleMode: false,
      viewedContent: [],
      
      addMessage: (msg) => set((state) => ({
        messages: [...state.messages, {
          ...msg,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          status: 'sent'
        }]
      })),
      
      markMessagesAsRead: (receiverRole, senderRole, isGroup) => set((state) => ({
        messages: state.messages.map(m => 
          (isGroup ? m.receiverRole === receiverRole : m.receiverRole === receiverRole && m.senderRole === senderRole) 
            ? { ...m, status: 'read' } 
            : m
        )
      })),

      createGroup: (group) => set((state) => ({
        groups: [...state.groups, {
          ...group,
          id: Math.random().toString(36).substring(7),
          createdAt: new Date().toISOString()
        }]
      })),

      updateGroup: (id, updates) => set((state) => ({
        groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
      })),

      deleteGroup: (id) => set((state) => ({
        groups: state.groups.filter(g => g.id !== id)
      })),
      
      addSiteNotification: (notif) => set((state) => ({
        notifications: [{
          ...notif,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString()
        }, ...state.notifications]
      })),
      
      deleteSiteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      setOnlineTime: (role, time) => set((state) => ({
        onlineTimes: { ...state.onlineTimes, [role]: time }
      })),
      
      setMaintenanceAlert: (alert) => set((state) => {
        const existing = state.maintenanceAlerts.findIndex(a => a.id === alert.id || a.section === alert.section);
        if (existing >= 0) {
          const newAlerts = [...state.maintenanceAlerts];
          newAlerts[existing] = alert;
          return { maintenanceAlerts: newAlerts };
        }
        return { maintenanceAlerts: [...state.maintenanceAlerts, alert] };
      }),
      
      removeMaintenanceAlert: (id) => set((state) => ({
        maintenanceAlerts: state.maintenanceAlerts.filter(a => a.id !== id)
      })),

      toggleSimpleMode: () => set((state) => ({ isSimpleMode: !state.isSimpleMode })),
      
      markContentAsViewed: (contentId) => set((state) => ({
        viewedContent: state.viewedContent.includes(contentId) 
          ? state.viewedContent 
          : [...state.viewedContent, contentId]
      })),
      
      resetApp: () => set({
        messages: [],
        groups: [],
        notifications: [],
        maintenanceAlerts: [],
        onlineTimes: {},
        isSimpleMode: false,
        viewedContent: []
      })
    }),
    {
      name: 'sunrise-app-storage',
    }
  )
);
