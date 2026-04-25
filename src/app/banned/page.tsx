import Link from 'next/link';
import { Gavel } from 'lucide-react';

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-red-900/30 p-8 rounded-2xl text-center shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-red-500/10 p-4 rounded-full">
            <Gavel className="text-red-500" size={48} />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Account Restricted</h1>
        <p className="text-slate-400 mb-8">
          Your access to this platform has been revoked due to a violation of our security policies.
        </p>
        <Link 
          href="/login" 
          className="inline-block w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}