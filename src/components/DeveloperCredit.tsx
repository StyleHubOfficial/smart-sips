import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeveloperCredit({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // wait for exit animation
    }, 3000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm"
        >
          <div className="relative px-10 py-8 rounded-2xl bg-black/80 shadow-[0_0_50px_rgba(0,240,255,0.2)] flex items-center justify-center mx-4">
            {/* Neon Border Animation */}
            <svg className="absolute inset-0 w-full h-full rounded-2xl" style={{ overflow: 'visible' }}>
              <motion.rect
                x="0" y="0" width="100%" height="100%" rx="16" ry="16"
                fill="none"
                stroke="url(#neonGradientCredit)"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ 
                  duration: 2.5, 
                  ease: [0.8, 0, 0.2, 1] // Super motion: starts slow, speeds up, slows down
                }}
                style={{ filter: 'drop-shadow(0 0 10px #00F0FF)' }}
              />
              <defs>
                <linearGradient id="neonGradientCredit" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#B026FF" />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex flex-col items-center gap-4">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-center"
              >
                Welcome to Smart Sunrise
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-xs md:text-sm font-medium tracking-[0.2em] uppercase text-white/40 text-center"
              >
                Designed and Developed by Lakshya Bhamu
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
