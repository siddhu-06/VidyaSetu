import type { ReactNode } from 'react';
import { DM_Sans, Playfair_Display } from 'next/font/google';

import { AppProviders } from '@/components/layout/AppProviders';

import './globals.css';

const displayFont = Playfair_Display({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
});

const sansFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable}`}>
      <head>
        <meta name="application-name" content="VidyaSetu" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VidyaSetu" />
        <meta name="description" content="Offline-first NGO learning support platform for mentor-led tutoring programs." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-cream text-indigo antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

