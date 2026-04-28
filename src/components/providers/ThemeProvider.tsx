'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Suppress React 19 "Encountered a script tag" warning which is a false positive for next-themes
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
      return
    }
    originalError(...args)
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}