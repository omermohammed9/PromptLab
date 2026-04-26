import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import AdminSwitch from '@/components/ui/AdminSwitch';
import { ThemeProvider } from '@/components/providers/ThemeProvider'; 
import Providers from '@/components/Providers';
import "./globals.css";
import AnalyticsListener from "@/components/AnalyticsListener"
import AuraBackground from "@/components/ui/AuraBackground";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "Prompt Lab",
  description: "AI Prompt Engineering Studio",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`} suppressHydrationWarning>
        <AuraBackground />
        <ThemeProvider>
            <Providers>
              <AdminSwitch />
              <AnalyticsListener />
              <Toaster position="bottom-center" />
              {children}
            </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}