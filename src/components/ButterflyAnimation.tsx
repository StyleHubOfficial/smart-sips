import React from 'react';
import { motion } from 'framer-motion';

export const ButterflyAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Butterfly 1 */}
      <motion.div
        className="absolute"
        initial={{ x: '-10vw', y: '20%', rotate: 45 }}
        animate={{ 
          x: ['-10vw', '110vw'],
          y: ['20%', '40%', '10%', '30%'],
          rotate: [45, 60, 30, 45]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <ButterflyBody color="#00F0FF" />
      </motion.div>

      {/* Butterfly 2 */}
      <motion.div
        className="absolute"
        initial={{ x: '110vw', y: '60%', rotate: -135 }}
        animate={{ 
          x: ['110vw', '-10vw'],
          y: ['60%', '40%', '80%', '60%'],
          rotate: [-135, -150, -120, -135]
        }}
        transition={{ 
          duration: 3.5, 
          repeat: Infinity, 
          ease: "linear",
          delay: 0.5
        }}
      >
        <ButterflyBody color="#B026FF" />
      </motion.div>

      {/* Butterfly 3 */}
      <motion.div
        className="absolute"
        initial={{ x: '50vw', y: '110vh', rotate: -45 }}
        animate={{ 
          x: ['50vw', '20vw', '80vw', '50vw'],
          y: ['110vh', '-10vh'],
          rotate: [-45, -60, -30, -45]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "linear",
          delay: 0.2
        }}
      >
        <ButterflyBody color="#00F0FF" />
      </motion.div>
    </div>
  );
};

const ButterflyBody: React.FC<{ color: string }> = ({ color }) => {
  return (
    <div className="relative w-8 h-8">
      {/* Left Wing */}
      <motion.div
        className="absolute right-1/2 w-6 h-8 origin-right"
        style={{ 
          backgroundColor: color,
          clipPath: 'polygon(100% 50%, 0 0, 20% 50%, 0 100%)',
          opacity: 0.6,
          filter: `drop-shadow(0 0 5px ${color})`
        }}
        animate={{ rotateY: [0, 70, 0] }}
        transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Right Wing */}
      <motion.div
        className="absolute left-1/2 w-6 h-8 origin-left"
        style={{ 
          backgroundColor: color,
          clipPath: 'polygon(0 50%, 100% 0, 80% 50%, 100% 100%)',
          opacity: 0.6,
          filter: `drop-shadow(0 0 5px ${color})`
        }}
        animate={{ rotateY: [0, -70, 0] }}
        transition={{ duration: 0.2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Body */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
        style={{ backgroundColor: '#fff', boxShadow: `0 0 10px ${color}` }}
      />
    </div>
  );
};
