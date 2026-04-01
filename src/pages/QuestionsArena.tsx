import { motion } from "motion/react";
import { BrainCircuit, FileSearch, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BackButton } from "../components/BackButton";
import { usePracticeStore } from "../store/usePracticeStore";
import { LazySection } from "../components/LazySection";

export default function QuestionsArena() {
  const isSmartPanelMode = usePracticeStore(state => state.isSmartPanelMode);

  return (
    <div className="min-h-screen pb-32 pt-24 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center">
      <Helmet>
        <title>Questions Arena | Smart Sunrise</title>
        <meta name="description" content="Access the Practice Arena and PYQ Engine to enhance your learning with dynamic DPPs and smart previous year questions." />
      </Helmet>
      <div className="w-full mb-8">
        <BackButton label="Back" />
      </div>
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ y: isSmartPanelMode ? 0 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl sm:text-5xl font-display font-bold mb-4 tracking-tight"
        >
          Questions <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF]">Arena</span>
        </motion.h1>
        <motion.p 
          initial={{ y: isSmartPanelMode ? 0 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: isSmartPanelMode ? 0 : 0.1 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto"
        >
          Your central hub for practice, assessment, and previous year questions.
        </motion.p>
      </div>

      <LazySection className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Practice Arena Card */}
          <Link to="/practice" className="group relative">
            <motion.div 
              initial={{ x: isSmartPanelMode ? 0 : -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={isSmartPanelMode ? { duration: 0.2 } : { type: "spring", stiffness: 100, damping: 20 }}
              className={`glass-panel p-10 rounded-3xl border border-white/10 ${isSmartPanelMode ? '' : 'hover:border-[#00F0FF]/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,240,255,0.15)]'} transition-all duration-500 h-full flex flex-col items-start overflow-hidden`}
            >
              {!isSmartPanelMode && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Animated Background Elements */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00F0FF]/5 rounded-full blur-3xl group-hover:bg-[#00F0FF]/10 transition-colors duration-500 -translate-y-1/2 translate-x-1/2"></div>
                </>
              )}
              
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00F0FF] to-blue-600 p-[1px] mb-8 ${isSmartPanelMode ? '' : 'group-hover:scale-110'} transition-transform duration-500 relative z-10`}>
                <div className="w-full h-full bg-[#0E0E12] rounded-2xl flex items-center justify-center">
                  <BrainCircuit className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h2 className={`text-3xl font-bold text-white mb-4 relative z-10 ${isSmartPanelMode ? '' : 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#00F0FF] group-hover:to-white'} transition-colors`}>Practice Arena</h2>
              <p className="text-gray-400 text-lg mb-8 relative z-10 flex-grow">
                Generate dynamic DPPs, enter practice mode, track your scores, and utilize the integrated whiteboard for solving.
              </p>
              
              <div className={`flex items-center gap-2 text-[#00F0FF] font-semibold relative z-10 ${isSmartPanelMode ? '' : 'group-hover:gap-4'} transition-all`}>
                Enter Arena <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>

          {/* PYQ Section Card */}
          <Link to="/pyq" className="group relative">
            <motion.div 
              initial={{ x: isSmartPanelMode ? 0 : 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={isSmartPanelMode ? { duration: 0.2 } : { type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
              className={`glass-panel p-10 rounded-3xl border border-white/10 ${isSmartPanelMode ? '' : 'hover:border-[#B026FF]/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(176,38,255,0.15)]'} transition-all duration-500 h-full flex flex-col items-start overflow-hidden`}
            >
              {!isSmartPanelMode && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B026FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Animated Background Elements */}
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#B026FF]/5 rounded-full blur-3xl group-hover:bg-[#B026FF]/10 transition-colors duration-500 translate-y-1/2 -translate-x-1/2"></div>
                </>
              )}

              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-[#B026FF] to-purple-600 p-[1px] mb-8 ${isSmartPanelMode ? '' : 'group-hover:scale-110'} transition-transform duration-500 relative z-10`}>
                <div className="w-full h-full bg-[#0E0E12] rounded-2xl flex items-center justify-center">
                  <FileSearch className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <h2 className={`text-3xl font-bold text-white mb-4 relative z-10 ${isSmartPanelMode ? '' : 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#B026FF] group-hover:to-white'} transition-colors`}>PYQ Engine</h2>
              <p className="text-gray-400 text-lg mb-8 relative z-10 flex-grow">
                Smart previous year question system. Filter by exam, year, topic, and difficulty with AI-powered analysis.
              </p>
              
              <div className={`flex items-center gap-2 text-[#B026FF] font-semibold relative z-10 ${isSmartPanelMode ? '' : 'group-hover:gap-4'} transition-all`}>
                Explore PYQs <ArrowRight className="w-5 h-5" />
              </div>
            </motion.div>
          </Link>
        </div>
      </LazySection>
    </div>
  );
}
