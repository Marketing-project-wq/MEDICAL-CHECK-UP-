import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "@/app/globals.css"
import { Toaster } from "@/components/layout/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "my.20fit - Medical Check-Up",
  description:
    "Platform analisis hasil Medical Check-Up (MCU) untuk membantu Anda memahami kondisi kesehatan dengan lebih baik melalui visualisasi data, artikel kesehatan, dan kuis interaktif.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
