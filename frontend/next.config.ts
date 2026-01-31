import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable image optimization for external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.**',
      },
    ],
    // Optimize images with modern formats
    formats: ['image/avif', 'image/webp'],
    // Minimize memory usage for image optimization
    minimumCacheTTL: 60,
  },
  // Enable gzip compression
  compress: true,
  // Remove x-powered-by header for security
  poweredByHeader: false,
  // Optimize package imports for better tree-shaking
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns'],
  },
  // Enable strict mode for better performance debugging
  reactStrictMode: true,
};

export default nextConfig;
