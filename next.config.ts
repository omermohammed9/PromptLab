import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    // 2. Fixes "Invalid Server Action Host" (Form Submissions)
    serverActions: {

      allowedOrigins: [
        'localhost:3000', 
        '192.168.1.164:3000' // Added user's local IP address
      ]
    }
  }
};

export default withNextIntl(nextConfig);