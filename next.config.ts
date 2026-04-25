import type { NextConfig } from "next";

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
    // 1. Fixes "Cross Origin request detected" (HMR Warning)
    // The feature exists, but types are missing, so we ignore the TS error:
    // @ts-expect-error - This is a valid Next.js option not yet in the types
    allowedDevOrigins: [
      'localhost:3000', 
      '192.168.1.164:3000' // Added user's local IP address
    ],

    // 2. Fixes "Invalid Server Action Host" (Form Submissions)
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 
        '192.168.1.164:3000' // Added user's local IP address
      ]
    }
  }
};

export default nextConfig;