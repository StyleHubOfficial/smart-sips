import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Cpu, Zap, Radio, Globe, ShieldCheck, Database, Server, Code2, Terminal, MonitorPlay, Layers, Activity } from 'lucide-react';

const loadingTexts = [
  "Synthesizing Virtual Environment...",
  "Calibrating Physics Engine...",
  "Compiling Shader Modules...",
  "Initializing WebGL Context...",
  "Mapping Geometric Vertices...",
  "Optimizing Render Pipeline...",
  "Injecting Interactive Logic...",
  "Synchronizing Parameter Matrix...",
  "Finalizing Simulation Core...",
  "Ready for Interaction."
];

const icons = [MonitorPlay, Box, Layers, Activity, Cpu, Zap, Radio, Globe, Code2, Terminal];

export default React.memo(function SimLoader() {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        const increment = Math.random() * 1.5 + 0.3;
        return Math.min(prev + increment, 100);
      });
    }, 40);

    const textInterval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % loadingTexts.length);
      setCurrentIconIndex(prev => (prev + 1) % icons.length);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  const CurrentIcon = icons[currentIconIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-[#050505] border border-[#B026FF]/30 p-8 md:p-12 shadow-[0_0_60px_rgba(176,38,255,0.15)] backdrop-blur-2xl">
      {/* Geometric Background Animation */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#B026FF20_1px,transparent_1px),linear-gradient(-45deg,#B026FF20_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-10">
        {/* Central Hexagon Animation */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 rounded-[30%] border border-[#B026FF]/40 bg-[#B026FF]/5"
          />
          <motion.div
            animate={{ rotate: -360, scale: [1.1, 1, 1.1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-10 rounded-[40%] border border-[#00F0FF]/20"
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIconIndex}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-[#B026FF]/30 to-[#00F0FF]/30 rounded-3xl flex items-center justify-center border border-[#B026FF]/50 shadow-[0_0_40px_rgba(176,38,255,0.4)]"
            >
              <CurrentIcon className="w-10 h-10 md:w-12 md:h-12 text-[#B026FF]" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status Text */}
        <div className="h-10 flex flex-col items-center justify-center gap-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={textIndex}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-[#B026FF] font-display text-lg md:text-xl font-bold tracking-widest uppercase text-center"
            >
              {loadingTexts[textIndex]}
            </motion.div>
          </AnimatePresence>
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">
            Simulation_Engine_v4.2.0_Active
          </div>
        </div>

        {/* Progress Bar with Shard Particles */}
        <div className="w-full max-w-lg space-y-3">
          <div className="flex justify-between text-[10px] font-mono text-[#B026FF]/80">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#B026FF] rounded-full animate-pulse"></span>
              CORE_SYNC: STABLE
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="relative h-3 bg-white/5 rounded-full border border-white/10">
            {/* Main Progress Bar */}
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#B026FF] via-[#00F0FF] to-[#B026FF] bg-[length:200%_100%] rounded-full"
              style={{ width: `${progress}%` }}
              animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              {/* Shard Emitter at Leading Edge */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0">
                 {Array.from({ length: 15 }).map((_, i) => (
                   <motion.div
                     key={i}
                     className="absolute w-2 h-0.5 bg-[#B026FF] rounded-full"
                     initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                     animate={{ 
                       x: -50 - Math.random() * 80, // Stronger backward force for simulator
                       y: (Math.random() - 0.5) * 40, 
                       opacity: 0, 
                       rotate: Math.random() * 720,
                       scale: 0
                     }}
                     transition={{ 
                       duration: 1.8, 
                       repeat: Infinity, 
                       ease: "circOut",
                       delay: i * 0.08
                     }}
                   />
                 ))}
                 {/* Pulse Glow Point */}
                 <motion.div 
                   animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                   transition={{ duration: 1, repeat: Infinity }}
                   className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[5px] shadow-[0_0_25px_#B026FF]"
                 />
              </div>
            </motion.div>
          </div>
          
          {/* Hex Data Stream */}
          <div className="flex justify-center gap-4 text-[9px] font-mono text-gray-600 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              >
                0x{Math.random().toString(16).slice(2, 10).toUpperCase()}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
