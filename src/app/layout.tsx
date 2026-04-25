import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import AdminSwitch from '@/components/ui/AdminSwitch';
import { ThemeProvider } from '@/components/providers/ThemeProvider'; 
import "./globals.css";
import AnalyticsListener from "@/components/AnalyticsListener"

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
            <AdminSwitch />
            <AnalyticsListener />
            <Toaster position="bottom-center" />
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}