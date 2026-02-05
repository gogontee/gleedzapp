// app/layout.js - UPDATED for Supabase auth
import { Inter } from 'next/font/google';
import "./globals.css";
import Providers from "./providers";
import BottomNav from "../components/BottomNav";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

// METADATA - Keep icons here for SEO, but we'll also add manual links for cache control
export const metadata = {
  title: 'Gleedz - Premium Event Platform',
  description: 'Gleedz is a platform for premium events.',
  keywords: 'events, competitions, pageants, voting, talent shows, contests',
  authors: [{ name: 'Gleedz' }],
  creator: 'Gleedz',
  publisher: 'Gleedz',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Gleedz - Premium Event Platform',
    description: 'Create, manage, and vote in competitions, pageants, and events',
    url: 'https://gleedz.com',
    siteName: 'Gleedz',
    images: [
      {
        url: 'https://gleedz.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gleedz - Premium Event Platform',
    description: 'Create, manage, and vote in competitions, pageants, and events',
    images: ['https://gleedz.com/og-image.png'],
    creator: '@gleedz',
  },
  // ICONS for metadata
  icons: {
    icon: [
      { url: '/favicon.ico?v=4' },
      { url: '/favicon-16x16.png?v=4', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=4', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png?v=4', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png?v=4', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=4' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg?v=4',
        color: '#5bbad5',
      },
    ],
  },
  manifest: '/site.webmanifest?v=4',
  verification: {
    google: 'YOUR_VERIFICATION_CODE_HERE',
  },
};

// VIEWPORT
export const viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }) {
  // CREATE SUPABASE SERVER CLIENT FOR SESSION
  const supabase = createServerComponentClient({ cookies });
  
  // Get Supabase session (not next-auth!)
  const { data: { session } } = await supabase.auth.getSession();
  
  // Add debugging
  console.log('Layout - Session exists:', !!session);
  if (session) {
    console.log('Layout - User ID:', session.user.id);
  }

  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* MANUAL FAVICON LINKS WITH CACHE BUSTING - Most important */}
        <link rel="icon" href="/favicon.ico?v=4" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" type="image/x-icon" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=4" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=4" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />
        <link rel="manifest" href="/site.webmanifest?v=4" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#D4AF37" />
        <meta name="msapplication-TileColor" content="#D4AF37" />
        <meta name="msapplication-config" content="/browserconfig.xml?v=4" />
        
        {/* Additional meta tags */}
        <link rel="canonical" href="https://gleedz.com" />
        
        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Gleedz",
              "url": "https://gleedz.com",
              "logo": "https://gleedz.com/logo.png",
              "description": "Premium platform for creating, managing, and voting in competitions, pageants, and events",
              "sameAs": [
                "https://twitter.com/gleedz",
                "https://facebook.com/gleedz",
                "https://instagram.com/gleedz",
                "https://linkedin.com/company/gleedz"
              ]
            })
          }}
        />
        
        {/* Add performance monitoring */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.startLoadTime = Date.now();
              window.addEventListener('load', function() {
                window.loadTime = Date.now() - window.startLoadTime;
                console.log('Page loaded in', window.loadTime, 'ms');
              });
            `
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Providers session={session}>
          <main className="flex-1 pb-16">{children}</main>

          {/* Global Bottom Navigation (mobile only) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}