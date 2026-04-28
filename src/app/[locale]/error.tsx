'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('common');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Root Error Boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
      <div className="glass-card max-w-md p-8 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-10 w-10"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-white mb-2">
          Something went wrong
        </h1>
        
        <p className="text-white/60 mb-8 leading-relaxed">
          An unexpected error occurred while processing your request. Our team has been notified.
        </p>

        <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-all hover:bg-indigo-500 active:scale-95"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-6 py-3 font-medium text-white transition-all hover:bg-white/10"
          >
            Go Home
          </button>
        </div>
        
        {error.digest && (
          <p className="mt-6 text-xs font-mono text-white/30">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
