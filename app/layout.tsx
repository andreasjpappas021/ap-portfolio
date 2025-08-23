import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
