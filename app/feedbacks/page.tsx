"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  MessageSquare,
  Send,
  UserPlus,
  Heart,
  Star,
  ThumbsUp,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Ban,
  Sparkles,
  Search,
  X,
  TrendingUp,
  Inbox,
  Eye,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { getImageUrl } from "@/lib/uploads-api"
import {
  type Feedback,
  type FeedbackRequest,
  type FeedbackStats,
  type SuggestionUser,
  type FeedbackType,
  FEEDBACK_TYPE_LABELS,
  getFeedbackStats,
  getFeedbackSuggestions,
  getSentFeedbacks,
  getReceivedFeedbacks,
  getSentRequests,
  getReceivedRequests,
  sendFeedback,
  markFeedbackViewed,
  createFeedbackRequest,
  declineFeedbackRequest,
  getFeedbackSuggestion,
} from "@/lib/feedback-api"

// ─── Tipos do feedback ─────────────────────────────────────────────────────────

const FEEDBACK_TYPES: {
  value: FeedbackType
  label: string
  icon: React.ElementType
  color: string
  bg: string
}[] = [
    { value: "reconhecimento", label: "Reconhecimento", icon: ThumbsUp, color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
    { value: "agradecimento", label: "Agradecimento", icon: Heart, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30" },
    { value: "sugestao", label: "Sugestão", icon: Star, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
    { value: "desenvolvimento", label: "Desenvolvimento", icon: Award, color: "text-green-500", bg: "bg-green-500/10 border-green-500/30" },
    { value: "critica_construtiva", label: "Melhoria Construtiva", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
  ]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "Agora"
  if (m < 60) return `Há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Há ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `Há ${d}d`
  return new Date(iso).toLocaleDateString("pt-BR")
}

function StatusBadge({ status }: { status: Feedback["status"] }) {
  if (status === "aprovado") return <Badge className="bg-green-500/15 text-green-700 border-green-500/20"><CheckCircle2 className="mr-1 h-3 w-3" />Entregue</Badge>
  if (status === "rejeitado") return <Badge className="bg-destructive/15 text-destructive border-destructive/20"><X className="mr-1 h-3 w-3" />Não aprovado</Badge>
  return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Em análise</Badge>
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function FeedbacksPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("enviar")

  // ─── Dados
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [received, setReceived] = useState<Feedback[]>([])
  const [sent, setSent] = useState<Feedback[]>([])
  const [sentRequests, setSentRequests] = useState<FeedbackRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FeedbackRequest[]>([])
  const [suggestions, setSuggestions] = useState<SuggestionUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ─── Formulário de envio
  const [selectedUser, setSelectedUser] = useState<SuggestionUser | null>(null)
  const [recipientSearch, setRecipientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<SuggestionUser[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedType, setSelectedType] = useState<FeedbackType | "">("")
  const [message, setMessage] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [replyToRequestId, setReplyToRequestId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ─── Formulário de solicitação
  const [reqUser, setReqUser] = useState<SuggestionUser | null>(null)
  const [reqSearch, setReqSearch] = useState("")
  const [reqSearchResults, setReqSearchResults] = useState<SuggestionUser[]>([])
  const [showReqDropdown, setShowReqDropdown] = useState(false)
  const [reqTopic, setReqTopic] = useState("")
  const [reqMessage, setReqMessage] = useState("")
  const [isSubmittingReq, setIsSubmittingReq] = useState(false)

  // ─── AI Assistant
  const [showAI, setShowAI] = useState(false)
  const [aiIntention, setAiIntention] = useState("")
  const [aiField, setAiField] = useState<"feedback" | "request">("feedback")
  const [isGenerating, setIsGenerating] = useState(false)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Carregar dados ───────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [statsRes, receivedRes, sentRes, sentReqRes, receivedReqRes, suggestRes] = await Promise.all([
        getFeedbackStats(),
        getReceivedFeedbacks(),
        getSentFeedbacks(),
        getSentRequests(),
        getReceivedRequests(),
        getFeedbackSuggestions(),
      ])
      setStats(statsRes.data)
      setReceived(receivedRes.data)
      setSent(sentRes.data)
      setSentRequests(sentReqRes.data)
      setReceivedRequests(receivedReqRes.data)
      setSuggestions(suggestRes.data)
    } catch (err) {
      toast({ title: "Erro ao carregar feedbacks", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  useEffect(() => { loadAll() }, [loadAll])

  // ─── Navegação por URL (?tab=solicitar) ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab) setActiveTab(tab)
  }, [])

  // ─── Busca de usuários com debounce ──────────────────────────────────────────

  const handleRecipientSearch = (value: string) => {
    setRecipientSearch(value)
    setSelectedUser(null)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (value.length < 2) { setSearchResults([]); setShowDropdown(false); return }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await getFeedbackSuggestions(value)
        setSearchResults(res.data)
        setShowDropdown(true)
      } catch { /* silent */ }
    }, 300)
  }

  const handleReqSearch = (value: string) => {
    setReqSearch(value)
    setReqUser(null)
    if (reqSearchTimerRef.current) clearTimeout(reqSearchTimerRef.current)
    if (value.length < 2) { setReqSearchResults([]); setShowReqDropdown(false); return }
    reqSearchTimerRef.current = setTimeout(async () => {
      try {
        const res = await getFeedbackSuggestions(value)
        setReqSearchResults(res.data)
        setShowReqDropdown(true)
      } catch { /* silent */ }
    }, 300)
  }

  // ─── Enviar feedback ──────────────────────────────────────────────────────────

  const handleSendFeedback = async () => {
    if (!selectedUser || !selectedType || message.trim().length < 10) {
      toast({ title: "Preencha todos os campos", description: "Destinatário, tipo e mensagem (mín. 10 caracteres) são obrigatórios.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)
    try {
      const res = await sendFeedback({
        toUserId: selectedUser.id,
        type: selectedType as FeedbackType,
        content: message.trim(),
        isPublic,
        requestId: replyToRequestId ?? undefined,
      })
      toast({
        title: "Feedback enviado! 🎉",
        description: stats?.requireApproval
          ? "Seu feedback está em análise e será entregue após aprovação."
          : `Feedback entregue para ${selectedUser.nome}.`,
      })
      setSelectedUser(null)
      setRecipientSearch("")
      setSelectedType("")
      setMessage("")
      setIsPublic(false)
      setReplyToRequestId(null)
      await loadAll()
    } catch (err) {
      toast({ title: "Erro ao enviar feedback", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Marcar como lido ─────────────────────────────────────────────────────────

  const handleMarkViewed = async (id: string) => {
    try {
      await markFeedbackViewed(id)
      setReceived(prev => prev.map(f => f.id === id ? { ...f, viewedAt: new Date().toISOString() } : f))
      setStats(prev => prev ? { ...prev, unreadReceived: Math.max(0, prev.unreadReceived - 1) } : prev)
    } catch { /* silent */ }
  }

  // ─── Solicitar feedback ───────────────────────────────────────────────────────

  const handleSendRequest = async () => {
    if (!reqUser) {
      toast({ title: "Selecione um colega", variant: "destructive" })
      return
    }
    setIsSubmittingReq(true)
    try {
      await createFeedbackRequest({
        toUserId: reqUser.id,
        topic: reqTopic.trim() || undefined,
        message: reqMessage.trim() || undefined,
      })
      toast({ title: "Solicitação enviada! 📬", description: `${reqUser.nome} será notificado.` })
      setReqUser(null)
      setReqSearch("")
      setReqTopic("")
      setReqMessage("")
      await loadAll()
    } catch (err) {
      toast({ title: "Erro ao enviar solicitação", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsSubmittingReq(false)
    }
  }

  const handleDeclineRequest = async (id: string) => {
    try {
      await declineFeedbackRequest(id)
      setReceivedRequests(prev => prev.map(r => r.id === id ? { ...r, status: "declined" } : r))
      toast({ title: "Solicitação recusada" })
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
    }
  }

  const handleReplyToRequest = (req: FeedbackRequest) => {
    setReplyToRequestId(req.id)
    setSelectedUser(req.fromUser as SuggestionUser)
    setRecipientSearch(req.fromUser.nome)
    setActiveTab("enviar")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ─── AI Assistant ─────────────────────────────────────────────────────────────

  const handleGenerateAI = async () => {
    if (!aiIntention || aiIntention.length < 3) return
    setIsGenerating(true)
    try {
      const { suggestion } = await getFeedbackSuggestion(aiIntention, aiField)
      if (aiField === "feedback") setMessage(suggestion)
      else setReqMessage(suggestion)
      setShowAI(false)
      setAiIntention("")
      toast({ title: "Texto gerado pela IA ✨", description: "Você pode editar antes de enviar." })
    } catch (err) {
      toast({ title: "Erro na IA", description: (err as Error).message, variant: "destructive" })
    } finally {
      setIsGenerating(false)
    }
  }

  if (!user) return null

  const canSendToday = stats ? stats.sentToday < stats.dailyLimit : true
  const canSendWeek = stats ? stats.sentThisWeek < stats.weeklyLimit : true
  const isLimitReached = !canSendToday || !canSendWeek

  const pendingReceivedRequests = receivedRequests.filter(r => r.status === "pending")
  const totalUnread = (stats?.unreadReceived ?? 0) + pendingReceivedRequests.length

  return (
    <>
      {/* Dialog: Assistente de IA */}
      <Dialog open={showAI} onOpenChange={setShowAI}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Assistente de IA para Feedbacks
            </DialogTitle>
            <DialogDescription>
              Selecione a intenção da sua mensagem e a IA criará um texto profissional e respeitoso para você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Label>O que você deseja falar?</Label>
            <Textarea
              placeholder="Ex: Quero elogiar a proatividade na reunião de hoje ou Pedir feedback sobre o relatório X..."
              value={aiIntention}
              onChange={(e) => setAiIntention(e.target.value)}
              rows={4}
              className="clay-button resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Descreva sua intenção de forma simples e a IA criará uma mensagem profissional para você.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAI(false)}>Cancelar</Button>
            <Button onClick={handleGenerateAI} disabled={!aiIntention || isGenerating}>
              {isGenerating
                ? <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />Gerando...</>
                : <><Sparkles className="mr-2 h-4 w-4" />Gerar Texto</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Feedbacks</h1>
        <p className="mt-2 text-lg text-muted-foreground">Reconheça colegas e acompanhe os feedbacks recebidos</p>
      </div>

      {/* Alerta de limite */}
      {isLimitReached && stats && (
        <Card className="mb-6 clay-card border-2 border-orange-500/40">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Ban className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Limite de feedbacks atingido</p>
                <p className="text-sm text-muted-foreground">
                  {!canSendToday
                    ? `Você já enviou ${stats.sentToday} feedbacks hoje (limite: ${stats.dailyLimit}/dia). Volte amanhã!`
                    : `Você já enviou ${stats.sentThisWeek} feedbacks esta semana (limite: ${stats.weeklyLimit}/semana).`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="clay-card border-0">
          <TabsTrigger value="enviar">
            Enviar Feedback
            {stats && stats.sentToday > 0 && (
              <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-xs">
                {stats.sentToday}/{stats.dailyLimit}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recebidos">
            Recebidos
            {totalUnread > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">{totalUnread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enviados">
            Enviados {stats ? `(${stats.totalSent})` : ""}
          </TabsTrigger>
          <TabsTrigger value="solicitar">
            Solicitar
            {pendingReceivedRequests.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground text-xs">{pendingReceivedRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ─── Aba Enviar ─────────────────────────────────────────────────────── */}
        <TabsContent value="enviar" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Enviar Feedback
                {replyToRequestId && (
                  <Badge variant="secondary" className="ml-auto text-xs gap-1">
                    <Inbox className="h-3 w-3" />
                    Respondendo solicitação
                    <button onClick={() => { setReplyToRequestId(null); setSelectedUser(null); setRecipientSearch("") }}>
                      <X className="h-3 w-3 ml-1" />
                    </button>
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Reconheça o trabalho de um colega e fortaleça a cultura do time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Busca de destinatário */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Para quem você quer enviar?*</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite o nome do colaborador..."
                    value={selectedUser ? selectedUser.nome : recipientSearch}
                    onChange={e => handleRecipientSearch(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowDropdown(true) }}
                    className="pl-9 clay-button"
                  />
                  {selectedUser && (
                    <button
                      onClick={() => { setSelectedUser(null); setRecipientSearch("") }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {showDropdown && searchResults.length > 0 && !selectedUser && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                      {searchResults.map(u => (
                        <button
                          key={u.id}
                          className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                          onClick={() => { setSelectedUser(u); setRecipientSearch(""); setShowDropdown(false) }}
                        >
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={getImageUrl(u.avatar ?? "") ?? ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(u.nome)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{u.nome}</p>
                            <p className="text-xs text-muted-foreground">{u.cargo}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedUser && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={getImageUrl(selectedUser.avatar ?? "") ?? ""} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(selectedUser.nome)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{selectedUser.nome}</span>
                    <span className="text-xs text-muted-foreground">— {selectedUser.cargo}</span>
                  </div>
                )}
              </div>

              {/* Mensagem */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Mensagem*</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAiField("feedback"); setShowAI(true) }}
                    className="gap-1.5 text-sm h-7"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Assistente de IA
                  </Button>
                </div>
                <Textarea
                  placeholder="Escreva uma mensagem de reconhecimento... (mín. 10 caracteres)"
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="clay-button resize-none"
                />
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">Dica: Seja específico sobre o que foi excelente</p>
                  <span className={`text-xs ${message.length < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                    {message.length}/2000
                  </span>
                </div>
              </div>

              {/* Tipo de feedback */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo de Reconhecimento*</label>
                <div className="grid grid-cols-5 gap-2">
                  {FEEDBACK_TYPES.map(ft => {
                    const Icon = ft.icon
                    const isSelected = selectedType === ft.value
                    return (
                      <button
                        key={ft.value}
                        onClick={() => setSelectedType(ft.value)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${isSelected ? `${ft.bg} border-current scale-105 shadow-sm` : "border-border bg-transparent hover:bg-muted"
                          }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? ft.color : "text-muted-foreground"}`} />
                        <span className={`text-[10px] font-medium text-center leading-tight ${isSelected ? ft.color : "text-muted-foreground"}`}>
                          {ft.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Opções */}
              <div className="space-y-3">
                {stats?.allowPublicFeedback && (
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="public"
                        checked={isPublic}
                        onChange={e => setIsPublic(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="public" className="text-sm font-medium cursor-pointer">
                          Permitir compartilhamento no feed social
                        </label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stats.requireApproval
                            ? "O destinatário poderá compartilhar após aprovação do gestor"
                            : "O destinatário poderá compartilhar no feed social"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSendFeedback}
                disabled={isSubmitting || isLimitReached || !selectedUser || !selectedType || message.length < 10}
                className="w-full clay-button"
              >
                {isSubmitting
                  ? <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />Enviando...</>
                  : <><Send className="mr-2 h-4 w-4" />Enviar Feedback</>}
              </Button>

              {/* Contador */}
              {stats && (
                <div className="rounded-lg bg-muted/30 p-3 text-center text-sm text-muted-foreground">
                  <span className={stats.sentToday >= stats.dailyLimit ? "text-destructive font-medium" : ""}>
                    Hoje: {stats.sentToday}/{stats.dailyLimit}
                  </span>
                  {" · "}
                  <span className={stats.sentThisWeek >= stats.weeklyLimit ? "text-destructive font-medium" : ""}>
                    Esta semana: {stats.sentThisWeek}/{stats.weeklyLimit}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sugestões de colegas */}
          {suggestions.length > 0 && (
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Sugestões de Colegas</CardTitle>
                <CardDescription>Pessoas da sua equipe para reconhecer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {suggestions.slice(0, 6).map(person => (
                    <Card key={person.id} className="clay-button border-border hover:border-primary/40 transition-colors cursor-pointer group">
                      <CardContent className="pt-5 pb-4 text-center">
                        <Avatar className="mx-auto h-14 w-14 border-2 border-primary/20 group-hover:border-primary transition-colors">
                          <AvatarImage src={getImageUrl(person.avatar ?? "") ?? ""} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials(person.nome)}</AvatarFallback>
                        </Avatar>
                        <p className="mt-2.5 font-semibold text-sm text-foreground truncate">{person.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{person.cargo}</p>
                        <Button
                          size="sm"
                          className="mt-3 w-full clay-button bg-transparent text-xs"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(person)
                            setRecipientSearch("")
                            window.scrollTo({ top: 0, behavior: "smooth" })
                          }}
                        >
                          <MessageSquare className="mr-1.5 h-3 w-3" />
                          Enviar Feedback
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Aba Recebidos ──────────────────────────────────────────────────── */}
        <TabsContent value="recebidos" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="clay-card border-0 text-center">
              <CardContent className="pt-5">
                <div className="text-3xl mb-1">🎉</div>
                <p className="text-3xl font-bold text-primary">{stats?.totalReceived ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Recebidos</p>
              </CardContent>
            </Card>
            <Card className="clay-card border-0 text-center">
              <CardContent className="pt-5">
                <div className="text-3xl mb-1">⭐</div>
                <p className="text-3xl font-bold text-accent">{stats?.receivedThisMonth ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Este Mês</p>
              </CardContent>
            </Card>
            <Card className="clay-card border-0 text-center">
              <CardContent className="pt-5">
                <div className="text-3xl mb-1">📬</div>
                <p className="text-3xl font-bold text-chart-1">{stats?.unreadReceived ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Não Lidos</p>
              </CardContent>
            </Card>
          </div>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Feedbacks Recebidos</CardTitle>
              <CardDescription>Feedbacks aprovados entregues para você</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-lg bg-muted/40 animate-pulse" />)}
                </div>
              ) : received.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-muted bg-muted/10 p-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-semibold text-foreground">Nenhum feedback recebido ainda</p>
                  <p className="mt-2 text-sm text-muted-foreground">Continue realizando um ótimo trabalho!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {received.map(fb => {
                    const typeInfo = FEEDBACK_TYPES.find(t => t.value === fb.type)
                    const Icon = typeInfo?.icon ?? MessageSquare
                    const isNew = !fb.viewedAt
                    return (
                      <Card
                        key={fb.id}
                        className={`transition-all ${isNew ? "border-2 border-primary/40 shadow-sm" : "clay-button border-border"}`}
                      >
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-11 w-11 shrink-0 border-2 border-primary/20">
                              {fb.fromUser ? <AvatarImage src={getImageUrl(fb.fromUser.avatar ?? "") ?? ""} /> : null}
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {fb.fromUser ? initials(fb.fromUser.nome) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="font-semibold text-sm text-foreground">
                                    {fb.fromUser?.nome ?? "Remetente"}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${typeInfo?.bg ?? ""} ${typeInfo?.color ?? ""}`}>
                                      <Icon className="h-3 w-3" />
                                      {FEEDBACK_TYPE_LABELS[fb.type]}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {isNew && <Badge className="bg-primary text-primary-foreground text-xs">Novo</Badge>}
                                  <span className="text-xs text-muted-foreground">{relativeTime(fb.createdAt)}</span>
                                </div>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{fb.content}</p>
                              {isNew && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkViewed(fb.id)}
                                  className="mt-3 clay-button bg-transparent h-7 text-xs"
                                >
                                  <Eye className="mr-1.5 h-3 w-3" />
                                  Marcar como lido
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Aba Enviados ───────────────────────────────────────────────────── */}
        <TabsContent value="enviados" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Histórico de Feedbacks Enviados</CardTitle>
              <CardDescription>
                {stats ? `Você enviou ${stats.sentThisMonth} feedbacks este mês` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />)}
                </div>
              ) : sent.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-muted bg-muted/10 p-12 text-center">
                  <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-semibold text-foreground">Nenhum feedback enviado ainda</p>
                  <p className="mt-2 text-sm text-muted-foreground">Comece reconhecendo o trabalho dos seus colegas!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sent.map(fb => {
                    const typeInfo = FEEDBACK_TYPES.find(t => t.value === fb.type)
                    const Icon = typeInfo?.icon ?? MessageSquare
                    return (
                      <div
                        key={fb.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/20 transition-colors"
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          {fb.toUser ? <AvatarImage src={getImageUrl(fb.toUser.avatar ?? "") ?? ""} /> : null}
                          <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                            {fb.toUser ? initials(fb.toUser.nome) : "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm text-foreground">Para {fb.toUser?.nome ?? "Colega"}</p>
                            <span className="text-xs text-muted-foreground">{relativeTime(fb.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-4 px-1 px-1.5 flex items-center gap-1">
                              <Icon className="h-2.5 w-2.5" />
                              {FEEDBACK_TYPE_LABELS[fb.type]}
                            </Badge>
                            <StatusBadge status={fb.status} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Aba Solicitar ──────────────────────────────────────────────────── */}
        <TabsContent value="solicitar" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Formulário de solicitação */}
            <Card className="clay-card border-0 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <UserPlus className="h-5 w-5" />
                  Solicitar Feedback
                </CardTitle>
                <CardDescription>Peça a opinião de um colega sobre seu trabalho ou um tópico específico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">De quem você quer solicitar?</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar colega..."
                      value={reqUser ? reqUser.nome : reqSearch}
                      onChange={e => handleReqSearch(e.target.value)}
                      onFocus={() => { if (reqSearchResults.length > 0) setShowReqDropdown(true) }}
                      className="pl-9 clay-button"
                    />
                    {reqUser && (
                      <button onClick={() => { setReqUser(null); setReqSearch("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {showReqDropdown && reqSearchResults.length > 0 && !reqUser && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                        {reqSearchResults.map(u => (
                          <button
                            key={u.id}
                            className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors"
                            onClick={() => { setReqUser(u); setReqSearch(""); setShowReqDropdown(false) }}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={getImageUrl(u.avatar ?? "") ?? ""} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(u.nome)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{u.nome}</p>
                              <p className="text-xs text-muted-foreground">{u.cargo}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sobre o que? (Tópico)</label>
                  <Input
                    placeholder="Ex: Minha apresentação na Sprint Review"
                    value={reqTopic}
                    onChange={e => setReqTopic(e.target.value)}
                    className="clay-button"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Mensagem Adicional</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setAiField("request"); setShowAI(true) }}
                      className="gap-1.5 text-sm h-7"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Assistente de IA
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Explique por que você deseja este feedback..."
                    rows={3}
                    value={reqMessage}
                    onChange={e => setReqMessage(e.target.value)}
                    className="clay-button resize-none text-sm"
                  />
                </div>

                <Button onClick={handleSendRequest} disabled={isSubmittingReq || !reqUser} className="w-full clay-button">
                  {isSubmittingReq ? "Enviando..." : "Enviar Solicitação"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de solicitações recebidas */}
            <div className="space-y-6">
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-primary" />
                    Solicitações para mim
                    {pendingReceivedRequests.length > 0 && <Badge className="ml-1">{pendingReceivedRequests.length}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingReceivedRequests.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground italic">Nenhuma solicitação pendente.</p>
                    </div>
                  ) : (
                    pendingReceivedRequests.map(req => (
                      <div key={req.id} className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-primary/10">
                            <AvatarImage src={getImageUrl(req.fromUser.avatar ?? "") ?? ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials(req.fromUser.nome)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{req.fromUser.nome} solicitou:</p>
                            <p className="text-sm font-medium text-primary truncate leading-tight">
                              {req.topic || "Feedback Geral"}
                            </p>
                          </div>
                        </div>
                        {req.message && (
                          <div className="bg-muted/40 p-2 rounded text-xs italic text-muted-foreground line-clamp-2">
                            "{req.message}"
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => handleReplyToRequest(req)}>Responder</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDeclineRequest(req.id)}>Recusar</Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Solicitações enviadas (mini-histórico) */}
              <Card className="clay-card border-0">
                <CardHeader className="py-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Minhas Solicitações Recentes</p>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {sentRequests.slice(0, 3).map(req => (
                    <div key={req.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={getImageUrl(req.toUser.avatar ?? "") ?? ""} />
                        <AvatarFallback className="text-[10px]">{initials(req.toUser.nome)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{req.toUser.nome}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{req.topic || "Feedback Geral"}</p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] px-1 h-4 ${req.status === "fulfilled" ? "bg-green-500/10 text-green-600 border-green-200" : "bg-yellow-500/10 text-yellow-600 border-yellow-200"
                        }`}>
                        {req.status === "fulfilled" ? "Respondida" : req.status === "declined" ? "Recusada" : "Pendente"}
                      </Badge>
                    </div>
                  ))}
                  {sentRequests.length === 0 && <p className="text-[10px] text-muted-foreground italic text-center py-2">Nenhuma solicitação enviada.</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
