"use client"

import { Label } from "@/components/ui/label"

import { DialogDescription } from "@/components/ui/dialog"

export const dynamic = "force-dynamic"

import { Suspense, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { EngajamentoService } from "@/lib/engajamento-service"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Building2,
  Calendar,
  CalendarIcon,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  GraduationCap,
  MessageSquare,
  Minus,
  Smile,
  Trophy,
  TrendingUp,
  Users,
  X,
  Zap,
  Clock,
  Filter,
  Search,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AnalyticsService } from "@/lib/analytics-service"
import { HumorAnalyticsService } from "@/lib/humor-analytics-service"
import { FeedbackAnalyticsService } from "@/lib/feedback-analytics-service"
import { SurveyAnalyticsService } from "@/lib/survey-analytics-service"
import { TrainingAnalyticsService } from "@/lib/training-analytics-service"
import { SurveyService } from "@/lib/survey-service"
import { FeedSocialService } from "@/lib/feed-social-service"
import type { FeedUserActivity } from "@/lib/feed-social-service"
import { ExportUtils, type ExportColumn } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"
import { LojinhaProfissionalService } from "@/lib/lojinha-profissional-service"
import { FeedbackApprovalPanel } from "@/components/feedback-approval-panel"
import { FeedSocialApprovalPanel } from "@/components/feed-social-approval-panel"

function CampanhasAnalytics({ user }: { user: any }) {
  const [selectedCampanha, setSelectedCampanha] = useState<string | null>(null)
  const [filtroNome, setFiltroNome] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroTime, setFiltroTime] = useState("todos")
  const [filtroCriador, setFiltroCriador] = useState("todos")
  const [campanhaTab, setCampanhaTab] = useState("visao-geral")

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  // Obter todas as campanhas
  const todasCampanhas = EngajamentoService.getAllEngajamentos().filter((e) => e.type === "campanha")

  // Filtrar campanhas baseado em permissões
  const campanhas = useMemo(() => {
    let filtered = todasCampanhas

    // Filtrar por permissão
    if (isGestor && !isSuperAdmin) {
      // Gestor vê apenas suas próprias campanhas
      filtered = filtered.filter((c) => c.createdBy === user.id)
    }
    // Super Admin vê todas

    // Aplicar filtros
    if (filtroNome) {
      filtered = filtered.filter((c) => c.title.toLowerCase().includes(filtroNome.toLowerCase()))
    }

    if (filtroStatus !== "todos") {
      filtered = filtered.filter((c) => (filtroStatus === "ativa" ? c.isActive : !c.isActive))
    }

    return filtered
  }, [todasCampanhas, isGestor, isSuperAdmin, user?.id, filtroNome, filtroStatus])

  // Calcular métricas da campanha selecionada
  const campanhaDetalhes = useMemo(() => {
    if (!selectedCampanha) return null

    const campanha = EngajamentoService.getEngajamentoById(selectedCampanha)
    if (!campanha) return null

    // Obter todos os participantes (mock - em produção viria do banco)
    const participants = ["2", "3", "4", "5"] // IDs de usuários mock
    
    const progressData = participants.map((userId) => {
      const progress = EngajamentoService.getParticipantProgress(selectedCampanha, userId)
      return {
        userId,
        progress: progress || {
          completedActions: [],
          progressPercentage: 0,
          engagementStatus: "nao_iniciado",
          lastInteraction: null,
        },
      }
    })

    const concluidos = progressData.filter((p) => p.progress.engagementStatus === "concluido").length
    const emAndamento = progressData.filter((p) => p.progress.engagementStatus === "em_andamento").length
    const naoIniciados = progressData.filter((p) => p.progress.engagementStatus === "nao_iniciado").length

    const progressoGeral =
      progressData.reduce((acc, p) => acc + p.progress.progressPercentage, 0) / progressData.length

    // Progresso por ação
    const acoesCampanha = campanha.validationRules?.requiredActions || []
    const acoesProgresso = acoesCampanha.map((acao) => {
      const usuariosConcluiram = progressData.filter((p) => 
        p.progress.completedActions.includes(acao)
      ).length
      
      return {
        acao,
        obrigatoria: true, // Todas em requiredActions são obrigatórias
        usuariosConcluiram,
        usuariosPendentes: participants.length - usuariosConcluiram,
        percentual: (usuariosConcluiram / participants.length) * 100,
      }
    })

    // Dados dos usuários
    const usuariosData = progressData.map((p) => {
      const mockUsers = [
        { id: "2", nome: "Ana Silva", avatar: "/placeholder.svg" },
        { id: "3", nome: "Carlos Oliveira", avatar: "/placeholder.svg" },
        { id: "4", nome: "Diana Santos", avatar: "/placeholder.svg" },
        { id: "5", nome: "Eduardo Lima", avatar: "/placeholder.svg" },
      ]
      
      const userInfo = mockUsers.find((u) => u.id === p.userId) || { nome: "Usuário", avatar: "" }
      
      const lastAction = p.progress.completedActions[p.progress.completedActions.length - 1] || "Nenhuma"
      const nextAction = acoesCampanha.find((a) => !p.progress.completedActions.includes(a)) || "Todas concluídas"

      return {
        ...userInfo,
        statusGeral: p.progress.engagementStatus,
        progressPercentage: p.progress.progressPercentage,
        ultimaAcao: lastAction,
        proximaAcao: nextAction === "Todas concluídas" ? nextAction : nextAction,
        dataUltimaInteracao: p.progress.lastInteraction
          ? new Date(p.progress.lastInteraction).toLocaleDateString("pt-BR")
          : "Nunca",
        visualizou: p.progress.engagementStatus !== "nao_iniciado",
      }
    })

    return {
      campanha,
      progressoGeral,
      concluidos,
      emAndamento,
      naoIniciados,
      totalUsuarios: participants.length,
      acoesProgresso,
      usuariosData,
    }
  }, [selectedCampanha])

  return (
    <div className="space-y-6">
      {/* Visão 1 - Lista de Campanhas */}
      {!selectedCampanha ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Campanhas</h2>
              <p className="text-sm text-muted-foreground">
                {isSuperAdmin
                  ? "Análise de todas as campanhas da empresa"
                  : "Análise das campanhas criadas por você"}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filtros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Nome da Campanha</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={filtroNome}
                      onChange={(e) => setFiltroNome(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativa">Ativas</SelectItem>
                      <SelectItem value="finalizada">Finalizadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isSuperAdmin && (
                  <>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select value={filtroTime} onValueChange={setFiltroTime}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Times</SelectItem>
                          <SelectItem value="criativo">Time Criativo</SelectItem>
                          <SelectItem value="vendas">Time de Vendas</SelectItem>
                          <SelectItem value="tech">Time Tech</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Criador</Label>
                      <Select value={filtroCriador} onValueChange={setFiltroCriador}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="gestor1">Gestor 1</SelectItem>
                          <SelectItem value="gestor2">Gestor 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Campanhas */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Lista de Campanhas</CardTitle>
              <CardDescription>{campanhas.length} campanhas encontradas</CardDescription>
            </CardHeader>
            <CardContent>
              {campanhas.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-semibold text-foreground">Nenhuma campanha encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isGestor ? "Crie sua primeira campanha no painel administrativo" : "Ajuste os filtros"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Conclusão Geral</TableHead>
                      <TableHead className="text-right">Usuários Vinculados</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campanhas.map((campanha) => {
                      // Mock de cálculo de progresso (em produção seria real)
                      const progressoMock = Math.floor(Math.random() * 100)
                      const usuariosVinculados = 12 // Mock

                      return (
                        <TableRow key={campanha.id}>
                          <TableCell className="font-medium">{campanha.title}</TableCell>
                          <TableCell>
                            <Badge variant={campanha.isActive ? "default" : "secondary"}>
                              {campanha.isActive ? "Ativa" : "Finalizada"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {campanha.startDate && campanha.endDate
                              ? `${new Date(campanha.startDate).toLocaleDateString("pt-BR")} - ${new Date(campanha.endDate).toLocaleDateString("pt-BR")}`
                              : "Sem prazo definido"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Progress value={progressoMock} className="w-16" />
                              <span className="text-sm font-semibold">{progressoMock}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{usuariosVinculados}</TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCampanha(campanha.id)}
                              className="bg-transparent"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Visão 2 - Detalhe da Campanha */
        campanhaDetalhes && (
          <>
            {/* Header com botão voltar */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedCampanha(null)} className="bg-transparent">
                <ArrowDown className="h-4 w-4 mr-2 rotate-90" />
                Voltar
              </Button>
              <div>
                <h2 className="text-2xl font-bold">{campanhaDetalhes.campanha.title}</h2>
                <p className="text-sm text-muted-foreground">{campanhaDetalhes.campanha.description}</p>
              </div>
            </div>

            {/* Tabs do detalhe */}
            <Tabs value={campanhaTab} onValueChange={setCampanhaTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                <TabsTrigger value="progresso-acao">Progresso por Ação</TabsTrigger>
                <TabsTrigger value="usuarios">Usuários</TabsTrigger>
              </TabsList>

              {/* Aba 1 - Visão Geral */}
              <TabsContent value="visao-geral" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary">{Math.round(campanhaDetalhes.progressoGeral)}%</p>
                        <p className="text-sm text-muted-foreground mt-1">Progresso Geral</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-chart-1">{campanhaDetalhes.concluidos}</p>
                        <p className="text-sm text-muted-foreground mt-1">Concluídos</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-accent">{campanhaDetalhes.emAndamento}</p>
                        <p className="text-sm text-muted-foreground mt-1">Em Andamento</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-muted-foreground">{campanhaDetalhes.naoIniciados}</p>
                        <p className="text-sm text-muted-foreground mt-1">Não Iniciados</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Gráfico de Progresso do Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Concluídos</span>
                          <span className="font-semibold">
                            {campanhaDetalhes.concluidos} / {campanhaDetalhes.totalUsuarios}
                          </span>
                        </div>
                        <Progress
                          value={(campanhaDetalhes.concluidos / campanhaDetalhes.totalUsuarios) * 100}
                          className="h-3"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Em Andamento</span>
                          <span className="font-semibold">
                            {campanhaDetalhes.emAndamento} / {campanhaDetalhes.totalUsuarios}
                          </span>
                        </div>
                        <Progress
                          value={(campanhaDetalhes.emAndamento / campanhaDetalhes.totalUsuarios) * 100}
                          className="h-3 [&>div]:bg-accent"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Não Iniciados</span>
                          <span className="font-semibold">
                            {campanhaDetalhes.naoIniciados} / {campanhaDetalhes.totalUsuarios}
                          </span>
                        </div>
                        <Progress
                          value={(campanhaDetalhes.naoIniciados / campanhaDetalhes.totalUsuarios) * 100}
                          className="h-3 [&>div]:bg-muted-foreground"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba 2 - Progresso por Ação */}
              <TabsContent value="progresso-acao" className="space-y-6">
                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Ações da Campanha</CardTitle>
                    <CardDescription>Progresso individual de cada ação obrigatória</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {campanhaDetalhes.acoesProgresso.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma ação obrigatória definida
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {campanhaDetalhes.acoesProgresso.map((acao, index) => (
                          <div key={index} className="rounded-lg border border-border p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{acao.acao}</h4>
                                  <Badge variant="default" className="text-xs">
                                    Obrigatória
                                  </Badge>
                                </div>
                              </div>
                              <span className="text-2xl font-bold text-primary">{Math.round(acao.percentual)}%</span>
                            </div>

                            <div className="space-y-2">
                              <Progress value={acao.percentual} className="h-2" />
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                  <CheckCircle2 className="inline h-3 w-3 mr-1 text-primary" />
                                  {acao.usuariosConcluiram} concluíram
                                </span>
                                <span>
                                  <Clock className="inline h-3 w-3 mr-1" />
                                  {acao.usuariosPendentes} pendentes
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba 3 - Usuários */}
              <TabsContent value="usuarios" className="space-y-6">
                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Participantes da Campanha</CardTitle>
                    <CardDescription>
                      {campanhaDetalhes.totalUsuarios} colaboradores vinculados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Colaborador</TableHead>
                          <TableHead>Status Geral</TableHead>
                          <TableHead>Progresso</TableHead>
                          <TableHead>Última Ação</TableHead>
                          <TableHead>Próxima Ação</TableHead>
                          <TableHead>Última Interação</TableHead>
                          <TableHead className="text-center">Visualizou</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campanhaDetalhes.usuariosData.map((usuario) => (
                          <TableRow key={usuario.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={usuario.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{usuario.nome.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{usuario.nome}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  usuario.statusGeral === "concluido"
                                    ? "default"
                                    : usuario.statusGeral === "em_andamento"
                                      ? "outline"
                                      : "secondary"
                                }
                              >
                                {usuario.statusGeral === "concluido"
                                  ? "Concluído"
                                  : usuario.statusGeral === "em_andamento"
                                    ? "Em andamento"
                                    : "Não iniciado"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={usuario.progressPercentage} className="w-16" />
                                <span className="text-sm font-semibold">{usuario.progressPercentage}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {usuario.ultimaAcao}
                            </TableCell>
                            <TableCell className="text-sm font-medium max-w-[200px] truncate">
                              {usuario.proximaAcao}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {usuario.dataUltimaInteracao}
                            </TableCell>
                            <TableCell className="text-center">
                              {usuario.visualizou ? (
                                <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-muted-foreground mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )
      )}
    </div>
  )
}

function FeedSocialAnalytics({ user }: { user: any }) {
  const [selectedTeam, setSelectedTeam] = useState<string>("todos")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30")
  const [selectedUser, setSelectedUser] = useState<FeedUserActivity | null>(null)

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  const getUserIds = (): string[] => {
    if (!user) return []

    if (isSuperAdmin) {
      if (selectedTeam === "todos") {
        return ["2", "3", "4", "5"] // Todos os usuários
      } else {
        return user.timeGerenciado || []
      }
    } else if (isGestor) {
      return user.timeGerenciado || []
    }

    return [user.id]
  }

  const userIds = getUserIds()

  const metrics = useMemo(() => {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return {
        totalPostagens: 0,
        totalComentarios: 0,
        totalCurtidas: 0,
        totalCompartilhamentos: 0,
        usuariosAtivos: 0,
        taxaEngajamento: 0,
      }
    }
    return FeedSocialService.getFeedMetrics(userIds)
  }, [userIds])

  const userActivities = useMemo(() => {
    if (!Array.isArray(userIds) || userIds.length === 0) return []
    return FeedSocialService.getUserActivities(userIds)
  }, [userIds])

  const feedContents = useMemo(() => {
    if (!Array.isArray(userIds) || userIds.length === 0) return []
    return FeedSocialService.getFeedContents(userIds)
  }, [userIds])

  const inactiveUsers = useMemo(() => {
    if (!Array.isArray(userIds) || userIds.length === 0) return []
    return FeedSocialService.getInactiveUsers(userIds)
  }, [userIds])

  const postsEvolution = useMemo(() => {
    if (!Array.isArray(userIds) || userIds.length === 0) return []
    return FeedSocialService.getPostsEvolution(userIds, Number.parseInt(selectedPeriod))
  }, [userIds, selectedPeriod])

  const engagementByTeam = useMemo(() => {
    if (!isSuperAdmin) return []
    return FeedSocialService.getEngagementByTeam()
  }, [isSuperAdmin])

  return (
    <div className="space-y-6">
      {isSuperAdmin && (
        <div className="clay-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Filtros</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="todos">Todos os Times</option>
                <option value="criativo">Time Criativo</option>
                <option value="vendas">Time de Vendas</option>
                <option value="tech">Time de Tecnologia</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div className="clay-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total de Postagens</p>
            <p className="text-3xl font-bold">{metrics.totalPostagens}</p>
          </div>
        </div>
        <div className="clay-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total de Comentários</p>
            <p className="text-3xl font-bold">{metrics.totalComentarios}</p>
          </div>
        </div>
        <div className="clay-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total de Curtidas</p>
            <p className="text-3xl font-bold">{metrics.totalCurtidas}</p>
          </div>
        </div>
        <div className="clay-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Compartilhamentos</p>
            <p className="text-3xl font-bold">{metrics.totalCompartilhamentos}</p>
          </div>
        </div>
        <div className="clay-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Usuários Ativos</p>
            <p className="text-3xl font-bold">{metrics.usuariosAtivos}</p>
          </div>
        </div>
        <div className="clay-card p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Taxa de Engajamento</p>
            <p className="text-3xl font-bold">{metrics.taxaEngajamento}</p>
          </div>
        </div>
      </div>

      <div className="clay-card p-6">
        <h3 className="text-lg font-semibold mb-4">Evolução de Postagens e Interações</h3>
        <div className="h-[300px] flex items-end gap-2">
          {postsEvolution.length > 0 ? (
            postsEvolution.map((day, index) => {
              const maxValue = Math.max(...postsEvolution.map((d) => Math.max(d.postagens, d.interacoes)))
              const postagensHeight = maxValue > 0 ? (day.postagens / maxValue) * 100 : 0
              const interacoesHeight = maxValue > 0 ? (day.interacoes / maxValue) * 100 : 0

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/20 rounded-t"
                    style={{ height: `${postagensHeight}%`, minHeight: day.postagens > 0 ? "4px" : "0" }}
                  />
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${interacoesHeight}%`, minHeight: day.interacoes > 0 ? "4px" : "0" }}
                  />
                </div>
              )
            })
          ) : (
            <div className="w-full flex items-center justify-center text-muted-foreground">Nenhum dado disponível</div>
          )}
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary/20 rounded" />
            <span>Postagens</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded" />
            <span>Interações</span>
          </div>
        </div>
      </div>

      {isSuperAdmin && engagementByTeam.length > 0 && (
        <div className="clay-card p-6">
          <h3 className="text-lg font-semibold mb-4">Engajamento por Time</h3>
          <div className="space-y-4">
            {engagementByTeam.map((team, index) => {
              const maxEngagement = engagementByTeam[0]?.engajamento || 1
              const percentage = (team.engajamento / maxEngagement) * 100

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{team.time}</span>
                    <span className="text-muted-foreground">
                      {team.postagens} postagens • {team.engajamento} interações
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="clay-card p-6">
        <h3 className="text-lg font-semibold mb-4">Atividade por Colaborador</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Nome</th>
                <th className="text-left py-3 px-4">Time</th>
                <th className="text-right py-3 px-4">Postagens</th>
                <th className="text-right py-3 px-4">Comentários</th>
                <th className="text-right py-3 px-4">Curtidas</th>
                <th className="text-right py-3 px-4">Compartilhamentos</th>
                <th className="text-left py-3 px-4">Última Interação</th>
                <th className="text-center py-3 px-4">Status</th>
                <th className="text-center py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {userActivities.length > 0 ? (
                userActivities.map((activity, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{activity.nome}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{activity.departamento}</td>
                    <td className="py-3 px-4 text-right">{activity.totalPostagens}</td>
                    <td className="py-3 px-4 text-right">{activity.totalComentarios}</td>
                    <td className="py-3 px-4 text-right">{activity.totalCurtidas}</td>
                    <td className="py-3 px-4 text-right">{activity.totalCompartilhamentos}</td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(activity.ultimaInteracao).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          activity.statusAtividade === "ativo"
                            ? "bg-green-100 text-green-700"
                            : activity.statusAtividade === "moderado"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {activity.statusAtividade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedUser(activity)}
                        className="text-primary hover:underline text-sm"
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Nenhuma atividade encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inactiveUsers.length > 0 && (
        <div className="clay-card p-6">
          <h3 className="text-lg font-semibold mb-4">Usuários Inativos no Feed</h3>
          <div className="space-y-2">
            {inactiveUsers.map((user, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <div>
                  <p className="font-medium">{user.nome}</p>
                  <p className="text-sm text-muted-foreground">{user.departamento}</p>
                </div>
                <p className="text-sm text-muted-foreground">{user.diasInativo} dias inativo</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Detalhes - {selectedUser.nome}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Postagens</p>
                  <p className="text-2xl font-bold">{selectedUser.totalPostagens}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Comentários</p>
                  <p className="text-2xl font-bold">{selectedUser.totalComentarios}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Curtidas</p>
                  <p className="text-2xl font-bold">{selectedUser.totalCurtidas}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Engajamento Recebido</p>
                  <p className="text-2xl font-bold">{selectedUser.engajamentoRecebido}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status de Atividade</p>
                <p className="text-lg font-semibold capitalize">{selectedUser.statusAtividade}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function HumorAnalytics({ user }: { user: any }) {
  const [selectedTeam, setSelectedTeam] = useState<string>("todos")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30")
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const { toast } = useToast()

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  const teamFilter = isSuperAdmin && selectedTeam !== "todos" ? selectedTeam : user?.departamento || ""
  const metrics = useMemo(() => HumorAnalyticsService.getMetrics(teamFilter), [teamFilter])
  const userAnalytics = useMemo(() => HumorAnalyticsService.getUserAnalytics(teamFilter), [teamFilter])

  const handleExportHumor = () => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Departamento", key: "departamento" },
      { header: "Humor Médio", key: "humorMedio", format: (v) => v?.toFixed(1) || "N/A" },
      { header: "Total Registros", key: "totalRegistros" },
      { header: "Último Registro", key: "ultimoRegistro", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
      { header: "Tendência", key: "tendencia" },
    ]

    const filename = isSuperAdmin
      ? `humor-analise-${selectedTeam === "todos" ? "todos" : selectedTeam}`
      : `humor-analise-meu-time`

    ExportUtils.exportToCSV(userAnalytics, columns, filename)
    toast({
      title: "Exportação concluída!",
      description: "Arquivo CSV gerado com sucesso",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics de Humor</h2>
          <p className="text-sm text-muted-foreground">
            Análise do clima organizacional e bem-estar dos colaboradores
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Times</SelectItem>
                <SelectItem value="Time Criativo">Time Criativo</SelectItem>
                <SelectItem value="Time Tech">Time Tech</SelectItem>
                <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={handleExportHumor} variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Extrair Dados
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Smile className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics?.mediaMensal?.toFixed(1) || "0.0"}/5.0</p>
                <p className="text-sm text-muted-foreground">Humor Médio Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-1/20">
                <Users className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics?.totalRegistros || 0}</p>
                <p className="text-sm text-muted-foreground">Total de Registros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics?.usuariosAtivos || 0}</p>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-3/20">
                <CheckCircle2 className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics?.taxaParticipacao || 0}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Participação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal */}
      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Evolução do Humor (Últimos 30 dias)</CardTitle>
          <CardDescription>Acompanhamento diário da média de humor registrada</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={metrics?.evolucaoTemporal || []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="data" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="media"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Humor Médio"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Análise por Colaborador</CardTitle>
          <CardDescription>Histórico e tendências individuais de humor</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Humor Médio</TableHead>
                <TableHead>Total Registros</TableHead>
                <TableHead>Último Registro</TableHead>
                <TableHead>Tendência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(userAnalytics || []).map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={usuario.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{usuario.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{usuario.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.departamento}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        usuario.humorMedio >= 4
                          ? "bg-green-100 text-green-700"
                          : usuario.humorMedio >= 3
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                      }
                    >
                      {usuario.humorMedio.toFixed(1)}/5.0
                    </Badge>
                  </TableCell>
                  <TableCell>{usuario.totalRegistros}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(usuario.ultimoRegistro).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        usuario.tendencia === "alta"
                          ? "default"
                          : usuario.tendencia === "estavel"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {usuario.tendencia === "alta" ? "Em Alta" : usuario.tendencia === "estavel" ? "Estável" : "Em Queda"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(usuario)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!userAnalytics || userAnalytics.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum registro de humor encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes - {selectedUser.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Humor Médio</p>
                  <p className="text-2xl font-bold">{selectedUser.humorMedio.toFixed(1)}/5.0</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Registros</p>
                  <p className="text-2xl font-bold">{selectedUser.totalRegistros}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tendência</p>
                <p className="text-lg font-semibold capitalize">{selectedUser.tendencia}</p>
              </div>
              <Button onClick={() => setSelectedUser(null)} className="w-full">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function FeedbackAnalytics({ user }: { user: any }) {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedTeam, setSelectedTeam] = useState<string>("Todos")
  const [selectedPeriod, setSelectedPeriod] = useState<number>(30)
  const { toast } = useToast()

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  const feedbackAnalytics = useMemo(() => {
    const teamFilter = isSuperAdmin ? selectedTeam : user?.departamento || ""
    return FeedbackAnalyticsService.getGeneralAnalytics(teamFilter, selectedPeriod)
  }, [selectedTeam, selectedPeriod, isSuperAdmin, user?.departamento])

  const feedbackUsuarios = useMemo(() => {
    if (!feedbackAnalytics) return []
    const usuarios = feedbackAnalytics.usuariosPorTime[isSuperAdmin ? selectedTeam : user?.departamento || ""] || []

    if (!sortColumn) return usuarios

    const sorted = [...usuarios].sort((a, b) => {
      const aValue = a[sortColumn as keyof typeof a]
      const bValue = b[sortColumn as keyof typeof b]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return sorted
  }, [feedbackAnalytics, sortColumn, sortDirection, isSuperAdmin, selectedTeam, user?.departamento])

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const handleExport = () => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Time", key: "time" },
      { header: "Enviados", key: "feedbacksEnviados" },
      { header: "Recebidos", key: "feedbacksRecebidos" },
      { header: "Taxa Resposta (%)", key: "taxaResposta", format: (v) => v?.toFixed(1) || "0" },
      { header: "Média Recebida", key: "mediaRecebida", format: (v) => v?.toFixed(1) || "N/A" },
      { header: "Última Atividade", key: "ultimaAtividade", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
    ]

    const filename = isSuperAdmin ? "feedbacks_colaboradores_todos" : "feedbacks_colaboradores_meu_time"

    ExportUtils.exportToCSV(feedbackUsuarios, columns, filename)
    toast({
      title: "Exportação concluída!",
      description: "Arquivo CSV gerado com sucesso",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics de Feedbacks</h2>
          <p className="text-sm text-muted-foreground">Análise de envio e recebimento de feedbacks</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os Times</SelectItem>
                  <SelectItem value="Time Criativo">Time Criativo</SelectItem>
                  <SelectItem value="Time Tech">Time Tech</SelectItem>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPeriod.toString()} onValueChange={(v) => setSelectedPeriod(Number(v))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Extrair Dados
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{feedbackAnalytics?.totalEnviados || 0}</p>
                <p className="text-sm text-muted-foreground">Total Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-1/20">
                <CheckCircle2 className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{feedbackAnalytics?.taxaRespostaMedia || 0}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{feedbackAnalytics?.usuariosAtivos || 0}</p>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-3/20">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {feedbackAnalytics?.mediaAvaliacoes?.toFixed(1) || "0.0"}
                </p>
                <p className="text-sm text-muted-foreground">Média de Avaliações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Participação por Colaborador</CardTitle>
          <CardDescription>Envio e recebimento de feedbacks</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("feedbacksEnviados")}>
                  Enviados {sortColumn === "feedbacksEnviados" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("feedbacksRecebidos")}
                >
                  Recebidos {sortColumn === "feedbacksRecebidos" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("taxaResposta")}>
                  Taxa {sortColumn === "taxaResposta" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSort("mediaRecebida")}>
                  Média {sortColumn === "mediaRecebida" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(feedbackUsuarios || []).map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={usuario.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{usuario.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{usuario.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.time}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{usuario.feedbacksEnviados}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{usuario.feedbacksRecebidos}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={usuario.taxaResposta} className="w-16" />
                      <span className="text-sm font-medium">{usuario.taxaResposta}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        usuario.mediaRecebida >= 4
                          ? "bg-green-100 text-green-700"
                          : usuario.mediaRecebida >= 3
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                      }
                    >
                      {usuario.mediaRecebida?.toFixed(1) || "0.0"}/5.0
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{usuario.ultimaAtividade}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(usuario)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!feedbackUsuarios || feedbackUsuarios.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum dado de feedback encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes - {selectedUser.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Feedbacks Enviados</p>
                  <p className="text-2xl font-bold">{selectedUser.feedbacksEnviados}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Feedbacks Recebidos</p>
                  <p className="text-2xl font-bold">{selectedUser.feedbacksRecebidos}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Resposta</p>
                  <p className="text-2xl font-bold">{selectedUser.taxaResposta}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Média Recebida</p>
                  <p className="text-2xl font-bold">{selectedUser.mediaRecebida?.toFixed(1) || "0.0"}/5.0</p>
                </div>
              </div>
              <Button onClick={() => setSelectedUser(null)} className="w-full">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function SurveyAnalytics({ user }: { user: any }) {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  const surveyMetrics = useMemo(() => {
    const analytics = SurveyAnalyticsService.getGeneralAnalytics()

    if (!analytics) {
      return {
        totalCreated: 0,
        totalActive: 0,
        averageParticipationRate: 0,
        activeUsers: 0,
        usageBySurvey: [],
        participationEvolution: [],
        totalParticipation: 0,
        totalCompleted: 0,
        completionRate: 0,
        averageTime: 0,
        inactiveUsers: 0,
      }
    }

    return {
      totalCreated: analytics.totalCriadas,
      totalActive: analytics.totalAtivas,
      averageParticipationRate: analytics.taxaParticipacaoMedia,
      activeUsers: analytics.usuariosAtivos,
      usageBySurvey: analytics.usoPorPesquisa || [],
      participationEvolution: analytics.evolucaoParticipacao || [],
      totalParticipation: analytics.totalParticipacao,
      totalCompleted: analytics.totalConcluidas,
      completionRate: analytics.taxaConclusao,
      averageTime: analytics.tempoMedioResposta,
      inactiveUsers: analytics.usuariosInativos,
    }
  }, [])

  const userAnalytics = useMemo(() => {
    const analytics = SurveyAnalyticsService.getGeneralAnalytics()

    if (!analytics || !analytics.usuariosPorTime) {
      return []
    }

    const teamFilter = isSuperAdmin ? "Todos" : user?.departamento || ""

    if (teamFilter === "Todos") {
      return Object.values(analytics.usuariosPorTime).flat()
    }

    return analytics.usuariosPorTime[teamFilter] || []
  }, [isSuperAdmin, user?.departamento])

  const sortedUsers = useMemo(() => {
    if (!sortColumn || !userAnalytics || !Array.isArray(userAnalytics)) return userAnalytics

    return [...userAnalytics].sort((a, b) => {
      const aValue = a[sortColumn as keyof typeof a]
      const bValue = b[sortColumn as keyof typeof b]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [userAnalytics, sortColumn, sortDirection])

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const handleExport = () => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Time", key: "time" },
      { header: "Pesquisas Respondidas", key: "pesquisasRespondidas" },
      { header: "Pesquisas Pendentes", key: "pesquisasPendentes" },
      { header: "Taxa Participação (%)", key: "taxaParticipacao", format: (v) => v?.toFixed(1) || "0" },
      { header: "XP Ganho", key: "xpGanho" },
      { header: "Última Resposta", key: "ultimaResposta", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
    ]

    const filename = isSuperAdmin ? "pesquisas_participacao_todos" : "pesquisas_participacao_meu_time"

    ExportUtils.exportToCSV(sortedUsers, columns, filename)
    toast({
      title: "Exportação concluída!",
      description: "Arquivo CSV gerado com sucesso",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics de Pesquisas</h2>
          <p className="text-sm text-muted-foreground">
            Análise de participação e engajamento em pesquisas
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Extrair Dados
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{surveyMetrics.totalCreated}</p>
                <p className="text-sm text-muted-foreground">Total de Pesquisas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-1/20">
                <CheckCircle2 className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{surveyMetrics.averageParticipationRate}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Participação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{surveyMetrics.activeUsers}</p>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-3/20">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{surveyMetrics.totalCompleted}</p>
                <p className="text-sm text-muted-foreground">Pesquisas Concluídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Evolução de Participação</CardTitle>
          <CardDescription>Participação nos últimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={surveyMetrics.participationEvolution}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="respostas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Respostas"
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Participação por Colaborador</CardTitle>
          <CardDescription>Histórico e engajamento individual</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Time</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("pesquisasRespondidas")}
                >
                  Respondidas {sortColumn === "pesquisasRespondidas" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Pendentes</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("taxaParticipacao")}
                >
                  Taxa {sortColumn === "taxaParticipacao" && (sortDirection === "asc" ? "↑" : "↓")}
                </TableHead>
                <TableHead>Engajamento</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sortedUsers || []).map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={usuario.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{usuario.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{usuario.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell>{usuario.time}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{usuario.pesquisasRespondidas}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.pesquisasPendentes > 0 ? "destructive" : "secondary"}>
                      {usuario.pesquisasPendentes}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={usuario.taxaParticipacao} className="w-16" />
                      <span className="text-sm font-medium">{usuario.taxaParticipacao}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        usuario.engajamento === "alto"
                          ? "default"
                          : usuario.engajamento === "medio"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {usuario.engajamento === "alto"
                        ? "Alto"
                        : usuario.engajamento === "medio"
                          ? "Médio"
                          : "Baixo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{usuario.ultimaInteracao}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(usuario)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!sortedUsers || sortedUsers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum dado de pesquisa encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{selectedUser.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold">{selectedUser.nome}</div>
                  <div className="text-sm font-normal text-muted-foreground">{selectedUser.time}</div>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="text-2xl font-bold">{selectedUser.pesquisasConcluidas}</div>
                  <div className="text-sm text-muted-foreground">Concluídas</div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="text-2xl font-bold">{selectedUser.pesquisasPendentes}</div>
                  <div className="text-sm text-muted-foreground">Pendentes</div>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="text-2xl font-bold">{selectedUser.taxaParticipacao}%</div>
                  <div className="text-sm text-muted-foreground">Taxa de Participação</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm font-medium">Obrigatórias Pendentes:</span>
                  <Badge variant={selectedUser.obrigatoriasPendentes > 0 ? "destructive" : "secondary"}>
                    {selectedUser.obrigatoriasPendentes}
                  </Badge>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm font-medium">Taxa de Conclusão:</span>
                  <span className="text-sm font-bold">{selectedUser.taxaConclusao}%</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm font-medium">Tempo Médio de Resposta:</span>
                  <span className="text-sm">{selectedUser.tempoMedioResposta} min</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-sm font-medium">Nível de Engajamento:</span>
                  <Badge
                    variant={
                      selectedUser.engajamento === "alto"
                        ? "default"
                        : selectedUser.engajamento === "medio"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {selectedUser.engajamento === "alto"
                      ? "Alto"
                      : selectedUser.engajamento === "medio"
                        ? "Médio"
                        : selectedUser.engajamento === "baixo"
                          ? "Baixo"
                          : "Inativo"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Última Interação:</span>
                  <span className="text-sm">{selectedUser.ultimaInteracao}</span>
                </div>
              </div>

              {selectedUser.pesquisasDetalhes?.respondidas && selectedUser.pesquisasDetalhes.respondidas.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">Histórico de Respostas</h4>
                  <div className="space-y-2 rounded-lg border p-4">
                    {selectedUser.pesquisasDetalhes.respondidas.slice(0, 5).map((response: any) => {
                      const survey = SurveyService.getSurveyById(response.surveyId)
                      return (
                        <div
                          key={response.id}
                          className="flex items-center justify-between border-b pb-2 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{survey?.title || "Pesquisa"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(response.completedAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Badge variant="outline">
                            +{survey?.reward.xp || 0} XP · ⭐ {survey?.reward.stars || 0}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedUser.pesquisasDetalhes?.pendentes && selectedUser.pesquisasDetalhes.pendentes.length > 0 && (
                <div>
                  <h4 className="mb-3 font-semibold">Pesquisas Pendentes</h4>
                  <div className="space-y-2 rounded-lg border p-4">
                    {selectedUser.pesquisasDetalhes.pendentes.slice(0, 5).map((survey: any) => (
                      <div key={survey.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex-1">
                          <p className="font-medium">{survey.title}</p>
                          <p className="text-xs text-muted-foreground">{survey.description}</p>
                        </div>
                        <Badge variant={survey.isRequired ? "destructive" : "secondary"}>
                          {survey.isRequired ? "Obrigatória" : "Opcional"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function RecompensasAnalytics({ user }: { user: any }) {
  const [selectedTeam, setSelectedTeam] = useState<string>("todos")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30")
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel")
  const [exportando, setExportando] = useState(false)
  const { toast } = useToast()

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  // Obter todos os cupons/resgates
  const todosCupons = useMemo(() => LojinhaProfissionalService.getTodosCupons(), [])
  const todosItens = useMemo(() => LojinhaProfissionalService.getAllItens(), [])

  // Filtrar cupons por time se necessário
  const cupons = useMemo(() => {
    if (isSuperAdmin) {
      if (selectedTeam === "todos") {
        return todosCupons
      } else {
        return todosCupons.filter((c) => c.timeId === selectedTeam)
      }
    } else if (isGestor && user?.timeGerenciado) {
      return todosCupons.filter((c) => user.timeGerenciado.includes(c.colaboradorId))
    }
    return []
  }, [todosCupons, selectedTeam, isSuperAdmin, isGestor, user])

  // Métricas principais
  const metrics = useMemo(() => {
    const totalResgatadas = cupons.length
    const pontosUtilizados = cupons.reduce((sum, c) => sum + c.pontosUtilizados, 0)

    // Recompensas mais resgatadas
    const resgatadosPorItem: Record<string, number> = {}
    cupons.forEach((c) => {
      resgatadosPorItem[c.itemNome] = (resgatadosPorItem[c.itemNome] || 0) + 1
    })

    const maisResgatadas = Object.entries(resgatadosPorItem)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade }))

    const menosResgatadas = Object.entries(resgatadosPorItem)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 5)
      .map(([nome, quantidade]) => ({ nome, quantidade }))

    // Evolução temporal (últimos 30 dias)
    const hoje = new Date()
    const evolucao = Array.from({ length: 30 }, (_, i) => {
      const data = new Date(hoje)
      data.setDate(data.getDate() - (29 - i))
      const dataStr = data.toISOString().split("T")[0]

      const resgatesNoDia = cupons.filter((c) => c.dataResgate.startsWith(dataStr)).length

      return {
        data: `${data.getDate()}/${data.getMonth() + 1}`,
        resgates: resgatesNoDia,
      }
    })

    return {
      totalResgatadas,
      pontosUtilizados,
      maisResgatadas,
      menosResgatadas,
      evolucao,
      itensDisponiveis: todosItens.filter((i) => i.status === "ativo").length,
    }
  }, [cupons, todosItens])

  const handleExportData = async () => {
    try {
      setExportando(true)
      toast({
        title: "Iniciando exportação...",
        description: "Preparando dados de recompensas",
      })

      const dados = cupons.map((cupom) => ({
        codigoCupom: cupom.codigoCupom,
        colaboradorNome: cupom.colaboradorNome,
        recompensa: cupom.itemNome,
        categoria: cupom.categoria,
        dataResgate: new Date(cupom.dataResgate).toLocaleDateString("pt-BR"),
        pontosUtilizados: cupom.pontosUtilizados,
        timeId: cupom.timeId,
        status: cupom.status,
      }))

      const columns: ExportColumn[] = [
        { header: "Código Cupom", key: "codigoCupom" },
        { header: "Colaborador", key: "colaboradorNome" },
        { header: "Recompensa", key: "recompensa" },
        { header: "Categoria", key: "categoria" },
        { header: "Data Resgate", key: "dataResgate" },
        { header: "Pontos Utilizados", key: "pontosUtilizados" },
        { header: "Time", key: "timeId" },
        { header: "Status", key: "status" },
      ]

      const filename = isSuperAdmin
        ? `recompensas-analise-${selectedTeam === "todos" ? "todos" : selectedTeam}`
        : `recompensas-analise-meu-time`

      if (exportFormat === "excel") {
        await ExportUtils.exportToExcel(dados, columns, filename, "Recompensas")
        toast({
          title: "Exportação concluída!",
          description: "Arquivo Excel gerado com sucesso",
        })
      } else {
        ExportUtils.exportToCSV(dados, columns, filename)
        toast({
          title: "Exportação concluída!",
          description: "Arquivo CSV gerado com sucesso",
        })
      }

      setShowExportDialog(false)
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Tente novamente ou use formato CSV",
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros e botão de extração */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics de Recompensas</h2>
          <p className="text-sm text-muted-foreground">
            Análise completa de resgates, cupons e uso da lojinha de recompensas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isSuperAdmin && (
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Times</SelectItem>
                <SelectItem value="time-1">Time Comercial</SelectItem>
                <SelectItem value="time-2">Time TI</SelectItem>
                <SelectItem value="time-3">Time Operações</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button onClick={() => setShowExportDialog(true)} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Extrair Dados
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.totalResgatadas}</p>
                <p className="text-sm text-muted-foreground">Total Resgatadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-1/20">
                <TrendingUp className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.pontosUtilizados.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pontos Utilizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{metrics.itensDisponiveis}</p>
                <p className="text-sm text-muted-foreground">Itens Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-3/20">
                <TrendingUp className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {metrics.totalResgatadas > 0 ? (metrics.pontosUtilizados / metrics.totalResgatadas).toFixed(0) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Pontos Médios/Resgate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução Temporal */}
      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Evolução de Resgates (Últimos 30 dias)</CardTitle>
          <CardDescription>Quantidade de recompensas resgatadas por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={metrics.evolucao}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="resgates" stroke="hsl(var(--primary))" strokeWidth={2} name="Resgates" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Mais e Menos Resgatadas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-chart-1" />
              Recompensas Mais Resgatadas
            </CardTitle>
            <CardDescription>Top 5 recompensas com maior procura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.maisResgatadas.map((item, index) => (
                <div key={item.nome} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.nome}</p>
                  </div>
                  <Badge variant="secondary">{item.quantidade} resgates</Badge>
                </div>
              ))}
              {metrics.maisResgatadas.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum resgate ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-chart-3" />
              Recompensas Menos Resgatadas
            </CardTitle>
            <CardDescription>Itens com menor saída (precisam de atenção)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.menosResgatadas.map((item, index) => (
                <div key={item.nome} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3/20 text-sm font-bold text-chart-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.nome}</p>
                  </div>
                  <Badge variant="outline">{item.quantidade} resgates</Badge>
                </div>
              ))}
              {metrics.menosResgatadas.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Nenhum resgate ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resgates Recentes */}
      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Resgates Recentes</CardTitle>
          <CardDescription>Últimos 10 resgates realizados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Colaborador</TableHead>
                <TableHead>Recompensa</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cupons.slice(0, 10).map((cupom) => (
                <TableRow key={cupom.id}>
                  <TableCell className="font-mono text-sm">{cupom.codigoCupom}</TableCell>
                  <TableCell>{cupom.colaboradorNome}</TableCell>
                  <TableCell>{cupom.itemNome}</TableCell>
                  <TableCell>{new Date(cupom.dataResgate).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-bold">{cupom.pontosUtilizados}</TableCell>
                </TableRow>
              ))}
              {cupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum resgate realizado ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Exportação */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extrair Dados de Recompensas</DialogTitle>
            <DialogDescription>
              {isSuperAdmin
                ? "Exportar dados de resgates de todos os gestores ou filtrar por time específico"
                : "Exportar dados de resgates do seu time"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Formato de Exportação</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Dados que serão exportados:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Códigos de cupons</li>
                <li>Colaboradores que resgataram</li>
                <li>Recompensas resgatadas</li>
                <li>Datas de resgate</li>
                <li>Pontos utilizados</li>
                <li>Times relacionados</li>
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Total de registros: {cupons.length}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={exportando}>
              Cancelar
            </Button>
            <Button onClick={handleExportData} disabled={exportando}>
              {exportando ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AnalyticsPageContent() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("visao-geral")
  const [filtroTime, setFiltroTime] = useState("Todos")
  const [filtroPeriodo, setFiltroPeriodo] = useState(30)
  const [humorFilterTime, setHumorFilterTime] = useState("todos")
  const [feedbackFiltroTime, setFeedbackFiltroTime] = useState("Todos")
  const [feedbackFiltroPeriodo, setFeedbackFiltroPeriodo] = useState(30)
  const [sortSurveyColumn, setSortSurveyColumn] = useState<string | null>(null)
  const [sortSurveyDirection, setSortSurveyDirection] = useState<"asc" | "desc">("desc")

  const [showActiveCollaborators, setShowActiveCollaborators] = useState(false)
  const [showCollaboratorDetail, setShowCollaboratorDetail] = useState(false)
  const [selectedCollaborator, setSelectedCollaborator] = useState<any>(null)
  const [showHumorDetailsModal, setShowHumorDetailsModal] = useState(false)
  const [selectedHumorUser, setSelectedHumorUser] = useState<any>(null)
  const [selectedSurveyUser, setSelectedSurveyUser] = useState<any>(null)
  const [feedbackOrdenacao, setFeedbackOrdenacao] = useState<{
    coluna: string | null
    direcao: "asc" | "desc"
  }>({ coluna: null, direcao: "desc" })
  const [trainingFiltroTime, setTrainingFiltroTime] = useState("todos")
  
  // Filtros para tabela de colaboradores
  const [searchName, setSearchName] = useState("")
  const [filterTeam, setFilterTeam] = useState("Todos")
  const [filterEngagement, setFilterEngagement] = useState("todos")

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  const handleExportData = async (data: any[], columns: ExportColumn[], filename: string, sheetName = "Dados") => {
    if (!data || data.length === 0) {
      toast({
        title: "Nenhum dado disponível",
        description: "Não há dados para exportar no momento.",
        variant: "destructive",
      })
      return
    }

    // Mostra dialog para escolher formato
    const format = await new Promise<"csv" | "excel" | null>((resolve) => {
      const dialog = document.createElement("div")
      dialog.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      dialog.innerHTML = `
        <div class="bg-background rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
          <h3 class="text-lg font-semibold">Escolha o formato de exportação</h3>
          <div class="space-y-2">
            <button id="export-excel" class="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90">
              Excel (.xlsx)
            </button>
            <button id="export-csv" class="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90">
              CSV (.csv)
            </button>
            <button id="export-cancel" class="w-full bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/90">
              Cancelar
            </button>
          </div>
        </div>
      `
      document.body.appendChild(dialog)

      dialog.querySelector("#export-excel")?.addEventListener("click", () => {
        document.body.removeChild(dialog)
        resolve("excel")
      })
      dialog.querySelector("#export-csv")?.addEventListener("click", () => {
        document.body.removeChild(dialog)
        resolve("csv")
      })
      dialog.querySelector("#export-cancel")?.addEventListener("click", () => {
        document.body.removeChild(dialog)
        resolve(null)
      })
    })

    if (!format) return

    try {
      toast({
        title: "Exportando dados...",
        description: "Por favor, aguarde.",
      })

      if (format === "excel") {
        await ExportUtils.exportToExcel(data, columns, filename, sheetName)
      } else {
        ExportUtils.exportToCSV(data, columns, filename)
      }

      toast({
        title: "Exportação concluída!",
        description: `Arquivo ${format === "excel" ? "Excel" : "CSV"} baixado com sucesso.`,
      })
    } catch (error) {
      console.error("Erro ao exportar:", error)

      // Fallback para CSV se Excel falhar
      if (format === "excel") {
        try {
          ExportUtils.exportToCSV(data, columns, filename)
          toast({
            title: "Exportado como CSV",
            description: "Excel não disponível. Arquivo CSV baixado.",
          })
        } catch (csvError) {
          toast({
            title: "Erro na exportação",
            description: "Não foi possível exportar os dados.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Erro na exportação",
          description: "Não foi possível exportar os dados.",
          variant: "destructive",
        })
      }
    }
  }

  const exportVisaoGeral = () => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Time", key: "time" },
      { header: "Taxa de Engajamento (%)", key: "taxaEngajamento", format: (v) => v?.toFixed(1) || "0" },
      { header: "Humor Médio", key: "humorMedio", format: (v) => v?.toFixed(1) || "N/A" },
      { header: "XP Total", key: "xpTotal" },
      { header: "Nível", key: "nivel" },
    ]
    handleExportData(filteredCollaborators, columns, "visao_geral_colaboradores", "Visão Geral")
  }

  // Helper para obter userIds para feed social, para evitar repetição
  const getUserIdsForFeed = () => {
    const tempUserIds = isSuperAdmin
      ? filtroTime === "todos"
        ? ["2", "3", "4", "5"]
        : user?.timeGerenciado || []
      : isGestor
        ? user?.timeGerenciado || []
        : ([user?.id].filter(Boolean) as string[])
    return tempUserIds
  }

  const exportFeedSocial = (metrics: any, userActivities: any[]) => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Departamento", key: "departamento" },
      { header: "Total Postagens", key: "totalPostagens" },
      { header: "Total Comentários", key: "totalComentarios" },
      { header: "Total Curtidas", key: "totalCurtidas" },
      { header: "Total Compartilhamentos", key: "totalCompartilhamentos" },
      { header: "Engajamento Recebido", key: "engajamentoRecebido" },
      { header: "Última Interação", key: "ultimaInteracao", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
      { header: "Status", key: "statusAtividade" },
    ]
    handleExportData(userActivities, columns, "feed_social_atividades", "Feed Social")
  }

  const exportHumor = (userAnalytics: any[]) => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Departamento", key: "departamento" },
      { header: "Humor Médio", key: "humorMedio", format: (v) => v?.toFixed(1) || "N/A" },
      { header: "Total Registros", key: "totalRegistros" },
      { header: "Último Registro", key: "ultimoRegistro", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
      { header: "Tendência", key: "tendencia" },
    ]
    handleExportData(userAnalytics, columns, "humor_organizacional", "Humor")
  }

  const exportFeedbacks = (userAnalytics: any[]) => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Time", key: "time" },
      { header: "Enviados", key: "feedbacksEnviados" },
      { header: "Recebidos", key: "feedbacksRecebidos" },
      { header: "Taxa Resposta (%)", key: "taxaResposta", format: (v) => v?.toFixed(1) || "0" },
      { header: "Média Recebida", key: "mediaRecebida", format: (v) => v?.toFixed(1) || "N/A" },
      { header: "Última Atividade", key: "ultimaAtividade", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
    ]
    handleExportData(userAnalytics, columns, "feedbacks_colaboradores", "Feedbacks")
  }

  const exportPesquisas = (userAnalytics: any[]) => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Time", key: "time" },
      { header: "Pesquisas Respondidas", key: "pesquisasRespondidas" },
      { header: "Pesquisas Pendentes", key: "pesquisasPendentes" },
      { header: "Taxa Participação (%)", key: "taxaParticipacao", format: (v) => v?.toFixed(1) || "0" },
      { header: "XP Ganho", key: "xpGanho" },
      { header: "Última Resposta", key: "ultimaResposta", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
    ]
    handleExportData(userAnalytics, columns, "pesquisas_participacao", "Pesquisas")
  }

  const exportTreinamentos = (userAnalytics: any[]) => {
    const columns: ExportColumn[] = [
      { header: "Nome", key: "nome" },
      { header: "Time", key: "time" },
      { header: "Treinamentos Concluídos", key: "treinamentosConcluidos" },
      { header: "Em Progresso", key: "treinamentosEmProgresso" },
      { header: "Taxa Conclusão (%)", key: "taxaConclusao", format: (v) => v?.toFixed(1) || "0" },
      { header: "Horas Treinamento", key: "horasTreinamento", format: (v) => v?.toFixed(1) || "0" },
      { header: "Certificados", key: "certificadosObtidos" },
      { header: "Último Acesso", key: "ultimoAcesso", format: (v) => new Date(v).toLocaleDateString("pt-BR") },
    ]
    handleExportData(userAnalytics, columns, "treinamentos_progresso", "Treinamentos")
  }

  const metricsData = useMemo(() => {
    const kpis = AnalyticsService.getKPIsGlobais()
    const collaborators = AnalyticsService.getAllCollaboratorsEngagement()

    // Guard clauses
    if (!Array.isArray(kpis) || kpis.length === 0) {
      return {
        activeCollaborators: 0,
        totalCollaborators: 0,
        averageEngagement: 0,
        averageHumor: 0,
        participationRate: 0,
      }
    }

    const filteredCollaborators =
      isSuperAdmin && filtroTime !== "Todos"
        ? collaborators.filter((c) => c.time === filtroTime)
        : collaborators.filter((c) => c.time === user?.departamento)

    return {
      activeCollaborators: AnalyticsService.getTotalColaboradoresAtivos(),
      totalCollaborators: collaborators.length,
      averageEngagement: AnalyticsService.getTaxaGeralEngajamento(),
      averageHumor: AnalyticsService.getMediaGeralHumor(),
      participationRate: AnalyticsService.getTaxaGeralParticipacao(),
    }
  }, [filtroTime, filtroPeriodo, isSuperAdmin, user?.departamento])

  const filteredCollaborators = useMemo(() => {
    let collaborators = AnalyticsService.getAllCollaboratorsEngagement()

    // Guard clause
    if (!Array.isArray(collaborators) || collaborators.length === 0) {
      return []
    }

    // Filtro por permissão (superadmin ou gestor)
    if (isSuperAdmin && filtroTime !== "Todos") {
      collaborators = collaborators.filter((c) => c.time === filtroTime)
    } else if (isGestor) {
      collaborators = collaborators.filter((c) => c.time === user?.departamento)
    }

    // Filtro por nome
    if (searchName.trim()) {
      collaborators = collaborators.filter((c) =>
        c.nome.toLowerCase().includes(searchName.toLowerCase())
      )
    }

    // Filtro por time adicional
    if (filterTeam !== "Todos") {
      collaborators = collaborators.filter((c) => c.time === filterTeam)
    }

    // Filtro por engajamento (ordenação)
    if (filterEngagement === "maior") {
      collaborators = [...collaborators].sort((a, b) => b.taxaEngajamento - a.taxaEngajamento)
    } else if (filterEngagement === "menor") {
      collaborators = [...collaborators].sort((a, b) => a.taxaEngajamento - b.taxaEngajamento)
    }

    return collaborators
  }, [filtroTime, isSuperAdmin, isGestor, user?.departamento, searchName, filterTeam, filterEngagement])

  const humorMetrics = useMemo(() => {
    const teamFilter = isSuperAdmin && humorFilterTime !== "todos" ? humorFilterTime : user?.departamento || ""
    return HumorAnalyticsService.getMetrics(teamFilter)
  }, [humorFilterTime, isSuperAdmin, user?.departamento])

  const humorUserAnalytics = useMemo(() => {
    const teamFilter = isSuperAdmin && humorFilterTime !== "todos" ? humorFilterTime : user?.departamento || ""
    return HumorAnalyticsService.getUserAnalytics(teamFilter)
  }, [humorFilterTime, isSuperAdmin, user?.departamento])

  const humorDistribution = useMemo(() => {
    if (!humorMetrics || !humorMetrics.distribuicaoPorCategoria) return []
    return humorMetrics.distribuicaoPorCategoria
  }, [humorMetrics])

  const humorEvolution = useMemo(() => {
    if (!humorMetrics || !humorMetrics.evolucaoTemporal) return []
    return humorMetrics.evolucaoTemporal
  }, [humorMetrics])

  const humorByTeam = useMemo(() => {
    if (!isSuperAdmin || !humorMetrics || !humorMetrics.comparativoPorTime || humorFilterTime !== "todos") return []
    return humorMetrics.comparativoPorTime
  }, [isSuperAdmin, humorMetrics, humorFilterTime])

  const feedbackAnalytics = useMemo(() => {
    const teamFilter = isSuperAdmin ? feedbackFiltroTime : user?.departamento || ""
    return FeedbackAnalyticsService.getGeneralAnalytics(teamFilter, feedbackFiltroPeriodo)
  }, [feedbackFiltroTime, feedbackFiltroPeriodo, isSuperAdmin, user?.departamento])

  const feedbackUsuarios = useMemo(() => {
    if (!feedbackAnalytics) return []
    const usuarios =
      feedbackAnalytics.usuariosPorTime[isSuperAdmin ? feedbackFiltroTime : user?.departamento || ""] || []

    if (!feedbackOrdenacao.coluna) return usuarios

    const sorted = [...usuarios].sort((a, b) => {
      const aValue = a[feedbackOrdenacao.coluna as keyof typeof a]
      const bValue = b[feedbackOrdenacao.coluna as keyof typeof b]

      if (typeof aValue === "string" && typeof bValue === "string") {
        return feedbackOrdenacao.direcao === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return feedbackOrdenacao.direcao === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return sorted
  }, [feedbackAnalytics, feedbackOrdenacao, isSuperAdmin, feedbackFiltroTime, user?.departamento])

  const surveyMetrics = useMemo(() => {
    const analytics = SurveyAnalyticsService.getGeneralAnalytics()

    if (!analytics) {
      return {
        totalCreated: 0,
        totalActive: 0,
        averageParticipationRate: 0,
        activeUsers: 0,
        usageBySurvey: [],
        participationEvolution: [],
        totalParticipation: 0,
        totalCompleted: 0,
        completionRate: 0,
        averageTime: 0,
        inactiveUsers: 0,
      }
    }

    return {
      totalCreated: analytics.totalCriadas,
      totalActive: analytics.totalAtivas,
      averageParticipationRate: analytics.taxaParticipacaoMedia,
      activeUsers: analytics.usuariosAtivos,
      usageBySurvey: analytics.usoPorPesquisa || [],
      participationEvolution: analytics.evolucaoParticipacao || [],
      totalParticipation: analytics.totalParticipacao,
      totalCompleted: analytics.totalConcluidas,
      completionRate: analytics.taxaConclusao,
      averageTime: analytics.tempoMedioResposta,
      inactiveUsers: analytics.usuariosInativos,
    }
  }, [isSuperAdmin, user?.departamento])

  const surveyUserAnalytics = useMemo(() => {
    const analytics = SurveyAnalyticsService.getGeneralAnalytics()

    // Guard clause
    if (!analytics || !analytics.usuariosPorTime) {
      return []
    }

    const teamFilter = isSuperAdmin ? "Todos" : user?.departamento || ""

    if (teamFilter === "Todos") {
      // Retornar todos os usuários de todos os times
      return Object.values(analytics.usuariosPorTime).flat()
    }

    return analytics.usuariosPorTime[teamFilter] || []
  }, [isSuperAdmin, user?.departamento])

  const sortedSurveyUsuarios = useMemo(() => {
    if (!sortSurveyColumn || !surveyUserAnalytics || !Array.isArray(surveyUserAnalytics)) return []

    return [...surveyUserAnalytics].sort((a, b) => {
      const aValue = a[sortSurveyColumn as keyof typeof a]
      const bValue = b[sortSurveyColumn as keyof typeof b]

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortSurveyDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [surveyUserAnalytics, sortSurveyColumn, sortSurveyDirection])

  const trainingAnalytics = TrainingAnalyticsService.getGeneralAnalytics()

  const trainingUsuarios = useMemo(() => {
    if (!trainingAnalytics || !trainingAnalytics.usuariosPorTime) return []

    const teamFilter = isSuperAdmin ? trainingFiltroTime : user?.departamento || ""

    if (teamFilter === "Todos" || teamFilter === "todos") {
      return Object.values(trainingAnalytics.usuariosPorTime).flat() || []
    }

    return trainingAnalytics.usuariosPorTime[teamFilter] || []
  }, [trainingAnalytics, isSuperAdmin, trainingFiltroTime, user?.departamento])

  const handleOpenDetails = (colaborador: any) => {
    setSelectedCollaborator(colaborador)
    setShowCollaboratorDetail(true)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: <Badge className="bg-green-100 text-green-800">Ativo</Badge>,
      inativo: <Badge variant="secondary">Inativo</Badge>,
      ausente: <Badge variant="destructive">Ausente</Badge>,
    }
    return badges[status as keyof typeof badges] || null
  }

  const getTendenciaBadge = (tendencia: string) => {
    const badges = {
      alta: (
        <Badge variant="default" className="gap-1">
          <ArrowUp className="h-3 w-3" />
          Em Alta
        </Badge>
      ),
      estavel: (
        <Badge variant="secondary" className="gap-1">
          <Minus className="h-3 w-3" />
          Estável
        </Badge>
      ),
      queda: (
        <Badge variant="destructive" className="gap-1">
          <ArrowDown className="h-3 w-3" />
          Em Queda
        </Badge>
      ),
    }
    return badges[tendencia as keyof typeof badges] || null
  }

  const ordenarFeedbackUsuarios = (coluna: string) => {
    if (feedbackOrdenacao.coluna === coluna) {
      setFeedbackOrdenacao({
        coluna,
        direcao: feedbackOrdenacao.direcao === "asc" ? "desc" : "asc",
      })
    } else {
      setFeedbackOrdenacao({ coluna, direcao: "desc" })
    }
  }

  const toggleSurveySortColumn = (column: string) => {
    if (sortSurveyColumn === column) {
      setSortSurveyDirection(sortSurveyDirection === "asc" ? "desc" : "asc")
    } else {
      setSortSurveyColumn(column)
      setSortSurveyDirection("desc")
    }
  }

  if (!user || !hasPermission(["gestor", "super-admin"])) {
    return null
  }

  return (
    <>
      <div className="container mx-auto max-w-7xl py-6 px-4 md:px-6">
        {/* Adicionando título e subtítulo mais genéricos */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Painel Analítico</h1>
          <p className="text-muted-foreground">Análise completa de engajamento e participação</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="clay-card border-0 w-full justify-start overflow-x-auto">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
            <TabsTrigger value="feed-social">Feed Social</TabsTrigger>
            <TabsTrigger value="humor">Humor</TabsTrigger>
            {/*
            <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
            <TabsTrigger value="pesquisas">Pesquisas</TabsTrigger>
            */}
            <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
            <TabsTrigger value="recompensas">Recompensas</TabsTrigger>
          </TabsList>

          {/* VISÃO GERAL */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Visão Geral</h2>
                <p className="text-sm text-muted-foreground">
                  {isSuperAdmin ? "Análise consolidada de todos os colaboradores" : "Análise do seu time"}
                </p>
              </div>
              <Button onClick={exportVisaoGeral} variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Extrair dados
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card
                className="clay-card border-0 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setShowActiveCollaborators(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Colaboradores Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{metricsData.activeCollaborators || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">de {metricsData.totalCollaborators || 0} total</p>
                  <Progress
                    value={
                      metricsData.totalCollaborators
                        ? (metricsData.activeCollaborators / metricsData.totalCollaborators) * 100
                        : 0
                    }
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              <Card className="clay-card border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Engajamento Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{metricsData.averageEngagement || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Participação geral</p>
                  <Progress value={metricsData.averageEngagement || 0} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="clay-card border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Humor Organizacional</CardTitle>
                  <Smile className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {metricsData.averageHumor ? metricsData.averageHumor.toFixed(1) : "0.0"}/5.0
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Média geral</p>
                  <Progress value={(metricsData.averageHumor || 0) * 20} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="clay-card border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Participação</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{metricsData.participationRate || 0}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Atividades concluídas</p>
                  <Progress value={metricsData.participationRate || 0} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Todos os Colaboradores</CardTitle>
                <CardDescription>
                  Análise individual de engajamento {isGestor && `do ${user?.departamento}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <label className="text-sm font-medium text-foreground mb-2 block">Pesquisar por nome</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Digite o nome..."
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-10 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      {searchName && (
                        <button
                          onClick={() => setSearchName("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Filtrar por time</label>
                    <select
                      value={filterTeam}
                      onChange={(e) => setFilterTeam(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Todos">Todos os times</option>
                      <option value="Time Criativo">Time Criativo</option>
                      <option value="Time Tech">Time Tech</option>
                      <option value="Recursos Humanos">Recursos Humanos</option>
                      <option value="Vendas">Vendas</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Ordenar por engajamento</label>
                    <select
                      value={filterEngagement}
                      onChange={(e) => setFilterEngagement(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="todos">Ordem padrão</option>
                      <option value="maior">Maior engajamento</option>
                      <option value="menor">Menor engajamento</option>
                    </select>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Engajamento</TableHead>
                      <TableHead>Participação</TableHead>
                      <TableHead>Humor</TableHead>
                      <TableHead>Última Interação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(filteredCollaborators || []).map((collab) => (
                      <TableRow key={collab.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={collab.avatar || "/placeholder.svg"} alt={collab.nome} />
                              <AvatarFallback>
                                {collab.nome
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium">{collab.nome}</p>
                          </div>
                        </TableCell>
                        <TableCell>{collab.time}</TableCell>
                        <TableCell>{getStatusBadge(collab.statusAtividade)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={collab.taxaEngajamento} className="w-16" />
                            <span className="text-sm font-medium">{collab.taxaEngajamento}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={collab.frequenciaParticipacao} className="w-16" />
                            <span className="text-sm">{collab.frequenciaParticipacao}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {collab.humorMedio ? collab.humorMedio.toFixed(1) : "N/A"}/5.0
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{collab.ultimaInteracao}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDetails(collab)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TREINAMENTOS */}
          <TabsContent value="treinamentos" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Treinamentos</h2>
                <p className="text-sm text-muted-foreground">Progresso e conclusão de treinamentos</p>
              </div>
              <Button onClick={() => exportTreinamentos(trainingUsuarios || [])} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Extrair dados
              </Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Analytics de Treinamentos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isSuperAdmin
                    ? "Análise completa de treinamentos e capacitação da plataforma"
                    : `Análise de treinamentos do ${user?.departamento}`}
                </p>
              </div>

              {isSuperAdmin && (
                <div className="flex gap-2">
                  <Select defaultValue="todos" onValueChange={setTrainingFiltroTime}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrar por time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Times</SelectItem>
                      <SelectItem value="Time Criativo">Time Criativo</SelectItem>
                      <SelectItem value="Time Tech">Time Tech</SelectItem>
                      <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select defaultValue="30">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {(() => {
              const trainingAnalytics = TrainingAnalyticsService.getGeneralAnalytics()

              return (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="clay-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total de Treinamentos
                        </CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{trainingAnalytics.totalCriados}</div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {trainingAnalytics.totalObrigatorios} obrigatórios
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="clay-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {trainingAnalytics.taxaConclusaoMedia}%
                        </div>
                        <Progress value={trainingAnalytics.taxaConclusaoMedia} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card className="clay-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {trainingAnalytics?.tempoMedioConclusao
                            ? trainingAnalytics.tempoMedioConclusao.toFixed(1)
                            : "0.0"}
                          h
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Por treinamento</p>
                      </CardContent>
                    </Card>

                    <Card className="clay-card">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Ativos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{trainingAnalytics.usuariosAtivos}</div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {trainingAnalytics.usuariosInativos} inativos
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="clay-card">
                    <CardHeader>
                      <CardTitle>Evolução de Participação</CardTitle>
                      <CardDescription>Participação e conclusões nos últimos 7 dias</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={trainingAnalytics.evolucaoParticipacao}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dia" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="participacao"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              name="Iniciados"
                            />
                            <Line
                              type="monotone"
                              dataKey="conclusoes"
                              stroke="hsl(var(--chart-1))"
                              strokeWidth={2}
                              name="Concluídos"
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card">
                    <CardHeader>
                      <CardTitle>Progresso por Colaborador</CardTitle>
                      <CardDescription>
                        {trainingUsuarios.length} colaboradores {isGestor && `do ${user?.departamento}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Concluídos</TableHead>
                            <TableHead>Em Andamento</TableHead>
                            <TableHead>Taxa de Conclusão</TableHead>
                            <TableHead>Engajamento</TableHead>
                            <TableHead>Última Interação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(trainingUsuarios || []).map((usuario) => (
                            <TableRow key={usuario.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={usuario.avatar || "/placeholder.svg"} />
                                    <AvatarFallback>{usuario.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{usuario.nome}</span>
                                </div>
                              </TableCell>
                              <TableCell>{usuario.time}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{usuario.treinamentosConcluidos}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={usuario.treinamentosEmAndamento > 0 ? "default" : "secondary"}>
                                  {usuario.treinamentosEmAndamento}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={usuario.taxaConclusao} className="w-16" />
                                  <span className="text-sm font-medium">{usuario.taxaConclusao}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    usuario.engajamento === "alto"
                                      ? "default"
                                      : usuario.engajamento === "medio"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {usuario.engajamento === "alto"
                                    ? "Alto"
                                    : usuario.engajamento === "medio"
                                      ? "Médio"
                                      : "Baixo"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{usuario.ultimaInteracao}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </TabsContent>

          {/* CAMPANHAS */}
          <TabsContent value="campanhas" className="space-y-6">
            <CampanhasAnalytics user={user} />
          </TabsContent>

          <TabsContent value="feed-social" className="space-y-6">
            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="analytics">Análises</TabsTrigger>
                <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics">
                <FeedSocialAnalytics user={user} />
              </TabsContent>

              <TabsContent value="aprovacoes">
                <FeedSocialApprovalPanel />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="humor" className="space-y-6">
            <HumorAnalytics user={user} />
          </TabsContent>

          {/*
          <TabsContent value="feedbacks" className="space-y-6">
            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="analytics">Análises</TabsTrigger>
                <TabsTrigger value="aprovacao">Aprovação</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics">
                <FeedbackAnalytics user={user} />
              </TabsContent>

              <TabsContent value="aprovacao">
                <FeedbackApprovalPanel />
              </TabsContent>
            </Tabs>
          </TabsContent>
          */}

          {/*
          <TabsContent value="pesquisas" className="space-y-6">
            <SurveyAnalytics user={user} />
          </TabsContent>
          */}

          <TabsContent value="recompensas">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              }
            >
              <RecompensasAnalytics user={user} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}

      <Dialog open={showActiveCollaborators} onOpenChange={setShowActiveCollaborators}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Colaboradores Ativos ({metricsData.activeCollaborators})</DialogTitle>
            <p className="text-sm text-muted-foreground">Colaboradores com 3 ou mais acessos esta semana</p>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-center">Acessos Semana</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredCollaborators || [])
                .filter((c) => c.statusAtividade === "ativo")
                .map((collab) => (
                  <TableRow key={collab.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={collab.avatar || "/placeholder.svg"} alt={collab.nome} />
                          <AvatarFallback>
                            {collab.nome
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{collab.nome}</p>
                      </div>
                    </TableCell>
                    <TableCell>{collab.time}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{collab.acessosSemana}</Badge>
                    </TableCell>
                    <TableCell>{collab.ultimaInteracao}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowActiveCollaborators(false)
                          handleOpenDetails(collab)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={showCollaboratorDetail} onOpenChange={setShowCollaboratorDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedCollaborator && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={selectedCollaborator.avatar || "/placeholder.svg"}
                        alt={selectedCollaborator.nome}
                      />
                      <AvatarFallback>
                        {selectedCollaborator.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl">{selectedCollaborator.nome}</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedCollaborator.departamento} • {selectedCollaborator.time}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowCollaboratorDetail(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.taxaEngajamento}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Taxa de Engajamento</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.frequenciaParticipacao}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Frequência Semanal</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.acessosSemana}</p>
                    <p className="text-xs text-muted-foreground mt-1">Acessos esta Semana</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Atividades na Plataforma</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Treinamentos Concluídos</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.treinamentosConcluidos}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Interações no Feed</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.interacoesFeed}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Pesquisas Respondidas</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.pesquisasRespondidas}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Eventos Participados</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.eventosParticipados}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status de Atividade</p>
                    {getStatusBadge(selectedCollaborator.statusAtividade)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tendência de Engajamento</p>
                    {getTendenciaBadge(selectedCollaborator.tendencia)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Humor Médio</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedCollaborator?.humorMedio >= 4
                          ? "bg-green-50 text-green-700"
                          : selectedCollaborator?.humorMedio >= 3
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                      }
                    >
                      {selectedCollaborator?.humorMedio ? selectedCollaborator.humorMedio.toFixed(1) : "0.0"}/5.0
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={selectedSurveyUser !== null} onOpenChange={() => setSelectedSurveyUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedSurveyUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedSurveyUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedSurveyUser.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold">{selectedSurveyUser.nome}</div>
                    <div className="text-sm font-normal text-muted-foreground">{selectedSurveyUser.time}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-2xl font-bold">{selectedSurveyUser.pesquisasConcluidas}</div>
                    <div className="text-sm text-muted-foreground">Concluídas</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-2xl font-bold">{selectedSurveyUser.pesquisasPendentes}</div>
                    <div className="text-sm text-muted-foreground">Pendentes</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-2xl font-bold">{selectedSurveyUser.taxaParticipacao}%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Participação</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Obrigatórias Pendentes:</span>
                    <Badge variant={selectedSurveyUser.obrigatoriasPendentes > 0 ? "destructive" : "secondary"}>
                      {selectedSurveyUser.obrigatoriasPendentes}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Taxa de Conclusão:</span>
                    <span className="text-sm font-bold">{selectedSurveyUser.taxaConclusao}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Tempo Médio de Resposta:</span>
                    <span className="text-sm">{selectedSurveyUser.tempoMedioResposta} min</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Nível de Engajamento:</span>
                    <Badge
                      variant={
                        selectedSurveyUser.engajamento === "alto"
                          ? "default"
                          : selectedSurveyUser.engajamento === "medio"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {selectedSurveyUser.engajamento === "alto"
                        ? "Alto"
                        : selectedSurveyUser.engajamento === "medio"
                          ? "Médio"
                          : selectedSurveyUser.engajamento === "baixo"
                            ? "Baixo"
                            : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Última Interação:</span>
                    <span className="text-sm">{selectedSurveyUser.ultimaInteracao}</span>
                  </div>
                </div>

                {selectedSurveyUser.pesquisasDetalhes.respondidas.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold">Histórico de Respostas</h4>
                    <div className="space-y-2 rounded-lg border p-4">
                      {(selectedSurveyUser?.pesquisasDetalhes?.respondidas || []).slice(0, 5).map((response) => {
                        const survey = SurveyService.getSurveyById(response.surveyId)
                        return (
                          <div
                            key={response.id}
                            className="flex items-center justify-between border-b pb-2 last:border-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{survey?.title || "Pesquisa"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(response.completedAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <Badge variant="outline">
                              +{survey?.reward.xp || 0} XP · ⭐ {survey?.reward.stars || 0}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedSurveyUser.pesquisasDetalhes.pendentes.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold">Pesquisas Pendentes</h4>
                    <div className="space-y-2 rounded-lg border p-4">
                      {(selectedSurveyUser?.pesquisasDetalhes?.pendentes || []).slice(0, 5).map((survey) => (
                        <div key={survey.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{survey.title}</p>
                            <p className="text-xs text-muted-foreground">{survey.description}</p>
                          </div>
                          <Badge variant={survey.isRequired ? "destructive" : "secondary"}>
                            {survey.isRequired ? "Obrigatória" : "Opcional"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Carregando painel analítico...</p>
          </div>
        </div>
      }
    >
      <AnalyticsPageContent />
    </Suspense>
  )
}
