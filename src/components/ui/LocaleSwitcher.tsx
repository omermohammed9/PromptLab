'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Languages } from 'lucide-react';

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('common');
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 px-4 py-2 md:px-3 md:py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-[background-color,border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
      aria-label={t('toggle_language')}
    >
      <Languages className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      <span className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
