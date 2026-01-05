// app/robots.js - CORRECTED VERSION
export default function robots() {
  return {
    // SINGLE rules object, not array
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/',
        '/private/',
      ],
    },
    // KEPT: sitemap directive
    sitemap: 'https://gleedz.com/sitemap.xml',
    // OPTIONAL: Host directive (some crawlers support it)
    host: 'https://gleedz.com',
  };
}