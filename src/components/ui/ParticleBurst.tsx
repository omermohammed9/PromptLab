'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
}

export default function ParticleBurst({ x, y, onComplete }: { x: number, y: number, onComplete: () => void }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    const colors = ['#f43f5e', '#fbbf24', '#3b82f6', '#10b981', '#a855f7'];
    const newParticles: Particle[] = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x,
      y,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 6 + 4,
      angle: Math.random() * Math.PI * 2,
      velocity: Math.random() * 10 + 5,
    }));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onComplete();
    }, 1000);

    return () => clearTimeout(timer);
  }, [x, y, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
            animate={{
              x: p.x + Math.cos(p.angle) * p.velocity * 15,
              y: p.y + Math.sin(p.angle) * p.velocity * 15,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
