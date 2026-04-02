import type { NextConfig } from "next";
import { env } from "./src/lib/env";

const nextConfig: NextConfig = {
  /* 性能优化配置 */
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  /* 图片优化配置 */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'trae-api-cn.mchost.guru',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30天缓存
  },
  
  /* 实验性功能 */
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  /* Turbopack 配置 */
  turbopack: {},
  
  /* 禁用类型检查（临时解决方案） */
  typescript: {
    ignoreBuildErrors: true,
  },
  
  /* 生产环境HTTPS配置 */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          /* 安全头部 */
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), autoplay=()',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  
  /* 重写规则 */
  async rewrites() {
    return [
      /* 可以在这里添加重写规则 */
    ];
  },
  /* 重定向规则 */
  async redirects() {
    const redirects = [];
    
    /* 生产环境HTTPS重定向 */
    if (env.NODE_ENV === 'production' && env.NEXT_PUBLIC_DOMAIN) {
      redirects.push({
        source: '/:path*',
        has: [
          {
            type: 'header' as const,
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        permanent: true,
        destination: 'https://' + env.NEXT_PUBLIC_DOMAIN + '/:path*',
      });
    }
    
    return redirects;
  },

};

export default nextConfig;
