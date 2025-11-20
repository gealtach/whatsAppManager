/** @type {import('next').NextConfig} */

const getCSP = (isProduction = false) => {
  const baseConfig = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' ${isProduction ? '' : "'unsafe-eval'"};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://scontent.whatsapp.net https://*.whatsapp.net;
    media-src 'self' blob: https://scontent.whatsapp.net https://*.whatsapp.net;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' ${isProduction ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:3001'} https://scontent.whatsapp.net https://*.whatsapp.net;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  return baseConfig.replaceAll(/\s{2,}/g, ' ').trim();
};

const nextConfig = {
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production';

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: getCSP(isProduction)
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
  images: {
    domains: ['scontent.whatsapp.net'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'scontent.whatsapp.net',
      },
      {
        protocol: 'https',
        hostname: '*.whatsapp.net',
      },
    ],
  },
}

module.exports = nextConfig;