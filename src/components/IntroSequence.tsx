import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const IntroSequence: React.FC<{ onComplete: (skipped?: boolean) => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'core' | 'logo' | 'credit'>('core');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('logo'), 1200);
    const t2 = setTimeout(() => setPhase('credit'), 2800);
    const t3 = setTimeout(() => onComplete(false), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const coreParticles: any[] = [];
    const coreParticleCount = 40;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < coreParticleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.max(canvas.width, canvas.height) * 0.6;
      coreParticles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        targetRadius: Math.random() * 60 + 20,
        angle: angle,
        radius: radius,
        size: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.5 ? '#00F0FF' : '#B026FF',
        opacity: 0,
        speed: Math.random() * 0.03 + 0.01,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (phase === 'core' || phase === 'logo') {
        coreParticles.forEach((p) => {
          p.radius += (p.targetRadius - p.radius) * 0.04;
          p.angle += p.speed;
          p.x = centerX + Math.cos(p.angle) * p.radius;
          p.y = centerY + Math.sin(p.angle) * p.radius;
          
          if (phase === 'core') {
            p.opacity = Math.min(p.opacity + 0.03, 0.7);
          } else {
            p.opacity *= 0.92;
            p.radius += 8;
          }

          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });

        if (phase === 'core') {
          const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 80);
          glow.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
          glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = glow;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
          ctx.fill();
        }
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
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-[9998] bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => onComplete(true)}
        className="absolute top-8 right-8 z-[9999] px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs font-medium backdrop-blur-sm"
      >
        Skip Intro
      </motion.button>

      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">
        <AnimatePresence mode="wait">
          {phase === 'logo' && (
            <motion.div
              key="logo"
              className="text-center absolute w-full px-4"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(5px)' }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ willChange: 'transform, opacity, filter' }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-9xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-white to-[#B026FF]">
                Smart Sunrise
              </h1>
            </motion.div>
          )}

          {phase === 'credit' && (
            <motion.div
              key="credit"
              className="text-center absolute"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <h2 className="text-2xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF] mb-2">
                Powered by Lakshya Bhamu
              </h2>
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent mx-auto" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
