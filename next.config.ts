import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'https://fvps2orw9wsxqvtc.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**', 
      },
    ],
  },
};

export default nextConfig;
