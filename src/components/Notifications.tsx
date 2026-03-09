import { AnimatePresence, motion } from "motion/react";
import { useNotificationStore } from "../store/useNotificationStore";
import { useAppStore } from "../store/useAppStore";
import { useAuthStore } from "../store/useAuthStore";
import { CheckCircle, XCircle, Info, X, Bell, Trash2 } from "lucide-react";

export default function Notifications({ isOpen }: { isOpen: boolean }) {
  const { notifications, removeNotification } = useNotificationStore();
  const { notifications: siteNotifications, deleteSiteNotification } = useAppStore();
  const { role } = useAuthStore();

  return (
    <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none max-h-[80vh] overflow-y-auto scrollbar-hide">
      <AnimatePresence>
        {/* Toast Notifications */}
        {notifications.map((notification, index) => (
          <motion.div
            key={`${notification.id}-${index}`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg min-w-[300px] max-w-sm overflow-hidden relative ${
              notification.type === 'success' ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]' :
              notification.type === 'error' ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]' :
              'bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
            }`}
          >
            {/* Animated background glow */}
            <div className={`absolute inset-0 opacity-20 blur-xl ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`}></div>

            <div className="relative z-10 shrink-0">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
              {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            
            <p className="relative z-10 text-sm font-medium text-white flex-1">{notification.message}</p>
            
            <button 
              onClick={() => removeNotification(notification.id)}
              className="relative z-10 p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}

        {/* Site Notifications / Announcements */}
        {isOpen && siteNotifications.map((notification, index) => (
          <motion.div
            key={`${notification.id}-${index}`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto flex flex-col gap-2 px-4 py-3 rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.15)] min-w-[300px] max-w-sm overflow-hidden relative"
          >
            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#00F0FF]" />
                <h4 className="font-bold text-white text-sm">{notification.title}</h4>
              </div>
              {(role === 'admin' || role === 'developer') && (
                <button 
                  onClick={() => deleteSiteNotification(notification.id)}
                  className="p-1 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <p className="relative z-10 text-xs text-gray-300 leading-relaxed">{notification.message}</p>
            
            <div className="relative z-10 flex justify-between items-center mt-1">
              <span className="text-[10px] text-[#00F0FF]/70 uppercase tracking-wider font-bold">{notification.senderRole}</span>
              <span className="text-[10px] text-gray-500">{new Date(notification.timestamp).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
