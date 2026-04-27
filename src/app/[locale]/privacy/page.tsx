import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal' })
  return {
    title: t('privacy'),
  }
}

export default function PrivacyPage() {
  const t = useTranslations('legal')
  const common = useTranslations('common')

  return (
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
          {t('privacy')}
        </h1>
        <p className="text-slate-500 mb-12 font-medium">
          {t('last_updated', { date: 'April 28, 2026' })}
        </p>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p>
              Welcome to {common('title')}. We are committed to protecting your personal information and your right to privacy. 
              If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, 
              please contact us.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register on the Website, 
              express an interest in obtaining information about us or our products and Services, when you participate in 
              activities on the Website or otherwise when you contact us.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; and other similar information.</li>
              <li><strong>AI Usage Data:</strong> We log prompt interactions to improve our services and ensure compliance with our terms.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p>
              We use personal information collected via our Website for a variety of business purposes described below:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To send administrative information to you.</li>
              <li>To fulfill and manage your orders.</li>
              <li>To protect our Services from misuse.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Sharing Your Information</h2>
            <p>
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, 
              or to fulfill business obligations.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Cookies and Other Tracking Technologies</h2>
            <p>
              We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. 
              Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Security of Your Information</h2>
            <p>
              We aim to protect your personal information through a system of organizational and technical security measures. 
              However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet 
              or information storage technology can be guaranteed to be 100% secure.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
