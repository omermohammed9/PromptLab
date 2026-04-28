import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  // Since this is a server component in [locale], we can get translations
  const t = await getTranslations('common');

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="relative">
        {/* Decorative elements */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-500/10 blur-[100px]" />
        
        <h1 className="relative font-display text-[12rem] font-black leading-none tracking-tighter text-white/5 sm:text-[20rem]">
          404
        </h1>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white">
            Lost in Space
          </h2>
          <p className="max-w-md text-lg text-white/60">
            The prompt you are looking for has been erased or moved to another dimension.
          </p>
          
          <div className="pt-8">
            <Link
              href="/"
              className="group relative inline-flex items-center overflow-hidden rounded-full bg-indigo-600 px-8 py-4 font-bold text-white transition-all hover:bg-indigo-500 hover:ring-4 hover:ring-indigo-500/20 active:scale-95"
            >
              <span className="relative flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Back to Safety
              </span>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-24 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-left transition-colors hover:bg-white/10">
          <h3 className="font-bold text-white mb-1">Documentation</h3>
          <p className="text-sm text-white/40">Learn how to use PromptLab.</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-left transition-colors hover:bg-white/10">
          <h3 className="font-bold text-white mb-1">Community</h3>
          <p className="text-sm text-white/40">Join our discord server.</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-left transition-colors hover:bg-white/10">
          <h3 className="font-bold text-white mb-1">Support</h3>
          <p className="text-sm text-white/40">Get help from our team.</p>
        </div>
      </div>
    </div>
  );
}
