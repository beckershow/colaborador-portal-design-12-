"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import {
  Bell, User, Gift, CheckCircle, X, Clock,
  Heart, MessageCircle, ThumbsUp, AlertCircle, ShoppingBag,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type ApiNotification,
} from "@/lib/notifications-api"
import { setFeedPostStatus } from "@/lib/feed-api"

export function NotificationCenter() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<ApiNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [rejectingNotif, setRejectingNotif] = useState<ApiNotification | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  // Tracking locally read notifications to prevent race condition with polling
  const [locallyRead, setLocallyRead] = useState<Set<string>>(new Set())

  // ─── Carregar notificações ───────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetchNotifications(1, 50)
      // super_admin não tem time — filtra post_pending_approval
      const filtered =
        user.role === "super-admin"
          ? res.data.filter(n => n.type !== "post_pending_approval")
          : res.data

      // Apply locally read state to incoming server data
      const merged = filtered.map(n => locallyRead.has(n.id) ? { ...n, status: "read" as const } : n)

      setNotifications(merged)
      setUnreadCount(merged.filter(n => n.status === "unread").length)
    } catch {
      // sem conexão — silencioso
    }
  }, [user, locallyRead])

  // Carrega na abertura do painel e a cada 15s quando aberto
  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const interval = setInterval(loadNotifications, 15_000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // ─── Ações ───────────────────────────────────────────────────────────────────

  const handleMarkRead = async (id: string) => {
    setLocallyRead(prev => new Set(prev).add(id))
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, status: "read" as const, readAt: new Date().toISOString() } : n),
    )
    setUnreadCount(c => Math.max(0, c - 1))
    await markNotificationRead(id).catch(() => { })
  }

  const handleMarkAllRead = async () => {
    const newLocallyRead = new Set(locallyRead)
    notifications.forEach(n => newLocallyRead.add(n.id))
    setLocallyRead(newLocallyRead)

    setNotifications(prev => prev.map(n => ({ ...n, status: "read" as const })))
    setUnreadCount(0)
    await markAllNotificationsRead().catch(() => { })
  }

  // ─── Aprovação de posts (post_pending_approval) ───────────────────────────────

  const handleApprovePost = async (notif: ApiNotification) => {
    const postId = (notif.data?.postId as string) ?? ""
    if (!postId) return
    setLoading(true)
    try {
      await setFeedPostStatus(postId, "approve")
      await markNotificationRead(notif.id)
      setNotifications(prev => prev.filter(n => n.id !== notif.id))
      setUnreadCount(c => Math.max(0, c - 1))
      // Sinaliza à página de comunidade para atualizar o feed
      window.dispatchEvent(new Event("engageai:feed-updated"))
      toast({ title: "Publicação aprovada", description: "O colaborador foi notificado." })
    } catch (err) {
      toast({
        title: "Erro ao aprovar",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRejectPost = (notif: ApiNotification) => {
    setRejectingNotif(notif)
    setRejectReason("")
  }

  const handleConfirmRejectPost = async () => {
    if (!rejectingNotif) return
    const notif = rejectingNotif
    const postId = (notif.data?.postId as string) ?? ""
    if (!postId) return
    setRejectingNotif(null)
    setLoading(true)
    try {
      await setFeedPostStatus(postId, "reject", rejectReason.trim() || undefined)
      await markNotificationRead(notif.id)
      setNotifications(prev => prev.filter(n => n.id !== notif.id))
      setUnreadCount(c => Math.max(0, c - 1))
      window.dispatchEvent(new Event("engageai:feed-updated"))
      toast({ title: "Publicação recusada", description: "O colaborador foi notificado." })
    } catch (err) {
      toast({
        title: "Erro ao recusar",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRejectReason("")
    }
  }

  // ─── Navegação inteligente ────────────────────────────────────────────────────

  const navigateToPost = (postId: string, openComments = false) => {
    setIsOpen(false)
    const isSamePage = typeof window !== "undefined" && window.location.pathname === "/comunidade"
    if (isSamePage) {
      window.dispatchEvent(
        new CustomEvent("engageai:highlight-post", { detail: { postId, openComments } }),
      )
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("engageai-highlight-post", JSON.stringify({ postId, openComments }))
      }
      router.push("/comunidade")
    }
  }

  const handleNotificationClick = (notif: ApiNotification) => {
    handleMarkRead(notif.id)

    const postId = notif.data?.postId as string | undefined

    switch (notif.type) {
      case "post_liked":
      case "post_approved":
        if (postId) navigateToPost(postId)
        else { setIsOpen(false); router.push("/comunidade") }
        break
      case "post_commented":
        if (postId) navigateToPost(postId, true)
        else { setIsOpen(false); router.push("/comunidade") }
        break
      case "post_rejected":
        // Leva direto para /comunidade onde a seção de rejeitados aparece no topo
        setIsOpen(false)
        router.push("/comunidade")
        break
      case "post_pending_approval":
        setIsOpen(false)
        router.push("/comunidade")
        break
      case "reward_redeemed":
        setIsOpen(false)
        router.push("/recompensas")
        break
      case "store_item_created":
      case "store_item_activated":
        setIsOpen(false)
        router.push("/admin?tab=lojinha&subtab=ativos")
        break
      case "store_item_available_to_manager":
      case "store_item_sent_to_manager":
      case "store_manager_item_activated":
      case "store_manager_item_deactivated":
        setIsOpen(false)
        router.push("/admin?tab=lojinha&subtab=estoque")
        break
      case "store_reward_requested":
      case "store_reward_request_reviewed":
        setIsOpen(false)
        router.push("/admin?tab=lojinha&subtab=solicitacoes")
        break
      case "store_item_available_to_team":
        setIsOpen(false)
        router.push("/recompensas")
        break
      case "feedback_received":
      case "feedback_approved":
      case "feedback_rejected":
      case "feedback_request_declined":
      case "feedback_request_fulfilled":
        setIsOpen(false)
        router.push("/feedbacks")
        break
      case "feedback_request_received":
        setIsOpen(false)
        router.push("/feedbacks?tab=solicitar")
        break
      case "feedback_pending_approval":
        setIsOpen(false)
        router.push("/analytics?tab=feedbacks")
        break
      case "survey_available":
        setIsOpen(false)
        router.push("/pesquisas")
        break
      default:
        // informativas: apenas fechar
        setIsOpen(false)
    }
  }

  // ─── Helpers de display ───────────────────────────────────────────────────────

  const getIcon = (type: ApiNotification["type"]) => {
    switch (type) {
      case "post_pending_approval": return <Clock className="h-5 w-5 text-yellow-500" />
      case "post_approved": return <CheckCircle className="h-5 w-5 text-green-500" />
      case "post_rejected": return <X className="h-5 w-5 text-destructive" />
      case "post_liked": return <Heart className="h-5 w-5 text-rose-500" />
      case "post_commented": return <MessageCircle className="h-5 w-5 text-primary" />
      case "xp_gained": return <ThumbsUp className="h-5 w-5 text-primary" />
      case "level_up": return <AlertCircle className="h-5 w-5 text-accent" />
      case "reward_redeemed": return <Gift className="h-5 w-5 text-accent" />
      case "feedback_received":
      case "feedback_approved":
      case "feedback_request_received":
      case "feedback_request_fulfilled": return <MessageCircle className="h-5 w-5 text-primary" />
      case "feedback_rejected":
      case "feedback_request_declined": return <X className="h-5 w-5 text-destructive" />
      case "feedback_pending_approval": return <Clock className="h-5 w-5 text-yellow-500" />
      case "store_item_created":
      case "store_item_activated":
      case "store_item_available_to_manager":
      case "store_item_available_to_team":
      case "store_item_sent_to_manager":
      case "store_manager_item_activated":
      case "store_manager_item_deactivated":
      case "store_reward_requested":
      case "store_reward_request_reviewed": return <ShoppingBag className="h-5 w-5 text-primary" />
      default: return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const formatTime = (iso: string) => {
    const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `Há ${diffMins}min`
    const h = Math.floor(diffMins / 60)
    if (h < 24) return `Há ${h}h`
    return `Há ${Math.floor(h / 24)}d`
  }

  const isActionRequired = (n: ApiNotification) => n.type === "post_pending_approval"

  if (!user) return null

  return (
    <>
      {/* Dialog: motivo de recusa */}
      <Dialog open={rejectingNotif !== null} onOpenChange={open => { if (!open) { setRejectingNotif(null); setRejectReason("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar publicação</DialogTitle>
            <DialogDescription>
              Informe opcionalmente o motivo da recusa. O colaborador será notificado e poderá ver o motivo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da recusa (opcional)..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => { setRejectingNotif(null); setRejectReason("") }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmRejectPost}>
              Confirmar recusa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão do sino */}
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsOpen(false)} />

          {/* Painel */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="mt-4 clay-button bg-transparent"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Marcar todas como lidas
                  </Button>
                )}
              </CardHeader>

              <CardContent className="max-h-[450px] overflow-y-auto space-y-3">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <p className="mt-4 text-sm text-muted-foreground">Nenhuma notificação no momento</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`rounded-lg border p-4 transition-all ${isActionRequired(notif) ? "cursor-default" : "cursor-pointer hover:shadow-md"
                        } ${notif.status === "unread"
                          ? "bg-primary/5 border-primary/30"
                          : "bg-card border-border"
                        }`}
                      onClick={() => !isActionRequired(notif) && handleNotificationClick(notif)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">{getIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-foreground">{notif.title}</h4>
                            {notif.status === "unread" && (
                              <Badge variant="default" className="flex-shrink-0">Novo</Badge>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>

                          {/* Preview do conteúdo para post_pending_approval */}
                          {notif.type === "post_pending_approval" && notif.data?.content != null && (
                            <p className="mt-1 text-xs text-foreground/70 line-clamp-2 italic">
                              &ldquo;{String(notif.data.content)}&rdquo;
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(notif.createdAt)}
                          </div>

                          {/* Ações para aprovação de posts */}
                          {isActionRequired(notif) && (
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="clay-button"
                                disabled={loading}
                                onClick={e => { e.stopPropagation(); handleApprovePost(notif) }}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="clay-button bg-transparent"
                                disabled={loading}
                                onClick={e => { e.stopPropagation(); handleRejectPost(notif) }}
                              >
                                Recusar
                              </Button>
                            </div>
                          )}
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
