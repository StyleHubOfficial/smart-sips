import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, BrainCircuit, MonitorPlay, Zap, HelpCircle, Lock, Rocket, LayoutGrid, GitGraph, Eye, EyeOff } from 'lucide-react';

const steps = [
  {
    title: "Smart Sunrise v2.0",
    content: "Welcome to the Advanced Edition! We've upgraded our AI engines and added powerful new laboratory tools.",
    icon: Sparkles,
    color: "#00F0FF",
    target: "header"
  },
  {
    title: "AI Classroom Co-Pilot",
    content: "Our intelligent assistant analyzes your uploaded content and suggests the best educational tools to generate automatically.",
    icon: Rocket,
    color: "#B026FF",
    target: "copilot"
  },
  {
    title: "AI Virtual Laboratory",
    content: "Generate interactive 2D & 3D physics and chemistry simulations from any topic or document. Perfect for visual learning.",
    icon: MonitorPlay,
    color: "#00F0FF",
    target: "simulator"
  },
  {
    title: "AI Concept Visualizer",
    content: "Convert complex scientific concepts into interactive visual explanations with diagrams, formulas, and real-life examples.",
    icon: LayoutGrid,
    color: "#10B981",
    target: "visualizer"
  },
  {
    title: "AI Concept Map",
    content: "Extract key information from your notes to create structured, interactive concept maps and flowcharts automatically.",
    icon: GitGraph,
    color: "#FACC15",
    target: "flowchart"
  }
];

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    setShowUpcoming(false);
    setAccessCode("");
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

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === "123") {
      setIsUnlocked(true);
    } else {
      alert("Invalid Access Code");
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
              style={{ backgroundColor: showUpcoming ? "#B026FF" : steps[currentStep].color }}
            ></div>

            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!showUpcoming ? (
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

                <div className="pt-6 border-t border-white/5">
                  <button 
                    onClick={() => setShowUpcoming(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B026FF]/10 to-[#00F0FF]/10 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Rocket className="w-4 h-4" />
                    View Upcoming Features
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-[#B026FF]/20 rounded-2xl flex items-center justify-center mb-4 border border-[#B026FF]/30">
                    <Lock className="w-8 h-8 text-[#B026FF]" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-2">Restricted Access</h3>
                  <p className="text-gray-400 text-sm">Enter the developer access code to view upcoming features roadmap.</p>
                </div>

                {!isUnlocked ? (
                  <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        placeholder="Enter Access Code"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-center focus:outline-none focus:border-[#B026FF]/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#B026FF] text-white font-bold hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] transition-all"
                    >
                      Unlock Roadmap
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowUpcoming(false)}
                      className="w-full text-gray-500 hover:text-white text-sm transition-colors"
                    >
                      Back to Tutorial
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    <h4 className="text-white font-bold text-lg">🚀 Smart Sunrise v2.0</h4>
                    
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center gap-3 text-[#00F0FF] font-bold">
                        <BrainCircuit className="w-5 h-5" />
                        AI Teaching Target Management System
                      </div>
                      <p className="text-xs text-gray-400">Intelligent administration for managing teaching progress, syllabus targets, and real-time performance analytics.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center gap-3 text-[#B026FF] font-bold">
                        <LayoutGrid className="w-5 h-5" />
                        Advanced Admin Dashboard
                      </div>
                      <p className="text-xs text-gray-400">Futuristic control center for visibility over teaching activities, syllabus completion, and classroom performance.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center gap-3 text-[#10B981] font-bold">
                        <Zap className="w-5 h-5" />
                        AI Timetable & Lesson Planning Automation
                      </div>
                      <p className="text-xs text-gray-400">Intelligent scheduling and planning system that automatically organizes teaching activities for the entire school.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center gap-3 text-[#FACC15] font-bold">
                        <MonitorPlay className="w-5 h-5" />
                        🚀 AI Teacher Command Center (v3.0)
                      </div>
                      <p className="text-xs text-gray-400">A futuristic classroom command center with AI lesson suggestions, real-time syllabus progress, and smart teaching insights.</p>
                    </div>
                    
                    <p className="text-xs text-gray-500 pt-2 italic">Result: AI Smart School Operating System</p>

                    <button 
                      onClick={() => {
                        setIsUnlocked(false);
                        setShowUpcoming(false);
                      }}
                      className="w-full py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
                    >
                      Close Roadmap
                    </button>
                  </div>
                )}
              </div>
            )}
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
