import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'logo' | 'particles'>('logo');
  const [revealProgress, setRevealProgress] = useState(-20); // -20 to 120 for diagonal wipe

  useEffect(() => {
    // Sequence timing
    const t1 = setTimeout(() => setPhase('particles'), 1000); // Logo stays for 1s
    const t2 = setTimeout(() => onComplete(), 4500); // End sequence

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

  useEffect(() => {
    // Start animation exactly once after 1 second (when phase changes to particles)
    const t = setTimeout(() => {
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
      const particleCount = window.innerWidth < 768 ? 30 : 60; // Responsive count

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width * 0.5 - canvas.width * 0.2, // Start bottom-left
          y: canvas.height + Math.random() * canvas.height * 0.5,
          size: Math.random() * 8 + 4,
          speedX: Math.random() * 4 + 2,
          speedY: -(Math.random() * 4 + 2),
          rotation: Math.random() * Math.PI * 2,
          flapSpeed: Math.random() * 0.15 + 0.05,
          opacity: Math.random() * 0.5 + 0.5,
          type: Math.random() > 0.4 ? 'butterfly' : 'crystal',
          offset: Math.random() * 1000
        });
      }

      let animationFrameId: number;
      let startTime = Date.now();

      const drawButterfly = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number, time: number, flapSpeed: number, offset: number) => {
        ctx.save();
        ctx.translate(x, y);
        
        // Calculate flight direction angle based on movement (diagonally up-right) + slight wobble
        const flightAngle = -Math.PI / 4 + Math.sin(time * 0.002 + offset) * 0.2; 
        ctx.rotate(flightAngle);
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00F0FF';
        
        // Flapping wings animation
        const flap = Math.sin((time + offset) * flapSpeed);
        const wingWidth = size * (0.3 + 0.7 * Math.abs(flap)); // 3D flap effect
        
        // Left wing
        ctx.beginPath();
        ctx.ellipse(-wingWidth, 0, wingWidth, size * 1.5, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.ellipse(wingWidth, 0, wingWidth, size * 1.5, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.2, size * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      const drawCrystal = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, opacity: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(176, 38, 255, 0.8)';
        ctx.shadowBlur = 15;
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
        const time = Date.now();
        const elapsed = time - startTime;
        
        // Calculate reveal progress based on time (0 to 120 over 3.5 seconds)
        const progress = Math.min(120, -20 + (elapsed / 3500) * 140);
        setRevealProgress(progress);

        particles.forEach((p) => {
          p.x += p.speedX;
          p.y += p.speedY;
          p.rotation += 0.02;
          
          // Fade out near top right
          if (p.x > canvas.width * 0.8 || p.y < canvas.height * 0.2) {
            p.opacity = Math.max(0, p.opacity - 0.02);
          }

          if (p.opacity > 0) {
            if (p.type === 'butterfly') {
              drawButterfly(ctx, p.x, p.y, p.size, p.rotation, p.opacity, time, p.flapSpeed, p.offset);
            } else {
              drawCrystal(ctx, p.x, p.y, p.size, p.rotation, p.opacity);
            }
          }
        });

        animationFrameId = requestAnimationFrame(render);
      };

      render();

      // Cleanup function for the timeout
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', resizeCanvas);
      };
    }, 1000);

    return () => clearTimeout(t);
  }, []);

  // The mask creates a diagonal wipe effect from bottom-left to top-right
  const maskStyle = {
    maskImage: `linear-gradient(to top right, transparent ${Math.max(0, revealProgress - 20)}%, black ${Math.min(100, revealProgress + 20)}%)`,
    WebkitMaskImage: `linear-gradient(to top right, transparent ${Math.max(0, revealProgress - 20)}%, black ${Math.min(100, revealProgress + 20)}%)`
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${phase !== 'logo' ? 'pointer-events-none' : ''}`}
      style={{ backgroundColor: phase === 'logo' ? '#0a0a0a' : 'transparent' }}
    >
      {/* Background overlay that wipes away */}
      <div 
        className="absolute inset-0 bg-[#0a0a0a]"
        style={phase !== 'logo' ? maskStyle : {}}
      />

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />
      
      <AnimatePresence mode="wait">
        {phase === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center z-20"
          >
            <div className="text-white/60 font-medium tracking-widest uppercase text-[10px] md:text-xs mb-2 drop-shadow-md">
              Welcome to Smart Classroom
            </div>
            <div className="text-4xl md:text-6xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#00F0FF] to-[#B026FF] drop-shadow-[0_0_20px_rgba(0,240,255,0.5)] text-center px-4">
              Smart Sunrise
            </div>
            <div className="text-white/80 font-medium tracking-widest uppercase text-xs md:text-sm mt-4 text-center drop-shadow-md">
              Developed by Lakshya Bhamu
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
