"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  BarChart3,
  AlertTriangle,
  Target,
  Activity,
  CheckCircle2,
  Trophy,
  Calendar,
  Megaphone,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface GestorOverview {
  id: string
  nome: string
  avatar: string
  departamento: string
  timeSize: number
  engajamento: number
  taxaParticipacao: number
  taxaConclusao: number
  engajamentosAtivos: number
  campanhasAtivas: number
  eventosRealizados: number
  pesquisasCriadas: number
  satisfacaoTime: number
  trend: "up" | "down" | "stable"
  alertas: number
}

const mockGestoresData: GestorOverview[] = [
  {
    id: "2",
    nome: "Marina Oliveira",
    avatar: "/professional-avatar-woman-glasses.jpg",
    departamento: "Marketing",
    timeSize: 8,
    engajamento: 87,
    taxaParticipacao: 92,
    taxaConclusao: 78,
    engajamentosAtivos: 5,
    campanhasAtivas: 2,
    eventosRealizados: 8,
    pesquisasCriadas: 12,
    satisfacaoTime: 4.5,
    trend: "up",
    alertas: 0,
  },
  {
    id: "6",
    nome: "Roberto Silva",
    avatar: "/professional-avatar-man-suit.jpg",
    departamento: "Tecnologia",
    timeSize: 15,
    engajamento: 92,
    taxaParticipacao: 95,
    taxaConclusao: 85,
    engajamentosAtivos: 8,
    campanhasAtivas: 3,
    eventosRealizados: 12,
    pesquisasCriadas: 8,
    satisfacaoTime: 4.7,
    trend: "up",
    alertas: 0,
  },
  {
    id: "7",
    nome: "Patricia Costa",
    avatar: "/professional-avatar-woman-suit.jpg",
    departamento: "Vendas",
    timeSize: 12,
    engajamento: 78,
    taxaParticipacao: 82,
    taxaConclusao: 70,
    engajamentosAtivos: 4,
    campanhasAtivas: 1,
    eventosRealizados: 6,
    pesquisasCriadas: 15,
    satisfacaoTime: 4.2,
    trend: "stable",
    alertas: 1,
  },
  {
    id: "8",
    nome: "Fernando Alves",
    avatar: "/professional-avatar-man-glasses.jpg",
    departamento: "RH",
    timeSize: 6,
    engajamento: 65,
    taxaParticipacao: 70,
    taxaConclusao: 58,
    engajamentosAtivos: 2,
    campanhasAtivas: 0,
    eventosRealizados: 3,
    pesquisasCriadas: 5,
    satisfacaoTime: 3.8,
    trend: "down",
    alertas: 2,
  },
]

const engagementTrendData = [
  { month: "Jul", Marina: 82, Roberto: 88, Patricia: 75, Fernando: 70 },
  { month: "Ago", Marina: 84, Roberto: 89, Patricia: 76, Fernando: 68 },
  { month: "Set", Marina: 85, Roberto: 90, Patricia: 77, Fernando: 66 },
  { month: "Out", Marina: 86, Roberto: 91, Patricia: 78, Fernando: 65 },
  { month: "Nov", Marina: 87, Roberto: 92, Patricia: 78, Fernando: 65 },
  { month: "Dez", Marina: 87, Roberto: 92, Patricia: 78, Fernando: 65 },
]

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-1))", "hsl(var(--chart-3))", "hsl(var(--chart-5))"]

export default function SuperAdminDashboard() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const [gestores] = useState<GestorOverview[]>(mockGestoresData)
  const [selectedGestor, setSelectedGestor] = useState<GestorOverview | null>(null)

  useEffect(() => {
    if (!hasPermission("super-admin")) {
      router.push("/")
    }
  }, [hasPermission, router])

  if (!hasPermission("super-admin")) {
    return null
  }

  const totalColaboradores = gestores.reduce((acc, g) => acc + g.timeSize, 0)
  const engajamentoMedio = Math.round(gestores.reduce((acc, g) => acc + g.engajamento, 0) / gestores.length)
  const taxaParticipacaoMedia = Math.round(gestores.reduce((acc, g) => acc + g.taxaParticipacao, 0) / gestores.length)
  const taxaConclusaoMedia = Math.round(gestores.reduce((acc, g) => acc + g.taxaConclusao, 0) / gestores.length)
  const engajamentosAtivosTotal = gestores.reduce((acc, g) => acc + g.engajamentosAtivos, 0)
  const alertasTotal = gestores.reduce((acc, g) => acc + g.alertas, 0)

  const getEngajamentoColor = (value: number) => {
    if (value >= 85) return "text-primary"
    if (value >= 70) return "text-chart-1"
    return "text-chart-3"
  }

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-chart-1" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-destructive" />
    return <Activity className="h-4 w-4 text-muted-foreground" />
  }

  // Dados para o gráfico de pizza de distribuição
  const distributionData = gestores.map((g) => ({
    name: g.nome.split(" ")[0],
    value: g.timeSize,
  }))

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard Hierárquico
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Visão completa de todos os gestores e seus times</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Colaboradores Totais</p>
                <p className="text-4xl font-bold text-foreground">{totalColaboradores}</p>
                <p className="text-xs text-muted-foreground mt-1">{gestores.length} gestores ativos</p>
              </div>
              <Users className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engajamento Médio</p>
                <p className={`text-4xl font-bold ${getEngajamentoColor(engajamentoMedio)}`}>{engajamentoMedio}%</p>
                <p className="text-xs text-muted-foreground mt-1">Todos os times</p>
              </div>
              <BarChart3 className="h-10 w-10 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engajamentos Ativos</p>
                <p className="text-4xl font-bold text-accent">{engajamentosAtivosTotal}</p>
                <p className="text-xs text-muted-foreground mt-1">Campanhas, eventos, missões</p>
              </div>
              <Target className="h-10 w-10 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertas Ativos</p>
                <p className={`text-4xl font-bold ${alertasTotal > 0 ? "text-chart-3" : "text-chart-1"}`}>
                  {alertasTotal}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {alertasTotal === 0 ? "Tudo funcionando bem" : "Requer atenção"}
                </p>
              </div>
              <AlertTriangle className={`h-10 w-10 ${alertasTotal > 0 ? "text-chart-3" : "text-chart-1"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="clay-card border-0">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="gestores">Gestores Individuais</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Evolução do Engajamento por Gestor */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Evolução do Engajamento por Gestor</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={engagementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="Marina" stroke={COLORS[0]} strokeWidth={2} />
                    <Line type="monotone" dataKey="Roberto" stroke={COLORS[1]} strokeWidth={2} />
                    <Line type="monotone" dataKey="Patricia" stroke={COLORS[2]} strokeWidth={2} />
                    <Line type="monotone" dataKey="Fernando" stroke={COLORS[3]} strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de Colaboradores */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Distribuição de Colaboradores</CardTitle>
                <CardDescription>Por gestor</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Performance Global */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Métricas de Performance Global</CardTitle>
              <CardDescription>Indicadores consolidados de todos os gestores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Taxa de Participação</p>
                    <p className="text-sm font-bold text-primary">{taxaParticipacaoMedia}%</p>
                  </div>
                  <Progress value={taxaParticipacaoMedia} className="h-3" />
                  <p className="text-xs text-muted-foreground">Meta: 85%</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Taxa de Conclusão</p>
                    <p className="text-sm font-bold text-primary">{taxaConclusaoMedia}%</p>
                  </div>
                  <Progress value={taxaConclusaoMedia} className="h-3" />
                  <p className="text-xs text-muted-foreground">Meta: 75%</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Engajamento Geral</p>
                    <p className="text-sm font-bold text-primary">{engajamentoMedio}%</p>
                  </div>
                  <Progress value={engajamentoMedio} className="h-3" />
                  <p className="text-xs text-muted-foreground">Meta: 80%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gestores" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {gestores.map((gestor) => (
              <Card key={gestor.id} className="clay-card border-0 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={`/diverse-group-avatars.png?query=${gestor.nome}`} />
                        <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                          {gestor.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{gestor.nome}</CardTitle>
                        <CardDescription>{gestor.departamento}</CardDescription>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline">{gestor.timeSize} colaboradores</Badge>
                          {gestor.alertas > 0 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {gestor.alertas}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {getTrendIcon(gestor.trend)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Indicadores Principais */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className={`text-2xl font-bold ${getEngajamentoColor(gestor.engajamento)}`}>
                        {gestor.engajamento}%
                      </p>
                      <p className="text-xs text-muted-foreground">Engajamento</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className="text-2xl font-bold text-primary">{gestor.taxaParticipacao}%</p>
                      <p className="text-xs text-muted-foreground">Participação</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3 text-center">
                      <p className="text-2xl font-bold text-accent">{gestor.satisfacaoTime.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Satisfação</p>
                    </div>
                  </div>

                  {/* Atividades */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Engajamentos Ativos</span>
                      </div>
                      <span className="font-semibold text-foreground">{gestor.engajamentosAtivos}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-chart-1" />
                        <span className="text-sm text-muted-foreground">Campanhas Ativas</span>
                      </div>
                      <span className="font-semibold text-foreground">{gestor.campanhasAtivas}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-chart-3" />
                        <span className="text-sm text-muted-foreground">Eventos Realizados</span>
                      </div>
                      <span className="font-semibold text-foreground">{gestor.eventosRealizados}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full clay-button bg-transparent"
                    variant="outline"
                    onClick={() => router.push(`/super-admin/gestor/${gestor.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes Completos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparativo" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Ranking de Engajamento</CardTitle>
              <CardDescription>Comparativo de performance entre todos os gestores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gestores
                  .sort((a, b) => b.engajamento - a.engajamento)
                  .map((gestor, index) => (
                    <div key={gestor.id} className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                          index === 0
                            ? "bg-gradient-to-br from-yellow-300 to-yellow-500 text-white"
                            : index === 1
                              ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
                              : index === 2
                                ? "bg-gradient-to-br from-orange-300 to-orange-400 text-white"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={gestor.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {gestor.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{gestor.nome}</p>
                        <p className="text-sm text-muted-foreground">{gestor.departamento}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-full rounded-full bg-muted">
                            <div
                              className={`h-3 rounded-full ${
                                gestor.engajamento >= 85
                                  ? "bg-primary"
                                  : gestor.engajamento >= 70
                                    ? "bg-chart-1"
                                    : "bg-chart-3"
                              }`}
                              style={{ width: `${gestor.engajamento}%` }}
                            />
                          </div>
                          <span className={`w-16 text-right font-bold ${getEngajamentoColor(gestor.engajamento)}`}>
                            {gestor.engajamento}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Comparativo de Métricas */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Comparativo de Métricas</CardTitle>
              <CardDescription>Análise multidimensional dos gestores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {["taxaParticipacao", "taxaConclusao", "satisfacaoTime"].map((metrica) => (
                  <div key={metrica}>
                    <h4 className="mb-3 font-semibold text-foreground">
                      {metrica === "taxaParticipacao" && "Taxa de Participação"}
                      {metrica === "taxaConclusao" && "Taxa de Conclusão"}
                      {metrica === "satisfacaoTime" && "Satisfação do Time"}
                    </h4>
                    <div className="space-y-2">
                      {gestores
                        .sort(
                          (a, b) =>
                            (b[metrica as keyof GestorOverview] as number) -
                            (a[metrica as keyof GestorOverview] as number),
                        )
                        .map((gestor) => {
                          const value = gestor[metrica as keyof GestorOverview] as number
                          const displayValue = metrica === "satisfacaoTime" ? value.toFixed(1) : `${value}%`
                          const maxValue = metrica === "satisfacaoTime" ? 5 : 100
                          const percentage = metrica === "satisfacaoTime" ? (value / 5) * 100 : value

                          return (
                            <div key={gestor.id} className="flex items-center gap-3">
                              <span className="w-32 text-sm text-muted-foreground">{gestor.nome.split(" ")[0]}</span>
                              <div className="h-2 flex-1 rounded-full bg-muted">
                                <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className="w-16 text-right text-sm font-semibold text-foreground">
                                {displayValue}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-chart-3" />
                Alertas de Performance
              </CardTitle>
              <CardDescription>Gestores e times que requerem atenção imediata</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gestores
                  .filter((g) => g.engajamento < 70 || g.taxaConclusao < 65 || g.alertas > 0)
                  .map((gestor) => (
                    <div
                      key={gestor.id}
                      className="rounded-lg border border-chart-3 bg-chart-3/10 p-4 transition-all hover:shadow-md"
                    >
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-chart-3" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">
                            {gestor.nome} - {gestor.departamento}
                          </h4>
                          <div className="mt-2 space-y-1">
                            {gestor.engajamento < 70 && (
                              <p className="text-sm text-muted-foreground">
                                Engajamento crítico: {gestor.engajamento}% (meta: 70%)
                              </p>
                            )}
                            {gestor.taxaConclusao < 65 && (
                              <p className="text-sm text-muted-foreground">
                                Taxa de conclusão baixa: {gestor.taxaConclusao}% (meta: 75%)
                              </p>
                            )}
                            {gestor.satisfacaoTime < 4.0 && (
                              <p className="text-sm text-muted-foreground">
                                Satisfação do time abaixo do esperado: {gestor.satisfacaoTime.toFixed(1)}/5.0
                              </p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="clay-button bg-transparent">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}

                {gestores.filter((g) => g.engajamento < 70 || g.taxaConclusao < 65 || g.alertas > 0).length === 0 && (
                  <div className="rounded-lg border border-chart-1 bg-chart-1/10 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-chart-1" />
                    <p className="mt-3 font-semibold text-foreground">Nenhum Alerta Ativo</p>
                    <p className="text-sm text-muted-foreground">
                      Todos os gestores estão com performance dentro das metas estabelecidas
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recomendações Estratégicas */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Recomendações Estratégicas</CardTitle>
              <CardDescription>Ações sugeridas para melhoria de performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="rounded-lg border border-primary bg-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Reconhecer Melhores Práticas</p>
                      <p className="text-sm text-muted-foreground">
                        Roberto Silva (Tecnologia) apresenta os melhores resultados. Considere compartilhar suas
                        estratégias com outros gestores.
                      </p>
                    </div>
                  </div>
                </div>

                {gestores.some((g) => g.engajamento < 70) && (
                  <div className="rounded-lg border border-chart-3 bg-chart-3/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-chart-3" />
                      <div>
                        <p className="font-semibold text-foreground">Intervenção Necessária</p>
                        <p className="text-sm text-muted-foreground">
                          Times com engajamento abaixo de 70% precisam de atenção imediata. Agende conversas individuais
                          com os gestores afetados.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-chart-1 bg-chart-1/10 p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-chart-1" />
                    <div>
                      <p className="font-semibold text-foreground">Aumentar Frequência de Campanhas</p>
                      <p className="text-sm text-muted-foreground">
                        Gestores com mais campanhas ativas apresentam melhor engajamento. Incentive a criação de novas
                        iniciativas.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
