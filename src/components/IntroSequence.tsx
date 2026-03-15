import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'particles' | 'forming' | 'glass' | 'complete'>('particles');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Sequence timing
    const t1 = setTimeout(() => setPhase('forming'), 1000); 
    const t2 = setTimeout(() => setShowText(true), 1200);
    const t3 = setTimeout(() => setPhase('glass'), 4000);
    const t4 = setTimeout(() => onComplete(), 6500);

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
    const particleCount = 200;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initialize particles at random positions
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        targetX: Math.random() * canvas.width,
        targetY: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.05 + 0.02,
        color: Math.random() > 0.5 ? '#00F0FF' : '#B026FF',
        opacity: Math.random() * 0.5 + 0.5,
      });
    }

    let animationFrameId: number;

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

      particles.forEach((p) => {
        if (phase === 'particles') {
          // Random movement
          p.x += (p.targetX - p.x) * 0.01;
          p.y += (p.targetY - p.y) * 0.01;
          if (Math.abs(p.x - p.targetX) < 1) p.targetX = Math.random() * canvas.width;
          if (Math.abs(p.y - p.targetY) < 1) p.targetY = Math.random() * canvas.height;
        } else if (phase === 'forming') {
          // Move toward center area where text will be
          p.x += (centerX + (Math.random() - 0.5) * 400 - p.x) * 0.1;
          p.y += (centerY + (Math.random() - 0.5) * 100 - p.y) * 0.1;
          p.opacity *= 0.98;
        } else {
          p.opacity *= 0.9;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [phase]);

  const words = "Smart Sunrise".split("");

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="relative z-20 flex flex-col items-center">
        <AnimatePresence>
          {showText && phase !== 'complete' && (
            <motion.div
              className="text-center relative"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="flex justify-center mb-4">
                {words.map((char, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { opacity: 0, scale: 0, y: 20, filter: 'blur(10px)' },
                      visible: { 
                        opacity: 1, 
                        scale: 1, 
                        y: 0, 
                        filter: 'blur(0px)',
                        transition: { 
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                          delay: i * 0.05 
                        }
                      }
                    }}
                    className={`text-5xl md:text-8xl font-display font-bold inline-block ${char === " " ? "mx-4" : "text-white"}`}
                    style={{
                      textShadow: "0 0 20px rgba(0, 240, 255, 0.5)",
                      background: "linear-gradient(to right, #00F0FF, #B026FF)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: char === " " ? "transparent" : "transparent"
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 0.8 }}
                className="text-xl md:text-2xl text-white/60 tracking-[0.3em] uppercase font-light"
              >
                AI Powered Classroom
              </motion.p>

              {/* Glassmorphic Bar Outro */}
              {phase === 'glass' && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ 
                    width: "120%", 
                    opacity: 1,
                    transition: { 
                      duration: 1.2, 
                      ease: [0.16, 1, 0.3, 1] // Apple-like ease
                    }
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 md:h-48 z-30 pointer-events-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(40px) saturate(180%)",
                    WebkitBackdropFilter: "blur(40px) saturate(180%)",
                    borderRadius: "24px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
                  }}
                >
                  {/* Highlight sweep */}
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                  
                  {/* Soft glow pulse at start */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.5, 0], scale: [0.8, 1.2, 1.5] }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 bg-white/30 blur-2xl rounded-full"
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glass reflection effect background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-30" />
    </div>
  );
};
