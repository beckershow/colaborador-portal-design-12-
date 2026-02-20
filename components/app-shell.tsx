"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { EngageSidebar } from "@/components/engage-sidebar"
import { HumorPopupModal } from "@/components/humor-popup-modal"
import { cn } from "@/lib/utils"

const PUBLIC_PATHS = ["/login"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      router.replace("/login")
    }
  }, [isLoading, user, isPublic, router])

  // Login page — no sidebar, full screen
  if (isPublic) {
    return <>{children}</>
  }

  // Still checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    )
  }

  // Not authenticated — redirect handled by useEffect, show nothing
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      <EngageSidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out ml-0",
          isSidebarCollapsed ? "md:ml-20" : "md:ml-72",
        )}
      >
        <div className="container mx-auto p-6 max-w-7xl">{children}</div>
      </main>
      <HumorPopupModal />
    </div>
  )
}
