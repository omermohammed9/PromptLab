"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Prompt } from '@/types/interface';
import { GitBranch, Clock, User, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GenealogyTreeProps {
  lineage: Prompt[];
  currentPromptId: string;
}

export const GenealogyTree: React.FC<GenealogyTreeProps> = ({ lineage, currentPromptId }) => {
  if (!lineage || lineage.length === 0) return null;

  // Sort by version number
  const sortedLineage = [...lineage].sort((a, b) => (a.version_number ?? 0) - (b.version_number ?? 0));

  return (
    <div className="relative w-full overflow-x-auto py-8 px-4">
      <div className="flex items-center space-x-8 min-w-max">
        {sortedLineage.map((prompt, index) => (
          <React.Fragment key={prompt.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 w-64 ${
                prompt.id === currentPromptId
                  ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              } backdrop-blur-md glassmorphism`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                  v{prompt.version_number || 1}
                </span>
                <Clock className="w-3 h-3 text-white/40" />
              </div>
              
              <h4 className="text-sm font-semibold text-white mb-1 truncate">
                {prompt.title || 'Untitled'}
              </h4>
              
              <div className="flex items-center space-x-2 text-[10px] text-white/50">
                <User className="w-3 h-3" />
                <span>{prompt.profiles?.username || 'Unknown'}</span>
                <span>•</span>
                <span>{prompt.created_at ? formatDistanceToNow(new Date(prompt.created_at)) : 'Just now'} ago</span>
              </div>

              {prompt.id === currentPromptId && (
                <div className="absolute -top-3 inset-x-0 mx-auto w-fit bg-blue-500 text-[10px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-lg">
                  Current
                </div>
              )}
            </motion.div>

            {index < sortedLineage.length - 1 && (
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="flex items-center text-white/20"
              >
                <ArrowRight className="w-6 h-6" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-6 flex items-center space-x-2 text-xs text-white/40 justify-center">
        <GitBranch className="w-3 h-3" />
        <span>Ancestry Lineage (Visualized)</span>
      </div>
    </div>
  );
};
