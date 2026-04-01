import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  notifications: SiteNotification[];
  maintenanceAlerts: MaintenanceAlert[];
  onlineTimes: Record<string, string>;
  isGlowEnabled: boolean;
  isSmartPanelMode: boolean;
  viewedContent: string[];
  
  addSiteNotification: (notif: Omit<SiteNotification, 'id' | 'timestamp'>) => void;
  deleteSiteNotification: (id: string) => void;
  
  setOnlineTime: (role: string, time: string) => void;
  
  setMaintenanceAlert: (alert: MaintenanceAlert) => void;
  removeMaintenanceAlert: (id: string) => void;
  toggleGlow: () => void;
  toggleSmartPanelMode: () => void;
  markContentAsViewed: (contentId: string) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      notifications: [],
      maintenanceAlerts: [],
      onlineTimes: {},
      isGlowEnabled: false,
      isSmartPanelMode: false,
      viewedContent: [],
      
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

      toggleGlow: () => set((state) => ({ isGlowEnabled: !state.isGlowEnabled })),
      toggleSmartPanelMode: () => set((state) => ({ isSmartPanelMode: !state.isSmartPanelMode })),
      
      markContentAsViewed: (contentId) => set((state) => ({
        viewedContent: state.viewedContent.includes(contentId) 
          ? state.viewedContent 
          : [...state.viewedContent, contentId]
      })),
      
      resetApp: () => set({
        notifications: [],
        maintenanceAlerts: [],
        onlineTimes: {},
        isGlowEnabled: false,
        isSmartPanelMode: false,
        viewedContent: []
      })
    }),
    {
      name: 'sunrise-app-storage',
    }
  )
);
