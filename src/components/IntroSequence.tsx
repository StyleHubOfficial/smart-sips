import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ButterflyAnimation } from './ButterflyAnimation';

export const IntroSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'particles' | 'forming' | 'glass' | 'complete'>('particles');
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    // Sequence timing - Faster sequence
    const t1 = setTimeout(() => setShowText(true), 400); // Show text earlier
    const t2 = setTimeout(() => setPhase('glass'), 2000); // Show glass bar
    const t3 = setTimeout(() => onComplete(), 4500); // Complete sequence

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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
    const particleCount = 400; // More particles for better formation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Initialize particles at random positions
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.max(canvas.width, canvas.height) * 0.5;
      particles.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle: angle,
        radius: radius,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.1 + 0.05,
        color: Math.random() > 0.5 ? '#00F0FF' : '#B026FF',
        opacity: Math.random() * 0.5 + 0.5,
        layer: i % 3,
      });
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      const gridSize = 60;
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
        if (phase === 'particles' || phase === 'forming') {
          // Circular movement per layer
          const angleSpeed = (p.layer + 1) * 0.005 * (p.layer % 2 === 0 ? 1 : -1);
          p.angle += angleSpeed;
          p.x = centerX + Math.cos(p.angle) * p.radius;
          p.y = centerY + Math.sin(p.angle) * p.radius;
        } else {
          p.opacity *= 0.92;
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
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <ButterflyAnimation />
      
      <div className="relative z-20 flex flex-col items-center">
        <AnimatePresence>
          {showText && phase !== 'complete' && (
            <motion.div
              className="text-center relative"
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="flex justify-center mb-4 relative">
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
                           stiffness: 300,
                           damping: 25,
                           delay: i * 0.03 
                         }
                       }
                     }}
                     className={`text-5xl md:text-8xl font-display font-bold inline-block ${char === " " ? "mx-4" : "text-white"}`}
                     style={{
                       textShadow: "0 0 20px rgba(0, 240, 255, 0.3)",
                       background: "linear-gradient(to right, #00F0FF, #B026FF)",
                       WebkitBackgroundClip: "text",
                       WebkitTextFillColor: char === " " ? "transparent" : "transparent"
                     }}
                   >
                     {char}
                   </motion.span>
                 ))}

                {/* Glassmorphic Bar Outro - Blast Expansion */}
                {phase === 'glass' && (
                  <motion.div
                    initial={{ width: 0, opacity: 0, scaleX: 0 }}
                    animate={{ 
                      width: "140%", 
                      opacity: 1,
                      scaleX: 1,
                      transition: { 
                        duration: 1.2, 
                        ease: "easeInOut"
                      }
                    }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 md:h-48 z-30 pointer-events-none flex items-center justify-center overflow-hidden origin-center"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      backdropFilter: "blur(60px) saturate(200%)",
                      WebkitBackdropFilter: "blur(60px) saturate(200%)",
                      borderRadius: "100px", // More rounded for iOS look
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    {/* Highlight sweep */}
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                    
                    {/* Soft glow pulse at start */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0, 0.8, 0], scale: [0.8, 1.5, 2] }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0 bg-white/40 blur-3xl rounded-full"
                    />

                    {/* Text reveal inside the bar */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="flex justify-center whitespace-nowrap"
                    >
                      {words.map((char, i) => (
                        <span
                          key={`reveal-${i}`}
                          className={`text-5xl md:text-8xl font-display font-bold inline-block ${char === " " ? "mx-4" : "text-white"}`}
                          style={{
                            background: "linear-gradient(to right, #fff, #fff)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent"
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glass reflection effect background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-30" />
    </motion.div>
  );
};
