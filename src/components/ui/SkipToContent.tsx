'use client'

import { useTranslations } from 'next-intl'

export default function SkipToContent() {
  const t = useTranslations('compliance')

  return (
    <a
      href="#main-content"
      className="absolute left-4 top-4 z-[200] -translate-y-[150%] bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-transform focus:translate-y-0 shadow-xl shadow-blue-600/20"
    >
      {t('skip_to_content')}
    </a>
  )
}
