import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface AnimatedCardProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
  hoverClassName?: string;
  activeClassName?: string;
  delay?: number;
  isSmartPanelMode?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  to, 
  onClick, 
  className = "", 
  hoverClassName = "",
  activeClassName = "",
  delay = 0.8,
  isSmartPanelMode = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const navigate = useNavigate();

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPressed) return;
    
    // If it's a link or button inside, we might want to let it handle itself?
    // But the user wants the WHOLE card to have this behavior.
    
    setIsPressed(true);

    setTimeout(() => {
      if (to) {
        navigate(to);
      } else if (onClick) {
        onClick();
      }
      setIsPressed(false);
    }, delay * 1000);
  };

  return (
    <motion.div
      onClick={handleInteraction}
      animate={isPressed ? { scale: 1.02, y: -8 } : { scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative cursor-pointer group ${className} ${isPressed ? 'is-pressed' : ''}`}
    >
      {children}
    </motion.div>
  );
};
