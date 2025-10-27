import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Suspense } from "react"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "iSellData - Fast & Reliable Data Bundles",
  description: "Trusted data provider for MTN, AirtelTigo, and Telecel networks. Fast delivery, instant activation.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
    ],
    apple: '/favicon.svg',
  },
  openGraph: {
    title: "iSellData - Fast & Reliable Data Bundles",
    description: "Trusted data provider for MTN, AirtelTigo, and Telecel networks. Fast delivery, instant activation.",
    url: "https://iselldata.vercel.app",
    siteName: "iSellData",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "iSellData - Fast & Reliable Data Bundles",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "iSellData - Fast & Reliable Data Bundles",
    description: "Trusted data provider for MTN, AirtelTigo, and Telecel networks.",
    images: ["/og-image.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} ${jetbrainsMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
