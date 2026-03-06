import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-black/80 rounded-md whitespace-nowrap pointer-events-none border border-white/10 backdrop-blur-sm shadow-xl
              ${position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
              ${position === 'left' ? 'right-full mr-2 top-1/2 -translate-y-1/2' : ''}
              ${position === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : ''}
            `}
          >
            {content}
            {/* Arrow */}
            <div 
              className={`absolute w-2 h-2 bg-black/80 border-r border-b border-white/10 rotate-45
                ${position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-t-0 border-l-0' : ''}
                ${position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-b-0 border-r-0 rotate-[225deg]' : ''}
                ${position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-l-0 border-t-0 rotate-[-45deg]' : ''}
                ${position === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-r-0 border-b-0 rotate-[135deg]' : ''}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
