import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface BackButtonProps {
  label?: string;
  to?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ label = 'Back', to, className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -4 }}
      onClick={handleBack}
      className={`flex items-center gap-2 text-gray-400 hover:text-[#00F0FF] transition-colors group ${className}`}
    >
      <div className="p-2 rounded-full bg-white/5 group-hover:bg-[#00F0FF]/10 transition-colors">
        <ArrowLeft className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
};
