"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { FeedbackService } from "@/lib/feedback-service"
import { useState, useEffect } from "react"
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

export default function FeedbacksPage() {
  const { user, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState("enviar")
  const [feedbacksReceived, setFeedbacksReceived] = useState<any[]>([])
  const [feedbacksSent, setFeedbacksSent] = useState<any[]>([])
  const [requestsSent, setRequestsSent] = useState<any[]>([])
  const [requestsReceived, setRequestsReceived] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)

  // Formulário de envio
  const [selectedRecipient, setSelectedRecipient] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [message, setMessage] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Formulário de solicitação
  const [requestRecipient, setRequestRecipient] = useState("")
  const [requestTopic, setRequestTopic] = useState("")
  const [requestMessage, setRequestMessage] = useState("")

  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [aiIntention, setAiIntention] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [currentField, setCurrentField] = useState<"feedback" | "request">("feedback")

  useEffect(() => {
    if (!user) return

    loadData()
  }, [user])

  const loadData = () => {
    if (!user) return

    setFeedbacksReceived(FeedbackService.getReceivedFeedbacks(user.id))
    setFeedbacksSent(FeedbackService.getSentFeedbacks(user.id))
    setRequestsSent(FeedbackService.getSentRequests(user.id))
    setRequestsReceived(FeedbackService.getReceivedRequests(user.id))
    setStats(FeedbackService.getStats(user.id))
    setSettings(FeedbackService.getSettings())
  }

  const handleSendFeedback = async () => {
    if (!user || !selectedRecipient || !selectedType || !message.trim()) {
      setError("Preencha todos os campos obrigatórios")
      return
    }

    // Verificar permissões
    const canSend = FeedbackService.canSendFeedback(user.id, "mock-recipient-id")
    if (!canSend.allowed) {
      setError(canSend.reason || "Não é possível enviar feedback")
      return
    }

    setIsSubmitting(true)
    setError("")

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 800))

    FeedbackService.sendFeedback({
      fromUserId: user.id,
      fromUserName: user.nome,
      toUserId: "mock-recipient-id",
      toUserName: selectedRecipient,
      type: selectedType,
      message: message.trim(),
      isPublic,
      isAnonymous: false,
    })

    // Limpar formulário
    setSelectedRecipient("")
    setSelectedType("")
    setMessage("")
    setIsPublic(false)
    setIsSubmitting(false)

    // Recarregar dados
    loadData()

    alert("Feedback enviado com sucesso! +30 XP e 8 estrelas")
  }

  const handleRequestFeedback = async () => {
    if (!user || !requestRecipient || !requestTopic) {
      return
    }

    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 800))

    FeedbackService.requestFeedback({
      fromUserId: user.id,
      fromUserName: user.nome,
      toUserId: "mock-recipient-id",
      toUserName: requestRecipient,
      topic: requestTopic,
      message: requestMessage.trim() || undefined,
    })

    setRequestRecipient("")
    setRequestTopic("")
    setRequestMessage("")
    setIsSubmitting(false)

    loadData()

    alert("Solicitação de feedback enviada!")
  }

  const handleMarkAsViewed = (feedbackId: string) => {
    FeedbackService.markAsViewed(feedbackId)
    loadData()
  }

  const handleGenerateAIText = async () => {
    if (!aiIntention) return

    setIsGeneratingAI(true)

    // Simular chamada de IA (em produção, usar API real)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const templates: Record<string, string> = {
      elogio: `Gostaria de parabenizar você pelo excelente trabalho realizado recentemente. Sua dedicação e comprometimento têm sido fundamentais para o sucesso da equipe. Continue assim!`,
      orientacao: `Percebi que há alguns pontos que podemos melhorar juntos. Estou à disposição para conversarmos e encontrarmos as melhores soluções. Conte comigo para o que precisar!`,
      reconhecimento: `Seu trabalho tem sido exemplar e merece todo o reconhecimento. A forma como você conduziu o projeto demonstra profissionalismo e excelência. Parabéns!`,
      melhoria: `Acredito que temos uma ótima oportunidade de crescimento nesta área. Gostaria de sugerir algumas melhorias que podem potencializar ainda mais seus resultados. Vamos conversar sobre isso?`,
      agradecimento: `Quero agradecer imensamente por sua colaboração e apoio. Sua contribuição foi essencial e fez toda a diferença. Muito obrigado!`,
    }

    const generatedText = templates[aiIntention] || `Texto gerado com base na intenção: ${aiIntention}`

    if (currentField === "feedback") {
      setMessage(generatedText)
    } else {
      setRequestMessage(generatedText)
    }

    setIsGeneratingAI(false)
    setShowAIAssistant(false)
    setAiIntention("")
  }

  if (!user) return null

  const feedbackTypes = settings?.feedbackTypes || []
  const canSendAnywhere = settings?.allowAnyUser || false
  const dailyLimit = settings?.limitPerDay || 5
  const weeklyLimit = settings?.limitPerWeek || 20
  const sentToday = FeedbackService.getFeedbacksSentToday(user.id)
  const sentThisWeek = FeedbackService.getFeedbacksSentThisWeek(user.id)

  return (
    <>
      <Dialog open={showAIAssistant} onOpenChange={setShowAIAssistant}>
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
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Qual é a sua intenção?</Label>
              <RadioGroup value={aiIntention} onValueChange={setAiIntention}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="elogio" id="elogio" />
                  <Label htmlFor="elogio" className="cursor-pointer font-normal">
                    👏 Elogio - Reconhecer trabalho bem feito
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="orientacao" id="orientacao" />
                  <Label htmlFor="orientacao" className="cursor-pointer font-normal">
                    💡 Orientação - Sugerir melhorias construtivas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reconhecimento" id="reconhecimento" />
                  <Label htmlFor="reconhecimento" className="cursor-pointer font-normal">
                    ⭐ Reconhecimento - Destacar excelência
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="melhoria" id="melhoria" />
                  <Label htmlFor="melhoria" className="cursor-pointer font-normal">
                    📈 Melhoria - Propor desenvolvimento
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="agradecimento" id="agradecimento" />
                  <Label htmlFor="agradecimento" className="cursor-pointer font-normal">
                    🙏 Agradecimento - Expressar gratidão
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIAssistant(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateAIText} disabled={!aiIntention || isGeneratingAI}>
              {isGeneratingAI ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Texto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Feedbacks</h1>
        <p className="mt-2 text-lg text-muted-foreground">Reconheça colegas e acompanhe os feedbacks recebidos</p>
      </div>

      {/* Alertas de Limites */}
      {(sentToday >= dailyLimit || sentThisWeek >= weeklyLimit) && (
        <Card className="mb-6 clay-card border-2 border-chart-3">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Ban className="h-5 w-5 text-chart-3" />
              <div>
                <p className="font-semibold text-foreground">Limite de feedbacks atingido</p>
                <p className="text-sm text-muted-foreground">
                  {sentToday >= dailyLimit
                    ? `Você já enviou ${sentToday} feedbacks hoje (limite: ${dailyLimit}/dia)`
                    : `Você já enviou ${sentThisWeek} feedbacks esta semana (limite: ${weeklyLimit}/semana)`}
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
            {sentToday > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {sentToday}/{dailyLimit}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recebidos">
            Recebidos
            {stats?.unreadReceived > 0 && (
              <Badge className="ml-2 bg-destructive text-destructive-foreground">{stats.unreadReceived}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enviados">Enviados ({stats?.totalSent || 0})</TabsTrigger>
          <TabsTrigger value="solicitar">Solicitar</TabsTrigger>
        </TabsList>

        {/* Enviar Feedback */}
        <TabsContent value="enviar" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Enviar Feedback
              </CardTitle>
              <CardDescription>
                Reconheça o trabalho de um colega
                {!canSendAnywhere && " (apenas para colegas autorizados pelo seu gestor)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Para quem você quer enviar?*</label>
                <Input
                  placeholder="Digite o nome do colaborador..."
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="clay-button"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tipo de Reconhecimento*</label>
                <div className="grid grid-cols-4 gap-3">
                  {feedbackTypes.map((type: string) => {
                    const icons: any = {
                      "Excelente Trabalho": ThumbsUp,
                      Colaboração: Heart,
                      Inovação: Star,
                      Liderança: Award,
                      Desenvolvimento: CheckCircle2,
                    }
                    const Icon = icons[type] || MessageSquare

                    return (
                      <Button
                        key={type}
                        variant="outline"
                        onClick={() => setSelectedType(type)}
                        className={`h-auto flex-col gap-2 p-4 clay-button border-2 ${
                          selectedType === type
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "bg-transparent"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{type}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Mensagem*</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentField("feedback")
                      setShowAIAssistant(true)
                    }}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm">Assistente de IA</span>
                  </Button>
                </div>
                <Textarea
                  placeholder="Escreva uma mensagem de reconhecimento para seu colega..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="clay-button resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Dica: Clique em "Assistente de IA" para receber sugestões de texto profissional
                </p>
              </div>

              {settings?.allowPublic && (
                <div className="space-y-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="public"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor="public" className="text-sm font-medium text-foreground cursor-pointer">
                        Habiltar compartilhamento desse Feedback  
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {settings?.requireApproval
                          ? "Feedback público passa por aprovação do gestor antes de ser compartilhado"
                          : "Ao habilitar, o destinatário poderá compartilhar esse Feedback com a comunidade no feed social"}
                      </p>
                    </div>
                  </div>
                  
                  {settings?.requireApproval && isPublic && (
                    <div className="ml-7 space-y-2 border-l-2 border-blue-500/30 pl-3">
                      <p className="text-xs font-medium text-blue-700">Como funciona o feedback público:</p>
                      <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
                        <li>Feedback é enviado e fica <strong>pendente de aprovação</strong></li>
                        <li>Vai para o Painel Analítico → aba Feedbacks → Aprovação</li>
                        <li>Gestor analisa e aprova (ou reprova) o feedback</li>
                        <li>Somente após aprovação:
                          <ul className="ml-6 mt-1 space-y-0.5 list-disc list-inside">
                            <li>Chega ao destinatário</li>
                            <li>Torna-se público no feed social</li>
                          </ul>
                        </li>
                      </ol>
                      <p className="text-xs text-blue-600 font-medium mt-2">
                        ⚠️ Feedback público NÃO chega imediatamente ao destinatário ou ao feed
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Button
                onClick={handleSendFeedback}
                disabled={isSubmitting || sentToday >= dailyLimit}
                className="w-full clay-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Feedback
                  </>
                )}
              </Button>

              <div className="rounded-lg bg-muted/30 p-3 text-center text-sm text-muted-foreground">
                Hoje: {sentToday}/{dailyLimit} · Esta semana: {sentThisWeek}/{weeklyLimit}
              </div>
            </CardContent>
          </Card>

          {/* Sugestões */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Sugestões de Colegas</CardTitle>
              <CardDescription>Pessoas que colaboraram com você recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "João Silva", role: "Designer", avatar: "JS", project: "Projeto Alpha" },
                  { name: "Maria Santos", role: "Desenvolvedora", avatar: "MS", project: "Dashboard V2" },
                  { name: "Pedro Costa", role: "Analista", avatar: "PC", project: "Relatório Q4" },
                ].map((person) => (
                  <Card key={person.name} className="clay-button border-border">
                    <CardContent className="pt-6 text-center">
                      <Avatar className="mx-auto h-16 w-16 border-2 border-primary">
                        <AvatarImage src={`/diverse-professional.jpg?query=${person.name}`} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{person.avatar}</AvatarFallback>
                      </Avatar>
                      <p className="mt-3 font-semibold text-foreground">{person.name}</p>
                      <p className="text-xs text-muted-foreground">{person.role}</p>
                      <Badge className="mt-2" variant="secondary">
                        {person.project}
                      </Badge>
                      <Button
                        size="sm"
                        className="mt-4 w-full clay-button bg-transparent"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecipient(person.name)
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                      >
                        <MessageSquare className="mr-2 h-3.5 w-3.5" />
                        Enviar Feedback
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Feedbacks Recebidos */}
        <TabsContent value="recebidos" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Card className="clay-card border-0">
              <CardContent className="pt-6 text-center">
                <div className="mb-2 text-4xl">🎉</div>
                <p className="text-3xl font-bold text-primary">{stats?.totalReceived || 0}</p>
                <p className="text-sm text-muted-foreground">Total Recebidos</p>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6 text-center">
                <div className="mb-2 text-4xl">⭐</div>
                <p className="text-3xl font-bold text-accent">{stats?.receivedThisMonth || 0}</p>
                <p className="text-sm text-muted-foreground">Este Mês</p>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6 text-center">
                <div className="mb-2 text-4xl">📬</div>
                <p className="text-3xl font-bold text-chart-1">{stats?.unreadReceived || 0}</p>
                <p className="text-sm text-muted-foreground">Não Lidos</p>
              </CardContent>
            </Card>
          </div>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Feedbacks Recebidos</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbacksReceived.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-muted bg-muted/10 p-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-semibold text-foreground">Nenhum feedback recebido ainda</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Continue realizando um ótimo trabalho e reconhecimentos virão!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacksReceived.map((feedback) => (
                    <Card
                      key={feedback.id}
                      className={`clay-button ${!feedback.viewedAt ? "border-primary border-2" : ""}`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 border-2 border-primary">
                            <AvatarImage src={`/professional-avatar.jpg?query=${feedback.fromUserName}`} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {feedback.fromUserName
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-foreground">
                                  {feedback.isAnonymous ? "Anônimo" : feedback.fromUserName}
                                </p>
                                <Badge variant="secondary" className="mt-1">
                                  {feedback.type}
                                </Badge>
                              </div>
                              {!feedback.viewedAt && <Badge className="bg-primary text-primary-foreground">Novo</Badge>}
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">{feedback.message}</p>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {new Date(feedback.createdAt).toLocaleString("pt-BR")}
                            </p>
                            {!feedback.viewedAt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAsViewed(feedback.id)}
                                className="mt-3 clay-button bg-transparent"
                              >
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                                Marcar como lido
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Feedbacks Enviados */}
        <TabsContent value="enviados" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Histórico de Feedbacks Enviados</CardTitle>
              <CardDescription>Você enviou {stats?.sentThisMonth || 0} feedbacks este mês</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbacksSent.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-muted bg-muted/10 p-12 text-center">
                  <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 font-semibold text-foreground">Nenhum feedback enviado ainda</p>
                  <p className="mt-2 text-sm text-muted-foreground">Comece reconhecendo o trabalho dos seus colegas!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacksSent.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`/professional-avatar.jpg?query=${feedback.toUserName}`} />
                          <AvatarFallback className="bg-chart-1 text-chart-1-foreground">
                            {feedback.toUserName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{feedback.toUserName}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {feedback.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(feedback.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={
                          feedback.status === "sent"
                            ? "bg-primary"
                            : feedback.status === "pending"
                              ? "bg-muted"
                              : "bg-destructive"
                        }
                      >
                        {feedback.viewedAt ? (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Visualizado
                          </>
                        ) : feedback.status === "sent" ? (
                          <>
                            <Send className="mr-1 h-3 w-3" />
                            Enviado
                          </>
                        ) : (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Pendente
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Solicitar Feedback */}
        <TabsContent value="solicitar" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Solicitar Feedback
              </CardTitle>
              <CardDescription>Peça feedback sobre seu trabalho ou projeto específico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Para quem você quer solicitar?*</label>
                <Input
                  placeholder="Digite o nome do colaborador..."
                  value={requestRecipient}
                  onChange={(e) => setRequestRecipient(e.target.value)}
                  className="clay-button"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Sobre o que você quer feedback?*</label>
                <Input
                  placeholder="Ex: Apresentação do Projeto Alpha, Relatório Q4, etc."
                  value={requestTopic}
                  onChange={(e) => setRequestTopic(e.target.value)}
                  className="clay-button"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Mensagem adicional (opcional)</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentField("request")
                      setShowAIAssistant(true)
                    }}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm">Assistente de IA</span>
                  </Button>
                </div>
                <Textarea
                  placeholder="Adicione contexto sobre o que você gostaria de receber feedback..."
                  rows={3}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="clay-button resize-none"
                />
              </div>

              <Button
                onClick={handleRequestFeedback}
                disabled={isSubmitting || !requestRecipient || !requestTopic}
                className="w-full clay-button"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Solicitar Feedback
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Solicitações Pendentes */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              {requestsSent.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-muted bg-muted/10 p-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma solicitação enviada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requestsSent.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{request.toUserName}</p>
                        <p className="text-sm text-muted-foreground">
                          Feedback sobre: {request.topic} · {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant={request.status === "pending" ? "secondary" : "default"}>
                        {request.status === "pending" ? (
                          <>
                            <Clock className="mr-1 h-3 w-3" />
                            Aguardando
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Completado
                          </>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solicitações Recebidas */}
          {requestsReceived.length > 0 && (
            <Card className="clay-card border-0 border-2 border-primary">
              <CardHeader>
                <CardTitle>Solicitações Recebidas</CardTitle>
                <CardDescription>Colegas que solicitaram feedback de você</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requestsReceived.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{request.fromUserName}</p>
                        <p className="text-sm text-muted-foreground">Solicitou feedback sobre: {request.topic}</p>
                      </div>
                      <Button
                        size="sm"
                        className="clay-button"
                        onClick={() => {
                          setSelectedRecipient(request.fromUserName)
                          setActiveTab("enviar")
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }}
                      >
                        <Send className="mr-2 h-3.5 w-3.5" />
                        Responder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </>
  )
}
