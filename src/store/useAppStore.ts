import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  senderRole: string;
  receiverRole: string; 
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
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
  notifications: SiteNotification[];
  maintenanceAlerts: MaintenanceAlert[];
  onlineTimes: Record<string, string>;
  isSimpleMode: boolean;
  
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>) => void;
  markMessagesAsRead: (receiverRole: string, senderRole: string) => void;
  
  addSiteNotification: (notif: Omit<SiteNotification, 'id' | 'timestamp'>) => void;
  deleteSiteNotification: (id: string) => void;
  
  setOnlineTime: (role: string, time: string) => void;
  
  setMaintenanceAlert: (alert: MaintenanceAlert) => void;
  removeMaintenanceAlert: (id: string) => void;
  toggleSimpleMode: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      messages: [],
      notifications: [],
      maintenanceAlerts: [],
      onlineTimes: {},
      isSimpleMode: false,
      
      addMessage: (msg) => set((state) => ({
        messages: [...state.messages, {
          ...msg,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date().toISOString(),
          status: 'sent'
        }]
      })),
      
      markMessagesAsRead: (receiverRole, senderRole) => set((state) => ({
        messages: state.messages.map(m => 
          (m.receiverRole === receiverRole && m.senderRole === senderRole) 
            ? { ...m, status: 'read' } 
            : m
        )
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

      toggleSimpleMode: () => set((state) => ({ isSimpleMode: !state.isSimpleMode }))
    }),
    {
      name: 'sunrise-app-storage',
    }
  )
);
