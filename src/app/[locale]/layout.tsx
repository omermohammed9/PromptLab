import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import AdminSwitch from '@/components/ui/AdminSwitch';
import { ThemeProvider } from '@/components/providers/ThemeProvider'; 
import Providers from '@/components/Providers';
import "../globals.css";
import AnalyticsListener from "@/components/AnalyticsListener"
import AuraBackground from "@/components/ui/AuraBackground";
import SystemBanner from "@/components/ui/SystemBanner";
import { getPublicSystemConfig } from "@/app/[locale]/admin/system-action";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import SkipToContent from '@/components/ui/SkipToContent';
import CookieConsent from '@/components/ui/CookieConsent';

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space-grotesk',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });

  return {
    title: {
      default: `${t('title')} | AI Prompt Engineering Studio`,
      template: `%s | ${t('title')}`
    },
    description: t('description'),
    keywords: t('keywords').split(',').map(k => k.trim()),
    authors: [{ name: "Prompt Lab Team" }],
    openGraph: {
      type: "website",
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      url: "https://prompt-lab.vercel.app",
      title: `${t('title')} | AI Prompt Engineering Studio`,
      description: t('description'),
      siteName: t('title'),
    },
    twitter: {
      card: "summary_large_image",
      title: `${t('title')} | AI Prompt Engineering Studio`,
      description: t('description'),
    },
    robots: {
      index: true,
      follow: true,
    }
  };
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  const systemConfig = await getPublicSystemConfig();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <AuraBackground />
          <ThemeProvider>
              <Providers>
                <SkipToContent />
                <SystemBanner 
                  bannerText={systemConfig.globalBanner} 
                  isMaintenance={systemConfig.maintenanceMode} 
                />
                <AdminSwitch />
                <AnalyticsListener />
                <Toaster position="bottom-center" />
                <main id="main-content">
                  {children}
                </main>
                <CookieConsent />
              </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}