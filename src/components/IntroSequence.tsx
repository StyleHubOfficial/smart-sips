import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'loading' | 'logo' | 'particles' | 'outro'>('loading');

  useEffect(() => {
    // Sequence timing
    const t1 = setTimeout(() => setPhase('logo'), 1000);
    const t2 = setTimeout(() => setPhase('particles'), 2500);
    const t3 = setTimeout(() => setPhase('outro'), 4500);
    const t4 = setTimeout(() => onComplete(), 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  useEffect(() => {
    if (phase !== 'particles' && phase !== 'outro') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width * 0.5 - canvas.width * 0.2, // Start bottom-left
        y: canvas.height + Math.random() * canvas.height * 0.5,
        size: Math.random() * 8 + 2,
        speedX: Math.random() * 3 + 1,
        speedY: -(Math.random() * 3 + 1),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.5 + 0.5,
        type: Math.random() > 0.5 ? 'butterfly' : 'crystal'
      });
    }

    let animationFrameId: number;

    const drawButterfly = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00F0FF';
      
      // Left wing
      ctx.beginPath();
      ctx.ellipse(-size, 0, size, size * 1.5, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Right wing
      ctx.beginPath();
      ctx.ellipse(size, 0, size, size * 1.5, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    };

    const drawCrystal = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgba(176, 38, 255, 0.6)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#B026FF';
      
      ctx.beginPath();
      ctx.moveTo(0, -size * 2);
      ctx.lineTo(size, 0);
      ctx.lineTo(0, size * 2);
      ctx.lineTo(-size, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        
        // Fade out near top right
        if (p.x > canvas.width * 0.7 || p.y < canvas.height * 0.3) {
          p.opacity -= 0.01;
        }

        if (p.opacity > 0) {
          if (p.type === 'butterfly') {
            drawButterfly(ctx, p.x, p.y, p.size, p.rotation, p.opacity);
          } else {
            drawCrystal(ctx, p.x, p.y, p.size, p.rotation, p.opacity);
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-bold text-white tracking-widest uppercase text-sm">Initializing</h2>
          </motion.div>
        )}

        {phase === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="text-6xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00F0FF] to-[#B026FF] drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]">
              Smart Sunrise
            </div>
            <div className="text-white/60 tracking-[0.3em] uppercase text-sm mt-4">
              Classroom Platform
            </div>
          </motion.div>
        )}

        {phase === 'outro' && (
          <motion.div
            key="outro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-12 text-center w-full"
          >
            <div className="text-white/80 font-medium tracking-widest uppercase text-sm">
              Powered by Lakshya Bhamu
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
