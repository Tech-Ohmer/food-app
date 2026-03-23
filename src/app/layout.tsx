import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OhmerEats',
  description: 'Order food from your favourite restaurants',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 flex flex-col">{children}</body>
    </html>
  )
}
