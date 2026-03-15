import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'particles' | 'core' | 'logo' | 'complete'>('particles');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Sequence timing
    const t1 = setTimeout(() => setPhase('core'), 2000); // Particles merge into core
    const t2 = setTimeout(() => setPhase('logo'), 3500); // Core morphs into logo
    const t3 = setTimeout(() => setShowText(true), 4000); // Text appears
    const t4 = setTimeout(() => onComplete(), 7000); // End sequence

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles: any[] = [];
    const particleCount = 150;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * Math.max(canvas.width, canvas.height);
      particles.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        targetX: centerX,
        targetY: centerY,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.02 + 0.01,
        color: Math.random() > 0.5 ? '#00F0FF' : '#B026FF',
        opacity: Math.random() * 0.5 + 0.5,
        angle: angle,
        distance: distance
      });
    }

    let animationFrameId: number;
    let corePulse = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (phase === 'particles' || phase === 'core') {
        particles.forEach((p) => {
          if (phase === 'particles') {
            p.distance -= p.speed * p.distance;
            p.x = centerX + Math.cos(p.angle) * p.distance;
            p.y = centerY + Math.sin(p.angle) * p.distance;
          } else {
            // Move toward center
            p.x += (centerX - p.x) * 0.1;
            p.y += (centerY - p.y) * 0.1;
            p.opacity *= 0.95;
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      if (phase === 'core' || phase === 'logo') {
        corePulse += 0.05;
        const pulseSize = Math.sin(corePulse) * 10;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100 + pulseSize);
        gradient.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(176, 38, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.globalAlpha = phase === 'logo' ? 0.5 : 1;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 100 + pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Core details
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50 + pulseSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <AnimatePresence>
        {phase === 'logo' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative z-20 flex flex-col items-center"
          >
            {/* Logo placeholder - can be replaced with actual logo SVG */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#B026FF] flex items-center justify-center shadow-[0_0_50px_rgba(0,240,255,0.5)] mb-8">
              <span className="text-4xl font-bold text-white">SS</span>
            </div>

            {showText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h1 className="text-4xl md:text-7xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00F0FF] to-[#B026FF] mb-4">
                  Welcome to Smart Sunrise
                </h1>
                <p className="text-xl md:text-2xl text-white/60 tracking-[0.3em] uppercase font-light">
                  AI Powered Classroom
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glass reflection effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-30" />
    </div>
  );
};

