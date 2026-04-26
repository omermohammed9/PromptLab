'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VIBE_COLORS: Record<string, string> = {
  professional: '#6366f1', // Indigo
  creative: '#ec4899',    // Pink
  technical: '#10b981',   // Emerald
  casual: '#f59e0b',      // Amber
  minimalist: '#94a3b8',  // Slate
  aggressive: '#ef4444',  // Red
};

export default function AuraBackground() {
  const [auraColor, setAuraColor] = useState('#6366f1');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const colors = Object.values(VIBE_COLORS);
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setAuraColor(randomColor);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div 
        className="aura-bg" 
        style={{ '--aura-color': auraColor } as any} 
      />
      <div className="bg-mesh" />
    </>
  );
}
