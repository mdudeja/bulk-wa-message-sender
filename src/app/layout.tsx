import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import HeaderComponent from "@/components/HeaderComponent"
import { Toaster } from "@/components/ui/sonner"
import Providers from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WA Bulk Message Sender",
  description: "Send bulk messages to WhatsApp users",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav>
          <HeaderComponent />
        </nav>
        <main className="p-2">
          <Providers>{children}</Providers>
        </main>
        <Toaster />
      </body>
    </html>
  )
}
