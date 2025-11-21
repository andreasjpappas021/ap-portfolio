import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import CustomerIOProvider from '@/components/customerio-provider'
import CustomerIOScript from '@/components/customerio-script'

export const metadata: Metadata = {
  title: 'Andreas Pappas - Senior Product Manager',
  description: 'Senior Product Manager crafting data-driven experiences that users love. View my portfolio of product strategy, growth, and user experience projects.',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <CustomerIOScript />
        <CustomerIOProvider />
        {children}
      </body>
    </html>
  )
}
