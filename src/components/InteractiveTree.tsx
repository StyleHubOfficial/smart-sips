import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, Sparkles, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface TreeNode {
  id: string;
  label: string;
  description?: string;
  children?: TreeNode[];
}

interface InteractiveTreeProps {
  data: TreeNode;
}

const TreeNodeComponent: React.FC<{ node: TreeNode; depth: number; onExpand: () => void }> = ({ node, depth, onExpand }) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    if (nextState) {
      onExpand();
    }
  };

  return (
    <div className="ml-4 sm:ml-8 mt-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
          isExpanded ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          {hasChildren && (
            <div className="text-[#00F0FF]">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-bold text-white group-hover:text-[#00F0FF] transition-colors">{node.label}</h4>
            {node.description && (
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">{node.description}</p>
            )}
          </div>
          {!isExpanded && hasChildren && (
            <div className="px-2 py-1 rounded-md bg-[#00F0FF]/20 text-[#00F0FF] text-[10px] font-bold uppercase tracking-wider animate-pulse">
              Expand
            </div>
          )}
        </div>
        
        {/* Connection Line */}
        {depth > 0 && (
          <div className="absolute -left-4 top-1/2 w-4 h-[1px] bg-white/10 group-hover:bg-[#00F0FF]/30 transition-colors" />
        )}
      </motion.div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-l border-white/10 ml-2"
          >
            {node.children!.map((child) => (
              <TreeNodeComponent key={child.id} node={child} depth={depth + 1} onExpand={onExpand} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const InteractiveTree: React.FC<InteractiveTreeProps> = ({ data }) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAutoZoom = () => {
    // Automatically zoom out slightly when expanding to keep context
    setZoom(prev => Math.max(0.5, prev - 0.05));
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-[#050505] rounded-2xl border border-white/10">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button 
          onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setZoom(1)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all"
          title="Reset Zoom"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tree Container */}
      <div className="absolute inset-0 overflow-auto p-8 custom-scrollbar">
        <motion.div 
          ref={containerRef}
          animate={{ scale: zoom }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="origin-top-left"
          style={{ width: 'max-content', minWidth: '100%' }}
        >
          <div className="flex items-center gap-2 mb-8 text-[#00F0FF]">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Interactive Concept Map</span>
          </div>
          <TreeNodeComponent node={data} depth={0} onExpand={handleAutoZoom} />
        </motion.div>
      </div>
    </div>
  );
};
