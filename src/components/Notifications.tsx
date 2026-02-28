import { AnimatePresence, motion } from "motion/react";
import { useNotificationStore } from "../store/useNotificationStore";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export default function Notifications() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg min-w-[300px] overflow-hidden relative ${
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

            <div className="relative z-10">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
              {notification.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            
            <p className="relative z-10 text-sm font-medium text-white flex-1">{notification.message}</p>
            
            <button 
              onClick={() => removeNotification(notification.id)}
              className="relative z-10 p-1 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
