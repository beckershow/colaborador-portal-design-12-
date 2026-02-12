"use client"

import { useAuth, type UserRole } from "@/lib/auth-context"
import { Shield, Users, User } from "lucide-react"

/**
 * Role indicator — shows current user role.
 * Role switching is no longer supported; log out and log in with a different account.
 */
export function RoleSwitcherDev() {
  const { user } = useAuth()

  const roleIcons: Record<UserRole, React.ComponentType<{ className?: string }>> = {
    "super-admin": Shield,
    gestor: Users,
    colaborador: User,
  }

  if (!user) return null

  const Icon = roleIcons[user.role] ?? User

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-md"
      title={`${user.nome} (${user.role})`}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
