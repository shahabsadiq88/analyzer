import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ANALYZER ACADEMY — Premier MDCAT & Test Prep Platform',
    template: '%s | ANALYZER ACADEMY',
  },
  description: 'Prepare with comprehensive video lectures, practice tests, and performance analytics.',
  keywords: ['ANALYZER ACADEMY', 'MDCAT', 'MDCAT preparation', 'Biology', 'Chemistry', 'Physics', 'MCQs'],
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    siteName: 'ANALYZER ACADEMY',
  },
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
