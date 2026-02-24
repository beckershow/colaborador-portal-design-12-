import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import { AppShell } from "@/components/app-shell"
import { DemoDataInitializer } from "@/components/demo-data-initializer"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EngageAI — Portal do Colaborador",
  description: "Seu portal de engajamento, desenvolvimento e bem-estar",
  generator: "v0.app",
  icons: {
    icon: "/favicon_engageai.png",
    apple: "/favicon_engageai.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <DemoDataInitializer />
          <AppShell>{children}</AppShell>
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
