"use client"

import { AvatarFallback } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { HumorService } from "@/lib/humor-service"
import { RankingService } from "@/lib/ranking-service"
import { EngajamentoService } from "@/lib/engajamento-service"
import { MetasService } from "@/lib/metas-service"
import { GamificationGuard } from "@/lib/gamification-guard"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Target,
  MessageSquare,
  Heart,
  Users,
  Award,
  TrendingUp,
  Star,
  Trophy,
  Settings,
  ClipboardList,
  Zap,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  GraduationCap,
  BarChart3,
  MapPin,
  MapPinOff,
} from "lucide-react"
import { Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { EngagementTrackingService } from "@/lib/engagement-tracking-service"
import { useRouter } from "next/navigation"

// Types para ações pendentes
type PendingActionType = "campanha" | "treinamento" | "pesquisa" | "feedback"
type ActionStatus = "nao_iniciado" | "em_andamento" | "pendente"

interface PendingAction {
  id: string
  type: PendingActionType
  title: string
  description: string
  status: ActionStatus
  startDate?: string
  endDate?: string
  rewardXP?: number
  rewardStars?: number
  progress?: {
    current: number
    total: number
    percentage: number
  }
  ctaLabel: string
  ctaAction: () => void
}

export default function HomePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [metas, setMetas] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([]) // TASK 2: Estado para eventos
  const isGestorOrAdmin = user?.role === "gestor" || user?.role === "super-admin";

  useEffect(() => {
    if (!user) return

    EngagementTrackingService.trackPlatformAccess(user.id)
    EngagementTrackingService.initializeEngagementsForUser(user.id)

    // Carregar ações pendentes
    loadPendingActions()
    
    // TASK 2: Carregar eventos mock
    const eventosMock = [
      {
        id: "evt-001",
        titulo: "Workshop de Liderança",
        descricao: "Desenvolvimento de habilidades de liderança e gestão de equipes",
        data: new Date().toISOString(),
        hora: "14:00",
        local: "Sala de Conferência A",
        tipo: "presencial",
        capa: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop",
        ganhos: { xp: 50, estrelas: 5 },
        participado: false,
      },
      {
        id: "evt-002",
        titulo: "Networking Online",
        descricao: "Conecte-se com profissionais de outros departamentos",
        data: new Date(Date.now() + 86400000).toISOString(),
        hora: "18:00",
        local: "https://meet.google.com/abc-defg-hij",
        tipo: "online",
        capa: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop",
        ganhos: { xp: 30, estrelas: 3 },
        participado: false,
      },
    ]
    setEventos(eventosMock)
    
    // TASK 4: Carregar metas funcionais e detalhadas
    if (user.role === "colaborador") {
      // Exemplos reais de metas com progresso e critérios
      const metasMock = [
        {
          id: "meta-001",
          titulo: "Atingir 500 XP este mês",
          descricao: "Complete campanhas e treinamentos para alcançar 500 pontos de experiência até o final do mês",
          prazo: "2024-01-31",
          progresso: 68,
          progressoAtual: 340,
          progressoMeta: 500,
          status: "em_andamento",
          criterios: [
            "Completar pelo menos 2 campanhas ativas",
            "Finalizar 3 treinamentos obrigatórios",
            "Participar ativamente do Feed Social"
          ]
        },
        {
          id: "meta-002",
          titulo: "Concluir trilha de Desenvolvimento Pessoal",
          descricao: "Finalize todos os treinamentos da trilha de desenvolvimento pessoal e soft skills",
          prazo: "2024-02-28",
          progresso: 40,
          progressoAtual: 2,
          progressoMeta: 5,
          status: "em_andamento",
          criterios: [
            "Concluir 5 treinamentos específicos da trilha",
            "Obter nota mínima de 80% nas avaliações"
          ]
        }
      ]
      setMetas(metasMock)
    }
  }, [user])

  const loadPendingActions = () => {
    if (!user) return

    const actions: PendingAction[] = []

    // TASK 2: EXEMPLOS REAIS E VARIADOS DE AÇÕES PENDENTES
    
    // EXEMPLO 1: Campanha 100% Concluída (para mostrar conquista)
    actions.push({
      id: "camp-001-concluida",
      type: "campanha",
      title: "Integração de Novos Colaboradores 2024",
      description: "Campanha de boas-vindas para novos membros do time, com foco em cultura, ferramentas e conexão com colegas.",
      status: "em_andamento",
      endDate: "2024-03-15",
      rewardXP: 100,
      rewardStars: 10,
      progress: {
        current: 4,
        total: 4,
        percentage: 100,
      },
      ctaLabel: "Ver Recompensas",
      ctaAction: () => {
        toast({
          title: "Campanha Concluída!",
          description: "Você ganhou +100 XP e ⭐ 10 estrelas! Parabéns!",
        })
      },
    })

    // EXEMPLO 2: Campanha Parcialmente Concluída (33%)
    actions.push({
      id: "camp-002-parcial",
      type: "campanha",
      title: "Mês do Feedback Construtivo",
      description: "Fortaleça a cultura de feedback da equipe enviando reconhecimentos e sugestões aos colegas.",
      status: "em_andamento",
      endDate: "2024-02-28",
      rewardXP: 80,
      rewardStars: 8,
      progress: {
        current: 1,
        total: 3,
        percentage: 33,
      },
      ctaLabel: "Continuar",
      ctaAction: () => {
        toast({
          title: "Próxima ação",
          description: "Finalize o treinamento de Comunicação Eficaz",
        })
        router.push("/treinamentos/treino-002")
      },
    })

    // EXEMPLO 3: Treinamento Não Iniciado (parte de campanha)
    actions.push({
      id: "treino-001",
      type: "treinamento",
      title: "Comunicação Eficaz no Ambiente de Trabalho",
      description: "Aprenda técnicas de comunicação assertiva, escuta ativa e feedback construtivo. Parte da campanha 'Mês do Feedback'.",
      status: "nao_iniciado",
      rewardXP: 60,
      rewardStars: 6,
      progress: {
        current: 0,
        total: 4,
        percentage: 0,
      },
      ctaLabel: "Iniciar",
      ctaAction: () => {
        toast({
          title: "Treinamento iniciado",
          description: "Você será direcionado para o primeiro módulo",
        })
        router.push("/treinamentos/treino-001")
      },
    })

    // EXEMPLO 4: Treinamento Em Andamento (50%)
    actions.push({
      id: "treino-002",
      type: "treinamento",
      title: "Compliance e Segurança da Informação",
      description: "Treinamento obrigatório sobre políticas de segurança, LGPD e boas práticas no ambiente corporativo.",
      status: "em_andamento",
      rewardXP: 80,
      rewardStars: 8,
      progress: {
        current: 2,
        total: 4,
        percentage: 50,
      },
      ctaLabel: "Continuar",
      ctaAction: () => {
        toast({
          title: "Retomando treinamento",
          description: "Você está no módulo 3 de 4",
        })
        router.push("/treinamentos/treino-002")
      },
    })

    // EXEMPLO 5: Pesquisa Pendente (sem campanha)
    actions.push({
      id: "pesq-001",
      type: "pesquisa",
      title: "Pesquisa de Clima Organizacional Q1",
      description: "Avaliação trimestral do ambiente de trabalho, satisfação e sugestões de melhorias para a gestão. 15 questões (10 min).",
      status: "pendente",
      endDate: "2024-02-05",
      rewardXP: 30,
      rewardStars: 3,
      ctaLabel: "Responder",
      ctaAction: () => {
        toast({
          title: "Iniciando pesquisa",
          description: "Sua opinião é muito importante para nós",
        })
        router.push("/pesquisas/pesq-001")
      },
    })

    // EXEMPLO 6: Pesquisa Pendente (parte de campanha)
    actions.push({
      id: "pesq-002",
      type: "pesquisa",
      title: "Avaliação do Programa de Feedback",
      description: "Ajude-nos a melhorar o programa de feedback da empresa. Parte da campanha 'Mês do Feedback'. 8 questões (5 min).",
      status: "pendente",
      endDate: "2024-02-10",
      rewardXP: 20,
      rewardStars: 2,
      ctaLabel: "Responder",
      ctaAction: () => {
        toast({
          title: "Iniciando pesquisa",
          description: "Parte da campanha 'Mês do Feedback Construtivo'",
        })
        router.push("/pesquisas/pesq-002")
      },
    })

    setPendingActions(actions)
  }

  const handleStartCampanha = (campanhaId: string) => {
    if (!user) return
    
    const campanha = EngajamentoService.getEngajamentoById(campanhaId)
    if (!campanha) return

    // Verificar se tem ordem obrigatória
    const hasOrderedActions = campanha.validationRules?.actionOrder?.enabled

    if (hasOrderedActions) {
      // TODO: Direcionar para primeira ação obrigatória pendente
      toast({
        title: "Campanha iniciada",
        description: "Você será direcionado para a primeira ação obrigatória.",
      })
      // router.push(`/campanhas/${campanhaId}/acao/primeira-pendente`)
    } else {
      // Direcionar para visão geral da campanha
      toast({
        title: "Campanha iniciada",
        description: "Você pode completar as ações em qualquer ordem.",
      })
      // router.push(`/campanhas/${campanhaId}`)
    }
    
    EngajamentoService.startEngajamento(campanhaId, user.id)
    loadPendingActions()
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const isColaborador = user.role === "colaborador"
  const isGestor = user.role === "gestor"
  const isSuperAdmin = user.role === "super-admin"
  
  // HOME DO COLABORADOR
  if (isColaborador && GamificationGuard.shouldShowGamificationUI(user.role)) {
    return (
      <>
        <div className="container mx-auto max-w-7xl space-y-8 p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">
              Olá, {user.nome?.split(" ")[0] || "Colaborador"}!
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Veja o que você precisa fazer hoje e acompanhe seu progresso.
            </p>
          </div>

          {/* TASK 1: MISSÃO DO DIA - DESTAQUE MÁXIMO NO TOPO */}
          <Card className="clay-card border-0 border-l-4 border-l-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-3">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Missão do Dia</CardTitle>
                  <CardDescription>Desafio de hoje para fortalecer a cultura do time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Compartilhe uma conquista da semana no Feed Social
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    Inspire seus colegas compartilhando uma vitória, aprendizado ou momento especial desta semana no Feed Social.
                  </p>
                  
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/feed-social">
                    <Button size="lg" className="clay-button">
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Ir para o Feed Social
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Coluna principal - Ações */}
            <div className="lg:col-span-2 space-y-6">
              {/* TASK 2-3: CARD DE AÇÕES PENDENTES COM EXEMPLOS REAIS */}
              <Card className="clay-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <CardTitle>Suas Ações Pendentes</CardTitle>
                    </div>
                    <Badge variant="secondary">{pendingActions.length} ações</Badge>
                  </div>
                  <CardDescription>
                    O que você precisa fazer agora, depois e no futuro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingActions.length === 0 ? (
                    <div className="rounded-lg bg-muted/30 p-8 text-center">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-primary mb-3" />
                      <p className="text-lg font-semibold text-foreground">Tudo em dia!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Você não tem ações pendentes no momento.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingActions.map((action) => (
                        <div
                          key={action.id}
                          className="rounded-lg border border-border bg-gradient-to-br from-card via-background to-card p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Badge de tipo e status */}
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <Badge
                                  variant={action.type === "campanha" ? "default" : "outline"}
                                  className="capitalize"
                                >
                                  {action.type}
                                </Badge>
                                
                                {action.status === "nao_iniciado" && (
                                  <Badge variant="secondary">Não iniciado</Badge>
                                )}
                                {action.status === "em_andamento" && (
                                  <Badge variant="outline" className="border-primary text-primary">
                                    <Clock className="mr-1 h-3 w-3" />
                                    Em andamento
                                  </Badge>
                                )}
                                {action.status === "pendente" && (
                                  <Badge variant="outline" className="border-accent text-accent">
                                    Pendente
                                  </Badge>
                                )}
                              </div>

                              {/* Título */}
                              <h3 className="font-semibold text-foreground mb-1">
                                {action.title}
                              </h3>

                              {/* Descrição curta */}
                              <p className="text-sm text-muted-foreground mb-3">
                                {action.description}
                              </p>

                              {/* Progresso (se aplicável) */}
                              {action.progress && (
                                <div className="mb-3 space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progresso</span>
                                    <span className="font-semibold text-primary">
                                      {action.progress.percentage}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                                      style={{ width: `${action.progress.percentage}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {action.progress.current} de {action.progress.total} ações concluídas
                                  </div>
                                </div>
                              )}

                              {/* Período e ganhos */}
                              <div className="flex items-center gap-4 text-sm flex-wrap">
                                {action.rewardXP && (
                                  <span className="text-primary font-semibold">
                                    +{action.rewardXP} XP
                                  </span>
                                )}
                                {action.rewardStars && (
                                  <span className="text-accent font-semibold">
                                    ⭐ {action.rewardStars}
                                  </span>
                                )}
                                {action.endDate && (
                                  <span className="text-muted-foreground">
                                    <Clock className="inline h-3 w-3 mr-1" />
                                    Até {new Date(action.endDate).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* CTA único e inteligente */}
                            <div>
                              <Button
                                size="sm"
                                className="clay-button"
                                onClick={action.ctaAction}
                              >
                                {action.status === "nao_iniciado" ? (
                                  <>
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Iniciar
                                  </>
                                ) : (
                                  <>
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Continuar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CARD 2 - METAS (CARD DEDICADO) */}
              <Card className="clay-card border-0 relative opacity-60 grayscale pointer-events-none">
                <Badge className="absolute right-3 top-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Em breve
                </Badge>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-chart-3" />
                      <CardTitle>Suas Metas</CardTitle>
                    </div>
                    <Badge variant="secondary">{metas.length} ativas</Badge>
                  </div>
                  <CardDescription>Acompanhe suas metas e conquiste seus objetivos</CardDescription>
                </CardHeader>
                <CardContent>
                  {metas.length === 0 ? (
                    <div className="rounded-lg bg-muted/30 p-6 text-center">
                      <Target className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Você não tem metas ativas no momento
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {metas.slice(0, 3).map((meta) => {
                        const progress = meta.progresso || 0
                        const prazoDate = meta.prazo ? new Date(meta.prazo) : null
                        const hoje = new Date()
                        const isAtrasada = prazoDate ? prazoDate < hoje && progress < 100 : false
                        
                        return (
                          <div
                            key={meta.id}
                            className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{meta.titulo}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {meta.descricao}
                                </p>
                                {meta.prazo && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    <Clock className="inline h-3 w-3 mr-1" />
                                    Prazo: {new Date(meta.prazo).toLocaleDateString("pt-BR")}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={isAtrasada ? "destructive" : progress === 100 ? "default" : "outline"}
                              >
                                {progress === 100 ? "Concluída" : isAtrasada ? "Atrasada" : "Em andamento"}
                              </Badge>
                            </div>

                            <div className="space-y-2 mb-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progresso</span>
                                <span className="font-semibold text-primary">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                              {meta.progressoAtual !== undefined && meta.progressoMeta !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  {meta.progressoAtual} de {meta.progressoMeta}
                                </p>
                              )}
                            </div>

                            {meta.criterios && meta.criterios.length > 0 && (
                              <div className="rounded-lg bg-muted/30 p-3 mb-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Critérios:</p>
                                <ul className="space-y-1">
                                  {meta.criterios.map((criterio: string, idx: number) => (
                                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                      <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                                      <span>{criterio}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <Button variant="ghost" size="sm" className="mt-2 w-full" disabled>
                              Ver detalhes completos
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}

                      {metas.length > 3 && (
                        <Button variant="outline" size="sm" className="w-full bg-transparent" disabled>
                          Ver todas as metas ({metas.length})
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna lateral - CARD 4 - RESUMO PESSOAL (SECUNDÁRIO) */}
            <div className="space-y-6">
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Seu Desempenho</CardTitle>
                  <CardDescription>Estatísticas e conquistas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar e info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-primary">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {user.nome?.split(" ").map((n) => n[0]).join("") || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary">
                          <Trophy className="mr-1 h-3 w-3" />
                          Nível {user.nivel}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {user.xp} / {user.xpProximo} XP
                      </p>
                    </div>
                  </div>

                  {/* Progresso de nível */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Próximo nível</span>
                      <span className="font-semibold text-primary">
                        {Math.round((user.xp / user.xpProximo) * 100)}%
                      </span>
                    </div>
                    <Progress value={(user.xp / user.xpProximo) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Faltam {user.xpProximo - user.xp} XP
                    </p>
                  </div>

                  {/* Cards de stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <Star className="mx-auto h-5 w-5 text-accent mb-1" />
                      <p className="text-xl font-bold text-foreground">⭐ {user.estrelas}</p>
                      <p className="text-xs text-muted-foreground">Estrelas</p>
                    </div>

                    <div className="relative rounded-lg bg-muted/30 p-3 text-center opacity-60 grayscale pointer-events-none">
                      <Badge className="absolute right-2 top-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-[10px] px-1.5 py-0 h-4">
                        Em breve
                      </Badge>
                      <Target className="mx-auto h-5 w-5 text-chart-3 mb-1" />
                      <p className="text-xl font-bold text-foreground">
                        {MetasService.getMetasConcluidasColaborador(user.id)}/
                        {MetasService.getMetasAtivasParaColaborador(user.role).length}
                      </p>
                      <p className="text-xs text-muted-foreground">Metas</p>
                    </div>
                  </div>

                  {/* Ranking semanal */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-4 w-4 text-accent" />
                      <h4 className="text-sm font-semibold">Ranking Semanal</h4>
                    </div>
                    <Link href="/ranking">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        Ver ranking completo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>

                  {/* Conquistas */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Conquistas Recentes</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          🏆
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Primeira Campanha</p>
                          <p className="text-xs text-muted-foreground">Há 2 dias</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </>
    )
  }

  // HOME DO SUPER ADMIN - VISÃO ORGANIZACIONAL
  if (isSuperAdmin) {
    // Dados mock para visão organizacional
    const gestoresMock = [
      {
        id: "gest-001",
        nome: "Carlos Mendes",
        time: "Tecnologia",
        engajamentoMedio: 85,
        tendencia: "subindo",
        colaboradores: 12,
        status: "saudavel",
      },
      {
        id: "gest-002",
        nome: "Ana Paula Costa",
        time: "Vendas",
        engajamentoMedio: 72,
        tendencia: "estavel",
        colaboradores: 18,
        status: "saudavel",
      },
      {
        id: "gest-003",
        nome: "Roberto Silva",
        time: "Operações",
        engajamentoMedio: 58,
        tendencia: "caindo",
        colaboradores: 25,
        status: "atencao",
      },
      {
        id: "gest-004",
        nome: "Mariana Santos",
        time: "Marketing",
        engajamentoMedio: 42,
        tendencia: "caindo",
        colaboradores: 15,
        status: "risco",
      },
    ]

    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        {/* Header do Super Admin */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-sm font-bold">
                  {user.nome?.split(" ").map((n) => n[0]).join("") || "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user.nome}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">{user.cargo}</p>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="h-5">Super Admin</Badge>
                  {user.departamento && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-sm text-muted-foreground">{user.departamento}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. VISÃO GERAL DA ORGANIZAÇÃO */}
        <Card className="clay-card border-0 shadow-md mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Visão Geral da Organização</CardTitle>
            <CardDescription>Indicadores consolidados da empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Engajamento Geral</span>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">68%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary">↑ 5%</span> vs mês anterior
                </p>
              </div>

              <div className="rounded-lg bg-chart-2/5 border border-chart-2/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Sentimento Org.</span>
                  <Heart className="h-4 w-4 text-chart-2" />
                </div>
                <p className="text-3xl font-bold text-chart-2">Positivo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  342 registros hoje
                </p>
              </div>

              <div className="rounded-lg bg-chart-1/10 border border-chart-1/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Participação</span>
                  <Users className="h-4 w-4 text-chart-1" />
                </div>
                <p className="text-3xl font-bold text-chart-1">73%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Colaboradores ativos
                </p>
              </div>

              <div className="rounded-lg bg-accent/5 border-2 border-accent/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Alertas Críticos</span>
                  <AlertCircle className="h-4 w-4 text-accent" />
                </div>
                <p className="text-3xl font-bold text-accent">2</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Times em risco
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. PANORAMA DOS GESTORES */}
        <Card className="clay-card border-0 border-l-4 border-l-primary shadow-md mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Panorama dos Gestores</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="h-6">{gestoresMock.filter((g) => g.status === "saudavel").length} saudáveis</Badge>
                <Badge variant="outline" className="h-6">{gestoresMock.filter((g) => g.status === "atencao").length} atenção</Badge>
                <Badge variant="destructive" className="h-6">{gestoresMock.filter((g) => g.status === "risco").length} risco</Badge>
              </div>
            </div>
            <CardDescription>Status consolidado dos times e seus gestores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gestoresMock.map((gestor) => {
                const statusColor =
                  gestor.status === "saudavel"
                    ? "bg-primary/10 border-primary/30"
                    : gestor.status === "atencao"
                      ? "bg-accent/10 border-accent/30"
                      : "bg-destructive/10 border-destructive/30"

                const tendenciaIcon =
                  gestor.tendencia === "subindo" ? (
                    <TrendingUp className="h-4 w-4 text-primary" />
                  ) : gestor.tendencia === "caindo" ? (
                    <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-muted" />
                  )

                return (
                  <div key={gestor.id} className={`rounded-lg border p-3 ${statusColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-foreground text-sm">{gestor.nome}</h4>
                          <Badge variant="outline" className="h-5 text-xs">
                            {gestor.time}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            <Users className="inline h-3 w-3 mr-1" />
                            {gestor.colaboradores} colaboradores
                          </span>
                          <span className="font-semibold text-primary">
                            {gestor.engajamentoMedio}% engajamento
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tendenciaIcon}
                        <Link href="/analytics">
                          <Button size="sm" variant="ghost" className="h-7 text-xs px-2">
                            Ver mais
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              <Link href="/analytics">
                <Button className="w-full clay-button">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver análise completa dos gestores
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Grid de 2 colunas */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 3. ALERTAS ESTRATÉGICOS */}
          <Card className="clay-card border-0 border-l-4 border-l-accent shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent" />
                <CardTitle className="text-lg">Alertas Estratégicos</CardTitle>
              </div>
              <CardDescription>Situações que requerem atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        Time de Marketing em queda
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Engajamento caiu 18% nas últimas 2 semanas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        Operações com baixa participação
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Apenas 58% dos colaboradores ativos
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground text-sm mb-1">
                        Tecnologia em alta
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Melhor desempenho dos últimos 3 meses
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link href="/inteligencia">
                  <Button variant="outline" className="w-full bg-transparent">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Ver todos os insights
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 4. COMPARATIVOS ORGANIZACIONAIS */}
          <Card className="clay-card border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Comparativos Organizacionais</CardTitle>
              </div>
              <CardDescription>Rankings e desempenho por área</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Top 3 Times</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 p-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Tecnologia</span>
                      </div>
                      <span className="text-sm font-bold text-primary">85%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border p-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Vendas</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">72%</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 border border-border p-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Operações</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">58%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Times em Risco</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-destructive/5 border border-destructive/30 p-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium">Marketing</span>
                      </div>
                      <span className="text-sm font-bold text-destructive">42%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Link href="/analytics">
                  <Button variant="outline" className="w-full bg-transparent">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analisar nos Analytics
                  </Button>
                </Link>
              </div>
                </CardContent>
              </Card>

              {/* TASK 2: CARD DE EVENTOS */}
              <Card className="clay-card border-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle>Eventos</CardTitle>
                    </div>
                  </div>
                  <CardDescription>Confira os eventos programados</CardDescription>
                </CardHeader>
                <CardContent>
                  {eventos.length === 0 ? (
                    <div className="rounded-lg bg-muted/30 p-6 text-center">
                      <Calendar className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum evento programado no momento
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Evento de hoje */}
                      {eventos.find(e => new Date(e.data).toDateString() === new Date().toDateString()) && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">EVENTO DE HOJE</p>
                          {eventos
                            .filter(e => new Date(e.data).toDateString() === new Date().toDateString())
                            .map(evento => (
                              <Link href="/eventos" key={evento.id}>
                                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 hover:bg-primary/10 transition-colors cursor-pointer mb-3">
                                  <div className="flex gap-3">
                                    <img
                                      src={evento.capa || "/placeholder.svg"}
                                      alt={evento.titulo}
                                      className="h-12 w-12 rounded object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm text-foreground truncate">
                                        {evento.titulo}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{evento.hora}</span>
                                        <span>•</span>
                                        {evento.tipo === "presencial" ? (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            Presencial
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <MapPinOff className="h-3 w-3" />
                                            Online
                                          </span>
                                        )}
                                      </div>
                                      {evento.ganhos && (
                                        <div className="flex items-center gap-2 mt-2 text-xs">
                                          <span className="text-primary font-semibold">+{evento.ganhos.xp} XP</span>
                                          <span className="text-accent font-semibold">⭐ {evento.ganhos.estrelas}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                        </div>
                      )}

                      {/* Próximo evento */}
                      {eventos.some(e => new Date(e.data) > new Date() || !eventos.find(e => new Date(e.data).toDateString() === new Date().toDateString())) && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">PRÓXIMO EVENTO</p>
                          {eventos
                            .filter(e => new Date(e.data) > new Date())
                            .slice(0, 1)
                            .map(evento => (
                              <Link href="/eventos" key={evento.id}>
                                <div className="rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                                  <div className="flex gap-3">
                                    <img
                                      src={evento.capa || "/placeholder.svg"}
                                      alt={evento.titulo}
                                      className="h-12 w-12 rounded object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm text-foreground truncate">
                                        {evento.titulo}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(evento.data).toLocaleDateString("pt-BR")}</span>
                                        <span>•</span>
                                        <span>{evento.hora}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          {eventos.length > 0 && (
                            <Link href="/eventos">
                              <Button variant="ghost" size="sm" className="w-full mt-3">
                                Ver todos os eventos
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
      </div>
    )
  }

  // HOME DO GESTOR - PAINEL EXECUTIVO DO TIME
  if (isGestor) {
    // TASK 4: Dados mock obrigatórios para visualização
    const criacoesMock = [
      {
        id: "camp-001",
        type: "campanha",
        nome: "Integração de Novos Colaboradores 2024",
        status: "ativa",
        progresso: 68,
        periodo: { inicio: "2024-01-15", fim: "2024-03-15" },
        usuariosVinculados: 24,
      },
      {
        id: "treino-001",
        type: "treinamento",
        nome: "Compliance e Segurança da Informação",
        status: "ativa",
        progresso: 45,
        periodo: null,
        usuariosVinculados: 87,
      },
      {
        id: "pesq-001",
        type: "pesquisa",
        nome: "Pesquisa de Clima Organizacional Q1",
        status: "ativa",
        progresso: 82,
        periodo: { inicio: "2024-01-20", fim: "2024-02-05" },
        usuariosVinculados: 156,
      },
    ]

    // TASK 5: Missão do Dia ativa (mock)
    const missaoDoDiaAtiva = {
      titulo: "Compartilhe uma conquista da semana no Feed Social",
      descricao: "Incentive seu time a compartilhar vitórias e reconhecimentos",
      dataAtivacao: "2024-01-25",
    }

    // TASK 6: Metas ativas (mock)
    const metasAtivas = [
      {
        id: "meta-001",
        nome: "Aumentar taxa de conclusão de treinamentos",
        status: "em_andamento",
        progressoTime: 73,
        prazo: "2024-02-28",
      },
      {
        id: "meta-002",
        nome: "Reduzir tempo médio de resposta a feedbacks",
        status: "em_andamento",
        progressoTime: 56,
        prazo: "2024-03-15",
      },
    ]

    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        {/* TASK 1: Header compacto do gestor */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-sm font-bold">
                  {user.nome?.split(" ").map((n) => n[0]).join("") || "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{user.nome}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {user.cargo}
                  </p>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="outline" className="h-5">
                    {user.role === "super-admin" ? "Super Admin" : "Gestor de Time"}
                  </Badge>
                  {user.departamento && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <p className="text-sm text-muted-foreground">{user.departamento}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TASK 2: SAÚDE DO TIME HOJE - ABOVE THE FOLD */}
        <Card className="clay-card border-0 shadow-md mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Saúde do Time Hoje</CardTitle>
            <CardDescription>Indicadores em tempo real</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Engajamento Médio</span>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">78%</p>
                <p className="text-xs text-muted-foreground mt-1">Últimos 7 dias</p>
              </div>

              <div className="rounded-lg bg-chart-2/5 border border-chart-2/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Humor do Time</span>
                  <Heart className="h-4 w-4 text-chart-2" />
                </div>
                <p className="text-3xl font-bold text-chart-2">Positivo</p>
                <p className="text-xs text-muted-foreground mt-1">85 registros hoje</p>
              </div>

              <div className="rounded-lg bg-accent/5 border-2 border-accent/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Alertas Ativos</span>
                  <AlertCircle className="h-4 w-4 text-accent" />
                </div>
                <p className="text-3xl font-bold text-accent">3</p>
                <p className="text-xs text-muted-foreground mt-1">Requerem atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TASK 3: O QUE VOCÊ DEVE ACOMPANHAR AGORA - ABOVE THE FOLD */}
        <Card className="clay-card border-0 border-l-4 border-l-accent shadow-md mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              <CardTitle className="text-xl">O que você deve acompanhar agora</CardTitle>
            </div>
            <CardDescription>Ações prioritárias para decisão imediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="h-5 text-xs">Alta</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">Queda de 15% no engajamento</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      3 colaboradores inativos há 7+ dias
                    </p>
                  </div>
                  <Link href="/inteligencia">
                    <Button size="sm" variant="outline" className="bg-transparent h-8 text-xs">
                      Agir
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="h-5 text-xs">Média</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">Feedbacks pendentes de aprovação</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      5 feedbacks aguardam há 48h+
                    </p>
                  </div>
                  <Link href="/feedbacks">
                    <Button size="sm" variant="outline" className="bg-transparent h-8 text-xs">
                      Revisar
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="h-5 text-xs">Baixa</Badge>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">Meta próxima do prazo</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vence em 5 dias
                    </p>
                  </div>
                  <Link href="/analytics?tab=metas">
                    <Button size="sm" variant="outline" className="bg-transparent h-8 text-xs">
                      Ver
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TASK 4: MISSÃO DO DIA - DESTAQUE FUNCIONAL */}
        <Card className="clay-card border-0 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Missão do Dia Ativa</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/gestor/criar-missao-do-dia">
                  <Button size="sm" variant="outline" className="bg-transparent h-8 text-xs">
                    Editar
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button size="sm" variant="outline" className="bg-transparent h-8 text-xs">
                    Calendário
                  </Button>
                </Link>
              </div>
            </div>
            <CardDescription>Estímulo diário configurado para o time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-3">
              <h3 className="font-semibold text-foreground text-sm mb-1">{missaoDoDiaAtiva.titulo}</h3>
              <p className="text-xs text-muted-foreground mb-2">{missaoDoDiaAtiva.descricao}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                Ativa desde {new Date(missaoDoDiaAtiva.dataAtivacao).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TASK 5 e 6: Grid de acompanhamento */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* TASK 5: SUAS CRIAÇÕES - MONITORAMENTO */}
            <Card className="clay-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Suas Criações</CardTitle>
                  </div>
                  <Link href="/admin">
                    <Button size="sm" className="clay-button h-8">
                      <Sparkles className="mr-2 h-3 w-3" />
                      Criar
                    </Button>
                  </Link>
                </div>
                <CardDescription>
                  Campanhas, treinamentos e pesquisas em acompanhamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {criacoesMock.map((criacao) => {
                    const badgeVariant =
                      criacao.type === "campanha"
                        ? "default"
                        : criacao.type === "treinamento"
                          ? "outline"
                          : "secondary"

                    const icon =
                      criacao.type === "campanha" ? (
                        <Zap className="h-3 w-3" />
                      ) : criacao.type === "treinamento" ? (
                        <GraduationCap className="h-3 w-3" />
                      ) : (
                        <ClipboardList className="h-3 w-3" />
                      )

                    return (
                      <div
                        key={criacao.id}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={badgeVariant} className="flex items-center gap-1 text-xs h-5">
                              {icon}
                              {criacao.type === "campanha"
                                ? "Campanha"
                                : criacao.type === "treinamento"
                                  ? "Treinamento"
                                  : "Pesquisa"}
                            </Badge>
                          </div>
                          <span className="text-xs font-semibold text-primary">{criacao.progresso}%</span>
                        </div>

                        <h4 className="font-semibold text-foreground text-sm mb-1">{criacao.nome}</h4>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            <Users className="inline h-3 w-3 mr-1" />
                            {criacao.usuariosVinculados} usuários
                          </span>
                          <Link href="/analytics">
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
                              Detalhes
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* TASK 6: METAS DO TIME - ACOMPANHAMENTO CONTÍNUO */}
            <Card className="clay-card border-0 border-l-4 border-l-primary relative opacity-60 grayscale pointer-events-none">
              <Badge className="absolute right-3 top-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Em breve
              </Badge>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Metas do Time</CardTitle>
                  </div>
                  <Badge variant="secondary" className="h-5 text-xs">{metasAtivas.length} ativas</Badge>
                </div>
                <CardDescription>Progresso contínuo das metas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metasAtivas.map((meta) => {
                    const prazoDate = new Date(meta.prazo)
                    const hoje = new Date()
                    const diasRestantes = Math.ceil((prazoDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                    
                    let statusVariant: "default" | "outline" | "destructive" = "outline"
                    let statusLabel = "Em dia"
                    
                    if (meta.progressoTime >= 80) {
                      statusVariant = "default"
                      statusLabel = "Em dia"
                    } else if (diasRestantes <= 7 && meta.progressoTime < 70) {
                      statusVariant = "destructive"
                      statusLabel = "Risco"
                    } else if (meta.progressoTime < 50) {
                      statusVariant = "outline"
                      statusLabel = "Atenção"
                    }

                    return (
                      <div key={meta.id} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground text-sm mb-1">{meta.nome}</h4>
                            <p className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {diasRestantes} dias restantes
                            </p>
                          </div>
                          <Badge variant={statusVariant} className="h-5 text-xs">
                            {statusLabel}
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold text-primary">{meta.progressoTime}%</span>
                          </div>
                          <Progress value={meta.progressoTime} className="h-1.5" />
                        </div>

                        <Button variant="ghost" size="sm" className="mt-2 w-full h-7 text-xs" disabled>
                          Ver detalhes
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral - Métricas de apoio */}
          <div className="space-y-6">
            <Card className="clay-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Métricas Rápidas</CardTitle>
                <CardDescription>Resumo de atividade do seu time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-chart-1/10 border border-chart-1/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Criações Ativas</span>
                    <Zap className="h-3 w-3 text-chart-1" />
                  </div>
                  <p className="text-2xl font-bold text-chart-1">{criacoesMock.length}</p>
                </div>

                <div className="rounded-lg bg-chart-2/10 border border-chart-2/30 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Colaboradores ativos do time</span>
                    <Users className="h-3 w-3 text-chart-2" />
                  </div>
                  <p className="text-2xl font-bold text-chart-2">42</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Fallback
  return null
}
