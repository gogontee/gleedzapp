export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/', // Consider allowing API if you want Google to index dynamic content
          '/dashboard/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1, // Add delay to prevent server overload
      },
    ],
    sitemap: 'https://gleedz.com/sitemap.xml',
    host: 'https://gleedz.com',
  };
}