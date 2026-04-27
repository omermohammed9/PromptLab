import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })
  return {
    title: t('terms'),
  }
}

export default function TermsPage() {
  const t = useTranslations('legal')
  const common = useTranslations('common')

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          {t('terms')}
        </h1>
        <p className="text-slate-500 mb-12 font-medium">
          {t('last_updated', { date: 'April 28, 2026' })}
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using {common('title')}, you agree to be bound by these Terms of Service. 
              If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are and will remain the exclusive property of {common('title')} and its licensors. 
              The prompts you create in your private vault remain your intellectual property. However, prompts shared in the Community Vault 
              become public and subject to the community license.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <p>
              When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Prohibited Uses</h2>
            <p>
              You may use the Service only for lawful purposes and in accordance with Terms. You agree not to use the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>To generate content that is harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
              <li>To impersonate or attempt to impersonate {common('title')}, a {common('title')} employee, another user, or any other person or entity.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, 
              including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
            <p>
              In no event shall {common('title')}, nor its directors, employees, partners, agents, suppliers, or affiliates, 
              be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, 
              loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability 
              to access or use the Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
