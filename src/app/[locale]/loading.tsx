'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="relative">
        {/* Animated Glow Effect */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-2xl animate-pulse" />
        
        {/* Spinner */}
        <div className="relative flex flex-col items-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
          
          <div className="mt-6 flex flex-col items-center space-y-2">
            <h3 className="font-display text-xl font-medium tracking-tight text-white/90">
              Initializing PromptLab
            </h3>
            <div className="flex space-x-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]"></span>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-500"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
