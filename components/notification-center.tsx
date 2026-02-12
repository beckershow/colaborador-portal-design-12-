"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationService, type Notification } from "@/lib/notification-service"
import { useAuth } from "@/lib/auth-context"
import { Bell, User, Gift, CheckCircle, X, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function NotificationCenter() {
  const { user, hasPermission } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const canViewNotifications = hasPermission(["gestor", "super-admin"])

  useEffect(() => {
    if (!canViewNotifications) return

    const unsubscribe = NotificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications)
      setUnreadCount(NotificationService.getUnreadCount())
    })

    return unsubscribe
  }, [canViewNotifications])

  if (!canViewNotifications) return null

  const handleMarkAsRead = (id: string) => {
    NotificationService.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    NotificationService.markAllAsRead()
  }

  const handleClearAll = () => {
    NotificationService.clearAll()
    setIsOpen(false)
  }

  const handleApprove = (notification: Notification) => {
    if (notification.type === "profile_change") {
      const changes = notification.data.changes
      const userId = notification.userId

      // Aplicar mudanças no localStorage (backend simulado)
      const usersData = localStorage.getItem("engageai-users-data") || "{}"
      const users = JSON.parse(usersData)

      if (!users[userId]) {
        users[userId] = {}
      }

      // Aplicar cada mudança
      Object.keys(changes).forEach((field) => {
        users[userId][field] = changes[field]
      })

      localStorage.setItem("engageai-users-data", JSON.stringify(users))

      window.dispatchEvent(
        new CustomEvent("user-data-updated", {
          detail: { userId, changes },
        }),
      )

      // Notificar o colaborador da aprovação
      NotificationService.notifyPostApproved(userId, notification.userName)

      toast({
        title: "Solicitação Aprovada",
        description: `As alterações de ${notification.userName} foram aplicadas com sucesso.`,
      })
    } else if (notification.type === "reward_request") {
      toast({
        title: "Resgate Aprovado",
        description: `O resgate de "${notification.data.reward.name}" foi aprovado para ${notification.userName}.`,
      })
    } else if (notification.type === "post_pending_approval") {
      const postId = notification.data.post.id
      if (postId) {
        const postsData = localStorage.getItem("engageai-posts") || "[]"
        const posts = JSON.parse(postsData)
        const post = posts.find((p: any) => p.id === postId)
        if (post) {
          post.status = "approved"
          post.approvedAt = new Date().toISOString()
          localStorage.setItem("engageai-posts", JSON.stringify(posts))

          window.dispatchEvent(new Event("posts-updated"))
        }
      }

      NotificationService.notifyPostApproved(notification.userId, notification.userName)

      toast({
        title: "Publicação Aprovada",
        description: `A publicação de ${notification.userName} está visível no feed.`,
      })
    }

    NotificationService.removeNotification(notification.id)
  }

  const handleReject = (notification: Notification) => {
    if (notification.type === "profile_change") {
      NotificationService.notifyPostRejected(
        notification.userId,
        notification.userName,
        "Solicitação de alteração de dados recusada pelo gestor",
      )

      toast({
        title: "Solicitação Recusada",
        description: `As alterações solicitadas por ${notification.userName} foram recusadas e o colaborador foi notificado.`,
        variant: "destructive",
      })
    } else if (notification.type === "post_pending_approval") {
      const postId = notification.data.post.id
      if (postId) {
        const postsData = localStorage.getItem("engageai-posts") || "[]"
        const posts = JSON.parse(postsData)
        const updatedPosts = posts.filter((p: any) => p.id !== postId)
        localStorage.setItem("engageai-posts", JSON.stringify(updatedPosts))
      }

      NotificationService.notifyPostRejected(
        notification.userId,
        notification.userName,
        "Publicação recusada pelo gestor",
      )

      toast({
        title: "Publicação Recusada",
        description: `A publicação de ${notification.userName} foi recusada e o colaborador foi notificado.`,
        variant: "destructive",
      })
    }

    // Remover a notificação após recusar
    NotificationService.removeNotification(notification.id)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "profile_change":
        return <User className="h-5 w-5 text-primary" />
      case "reward_request":
        return <Gift className="h-5 w-5 text-accent" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getNotificationTitle = (notification: Notification) => {
    switch (notification.type) {
      case "profile_change":
        return "Solicitação de Alteração de Dados"
      case "reward_request":
        return "Solicitação de Resgate"
      case "post_pending_approval":
        return "Publicação Aguardando Aprovação"
      default:
        return "Notificação"
    }
  }

  const getNotificationDescription = (notification: Notification) => {
    switch (notification.type) {
      case "profile_change":
        const changes = notification.data.changes
        const fields = Object.keys(changes).join(", ")
        return `${notification.userName} solicitou alteração em: ${fields}`
      case "reward_request":
        return `${notification.userName} solicitou resgate de "${notification.data.reward.name}" (${notification.data.reward.cost} estrelas)`
      case "post_pending_approval":
        return `${notification.userName} criou uma nova publicação aguardando sua aprovação`
      default:
        return ""
    }
  }

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const notifTime = new Date(timestamp)
    const diffMs = now.getTime() - notifTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `Há ${diffMins}min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Há ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Há ${diffDays}d`
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setIsOpen(!isOpen)} title="Notificações">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)} />
          <div className="fixed right-4 top-16 z-50 w-[400px] max-h-[600px] animate-in slide-in-from-top-5">
            <Card className="clay-card border shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Notificações</CardTitle>
                    <CardDescription>
                      {notifications.length === 0
                        ? "Nenhuma notificação"
                        : `${notifications.length} notificação${notifications.length > 1 ? "ões" : ""}`}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {notifications.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="flex-1 clay-button bg-transparent"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Marcar todas como lidas
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      className="flex-1 clay-button bg-transparent"
                    >
                      Limpar todas
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="max-h-[450px] overflow-y-auto space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-sm text-muted-foreground">Nenhuma notificação no momento</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md ${
                        notif.read ? "bg-card border-border" : "bg-primary/5 border-primary/30"
                      }`}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-foreground">{getNotificationTitle(notif)}</h4>
                            {!notif.read && (
                              <Badge variant="default" className="flex-shrink-0">
                                Novo
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{getNotificationDescription(notif)}</p>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(notif.timestamp)}
                          </div>

                          {notif.type === "profile_change" && (
                            <div className="mt-3 space-y-2 p-3 rounded-lg bg-muted/50">
                              <p className="text-xs font-semibold text-foreground">Campos alterados:</p>
                              {Object.entries(notif.data.changes).map(([field, value]) => (
                                <div key={field} className="text-xs">
                                  <span className="font-medium text-muted-foreground">{field}:</span>{" "}
                                  <span className="text-foreground">{value as string}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {notif.type === "post_pending_approval" && notif.data.post && (
                            <div className="mt-3 p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-foreground line-clamp-3">{notif.data.post.content}</p>
                              {notif.data.post.hasImage && (
                                <Badge variant="secondary" className="mt-2">
                                  Contém imagem
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              className="clay-button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApprove(notif)
                              }}
                            >
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="clay-button bg-transparent"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReject(notif)
                              }}
                            >
                              Recusar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
