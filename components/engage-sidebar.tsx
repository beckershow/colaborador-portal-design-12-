"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Heart,
  MessageSquare,
  ClipboardList,
  Trophy,
  Settings,
  ChevronDown,
  LogOut,
  GraduationCap,
  Shield,
  UserCircle,
  ShoppingBag,
  BarChart3,
  TrendingUp,
  Calendar,
  FolderOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserRoleBadge } from "@/components/user-role-badge"
import { NotificationCenter } from "@/components/notification-center"
import { CollaboratorNotificationBell } from "@/components/collaborator-notification-bell"
import { useAuth } from "@/lib/auth-context"
import { GamificationGuard } from "@/lib/gamification-guard"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getPendingFeedbacks } from "@/lib/feedback-api"

export function EngageSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean
  setIsCollapsed: (value: boolean) => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, hasPermission, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }
  
  // TASK 4: Estado de expansão da categoria de módulos (apenas para gestores e admins)
  const isGestorOrAdmin = user?.role === "gestor" || user?.role === "super-admin"
  const [isModulosExpanded, setIsModulosExpanded] = useState(!isGestorOrAdmin)

  // Badge de aprovações pendentes (apenas gestor)
  const [feedbackPendingCount, setFeedbackPendingCount] = useState(0)
  useEffect(() => {
    if (user?.role !== "gestor") return
    getPendingFeedbacks(1, 1)
      .then(res => setFeedbackPendingCount(res.data.length))
      .catch(() => {})
    const interval = setInterval(() => {
      getPendingFeedbacks(1, 1)
        .then(res => setFeedbackPendingCount(res.data.length))
        .catch(() => {})
    }, 60_000) // recheck every 60s
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  if (!user) return null

  const showAdminPanel = hasPermission(["gestor", "super-admin"])
  const showGestoresPanel = hasPermission("super-admin")
  const showConfiguracoesGanhos = hasPermission("super-admin")

  // TASK 1: Home separado - sempre visível, não colapsável
  const homeNavigation = [
    { name: "Home", href: "/", icon: LayoutDashboard },
  ]

  // Feed Social - sempre visível para todos, abaixo de Home
  const feedSocialNavigation = [
    { name: "Feed Social", href: "/comunidade", icon: Users },
  ]

  // TASK 2: Módulos do Colaborador - agrupados em categoria colapsável (sem Feed Social)
  const modulosColaborador = [
    { name: "Humor do Dia", href: "/humor", icon: Heart },
    { name: "Feedbacks", href: "/feedbacks", icon: MessageSquare },
    { name: "Pesquisas", href: "/pesquisas", icon: ClipboardList },
    { name: "Treinamentos", href: "/treinamentos", icon: GraduationCap },
    { name: "Eventos", href: "/eventos", icon: Calendar }, // TASK 1: Novo item
    { name: "Carreira e Seleção", href: "/carreira-selecao", icon: TrendingUp, comingSoon: true },
    { name: "Ranking", href: "/ranking", icon: Trophy },
    { name: "Recompensas", href: "/recompensas", icon: ShoppingBag },
  ]

  const profileNavigation = [{ name: "Meu Perfil", href: "/perfil", icon: UserCircle }]

  const adminNavigation = [
    { name: "Painel Analítico", href: "/analytics", icon: BarChart3 },
    { name: "Inteligência & Previsões", href: "/inteligencia", icon: TrendingUp },
    { name: "Painel Administrativo", href: "/admin", icon: Settings },
    ...(showGestoresPanel ? [{ name: "Gestão de Gestores", href: "/admin/gestores", icon: Shield }] : []),
    ...(showConfiguracoesGanhos
      ? [{ name: "Calibragem de Ganhos", href: "/configuracoes-ganhos", icon: Settings }]
      : []),
  ]

  const iconClass = isCollapsed ? "h-6 w-6 shrink-0" : "h-5 w-5 shrink-0"

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
        isCollapsed ? "w-20" : "w-72",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">Empresa</h1>
                <p className="text-xs text-muted-foreground">Powered by EngageAI</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div className="border-b border-sidebar-border p-6">
          <div className={cn("flex items-center", isCollapsed ? "flex-col" : "gap-3")}>
            <Avatar className={cn("border-2 border-primary", isCollapsed ? "h-12 w-12" : "h-14 w-14")}>
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.nome
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sidebar-foreground">{user.nome}</p>
                  {/* Gestores/admins — notificações internas (aprovações) */}
                  {hasPermission(["gestor", "super-admin"]) && <NotificationCenter />}
                  {/* Colaboradores — notificações do backend */}
                  {user?.role === "colaborador" && <CollaboratorNotificationBell />}
                </div>
                <div className="mt-1.5">
                  <UserRoleBadge role={user.role} size="sm" />
                </div>
                {GamificationGuard.shouldShowGamificationUI(user.role) && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Heart className="h-3.5 w-3.5 text-accent" />
                    <span className="text-xs font-medium text-accent-foreground">Nível {user.nivel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {!isCollapsed && GamificationGuard.shouldShowGamificationUI(user.role) && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  XP: {user.xp} / {user.xpProximo}
                </span>
                <span className="font-semibold text-primary">{Math.round((user.xp / user.xpProximo) * 100)}%</span>
              </div>
              <Progress value={(user.xp / user.xpProximo) * 100} className="h-2" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {/* TASK 1: Home - sempre visível, primeiro item, não colapsável */}
          {homeNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={iconClass} />
                {!isCollapsed && item.name}
              </Link>
            )
          })}

          {/* Feed Social - sempre visível para todos */}
          {feedSocialNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={iconClass} />
                {!isCollapsed && item.name}
              </Link>
            )
          })}

          {/* TASK 2 & 3: Categoria "Módulos do Colaborador" */}
          <div className="my-2">
            {/* TASK 3: Header da categoria - colapsável apenas para gestores/admins */}
            {!isCollapsed && (
              <div 
                className={cn(
                  "flex items-center justify-between px-3 py-2 mb-1",
                  isGestorOrAdmin ? "cursor-pointer hover:bg-sidebar-accent/50 rounded-lg" : ""
                )}
                onClick={() => {
                  // TASK 3: Apenas gestores e admins podem colapsar
                  if (isGestorOrAdmin) {
                    setIsModulosExpanded(!isModulosExpanded)
                  }
                }}
              >
                <p className="text-xs font-semibold text-muted-foreground">MÓDULOS DO COLABORADOR</p>
                {/* TASK 3: Ícone de expansão apenas para gestores/admins */}
                {isGestorOrAdmin && (
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      !isModulosExpanded && "-rotate-90"
                    )} 
                  />
                )}
              </div>
            )}

            {/* TASK 3: Módulos - sempre expandidos para colaboradores, colapsáveis para outros */}
            {(isModulosExpanded || !isGestorOrAdmin) && modulosColaborador.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed && "justify-center",
                    !isCollapsed && "ml-2" // Leve indentação quando expandido
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={iconClass} />
                  {!isCollapsed && (
                    <span className="flex items-center gap-2 flex-1">
                      {item.name}
                      {item.comingSoon && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                          Em breve
                        </Badge>
                      )}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Seção Administração - aparece ANTES de Configurações para Gestor/Admin */}
          {showAdminPanel && (
            <>
              <div className="my-4 border-t border-sidebar-border" />
              {!isCollapsed && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-semibold text-muted-foreground">ADMINISTRAÇÃO</p>
                </div>
              )}

              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                const showBadge = item.href === "/analytics" && feedbackPendingCount > 0
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isCollapsed && "justify-center",
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="relative">
                      <item.icon className={iconClass} />
                      {showBadge && isCollapsed && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-500" />
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="flex items-center gap-2 flex-1">
                        {item.name}
                        {showBadge && (
                          <Badge className="ml-auto bg-yellow-500 text-white text-[10px] px-1.5 h-4 min-w-4">
                            {feedbackPendingCount}
                          </Badge>
                        )}
                      </span>
                    )}
                  </Link>
                )
              })}
            </>
          )}

          {/* Seção Configurações - aparece por último para todos */}
          <div className="my-4 border-t border-sidebar-border" />
          {!isCollapsed && (
            <div className="px-3 pb-2">
              <p className="text-xs font-semibold text-muted-foreground">CONFIGURAÇÕES</p>
            </div>
          )}

          {profileNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={iconClass} />
                {!isCollapsed && item.name}
              </Link>
            )
          })}
        </nav>

        {/* Stars Badge - APENAS PARA COLABORADORES */}
        {!isCollapsed && GamificationGuard.shouldShowGamificationUI(user.role) && (
          <div className="border-t border-sidebar-border p-6">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Estrelas Acumuladas</p>
                <p className="text-2xl font-bold text-accent-foreground">⭐ {user.estrelas}</p>
              </div>
              <Trophy className="h-8 w-8 text-accent" />
            </div>
          </div>
        )}

        {/* Collapse Button & Logout */}
        <div className="border-t border-sidebar-border p-4">
          <div className={cn("flex gap-2", isCollapsed ? "flex-col" : "")}>
            <Button
              variant="outline"
              size={isCollapsed ? "icon" : "sm"}
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="clay-button bg-transparent"
              title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", isCollapsed ? "rotate-90" : "rotate-0")} />
              {!isCollapsed && "Recolher"}
            </Button>
            <Button
              variant="outline"
              size={isCollapsed ? "icon" : "sm"}
              className="clay-button bg-transparent text-red-600 hover:text-red-700"
              title="Sair da plataforma"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {!isCollapsed && "Sair"}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  return { isCollapsed, setIsCollapsed }
}
