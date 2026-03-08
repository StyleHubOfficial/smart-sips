import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, Sparkles } from 'lucide-react';

interface TreeNode {
  id: string;
  label: string;
  description?: string;
  children?: TreeNode[];
}

interface InteractiveTreeProps {
  data: TreeNode;
}

const TreeNodeComponent: React.FC<{ node: TreeNode; depth: number }> = ({ node, depth }) => {
  const [isExpanded, setIsExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-4 sm:ml-8 mt-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
          isExpanded ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/20'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
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
              Click to Expand
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
              <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const InteractiveTree: React.FC<InteractiveTreeProps> = ({ data }) => {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-8 text-[#00F0FF]">
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-widest">Interactive Concept Map</span>
      </div>
      <TreeNodeComponent node={data} depth={0} />
    </div>
  );
};
