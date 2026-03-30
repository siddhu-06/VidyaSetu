import type { ReactNode } from 'react';

import { AppProviders } from '@/components/layout/AppProviders';

import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="VidyaSetu" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VidyaSetu" />
        <meta name="description" content="Offline-first NGO learning support platform for volunteer tutoring programs." />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen bg-slate-100 text-slate-950 antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

