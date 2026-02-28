"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Lock,
  Calendar,
  Loader2,
  RefreshCw,
  ThumbsUp,
  Heart,
  Star,
  Award,
  TrendingUp,
  MessageSquare,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getPendingFeedbacks,
  getTeamReviewedFeedbacks,
  approveFeedback,
  rejectFeedback,
  type Feedback,
  type FeedbackType,
  FEEDBACK_TYPE_LABELS,
} from "@/lib/feedback-api"
import { getImageUrl } from "@/lib/uploads-api"

// ─── Mapa de tipo → ícone/cor ─────────────────────────────────────────────────

const TYPE_META: Record<FeedbackType, { icon: React.ElementType; color: string; bg: string }> = {
  reconhecimento:     { icon: ThumbsUp,    color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  agradecimento:      { icon: Heart,       color: "text-rose-500",   bg: "bg-rose-500/10 border-rose-500/30" },
  sugestao:           { icon: Star,        color: "text-blue-500",   bg: "bg-blue-500/10 border-blue-500/30" },
  desenvolvimento:    { icon: Award,       color: "text-green-500",  bg: "bg-green-500/10 border-green-500/30" },
  critica_construtiva: { icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
}

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface FeedbackApprovalPanelProps {
  onPendingCountChange?: (count: number) => void
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function FeedbackApprovalPanel({ onPendingCountChange }: FeedbackApprovalPanelProps = {}) {
  const { toast } = useToast()

  const [pending, setPending]               = useState<Feedback[]>([])
  const [reviewed, setReviewed]             = useState<Feedback[]>([])
  const [loadingPending, setLoadingPending] = useState(true)
  const [loadingReviewed, setLoadingReviewed] = useState(false)
  const [isActing, setIsActing]             = useState(false)

  // Rejection dialog
  const [rejectingFb, setRejectingFb]       = useState<Feedback | null>(null)
  const [rejectNote, setRejectNote]         = useState("")

  // ── Carregamento ──────────────────────────────────────────────────────────

  const loadPending = useCallback(async () => {
    setLoadingPending(true)
    try {
      const res = await getPendingFeedbacks(1, 100)
      setPending(res.data)
      onPendingCountChange?.(res.data.length)
    } catch {
      toast({ title: "Erro ao carregar pendências", variant: "destructive" })
    } finally {
      setLoadingPending(false)
    }
  }, [onPendingCountChange, toast])

  const loadReviewed = useCallback(async () => {
    setLoadingReviewed(true)
    try {
      const res = await getTeamReviewedFeedbacks(1, 50)
      setReviewed(res.data)
    } catch { /* silencioso */ } finally {
      setLoadingReviewed(false)
    }
  }, [])

  useEffect(() => {
    loadPending()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Aprovar ───────────────────────────────────────────────────────────────

  const handleApprove = async (feedbackId: string) => {
    setIsActing(true)
    try {
      await approveFeedback(feedbackId)
      const updated = pending.filter(f => f.id !== feedbackId)
      setPending(updated)
      onPendingCountChange?.(updated.length)
      toast({ title: "Feedback aprovado ✅", description: "Remetente e destinatário foram notificados." })
    } catch (err) {
      toast({ title: "Erro ao aprovar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsActing(false)
    }
  }

  // ── Recusar ───────────────────────────────────────────────────────────────

  const handleReject = async () => {
    if (!rejectingFb) return
    if (!rejectNote.trim()) {
      toast({ title: "Informe o motivo da recusa", variant: "destructive" })
      return
    }
    setIsActing(true)
    try {
      await rejectFeedback(rejectingFb.id, rejectNote.trim())
      const updated = pending.filter(f => f.id !== rejectingFb.id)
      setPending(updated)
      onPendingCountChange?.(updated.length)
      setRejectingFb(null)
      setRejectNote("")
      toast({ title: "Feedback recusado", description: "O remetente foi notificado." })
    } catch (err) {
      toast({ title: "Erro ao recusar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsActing(false)
    }
  }

  // ── Card de feedback ──────────────────────────────────────────────────────

  const FeedbackCard = ({ feedback, showActions }: { feedback: Feedback; showActions: boolean }) => {
    const meta = TYPE_META[feedback.type] ?? { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10 border-primary/20" }
    const TypeIcon = meta.icon

    return (
      <Card className="clay-card border-0">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                {feedback.fromUser?.avatar && (
                  <AvatarImage src={getImageUrl(feedback.fromUser.avatar) ?? undefined} />
                )}
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {feedback.fromUser ? initials(feedback.fromUser.nome) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{feedback.fromUser?.nome ?? "—"}</span>
                  <span className="text-muted-foreground text-xs">→</span>
                  <span className="font-semibold text-sm text-primary">{feedback.toUser?.nome ?? "—"}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(feedback.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge variant="outline" className={`text-[10px] px-1.5 border ${meta.bg} ${meta.color}`}>
                <TypeIcon className="h-2.5 w-2.5 mr-1" />
                {FEEDBACK_TYPE_LABELS[feedback.type]}
              </Badge>
              {feedback.isPublic ? (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1 text-[10px]">
                  <Globe className="h-3 w-3" />Público
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20 gap-1 text-[10px]">
                  <Lock className="h-3 w-3" />Privado
                </Badge>
              )}
              {!showActions && (
                <Badge
                  variant="outline"
                  className={feedback.status === "aprovado"
                    ? "bg-green-500/10 text-green-600 border-green-500/20 text-[10px]"
                    : "bg-red-500/10 text-red-600 border-red-500/20 text-[10px]"}
                >
                  {feedback.status === "aprovado" ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                  {feedback.status === "aprovado" ? "Aprovado" : "Recusado"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-sm text-foreground">{feedback.content}</p>
          </div>

          {feedback.reviewNote && !showActions && (
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground font-medium mb-0.5">Motivo da recusa:</p>
              <p className="text-xs text-muted-foreground italic">{feedback.reviewNote}</p>
            </div>
          )}

          {feedback.isPublic && showActions && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
              <p className="text-xs text-blue-600">
                <Globe className="inline h-3 w-3 mr-1" />
                Este feedback será compartilhado no feed social após aprovação.
              </p>
            </div>
          )}

          {showActions && (
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={() => handleApprove(feedback.id)}
                disabled={isActing}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aprovar
              </Button>
              <Button
                onClick={() => { setRejectingFb(feedback); setRejectNote("") }}
                disabled={isActing}
                variant="outline"
                className="flex-1 bg-transparent border-red-500/30 text-red-600 hover:bg-red-500/10"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Recusar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-6">
        <h2 className="text-2xl font-bold text-foreground">Aprovação de Feedbacks</h2>
        <p className="mt-2 text-muted-foreground">
          Gerencie feedbacks pendentes e visualize o histórico de revisões da sua equipe.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes
            {pending.length > 0 && (
              <Badge className="ml-1 bg-yellow-500 text-white text-[10px] px-1.5 h-4 min-w-4">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="reviewed"
            className="gap-2"
            onClick={() => { if (reviewed.length === 0) loadReviewed() }}
          >
            <CheckCircle2 className="h-4 w-4" />
            Histórico ({reviewed.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Pendentes ── */}
        <TabsContent value="pending" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={loadPending} disabled={loadingPending} className="h-7 text-xs gap-1">
              <RefreshCw className={`h-3 w-3 ${loadingPending ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {loadingPending ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pending.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 opacity-60" />
                <p className="mt-4 text-center text-muted-foreground">
                  Nenhum feedback pendente de aprovação.
                </p>
              </CardContent>
            </Card>
          ) : (
            pending.map(fb => <FeedbackCard key={fb.id} feedback={fb} showActions={true} />)
          )}
        </TabsContent>

        {/* ── Histórico ── */}
        <TabsContent value="reviewed" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={loadReviewed} disabled={loadingReviewed} className="h-7 text-xs gap-1">
              <RefreshCw className={`h-3 w-3 ${loadingReviewed ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {loadingReviewed ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reviewed.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground opacity-50" />
                <p className="mt-4 text-center text-muted-foreground">
                  Nenhum feedback revisado ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            reviewed.map(fb => <FeedbackCard key={fb.id} feedback={fb} showActions={false} />)
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Recusar Feedback ── */}
      <Dialog
        open={rejectingFb !== null}
        onOpenChange={open => { if (!open) { setRejectingFb(null); setRejectNote("") } }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Recusar Feedback</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. O remetente será notificado e poderá editar e reenviar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {rejectingFb && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground italic line-clamp-3">
                "{rejectingFb.content}"
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="reject-note">
                Motivo da recusa <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-note"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Ex: O conteúdo não está alinhado com as políticas de feedback da empresa..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectingFb(null); setRejectNote("") }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isActing || !rejectNote.trim()}
              onClick={handleReject}
            >
              {isActing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
