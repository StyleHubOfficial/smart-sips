import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Sparkles, BrainCircuit, MonitorPlay, Zap, HelpCircle, Lock, Rocket, LayoutGrid, GitGraph, Eye, EyeOff } from 'lucide-react';

const steps = [
  {
    title: "Smart Sunrise v2.5",
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
  },
  {
    id: 'slide-whiteboard',
    title: "Slide Whiteboard Mode (Presentation Solver)",
    icon: MonitorPlay,
    color: "#FACC15",
    description: `🔹 Brief Description
A presentation-style question solving mode where each question becomes a teaching slide with a fully interactive whiteboard. Teachers can write, draw, highlight, and annotate directly beside or on top of the question while explaining the solution.
Questions appear one-by-one or two-per-slide, allowing teachers to move through them like a presentation while solving problems step-by-step. This mode transforms Practice Arena into a live classroom solving environment.
Key Highlights
• Slide-based question solving
• Write directly on question
• Full-screen teaching mode
• Next / previous slide navigation
• Multi-layer annotations
• Smart panel friendly interface
• Save solved question slides`
  },
  {
    id: 'side-whiteboard',
    title: "Side Whiteboard Mode (Inline Question Solver)",
    icon: GitGraph,
    color: "#EF4444",
    description: `🔹 Brief Description
A powerful inline whiteboard mode that allows teachers to solve and explain questions directly while viewing the question list. When activated, a smooth collapsible digital whiteboard appears beside the questions, allowing teachers to write, draw diagrams, or explain concepts in real time while scrolling through questions.
The whiteboard can be expanded, collapsed, or resized, ensuring flexible teaching during classroom discussions. This feature is optimized for smart panels and classroom teaching, making question solving interactive and visual.
Key Highlights
• Collapsible side whiteboard
• Smooth scrolling question list
• Diagram drawing tools
• Math writing support
• Instant erase and undo
• Smart panel optimized layout
• Save explanation as image/PDF`
  },
  {
    id: 'smart-dashboard',
    title: "🚀 Smart Classroom Dashboard (v3.0)",
    icon: LayoutGrid,
    color: "#3B82F6",
    description: `A completely redesigned Smart Classroom Dashboard that acts as the central control screen for the entire learning platform. This dashboard is designed for public classroom display on smart panels, allowing teachers and students to instantly access educational resources and AI-powered tools.
The interface is extremely smooth, professional, and visually engaging, making it ideal as the main landing page of the platform.
Key Highlights
• Ultra-smooth and professional UI optimized for smart panels
• Intelligent content discovery with advanced filters
• AI-generated thumbnails and smart topic formatting
• Automatic content organization for better readability
• Smart panel presentation mode for classroom use`
  },
  {
    id: 'copilot-panel',
    title: "🧠 AI Classroom Copilot Panel",
    icon: BrainCircuit,
    color: "#8B5CF6",
    description: `An advanced AI assistant integrated directly into the dashboard that continuously analyzes uploaded classroom content and automatically suggests useful teaching resources.
The system intelligently detects topics and recommends tools such as:
• practice quizzes
• concept diagrams
• physics simulations
• AI lesson plans
This transforms the platform into a real-time AI teaching assistant, helping teachers instantly generate interactive learning materials.`
  }
];

export default function Tutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<typeof upcomingFeatures[0] | null>(null);
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
