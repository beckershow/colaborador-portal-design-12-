import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, User } from "lucide-react"
import type { UserRole } from "@/lib/auth-context"

interface UserRoleBadgeProps {
  role: UserRole
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
}

const roleConfig: Record<
  UserRole,
  {
    label: string
    color: string
    bgColor: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  "super-admin": {
    label: "Super Admin",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-300",
    icon: Shield,
  },
  gestor: {
    label: "Gestor de Time",
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-300",
    icon: Users,
  },
  colaborador: {
    label: "Colaborador",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-300",
    icon: User,
  },
}

export function UserRoleBadge({ role, size = "md", showIcon = true }: UserRoleBadgeProps) {
  const config = roleConfig[role]
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }

  return (
    <Badge className={`${config.bgColor} ${config.color} border ${sizeClasses[size]} font-semibold`}>
      {showIcon && <Icon className={`mr-1.5 ${iconSizes[size]}`} />}
      {config.label}
    </Badge>
  )
}
