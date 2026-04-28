import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // 👈 ADD THIS LINE (Critical)
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        card: 'hsl(var(--background-card))',
        primary: 'hsl(var(--foreground-primary))',
        secondary: 'hsl(var(--foreground-secondary))',
        'border-dim': 'hsl(var(--border-dim))',
        'amber-text': 'hsl(var(--accent-amber-text))',
      },
      zIndex: {
        'navbar': 'var(--z-navbar)',
        'admin-switch': 'var(--z-admin-switch)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'], // Ensure mono is available
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
export default config;