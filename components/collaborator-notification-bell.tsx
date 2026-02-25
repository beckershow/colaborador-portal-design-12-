"use client"

import { useEffect, useState } from "react"
import { Bell, ClipboardList, BookOpen, Gift, MessageSquare, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { apiFetch } from "@/lib/api-client"
import { NotificationService, type CollabFeedNotification } from "@/lib/notification-service"
import { useAuth } from "@/lib/auth-context"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BackendNotification {
  id: string
  userId: string
  type:
    | "xp_gained"
    | "level_up"
    | "achievement"
    | "feedback_received"
    | "feedback_approved"
    | "survey_available"
    | "event_reminder"
    | "mission_complete"
    | "reward_redeemed"
    | "mention"
    | "system"
  title: string
  message: string
  data?: Record<string, unknown>
  status: "unread" | "read"
  createdAt: string
  readAt?: string
}

interface NotificationsResponse {
  data: BackendNotification[]
  meta: {
    total: number
    page: number
    limit: number
    unreadCount: number
  }
}

// Tipo unificado para exibição
type DisplayNotif =
  | { source: "backend"; notif: BackendNotification }
  | { source: "local"; notif: CollabFeedNotification }

function getDisplayDate(n: DisplayNotif): string {
  return n.source === "backend" ? n.notif.createdAt : n.notif.createdAt
}

function isUnread(n: DisplayNotif): boolean {
  return n.source === "backend" ? n.notif.status === "unread" : !n.notif.read
}

function BackendNotificationIcon({ type }: { type: BackendNotification["type"] }) {
  const cls = "h-4 w-4 shrink-0"
  switch (type) {
    case "survey_available":
      return <ClipboardList className={cls} />
    case "system":
      return <BookOpen className={cls} />
    case "reward_redeemed":
      return <Gift className={cls} />
    case "feedback_received":
    case "feedback_approved":
      return <MessageSquare className={cls} />
    default:
      return <Bell className={cls} />
  }
}

function LocalNotifIcon({ type }: { type: CollabFeedNotification["type"] }) {
  const cls = "h-4 w-4 shrink-0"
  return type === "post_approved" ? (
    <CheckCircle className={`${cls} text-green-500`} />
  ) : (
    <XCircle className={`${cls} text-red-500`} />
  )
}

export function CollaboratorNotificationBell() {
  const { user } = useAuth()
  const [backendNotifs, setBackendNotifs] = useState<BackendNotification[]>([])
  const [localNotifs, setLocalNotifs] = useState<CollabFeedNotification[]>([])
  const [backendUnread, setBackendUnread] = useState(0)
  const [open, setOpen] = useState(false)

  // Carregar notificações do backend
  useEffect(() => {
    apiFetch<NotificationsResponse>("/notifications?limit=20")
      .then((res) => {
        setBackendNotifs(res.data)
        setBackendUnread(res.meta.unreadCount)
      })
      .catch(() => {
        // Silently ignore — user may not be authenticated yet
      })
  }, [])

  // Carregar notificações locais (aprovação/rejeição de posts do feed)
  useEffect(() => {
    if (!user?.id) return
    const local = NotificationService.getCollabFeedNotifications(user.id)
    setLocalNotifs(local)
  }, [user?.id])

  // Recarregar notificações locais quando o popover abre
  useEffect(() => {
    if (open && user?.id) {
      setLocalNotifs(NotificationService.getCollabFeedNotifications(user.id))
    }
  }, [open, user?.id])

  const localUnread = localNotifs.filter((n) => !n.read).length
  const totalUnread = backendUnread + localUnread
  const badgeLabel = totalUnread > 9 ? "9+" : String(totalUnread)

  // Mesclar e ordenar por data (mais recentes primeiro)
  const allNotifs: DisplayNotif[] = [
    ...localNotifs.map((n) => ({ source: "local" as const, notif: n })),
    ...backendNotifs.map((n) => ({ source: "backend" as const, notif: n })),
  ].sort((a, b) => new Date(getDisplayDate(b)).getTime() - new Date(getDisplayDate(a)).getTime())

  const handleMarkBackendRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" })
      setBackendNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, status: "read" as const } : n)))
      setBackendUnread((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  const handleMarkLocalRead = (id: string) => {
    NotificationService.markCollabFeedNotificationRead(id)
    setLocalNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarkAllAsRead = async () => {
    // Backend
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" })
      setBackendNotifs((prev) => prev.map((n) => ({ ...n, status: "read" as const })))
      setBackendUnread(0)
    } catch {
      // ignore
    }

    // Local
    if (user?.id) {
      NotificationService.markAllCollabFeedNotificationsRead(user.id)
      setLocalNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  const handleNotifClick = (item: DisplayNotif) => {
    if (!isUnread(item)) return
    if (item.source === "backend") {
      handleMarkBackendRead(item.notif.id)
    } else {
      handleMarkLocalRead(item.notif.id)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {totalUnread > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] text-white">
              {badgeLabel}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notificações</h3>
          {totalUnread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {allNotifs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 opacity-40" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            allNotifs.map((item) => {
              const unread = isUnread(item)
              const date = getDisplayDate(item)
              const key = `${item.source}-${item.notif.id}`

              return (
                <button
                  key={key}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                    unread ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleNotifClick(item)}
                >
                  <div className={`mt-0.5 ${unread && item.source === "backend" ? "text-primary" : "text-muted-foreground"}`}>
                    {item.source === "backend" ? (
                      <BackendNotificationIcon type={item.notif.type} />
                    ) : (
                      <LocalNotifIcon type={item.notif.type} />
                    )}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-xs font-medium leading-tight">
                      {item.source === "local" ? item.notif.title : item.notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {item.source === "local" ? item.notif.message : item.notif.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(date), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
