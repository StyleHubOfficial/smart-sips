import { motion } from "motion/react";
import { Sparkles, MonitorPlay, GitGraph, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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
  return (
    <div className="min-h-screen pb-32 pt-24 px-6 max-w-[1920px] 2xl:px-12 mx-auto">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight"
        >
          AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF]">Generators</span>
        </motion.h1>
        <motion.p 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto"
        >
          Powerful AI tools to create interactive content, diagrams, and simulations instantly.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {GENERATORS.map((gen, idx) => (
          <motion.div
            key={gen.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1, type: "spring", stiffness: 100, damping: 20 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={gen.link} className="block h-full">
              <div className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-white/30 h-full flex flex-col group relative overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className={`absolute inset-0 bg-gradient-to-br ${gen.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gen.color} p-[1px] mb-8 group-hover:scale-110 transition-transform duration-500 relative z-10`}>
                  <div className="w-full h-full bg-[#0E0E12] rounded-2xl flex items-center justify-center">
                    <gen.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-colors">{gen.title}</h3>
                <p className="text-gray-400 mb-8 relative z-10 flex-grow group-hover:text-gray-300 transition-colors">{gen.desc}</p>
                
                <div className="flex items-center justify-between mt-auto relative z-10">
                  <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 group-hover:text-white transition-colors">Launch Tool</span>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
