import React from 'react';
import { motion } from 'motion/react';

export const PenPaperAnimation: React.FC<{ size?: number }> = ({ size = 24 }) => {
  return (
    <motion.div
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M10 90 L90 90 M10 70 L90 70 M10 50 L90 50"
          stroke="#00F0FF"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
      <motion.div
        animate={{ x: [0, size * 0.8, 0], y: [0, -size * 0.2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-0 w-3 h-3 bg-white rounded-full"
      />
    </motion.div>
  );
};
