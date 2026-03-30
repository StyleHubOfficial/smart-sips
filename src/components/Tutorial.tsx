import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, BrainCircuit, MonitorPlay, Zap, HelpCircle, Lock, Rocket, LayoutGrid, GitGraph, Eye, EyeOff } from 'lucide-react';

const steps = [
  {
    title: "Smart Sunrise v3.0 Advance",
    content: "Welcome to the Advance 3.0x Edition! We've upgraded the Practice Arena with advanced whiteboards, smart timers, and AI-powered similar question generation.",
    icon: Sparkles,
    color: "#00F0FF",
    target: "header"
  },
  {
    title: "Advanced Practice Arena",
    content: "Now featuring live question generation, source links, and a powerful similar question generator (AI, PYQ, or Search).",
    icon: BrainCircuit,
    color: "#B026FF",
    target: "practice"
  },
  {
    title: "Interactive Whiteboards",
    content: "New bottom-aligned toolbar with advanced eraser tools (laser pointer, selection erase) and fullscreen support for immersive teaching.",
    icon: MonitorPlay,
    color: "#00F0FF",
    target: "whiteboard"
  },
  {
    title: "Smart Timer System",
    content: "Set custom practice durations and track your progress with our new integrated timer controls.",
    icon: Zap,
    color: "#10B981",
    target: "timer"
  },
  {
    title: "Enhanced Dashboard",
    content: "Redesigned content cards with neon borders and detailed hover information for better resource management.",
    icon: LayoutGrid,
    color: "#FACC15",
    target: "dashboard"
  }
];

const upcomingFeatures = [
  {
    id: 'target-management',
    title: "AI Teaching Target Management System",
    icon: BrainCircuit,
    color: "#00F0FF",
    description: `A powerful administration system designed to help schools manage teaching progress intelligently.
Administrators can assign weekly or monthly syllabus targets to individual teachers or entire departments. The system continuously analyzes uploaded teaching content using AI to estimate real progress and compare it with assigned goals.
Key Capabilities:
• Assign syllabus targets per teacher or per class
• Track real-time teaching progress
• AI-based syllabus completion analysis
• Smart alerts for delayed chapters
• Performance monitoring for teachers
• Intelligent reminders and guidance notifications
This system transforms the platform into an AI-powered academic management system for smart classrooms.`
  },
  {
    id: 'admin-dashboard',
    title: "Advanced Admin Dashboard",
    icon: LayoutGrid,
    color: "#B026FF",
    description: `A futuristic control center that provides administrators with complete visibility over teaching activities, syllabus completion, and classroom performance.
The dashboard displays real-time analytics and visual insights that help school management monitor academic progress efficiently.
Key Capabilities:
• Real-time teacher activity monitoring
• Class-wise and subject-wise progress tracking
• Teaching performance analytics
• AI-generated insights and recommendations
• Interactive progress graphs and charts
• Notification broadcasting system
The dashboard is designed with a premium interface optimized for large displays and administrative control.`
  },
  {
    id: 'timetable-automation',
    title: "AI Timetable & Lesson Planning Automation",
    icon: Zap,
    color: "#10B981",
    description: `An intelligent scheduling and planning system that automatically organizes teaching activities for the entire school.
The AI analyzes available teachers, subjects, syllabus requirements, and exam timelines to create optimized weekly timetables and structured lesson plans.
Key Capabilities:
• Automatic timetable generation
• Conflict-free teacher scheduling
• AI-generated lesson plans for each topic
• Smart integration with simulations and diagrams
• Syllabus completion prediction
• Adaptive planning before exams
This feature ensures efficient academic planning while reducing manual workload for administrators and teachers.`
  }
];

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<typeof upcomingFeatures[0] | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [skipIntro, setSkipIntro] = useState(() => {
    return localStorage.getItem('sunrise_skip_intro') === 'true';
  });

  const toggleSkipIntro = () => {
    const newValue = !skipIntro;
    setSkipIntro(newValue);
    localStorage.setItem('sunrise_skip_intro', String(newValue));
  };

  const handleSkipForSession = () => {
    sessionStorage.setItem('sunrise_skip_intro_session', 'true');
    setIsOpen(false);
  };

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('sunrise_tutorial_v3_seen');
    const isSessionSkipped = sessionStorage.getItem('sunrise_skip_intro_session') === 'true';
    const isPermanentlySkipped = localStorage.getItem('sunrise_skip_intro') === 'true';

    if (!hasSeenTutorial && !isSessionSkipped && !isPermanentlySkipped) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('sunrise_tutorial_v3_seen', 'true');
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
                      onClick={handleSkipForSession}
                      className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all text-sm"
                    >
                      Skip for Now
                    </button>
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

                <div className="pt-6 border-t border-white/5 space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                    <div 
                      onClick={toggleSkipIntro}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${skipIntro ? 'bg-[#00F0FF]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${skipIntro ? 'left-6' : 'left-1'}`} />
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Skip Intro Sequence</span>
                  </label>

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

                {false && !isUnlocked ? (
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
                    {!selectedFeature ? (
                      <>
                        <h4 className="text-white font-bold text-lg">🚀 Smart Sunrise v2.5</h4>
                        {upcomingFeatures.map((feature) => (
                          <button
                            key={feature.id}
                            onClick={() => setSelectedFeature(feature)}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3 font-bold" style={{ color: feature.color }}>
                              <feature.icon className="w-5 h-5" />
                              {feature.title}
                            </div>
                          </button>
                        ))}
                        <p className="text-xs text-gray-500 pt-2 italic">Result: AI Smart School Operating System</p>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <button 
                          onClick={() => setSelectedFeature(null)}
                          className="text-gray-500 hover:text-white text-sm flex items-center gap-1"
                        >
                          <ChevronLeft className="w-4 h-4" /> Back to Roadmap
                        </button>
                        <h4 className="text-xl font-bold" style={{ color: selectedFeature.color }}>{selectedFeature.title}</h4>
                        <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                          {selectedFeature.description}
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => {
                        setIsUnlocked(false);
                        setShowUpcoming(false);
                        setSelectedFeature(null);
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
