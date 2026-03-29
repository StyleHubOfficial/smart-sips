import { motion } from "motion/react";
import { PlayCircle, BrainCircuit, FileSearch, MonitorPlay, ChevronRight, BookOpen, Sparkles, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen pb-32">
      {/* Top Section - Video Animation */}
      <section className="relative h-[70vh] sm:h-[80vh] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[var(--color-background)] z-10"></div>
        
        {/* Video Background */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        >
          <source src="https://cdn.pixabay.com/video/2020/05/25/40131-424917415_large.mp4" type="video/mp4" />
          {/* Fallback CSS Animation if video fails */}
          <div className="absolute inset-0 bg-[#0E0E12] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00F0FF] rounded-full mix-blend-screen filter blur-[150px] animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#B026FF] rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
        </video>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl sm:text-7xl md:text-8xl font-display font-bold mb-6 tracking-tight drop-shadow-2xl"
          >
            Welcome to <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#B026FF] filter drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">Smart Sunrise</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl sm:text-3xl text-gray-200 font-light drop-shadow-lg"
          >
            AI Powered Classroom Experience
          </motion.p>
        </div>
      </section>

      {/* Platform Introduction */}
      <section className="py-20 px-6 max-w-7xl mx-auto relative z-20">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">The Future of Education</h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            Smart Sunrise transforms traditional teaching into an interactive, AI-driven experience. 
            Generate content, practice dynamically, and visualize concepts with unprecedented ease.
          </p>
        </motion.div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-32">
          {[
            { icon: Sparkles, title: "AI Generators", desc: "Instantly create diagrams, simulators, and flowcharts.", color: "from-[#00F0FF] to-blue-500" },
            { icon: BrainCircuit, title: "Practice Arena", desc: "Dynamic DPPs and interactive practice modes.", color: "from-yellow-400 to-orange-500" },
            { icon: FileSearch, title: "PYQ System", desc: "Smart previous year question engine with AI analysis.", color: "from-emerald-400 to-green-600" },
            { icon: MonitorPlay, title: "Whiteboard", desc: "Integrated digital canvas for live teaching.", color: "from-[#B026FF] to-purple-600" },
            { icon: BookOpen, title: "Classroom Dashboard", desc: "Organized content delivery and management.", color: "from-pink-500 to-rose-500" },
          ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
                className="glass-panel p-8 rounded-2xl border border-white/10 hover:border-transparent group cursor-pointer relative overflow-hidden h-full"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                {/* Animated Border */}
                <div className={`absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy pointer-events-none z-50`} style={{ WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
                
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-[1px] mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]`}>
                  <div className="w-full h-full bg-[#0E0E12] rounded-xl flex items-center justify-center">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{feature.desc}</p>
              </motion.div>
          ))}
        </div>

        {/* How It Works */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-12 text-center">How It Works</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {['Upload', 'Generate', 'Teach', 'Practice'].map((step, idx) => (
              <div key={idx} className="flex items-center gap-4 md:gap-8 flex-col md:flex-row w-full md:w-auto">
                <div className="glass-panel px-8 py-4 rounded-2xl border border-white/10 text-center relative group overflow-hidden w-full md:w-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00F0FF]/10 to-[#B026FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-xl font-bold text-white relative z-10">{step}</span>
                </div>
                {idx < 3 && <ChevronRight className="w-8 h-8 text-gray-600 hidden md:block" />}
                {idx < 3 && <ChevronRight className="w-8 h-8 text-gray-600 md:hidden rotate-90" />}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32"
        >
          <Link to="/courses" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors text-center flex items-center justify-center gap-2 group">
            <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Explore Courses
          </Link>
          <Link to="/questions" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#B026FF] text-white font-semibold hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2 group shadow-[0_0_30px_rgba(0,240,255,0.3)]">
            <BrainCircuit className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Start Practice
          </Link>
          <Link to="/ai-generators" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors text-center flex items-center justify-center gap-2 group">
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Open AI Tools
          </Link>
        </motion.div>

        {/* Developer Details */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="glass-panel p-8 rounded-3xl border border-white/10 text-center max-w-2xl mx-auto mb-20"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00F0FF] to-[#B026FF] p-[1px] mx-auto mb-6">
            <div className="w-full h-full bg-[#0E0E12] rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
          <p className="text-gray-400 mb-8">
            For any complaint, feedback, error, idea, suggestion, etc. Directly contact us.
          </p>
          <div className="flex flex-col gap-4 text-sm sm:text-base mb-8">
            <a href="mailto:stylehubofficial02@gmail.com" className="text-[#00F0FF] hover:underline flex items-center justify-center gap-2">
              <span className="text-gray-400">Business:</span> stylehubofficial02@gmail.com
            </a>
            <a href="mailto:lakshyabhamu2@gmail.com" className="text-[#B026FF] hover:underline flex items-center justify-center gap-2">
              <span className="text-gray-400">Personal:</span> lakshyabhamu2@gmail.com
            </a>
          </div>

          <div className="border-t border-white/10 pt-8 mt-8 text-gray-400 text-sm space-y-2">
            <p>Powered by <span className="text-white font-bold">Lakshya Bhamu</span></p>
            <p>Style Hub - developed by <span className="text-white font-bold">Lakshya</span></p>
            <p>Style Hub creativity / More Apps:</p>
            <a href="https://newsapp02.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[#00F0FF] hover:underline">
              • News Club
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
