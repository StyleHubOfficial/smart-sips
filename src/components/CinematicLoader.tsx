import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Cpu, Zap, Radio, Globe, ShieldCheck, Database, Server, Code2, Terminal } from 'lucide-react';

const loadingTexts = [
  "Initializing Neural Pathways...",
  "Connecting to Quantum Core...",
  "Decrypting Knowledge Base...",
  "Synthesizing Data Streams...",
  "Optimizing Cognitive Algorithms...",
  "Scanning Global Archives...",
  "Verifying Source Authenticity...",
  "Calibrating Response Matrix...",
  "Generating High-Fidelity Output...",
  "Finalizing Neural Handshake..."
];

const icons = [BrainCircuit, Cpu, Zap, Radio, Globe, ShieldCheck, Database, Server, Code2, Terminal];

export default React.memo(function CinematicLoader() {
  const [progress, setProgress] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        // Random increment for "realistic" loading feel
        const increment = Math.random() * 2 + 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 50);

    const textInterval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % loadingTexts.length);
      setCurrentIconIndex(prev => (prev + 1) % icons.length);
    }, 1800);

    return () => {
      clearInterval(interval);
      clearInterval(textInterval);
    };
  }, []);

  const CurrentIcon = icons[currentIconIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-black/80 border border-[#00F0FF]/30 p-8 md:p-12 shadow-[0_0_50px_rgba(0,240,255,0.1)] backdrop-blur-xl">
      {/* Background Grid Animation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00F0FF10_1px,transparent_1px),linear-gradient(to_bottom,#00F0FF10_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Central Icon Animation */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 rounded-full border border-dashed border-[#00F0FF]/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-8 rounded-full border border-dotted border-[#B026FF]/30"
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIconIndex}
              initial={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 1.5, opacity: 0, filter: "blur(10px)" }}
              transition={{ duration: 0.4 }}
              className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#00F0FF]/20 to-[#B026FF]/20 rounded-2xl flex items-center justify-center border border-[#00F0FF]/50 shadow-[0_0_30px_rgba(0,240,255,0.3)]"
            >
              <CurrentIcon className="w-8 h-8 md:w-10 md:h-10 text-[#00F0FF]" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text Animation */}
        <div className="h-8 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={textIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[#00F0FF] font-mono text-sm md:text-base tracking-widest uppercase text-center"
            >
              {loadingTexts[textIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-xs font-mono text-[#00F0FF]/70">
            <span>SYSTEM_STATUS: ACTIVE</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <div className="relative h-2 bg-[#00F0FF]/10 rounded-full border border-[#00F0FF]/20">
            {/* Main Progress Bar */}
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00F0FF] via-[#B026FF] to-[#00F0FF] bg-[length:200%_100%] rounded-full"
              animate={{ 
                width: `${progress}%`,
                backgroundPosition: ["0% 0%", "100% 0%"]
              }}
              transition={{ 
                width: { type: "spring", stiffness: 50, damping: 20 },
                backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
              }}
            >
              {/* Particle Emitter at Leading Edge */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0">
                 {Array.from({ length: 12 }).map((_, i) => (
                   <motion.div
                     key={`particle-${i}`}
                     className="absolute w-1 h-1 bg-[#00F0FF] rounded-full shadow-[0_0_8px_#00F0FF]"
                     initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                     animate={{ 
                       x: -40 - Math.random() * 60, // Backward force
                       y: (Math.random() - 0.5) * 25, 
                       opacity: 0, 
                       scale: 0,
                       rotate: Math.random() * 360
                     }}
                     transition={{ 
                       duration: 1.5, 
                       repeat: Infinity, 
                       ease: "circOut",
                       delay: i * 0.1
                     }}
                   />
                 ))}
                 {/* Tip Glow */}
                 <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[6px] opacity-60 shadow-[0_0_20px_#00F0FF]"></div>
              </div>
            </motion.div>
            
            {/* Glitch Effect Overlay */}
            <motion.div
              className="absolute top-0 left-0 h-full w-2 bg-white/50 blur-[2px] rounded-full"
              animate={{ left: ["0%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
            />
          </div>
          
          {/* Binary Data Stream Effect */}
          <div className="flex justify-between text-[10px] font-mono text-[#00F0FF]/40 overflow-hidden whitespace-nowrap">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.span
                key={`stream-${i}`}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
              >
                {Array.from({ length: 20 }).map(() => Math.round(Math.random())).join('')}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
