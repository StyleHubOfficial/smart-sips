import { motion } from "motion/react";
import { ReactNode } from "react";
import { usePracticeStore } from "../store/usePracticeStore";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const isSmartPanelMode = usePracticeStore((state) => state.isSmartPanelMode);

  return (
    <motion.div
      initial={isSmartPanelMode ? { opacity: 0 } : { opacity: 0, x: 20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={isSmartPanelMode ? { opacity: 0 } : { opacity: 0, x: -20, scale: 0.98 }}
      transition={isSmartPanelMode ? { duration: 0.2 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}
