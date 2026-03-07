import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, BrainCircuit, MonitorPlay, Zap, HelpCircle } from 'lucide-react';

const steps = [
  {
    title: "Smart Sunrise v2.0",
    content: "Welcome to the Advanced Edition! We've upgraded our AI engines and added powerful new laboratory tools.",
    icon: Sparkles,
    color: "#00F0FF",
    target: "header"
  },
  {
    title: "Advanced AI Models",
    content: "Choose between 'Smart/Quality' for complex reasoning or 'Fast' for quick results. Tailor the AI to your specific needs.",
    icon: Zap,
    color: "#FACC15",
    target: "models"
  },
  {
    title: "Chemistry Laboratory",
    content: "The Simulator now supports Chemistry! Generate interactive experiments with molecular visualizations and reaction controls.",
    icon: BrainCircuit,
    color: "#10B981",
    target: "chemistry"
  },
  {
    title: "Universal File Upload",
    content: "You can now upload PDFs, images, and text files to ALL AI generators. Use your own documents as the source of truth.",
    icon: MonitorPlay,
    color: "#B026FF",
    target: "upload"
  },
  {
    title: "Diagram Generator",
    content: "Create complex flowcharts, mind maps, and sequence diagrams instantly. Perfect for visualizing difficult concepts.",
    icon: HelpCircle,
    color: "#6366F1",
    target: "flowchart"
  }
];

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('sunrise_tutorial_v2_seen');
    if (!hasSeenTutorial) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('sunrise_tutorial_v2_seen', 'true');
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md glass-panel rounded-3xl p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Background Glow */}
            <div 
              className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20"
              style={{ backgroundColor: steps[currentStep].color }}
            ></div>

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10"
                  style={{ backgroundColor: `${steps[currentStep].color}20`, color: steps[currentStep].color }}
                >
                  <StepIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">
                    {steps[currentStep].title}
                  </h3>
                </div>
              </div>

              <p className="text-gray-400 leading-relaxed">
                {steps[currentStep].content}
              </p>

              <div className="flex items-center justify-between pt-4">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div 
                      key={i}
                      className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6' : 'w-2 bg-white/10'}`}
                      style={{ backgroundColor: i === currentStep ? steps[currentStep].color : undefined }}
                    ></div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <button 
                      onClick={prevStep}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: steps[currentStep].color }}
                  >
                    {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-36 sm:bottom-24 right-6 z-[90] w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-[#00F0FF] hover:bg-white/20 transition-all shadow-lg"
          title="Show Tutorial"
        >
          <HelpCircle className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
