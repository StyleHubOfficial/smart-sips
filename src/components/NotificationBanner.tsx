import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { useFirebaseNotifications } from '../hooks/useFirebaseNotifications';

export default function NotificationBanner() {
  const { notifications } = useFirebaseNotifications();
  const [visible, setVisible] = React.useState(true);

  if (notifications.length === 0 || !visible) return null;

  const latest = notifications[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 border-b border-white/10 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#00F0FF]/20">
              <Bell className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{latest.title}</p>
              <p className="text-xs text-gray-400">{latest.message}</p>
            </div>
          </div>
          <button 
            onClick={() => setVisible(false)}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
