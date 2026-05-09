import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { useFlowChartStore } from '../store/useFlowChartStore';
import { useConceptVisualizerStore } from '../store/useConceptVisualizerStore';
import { usePracticeStore } from '../store/usePracticeStore';
import { GoogleAd } from './GoogleAd';
import { Loader2 } from 'lucide-react';

export const AdOverlay: React.FC = () => {
  const { isGeneratingContent } = useAppStore();
  const simulatorLoading = useSimulatorStore((state) => state.loading);
  const flowChartLoading = useFlowChartStore((state) => state.loading);
  const conceptLoading = useConceptVisualizerStore((state) => state.loading);
  const practiceLoading = usePracticeStore((state) => state.loading);

  const isGenerating = 
    isGeneratingContent || 
    simulatorLoading || 
    flowChartLoading || 
    conceptLoading || 
    practiceLoading;

  // Add slight delay before showing ad to avoid flashes for very quick generations
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isGenerating) {
      // Show immediately or with small delay? Let's show immediately to ensure they see it.
      setShowAd(true);
    } else {
      // Hide when not generating
      setShowAd(false);
    }
    return () => clearTimeout(timeout);
  }, [isGenerating]);

  return (
    <AnimatePresence>
      {showAd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"
        >
          <div className="absolute top-8 flex items-center gap-3 text-[#00F0FF]">
            <Loader2 className="w-8 h-8 animate-spin" />
            <h2 className="text-2xl font-bold tracking-wider">GENERATING CONTENT...</h2>
          </div>
          
          <div className="w-full max-w-[800px] h-[400px] bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="absolute top-2 right-4 text-xs text-white/30 uppercase tracking-widest font-bold">Advertisement</div>
            <div className="w-full h-full flex items-center justify-center p-4">
              <GoogleAd slot="1615756616" format="auto" />
            </div>
            {/* Glowing borders */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent opacity-50" />
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#B026FF] to-transparent opacity-50" />
          </div>
          
          <p className="mt-8 text-gray-400 text-center max-w-lg">
            Please wait while Sunrise AI creates your tailored educational content.
            This might take a few moments.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
