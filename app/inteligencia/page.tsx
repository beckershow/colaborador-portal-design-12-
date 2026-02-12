"use client"

import { AvatarFallback } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import { Suspense, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Brain,
  Download,
  Heart,
  Shield,
  Activity,
  CheckCircle,
  BookOpen,
  ExternalLink,
  Clock,
  Target,
  TrendingUp,
  Users,
  Zap,
  TrendingDown,
  Lightbulb
} from "lucide-react"
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
  Bar,
  BarChart as RechartsBarChart,
  Area,
  AreaChart as RechartsAreaChart,
} from "recharts"

import { InteligenciaService } from "@/lib/inteligencia-service"
import { ExportUtils, type ExportColumn } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"

function InteligenciaPageContent() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("visao-geral")
  const [selectedTeam, setSelectedTeam] = useState<string>("todos")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30")
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel")
  const [alertaOrganizacional, setAlertaOrganizacional] = useState<string>("Medido")

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"

  const dataFilter = useMemo(() => {
    if (!user) return undefined

    if (isGestor) {
      return {
        gestorId: user.id,
        teamIds: user.timeGerenciado,
        isGlobal: false,
        periodo: Number.parseInt(selectedPeriod),
        selectedTeamName: null,
      }
    }

    if (isSuperAdmin && selectedTeam !== "todos") {
      // SUPERADMIN com time específico selecionado - filtrar APENAS aquele time
      return {
        teamIds: [selectedTeam], // Array com apenas o time selecionado
        isGlobal: false,
        periodo: Number.parseInt(selectedPeriod),
        selectedTeamName: selectedTeam,
      }
    }

    // SUPERADMIN sem filtro - visão global
    return {
      isGlobal: true,
      periodo: Number.parseInt(selectedPeriod),
      selectedTeamName: null,
    }
  }, [user, isGestor, isSuperAdmin, selectedTeam, selectedPeriod])

  const userIds = useMemo(() => {
    if (!user) return []

    if (isSuperAdmin) {
      if (selectedTeam === "todos") {
        return ["2", "3", "4", "5"]
      } else {
        return user.timeGerenciado || []
      }
    } else if (isGestor) {
      return user.timeGerenciado || []
    }

    return [user.id]
  }, [user, selectedTeam, isSuperAdmin, isGestor])

  const indiceEngajamento = useMemo(
    () => InteligenciaService.getIndiceGeralEngajamento(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const climaOrganizacional = useMemo(
    () => InteligenciaService.getIndiceClimaOrganizacional(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const riscoMedio = useMemo(
    () => InteligenciaService.getRiscoMedioDesengajamento(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const tendenciaParticipacao = useMemo(
    () => InteligenciaService.getTendenciaParticipacao(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const alertasOrganizacionais = useMemo(
    () => InteligenciaService.getAlertasOrganizacionais(userIds, dataFilter),
    [userIds, dataFilter],
  )

  const riscosDesengajamento = useMemo(
    () => InteligenciaService.getRiscosDesengajamento(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const evolucaoRisco = useMemo(
    () => InteligenciaService.getEvolucaoRisco(userIds, 30, dataFilter),
    [userIds, dataFilter],
  )

  const previsaoTurnover = useMemo(
    () => InteligenciaService.getPrevisaoTurnover(userIds, dataFilter),
    [userIds, dataFilter],
  )

  const recomendacoes = useMemo(
    () =>
      InteligenciaService.getRecomendacoesInteligentes(
        userIds,
        isSuperAdmin ? "super-admin" : "gestor",
        dataFilter,
      ),
    [userIds, isSuperAdmin, dataFilter],
  )

  const bemEstarProdutividade = useMemo(
    () => InteligenciaService.getBemEstarProdutividade(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const evolucaoBemEstar = useMemo(
    () => InteligenciaService.getEvolucaoBemEstar(30, dataFilter),
    [userIds, dataFilter],
  )

  const recompensasInsights = useMemo(() => InteligenciaService.getRecompensasInsights(userIds), [userIds])
  const resgatesPorTipo = useMemo(() => InteligenciaService.getResgatesPorTipo(), [userIds])

  const indicadoresDesenvolvimento = useMemo(
    () => InteligenciaService.getIndicadoresDesenvolvimento(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const perfilDesenvolvimento = useMemo(
    () => InteligenciaService.getPerfilDesenvolvimento(userIds, dataFilter),
    [userIds, dataFilter],
  )
  const trilhasRecomendadas = useMemo(
    () => InteligenciaService.getTrilhasRecomendadas(dataFilter),
    [userIds, dataFilter],
  )

  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<string | null>(null)
  const planoDesenvolvimento = useMemo(
    () => (colaboradorSelecionado ? InteligenciaService.getPlanoDesenvolvimento(colaboradorSelecionado) : null),
    [colaboradorSelecionado],
  )

  const handleExecutarRecomendacao = (recomendacao: any) => {
    if (recomendacao.redirectUrl) {
      router.push(recomendacao.redirectUrl)
      toast({
        title: "Redirecionando...",
        description: `Você será direcionado para ${recomendacao.titulo}`,
      })
    }
  }

  const handleExportData = async () => {
    try {
      toast({
        title: "Preparando exportação...",
        description: "Seus dados estão sendo processados.",
      })

      let columns: ExportColumn[] = []
      let data: any[] = []
      let fileName = ""

      switch (activeTab) {
        case "visao-geral":
          fileName = `inteligencia-visao-geral-${new Date().toISOString().split("T")[0]}`
          columns = [
            { header: "Métrica", key: "metrica" },
            { header: "Valor", key: "valor" },
            { header: "Status", key: "status" },
          ]
          data = [
            { metrica: "Índice de Engajamento", valor: indiceEngajamento.valor, status: indiceEngajamento.tendencia },
            { metrica: "Clima Organizacional", valor: climaOrganizacional, status: "Medido" },
            { metrica: "Risco Médio", valor: riscoMedio, status: alertasOrganizacionais[0]?.tipo || "OK" },
            {
              metrica: "Tendência de Participação",
              valor: tendenciaParticipacao.percentual,
              status: tendenciaParticipacao.tendencia,
            },
          ]
          break

        case "risco-desengajamento":
          fileName = `inteligencia-risco-${new Date().toISOString().split("T")[0]}`
          columns = [
            { header: "Time", key: "time" },
            { header: "Nível de Risco", key: "risco" },
            { header: "Pontuação", key: "pontuacao" },
            { header: "Fatores", key: "fatores" },
          ]
          data = riscosDesengajamento.map((r) => ({
            time: r.time,
            risco: r.risco,
            pontuacao: r.pontuacao,
            fatores: r.fatores.join(", "),
          }))
          break

        case "previsao-turnover":
          fileName = `inteligencia-turnover-${new Date().toISOString().split("T")[0]}`
          columns = [
            { header: "Time", key: "time" },
            { header: "Tendência (%)", key: "tendencia" },
            { header: "Principais Fatores", key: "fatores" },
          ]
          data = previsaoTurnover.map((p) => ({
            time: p.time,
            tendencia: p.tendencia,
            fatores: p.fatoresImpacto.map((f) => `${f.fator} (${f.peso}%)`).join(", "),
          }))
          break

        case "recomendacoes":
          fileName = `inteligencia-recomendacoes-${new Date().toISOString().split("T")[0]}`
          columns = [
            { header: "Tipo", key: "tipo" },
            { header: "Título", key: "titulo" },
            { header: "Motivo", key: "motivo" },
            { header: "Impacto Esperado", key: "impactoEsperado" },
            { header: "Prioridade", key: "prioridade" },
          ]
          data = recomendacoes
          break

        case "bem-estar":
          fileName = `inteligencia-bem-estar-${new Date().toISOString().split("T")[0]}`
          columns = [
            { header: "Time", key: "time" },
            { header: "Índice de Equilíbrio", key: "indiceEquilibrio" },
            { header: "Sinais de Fadiga", key: "sinaisFadiga" },
            { header: "Recomendações", key: "recomendacoes" },
          ]
          data = bemEstarProdutividade.map((b) => ({
            time: b.time,
            indiceEquilibrio: b.indiceEquilibrio,
            sinaisFadiga: b.sinaisFadiga.join("; "),
            recomendacoes: b.recomendacoes.join("; "),
          }))
          break

        case "recompensas-inteligentes":
          fileName = `inteligencia-recompensas-${new Date().toISOString().split("T")[0]}`
          columns = [
            { header: "Tipo", key: "tipo" },
            { header: "Quantidade", key: "quantidade" },
            { header: "Engajamento (%)", key: "engajamento" },
          ]
          data = resgatesPorTipo
          break

        case "desenvolvimento":
          fileName = `inteligencia-desenvolvimento-${new Date().toISOString().split("T")[0]}`
          columns = [
            { header: "Colaborador", key: "colaborador" },
            { header: "Pontos Fortes", key: "pontosFortesCount" },
            { header: "Áreas de Melhoria", key: "areasMelhoriaCount" },
            { header: "Treinamentos Sugeridos", key: "treinamentosSugeridos" },
            { header: "Potencial", key: "potencialCrescimento" },
          ]
          data = perfilDesenvolvimento.map((p) => ({
            ...p,
            treinamentosSugeridos: p.treinamentosSugeridos.join(", "),
          }))
          break
      }

      if (exportFormat === "excel") {
        await ExportUtils.exportToExcel(columns, data, fileName)
      } else {
        ExportUtils.exportToCSV(columns, data, fileName)
      }

      toast({
        title: "Exportação concluída!",
        description: `Arquivo ${exportFormat.toUpperCase()} baixado com sucesso.`,
      })

      setExportDialogOpen(false)
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (!hasPermission(["gestor", "super-admin"])) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="text-3xl font-bold">Inteligência & Previsões</h1>
                <p className="text-muted-foreground">Análise preditiva e prescritiva para decisões estratégicas</p>
              </div>
            </div>
          </div>

          <Button onClick={() => setExportDialogOpen(true)} className="clay-button bg-transparent" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Extrair Dados
          </Button>
        </div>

        {/* Filtros (apenas Super Admin) */}
        {isSuperAdmin && (
          <Card className="clay-card">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time</label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Times</SelectItem>
                      <SelectItem value="criativo">Time Criativo</SelectItem>
                      <SelectItem value="vendas">Time de Vendas</SelectItem>
                      <SelectItem value="tech">Time de Tecnologia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="clay-card border-0 w-full justify-start overflow-x-auto flex-wrap h-auto gap-2">
            <TabsTrigger value="visao-geral" className="gap-2">
              <Target className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="risco-desengajamento" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risco de Desengajamento
            </TabsTrigger>
            <TabsTrigger value="previsao-turnover" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Previsão de Turnover
            </TabsTrigger>
            <TabsTrigger value="recomendacoes" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Recomendações
            </TabsTrigger>
            <TabsTrigger value="bem-estar" className="gap-2">
              <Heart className="h-4 w-4" />
              Bem-estar
            </TabsTrigger>
            <TabsTrigger value="recompensas-inteligentes" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Recompensas
            </TabsTrigger>
            <TabsTrigger value="desenvolvimento" className="gap-2">
              <Clock className="h-4 w-4" />
              Desenvolvimento
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: VISÃO GERAL INTELIGENTE */}
          <TabsContent value="visao-geral" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="clay-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    Índice de Engajamento (IA)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-bold">{indiceEngajamento.valor}</div>
                      <Badge
                        variant={
                          indiceEngajamento.tendencia === "crescente"
                            ? "default"
                            : indiceEngajamento.tendencia === "estavel"
                              ? "secondary"
                              : "destructive"
                        }
                        className="gap-1"
                      >
                        {indiceEngajamento.tendencia === "crescente" ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : indiceEngajamento.tendencia === "estavel" ? (
                          <Activity className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(indiceEngajamento.mudancaPercentual)}%
                      </Badge>
                    </div>
                    <Progress value={indiceEngajamento.valor} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Tendência {indiceEngajamento.tendencia} baseada em múltiplos indicadores de participação
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="clay-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    Clima Organizacional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-4xl font-bold">{climaOrganizacional}</div>
                    <Progress value={climaOrganizacional} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Baseado em humor do dia, feedbacks e interações sociais
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="clay-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-500" />
                    Risco Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-4xl font-bold">{riscoMedio}%</div>
                    <Progress value={riscoMedio} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Probabilidade de desengajamento nos próximos 30 dias
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="clay-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Tendência de Participação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold">{tendenciaParticipacao.percentual}%</div>
                      <Badge>{tendenciaParticipacao.tendencia}</Badge>
                    </div>
                    <Progress value={tendenciaParticipacao.percentual} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Percentual de colaboradores ativamente engajados na plataforma
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="clay-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-purple-500" />
                    Alertas Organizacionais
                  </CardTitle>
                  <CardDescription>Alertas baseados em dados concretos e análise preditiva</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alertasOrganizacionais.map((alerta, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-4 ${
                          alerta.severidade === "alta"
                            ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                            : alerta.severidade === "media"
                              ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                              : "border-green-500 bg-green-50 dark:bg-green-950/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  alerta.severidade === "alta"
                                    ? "destructive"
                                    : alerta.severidade === "media"
                                      ? "secondary"
                                      : "default"
                                }
                              >
                                {alerta.severidade.toUpperCase()}
                              </Badge>
                              <span className="font-semibold text-sm">{alerta.tipo}</span>
                              {alerta.timeAfetado && (
                                <Badge variant="outline" className="text-xs">
                                  {alerta.timeAfetado}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{alerta.motivo}</p>
                          </div>
                          {alerta.severidade !== "baixa" && (
                            <Activity className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ABA 2: RISCO DE DESENGAJAMENTO */}
          <TabsContent value="risco-desengajamento" className="space-y-6">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Classificação de Risco por Time</CardTitle>
                <CardDescription>Análise preditiva de possíveis quedas de engajamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riscosDesengajamento.map((risco, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{risco.time}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge
                              variant={
                                risco.risco === "baixo" ? "default" : risco.risco === "medio" ? "secondary" : "destructive"
                              }
                            >
                              Risco {risco.risco}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{risco.pontuacao} pontos</span>
                          </div>
                        </div>
                      </div>
                      <Progress
                        value={risco.pontuacao}
                        className="h-2"
                        style={{
                          background: "var(--secondary)",
                        }}
                      />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">Fatores de impacto:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          {risco.fatores.map((fator, fidx) => (
                            <li key={fidx}>{fator}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Evolução do Risco (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={evolucaoRisco}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="riscoGeral" stroke="#8884d8" name="Risco Geral" />
                    <Line type="monotone" dataKey="timeCriativo" stroke="#82ca9d" name="Time Criativo" />
                    <Line type="monotone" dataKey="timeVendas" stroke="#ffc658" name="Time de Vendas" />
                    <Line type="monotone" dataKey="timeTech" stroke="#ff7c7c" name="Time de Tecnologia" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: PREVISÃO DE TURNOVER */}
          <TabsContent value="previsao-turnover" className="space-y-6">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Tendência de Risco por Time</CardTitle>
                <CardDescription>Projeção não-nominal de possíveis evasões</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {previsaoTurnover.map((previsao, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{previsao.time}</p>
                          <p className="text-sm text-muted-foreground">Tendência de risco de evasão</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-amber-500">{previsao.tendencia}%</div>
                          <p className="text-xs text-muted-foreground">próximos 90 dias</p>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                        <p className="font-medium text-sm">Fatores correlacionados:</p>
                        {previsao.fatoresImpacto.map((fator, fidx) => (
                          <div key={fidx} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{fator.fator}</span>
                              <span className="font-medium">{fator.peso}%</span>
                            </div>
                            <Progress value={fator.peso} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  Insight da IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  <strong>Times com baixa participação e humor negativo apresentam 2,1x mais risco de evasão.</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  A análise preditiva indica forte correlação entre engajamento reduzido e tendência de turnover. Ações
                  preventivas são recomendadas para times com risco acima de 10%.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 4: RECOMENDAÇÕES INTELIGENTES */}
          <TabsContent value="recomendacoes" className="space-y-6">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Ações Sugeridas pela IA</CardTitle>
                <CardDescription>Recomendações prescritivas baseadas em análise de dados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recomendacoes.map((rec) => (
                    <div
                      key={rec.id}
                      className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                rec.prioridade === "alta"
                                  ? "destructive"
                                  : rec.prioridade === "media"
                                    ? "secondary"
                                    : "default"
                              }
                            >
                              {rec.prioridade}
                            </Badge>
                            <Badge variant="outline">{rec.tipo}</Badge>
                          </div>
                          <h4 className="font-semibold">{rec.titulo}</h4>
                        </div>
                        <Button
                          size="sm"
                          className="clay-button bg-transparent"
                          variant="outline"
                          onClick={() => handleExecutarRecomendacao(rec)}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Executar
                        </Button>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-medium text-muted-foreground">Motivo:</p>
                          <p>{rec.motivo}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Impacto Esperado:</p>
                          <p className="text-green-600 dark:text-green-400">{rec.impactoEsperado}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 5: BEM-ESTAR & PRODUTIVIDADE */}
          <TabsContent value="bem-estar" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {bemEstarProdutividade.map((bem, idx) => (
                <Card key={idx} className="clay-card">
                  <CardHeader>
                    <CardTitle className="text-base">{bem.time}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Índice de Equilíbrio</span>
                        <span className="text-2xl font-bold">{bem.indiceEquilibrio}</span>
                      </div>
                      <Progress value={bem.indiceEquilibrio} className="h-2" />
                    </div>

                    {bem.sinaisFadiga.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">Sinais de Fadiga:</p>
                        <ul className="text-xs space-y-1">
                          {bem.sinaisFadiga.map((sinal, sidx) => (
                            <li key={sidx} className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {sinal}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {bem.recomendacoes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Recomendações:</p>
                        <ul className="text-xs space-y-1">
                          {bem.recomendacoes.map((rec, ridx) => (
                            <li key={ridx} className="flex items-start gap-2">
                              <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Evolução do Bem-estar (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsAreaChart data={evolucaoBemEstar}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="bemEstar"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Bem-estar"
                    />
                    <Area
                      type="monotone"
                      dataKey="produtividade"
                      stackId="1"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Produtividade"
                    />
                    <Area
                      type="monotone"
                      dataKey="equilibrio"
                      stackId="1"
                      stroke="#ffc658"
                      fill="#ffc658"
                      name="Equilíbrio"
                    />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 6: RECOMPENSAS INTELIGENTES */}
          <TabsContent value="recompensas-inteligentes" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="clay-card">
                <CardHeader>
                  <CardTitle>Insights de Recompensas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Item Mais Resgatado</p>
                    <p className="text-xl font-bold">{recompensasInsights.itemMaisResgatado}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Item Menos Utilizado</p>
                    <p className="text-xl font-bold">{recompensasInsights.itemMenosUtilizado}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Correlação com Engajamento</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-green-500">{recompensasInsights.correlacaoEngajamento}</p>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="clay-card bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-violet-500" />
                    Insight da IA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{recompensasInsights.insight}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Resgates por Tipo vs Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={resgatesPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="quantidade" fill="#8884d8" name="Quantidade de Resgates" />
                    <Bar yAxisId="right" dataKey="engajamento" fill="#82ca9d" name="Engajamento (%)" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 7: DESENVOLVIMENTO PROFISSIONAL RECONSTRUÍDO */}
          <TabsContent value="desenvolvimento" className="space-y-6">
            {/* Visão Geral de Desenvolvimento - Cards Estratégicos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="clay-card">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Alto Potencial</CardDescription>
                  <CardTitle className="text-3xl">{indicadoresDesenvolvimento.altoPotencial}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Colaboradores prontos para próximo nível</p>
                </CardContent>
              </Card>
              <Card className="clay-card">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Risco de Estagnação</CardDescription>
                  <CardTitle className="text-3xl text-orange-500">{indicadoresDesenvolvimento.riscoEstagnacao}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
                </CardContent>
              </Card>
              <Card className="clay-card">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Competências Críticas</CardDescription>
                  <CardTitle className="text-3xl">{indicadoresDesenvolvimento.competenciasCriticas.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Áreas prioritárias de desenvolvimento</p>
                </CardContent>
              </Card>
              <Card className="clay-card">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Treinamentos de Alto Impacto</CardDescription>
                  <CardTitle className="text-3xl">{indicadoresDesenvolvimento.treinamentosMaiorImpacto.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Recomendados pela IA</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela Principal de Desenvolvimento Individual */}
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Desenvolvimento Individual Orientado por IA</CardTitle>
                <CardDescription>
                  Responde: Quem desenvolver, Em quê desenvolver, Por quê desenvolver, Como desenvolver e Qual o
                  impacto esperado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {perfilDesenvolvimento.map((perfil) => (
                    <div
                      key={perfil.id}
                      className="border rounded-lg p-4 space-y-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setColaboradorSelecionado(perfil.id)}
                    >
                      {/* Cabeçalho do Colaborador */}
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={perfil.avatar || "/placeholder.svg"} alt={perfil.colaborador} />
                          <AvatarFallback>{perfil.colaborador.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{perfil.colaborador}</h4>
                              <p className="text-sm text-muted-foreground">
                                {perfil.cargo} • {perfil.time} • {perfil.tempoEmpresa}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {perfil.emAltoDesempenho && (
                                <Badge variant="default" className="bg-green-500">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Alto Desempenho
                                </Badge>
                              )}
                              {perfil.riscoEstagnacao && (
                                <Badge variant="destructive">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Risco Estagnação
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  perfil.potencial === "alto"
                                    ? "default"
                                    : perfil.potencial === "medio"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="capitalize"
                              >
                                Potencial: {perfil.potencial}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Pontos Fortes */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Pontos Fortes ({perfil.pontosFortesDetalhados.length})
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {perfil.pontosFortesDetalhados.map((pf, idx) => (
                            <div key={idx} className="bg-green-50 dark:bg-green-950/20 rounded p-2">
                              <Badge variant="outline" className="mb-1 text-xs border-green-500">
                                {pf.categoria}
                              </Badge>
                              <p className="text-xs text-muted-foreground">{pf.descricao}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Áreas de Melhoria */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4 text-orange-500" />
                          Áreas de Melhoria ({perfil.areasMelhoriaDetalhadas.length})
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {perfil.areasMelhoriaDetalhadas.map((am, idx) => (
                            <div
                              key={idx}
                              className={`rounded p-2 ${
                                am.severidade === "alta"
                                  ? "bg-red-50 dark:bg-red-950/20"
                                  : am.severidade === "media"
                                    ? "bg-orange-50 dark:bg-orange-950/20"
                                    : "bg-yellow-50 dark:bg-yellow-950/20"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    am.severidade === "alta"
                                      ? "border-red-500"
                                      : am.severidade === "media"
                                        ? "border-orange-500"
                                        : "border-yellow-500"
                                  }`}
                                >
                                  {am.categoria}
                                </Badge>
                                <span className="text-xs capitalize text-muted-foreground">{am.severidade}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{am.descricao}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Treinamentos Sugeridos pela IA */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-500" />
                          Treinamentos Sugeridos pela IA ({perfil.treinamentosSugeridos.length})
                        </h5>
                        <div className="space-y-3">
                          {perfil.treinamentosSugeridos.map((treino, idx) => (
                            <div key={idx} className="border rounded-lg p-3 space-y-2 bg-blue-50 dark:bg-blue-950/10">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{treino.icone}</span>
                                  <div>
                                    <Badge variant="outline" className="mb-1">
                                      {treino.categoria}
                                    </Badge>
                                    <h6 className="font-semibold text-sm">{treino.nome}</h6>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" className="clay-button bg-transparent">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Ver Detalhes
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground font-semibold">Objetivo:</p>
                                  <p>{treino.objetivo}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground font-semibold">Competência Desenvolvida:</p>
                                  <p>{treino.competenciaDesenvolvida}</p>
                                </div>
                              </div>
                              <div className="space-y-1 text-xs">
                                <p className="text-muted-foreground font-semibold">Por quê foi recomendado:</p>
                                <p>{treino.motivoRecomendacao}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {treino.fonteAnalise.map((fonte, fidx) => (
                                    <Badge key={fidx} variant="secondary" className="text-xs">
                                      {fonte}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Potencial Explicado */}
                      <div className="bg-accent/30 rounded p-3">
                        <p className="text-xs">
                          <span className="font-semibold">Por que este potencial?</span> {perfil.potencialExplicacao}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trilhas de Capacitação Recomendadas */}
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Trilhas de Capacitação Estratégicas</CardTitle>
                <CardDescription>Desenvolvimento orientado por objetivos organizacionais e impacto mensurável</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trilhasRecomendadas.map((trilha, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-lg">{trilha.nome}</h4>
                          <p className="text-sm text-muted-foreground">{trilha.objetivoEstrategico}</p>
                        </div>
                        <Badge
                          variant={
                            trilha.nivelImpacto === "alto"
                              ? "default"
                              : trilha.nivelImpacto === "medio"
                                ? "secondary"
                                : "outline"
                          }
                          className="capitalize"
                        >
                          {trilha.nivelImpacto} Impacto
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Competências Desenvolvidas:</p>
                          <div className="flex flex-wrap gap-1">
                            {trilha.competenciasDesenvolvidas.map((comp, cidx) => (
                              <Badge key={cidx} variant="outline" className="text-xs">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground">Perfil Ideal:</p>
                          <p className="text-sm">{trilha.perfilIdeal}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Impacto em Performance:</p>
                          <p className="text-sm font-semibold text-green-600">{trilha.impactoEsperado.performance}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Impacto em Engajamento:</p>
                          <p className="text-sm font-semibold text-blue-600">{trilha.impactoEsperado.engajamento}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">Impacto em Retenção:</p>
                          <p className="text-sm font-semibold text-purple-600">{trilha.impactoEsperado.retencao}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            <Clock className="h-4 w-4 inline mr-1" />
                            {trilha.duracaoEstimada}
                          </span>
                          <span className="text-muted-foreground">
                            <Users className="h-4 w-4 inline mr-1" />
                            {trilha.colaboradoresElegiveis} elegíveis
                          </span>
                        </div>
                        <Button size="sm" className="clay-button">
                          <Zap className="h-4 w-4 mr-1" />
                          Implementar Trilha
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Exportação */}
        <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Dados de Inteligência</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Formato</label>
                <Select value={exportFormat} onValueChange={(v: "excel" | "csv") => setExportFormat(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV (.csv)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isSuperAdmin
                    ? "Você está exportando dados conforme filtros aplicados."
                    : "Você está exportando dados do seu time."}
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleExportData}>Exportar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function InteligenciaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <Brain className="h-16 w-16 animate-pulse mx-auto text-violet-500" />
            <p className="text-lg font-medium">Carregando Inteligência & Previsões...</p>
          </div>
        </div>
      }
    >
      <InteligenciaPageContent />
    </Suspense>
  )
}
