import { Sparkles } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher'
import AuthButton from '@/components/home/AuthButton'
import LandingHero from '@/components/home/LandingHero'
import FeatureGrid from '@/components/home/FeatureGrid'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const legal = await getTranslations({ locale, namespace: 'legal' });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden selection:bg-blue-500/30">
      
      {/* 1. NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Area */}
          <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-slate-900 dark:text-white">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <Sparkles size={20} fill="currentColor" />
            </div>
            {common('title')}
          </div>

          {/* Actions Area */}
          <div className="flex items-center gap-4">
             <LocaleSwitcher />
             <ThemeToggle />
             <div className="hidden sm:block">
                <AuthButton label={common('login')} variant="outline" />
             </div>
             <AuthButton label={t('launch')} variant="primary" />
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION (Client Component) */}
      <LandingHero 
        t={{
          version: t('version'),
          headline: t('headline'),
          subheadline: t('subheadline'),
          launch: t('launch'),
          vault: t('vault')
        }} 
      />

      {/* 3. FEATURE CARDS (Client Component) */}
      <FeatureGrid 
        t={{
          refinement: {
            title: t('features.refinement.title'),
            desc: t('features.refinement.desc')
          },
          vault: {
            title: t('features.vault.title'),
            desc: t('features.vault.desc')
          },
          community: {
            title: t('features.community.title'),
            desc: t('features.community.desc')
          }
        }}
      />
      
      {/* 4. FOOTER */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm font-medium order-2 md:order-1">{t('footer')}</p>
          
          <div className="flex items-center gap-8 order-1 md:order-2">
            <Link 
              href={`/${locale}/privacy`}
              className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
            >
              {legal('privacy')}
            </Link>
            <Link 
              href={`/${locale}/terms`}
              className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
            >
              {legal('terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}