import { motion } from "motion/react";
import { Sparkles, MonitorPlay, GitGraph, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { usePracticeStore } from "../store/usePracticeStore";
import { LazySection } from "../components/LazySection";
import { AnimatedCard } from "../components/AnimatedCard";

const GENERATORS = [
  {
    id: 'simulator',
    title: 'Simulator Generator',
    desc: 'Create interactive 3D and 2D physics/math simulations using natural language.',
    icon: MonitorPlay,
    color: 'from-[#00F0FF] to-blue-600',
    link: '/simulator'
  },
  {
    id: 'flowchart',
    title: 'Flowchart Generator',
    desc: 'Instantly generate complex flowcharts and mind maps from text descriptions.',
    icon: GitGraph,
    color: 'from-[#B026FF] to-purple-600',
    link: '/flowchart'
  },
  {
    id: 'visualizer',
    title: 'Concept Visualizer',
    desc: 'Visualize abstract concepts with AI-generated diagrams and interactive models.',
    icon: Sparkles,
    color: 'from-emerald-400 to-green-600',
    link: '/visualizer'
  }
];

export default function AIGenerators() {
  const isSmartPanelMode = usePracticeStore(state => state.isSmartPanelMode);

  return (
    <div className="min-h-screen pb-32 pt-24 px-6 max-w-7xl mx-auto">
      <Helmet>
        <title>AI Generators | Smart Sunrise</title>
        <meta name="description" content="Use powerful AI tools to instantly generate interactive simulators, complex flowcharts, and concept visualizers." />
      </Helmet>
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ y: isSmartPanelMode ? 0 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight"
        >
          AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF]">Generators</span>
        </motion.h1>
        <motion.p 
          initial={{ y: isSmartPanelMode ? 0 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: isSmartPanelMode ? 0 : 0.1 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto"
        >
          Powerful AI tools to create interactive content, diagrams, and simulations instantly.
        </motion.p>
      </div>

      <LazySection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {GENERATORS.map((gen, idx) => (
            <AnimatedCard
              key={gen.id}
              to={gen.link}
              isSmartPanelMode={isSmartPanelMode}
            >
              <motion.div
                initial={{ y: isSmartPanelMode ? 0 : 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={isSmartPanelMode ? { duration: 0.2 } : { delay: idx * 0.1, type: "spring", stiffness: 100, damping: 20 }}
                className={`glass-panel p-8 rounded-3xl border border-white/10 ${isSmartPanelMode ? '' : 'hover:border-white/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]'} h-full flex flex-col group relative overflow-hidden`}
              >
                {!isSmartPanelMode && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gen.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                )}
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gen.color} p-[1px] mb-8 ${isSmartPanelMode ? '' : 'group-hover:scale-110'} transition-transform duration-500 relative z-10`}>
                  <div className="w-full h-full bg-[#0E0E12] rounded-2xl flex items-center justify-center">
                    <gen.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className={`text-2xl font-bold text-white mb-3 relative z-10 ${isSmartPanelMode ? '' : 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400'} transition-colors`}>{gen.title}</h3>
                <p className={`text-gray-400 mb-8 relative z-10 flex-grow ${isSmartPanelMode ? '' : 'group-hover:text-gray-300'} transition-colors`}>{gen.desc}</p>
                
                <div className="flex items-center justify-between mt-auto relative z-10">
                  <span className={`text-sm font-semibold uppercase tracking-wider text-gray-500 ${isSmartPanelMode ? '' : 'group-hover:text-white'} transition-colors`}>Launch Tool</span>
                  <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center ${isSmartPanelMode ? '' : 'group-hover:bg-white/10'} transition-colors`}>
                    <ArrowRight className={`w-5 h-5 text-white ${isSmartPanelMode ? '' : 'group-hover:translate-x-1'} transition-transform`} />
                  </div>
                </div>
              </motion.div>
            </AnimatedCard>
          ))}
        </div>
      </LazySection>
    </div>
  );
}
