import './globals.css'
import { DatabaseInitializer } from '@/lib/scanner/dbInitializer'
import AgeGate from '@/components/AgeGate'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'StrainSpotter — AI Cannabis Identification',
    template: '%s | StrainSpotter',
  },
  description:
    'AI-powered cannabis strain identification. Snap a photo and get instant strain analysis with terpene profiles, effects, and grow coaching tips.',
  keywords: [
    'cannabis',
    'strain identification',
    'AI scanner',
    'terpene profile',
    'grow coach',
    'marijuana',
    'weed identifier',
  ],
  openGraph: {
    title: 'StrainSpotter — AI Cannabis Identification',
    description:
      'Snap a photo. Get instant strain analysis with terpene profiles, effects, and grow coaching.',
    url: 'https://strainspotter.app',
    siteName: 'StrainSpotter',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StrainSpotter — AI Cannabis Identification',
    description:
      'Snap a photo. Get instant strain analysis with terpene profiles, effects, and grow coaching.',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/brand/cannabis-icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/cannabis-icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/brand/cannabis-icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/cannabis-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/brand/cannabis-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StrainSpotter',
    startupImage: [
      {
        url: '/brand/cannabis-icon.png',
        media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'StrainSpotter',
    'format-detection': 'telephone=no',
    'msapplication-TileColor': '#1a2420',
    'msapplication-tap-highlight': 'no',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1a2420' },
    { media: '(prefers-color-scheme: light)', color: '#1a2420' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DatabaseInitializer />
        <ErrorBoundary>
          <AgeGate>
            {children}
          </AgeGate>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
