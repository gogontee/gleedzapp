// app/layout.js - FIXED VERSION
import { Inter } from 'next/font/google';
import "./globals.css";
import Providers from "./providers";
import BottomNav from "../components/BottomNav";
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

// METADATA
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

export const viewport = {
  themeColor: '#D4AF37',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }) {
  // Get cookies for session handling
  const cookieStore = cookies();
  
  // Initialize session as null (will be set on client-side)
  let session = null;
  
  // Only try to get session if we have auth cookies
  try {
    // Check if we have auth cookies without making a full request
    const authCookie = cookieStore.get('sb-mttimgygxzfqzmnirfyq-auth-token');
    
    if (authCookie?.value) {
      // We have auth cookies, but we'll let client-side handle the session
      // This prevents server-side errors from invalid sessions
      session = { hasCookie: true };
    }
  } catch (error) {
    console.log('No auth session found or error:', error.message);
    // Continue without session - client will handle it
  }

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        {/* Favicon links */}
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
        
        {/* Structured Data */}
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
        
        {/* Prevent video autoplay errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent video autoplay errors
              document.addEventListener('DOMContentLoaded', function() {
                const videos = document.querySelectorAll('video');
                videos.forEach(video => {
                  video.playsInline = true;
                  video.muted = true;
                  
                  // Handle autoplay with user interaction
                  const playVideo = () => {
                    video.play().catch(e => {
                      console.log('Video autoplay prevented:', e.name);
                      // Autoplay was prevented, wait for user interaction
                      document.addEventListener('click', function playOnClick() {
                        video.play().catch(() => {});
                        document.removeEventListener('click', playOnClick);
                      }, { once: true });
                    });
                  };
                  
                  // Try to play when video is visible
                  const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                      if (entry.isIntersecting) {
                        playVideo();
                      }
                    });
                  }, { threshold: 0.5 });
                  
                  observer.observe(video);
                });
              });
              
              // Performance monitoring
              window.startLoadTime = Date.now();
              window.addEventListener('load', function() {
                window.loadTime = Date.now() - window.startLoadTime;
                if (window.loadTime > 3000) {
                  console.warn('Page load took', window.loadTime, 'ms - Consider optimizing');
                }
              });
            `
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50">
        <Providers session={session}>
          <main className="flex-1 pb-16 md:pb-0">{children}</main>

          {/* Global Bottom Navigation (mobile only) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <BottomNav />
          </div>
        </Providers>
        
        {/* Add global error boundary for video errors */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler for video errors
              window.addEventListener('error', function(e) {
                if (e.target && e.target.tagName === 'VIDEO') {
                  e.preventDefault();
                  console.log('Video error handled:', e.message);
                  return false;
                }
              }, true);
              
              // Handle promise rejections
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.name === 'AbortError' && e.reason.message.includes('video')) {
                  e.preventDefault();
                  console.log('Video promise rejection handled');
                  return false;
                }
              });
            `
          }}
        />
      </body>
    </html>
  );
}