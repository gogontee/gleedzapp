// app/layout.js - UPDATED with all favicons
import { Inter } from 'next/font/google';
import "./globals.css";
import Providers from "./providers";
import BottomNav from "../components/BottomNav";
import { getServerSession } from "next-auth";

const inter = Inter({ subsets: ['latin'] });

// METADATA - Remove themeColor and viewport from here
export const metadata = {
  title: 'Gleedz - Premium Event Platform',
  description: 'Gleedz is a premium platform for creating, managing, and voting in competitions, pageants, and events.',
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
  // ALL ICONS RESTORED
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#5bbad5',
      },
    ],
  },
  manifest: '/site.webmanifest',
  // REMOVED: themeColor and viewport from here
  verification: {
    google: 'YOUR_VERIFICATION_CODE_HERE', // Add your Google code
  },
};

// VIEWPORT - Add this separate export (Next.js 14 requirement)
export const viewport = {
  themeColor: '#D4AF37', // MOVED HERE
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }) {
  const session = await getServerSession();

  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Keep only essential tags */}
        <link rel="canonical" href="https://gleedz.com" />
        <meta name="theme-color" content="#D4AF37" />
        <meta name="msapplication-TileColor" content="#D4AF37" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
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