"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { EngajamentoService } from "@/lib/engajamento-service"
import { EventoService } from "@/lib/evento-service"
import { TrainingService } from "@/lib/training-service"
import { SurveyService } from "@/lib/survey-service"
import {
  ArrowLeft,
  Users,
  Target,
  Calendar,
  FileQuestion,
  GraduationCap,
  TrendingUp,
  Award,
  MessageSquare,
  CheckCircle2,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface GestorDetalhado {
  id: string
  nome: string
  email: string
  avatar: string
  cargo: string
  departamento: string
  timeSize: number
  colaboradores: Array<{
    id: string
    nome: string
    cargo: string
    xp: number
    engajamento: number
  }>
}

const mockGestoresDetalhados: Record<string, GestorDetalhado> = {
  "2": {
    id: "2",
    nome: "Marina Oliveira",
    email: "marina.oliveira@engageai.com",
    avatar: "/professional-avatar-woman-glasses.jpg",
    cargo: "Gerente de Marketing",
    departamento: "Marketing",
    timeSize: 8,
    colaboradores: [
      { id: "3", nome: "Ana Carolina Silva", cargo: "Analista de Marketing", xp: 1200, engajamento: 92 },
      { id: "11", nome: "Lucas Ferreira", cargo: "Designer Gráfico", xp: 980, engajamento: 88 },
      { id: "12", nome: "Juliana Costa", cargo: "Social Media", xp: 1150, engajamento: 90 },
      { id: "13", nome: "Pedro Santos", cargo: "Redator", xp: 850, engajamento: 85 },
      { id: "14", nome: "Mariana Lima", cargo: "Analista de Conteúdo", xp: 1050, engajamento: 87 },
      { id: "15", nome: "Rafael Alves", cargo: "Coordenador de Campanhas", xp: 1300, engajamento: 94 },
      { id: "16", nome: "Camila Souza", cargo: "Analista de SEO", xp: 920, engajamento: 83 },
      { id: "17", nome: "Thiago Mendes", cargo: "Especialista em Ads", xp: 1100, engajamento: 89 },
    ],
  },
  "6": {
    id: "6",
    nome: "Roberto Silva",
    email: "roberto.silva@engageai.com",
    avatar: "/professional-avatar-man-suit.jpg",
    cargo: "Gerente de TI",
    departamento: "Tecnologia",
    timeSize: 15,
    colaboradores: [
      { id: "21", nome: "Carlos Eduardo", cargo: "Desenvolvedor Full Stack", xp: 1450, engajamento: 95 },
      { id: "22", nome: "Amanda Rodrigues", cargo: "DevOps Engineer", xp: 1380, engajamento: 93 },
      { id: "23", nome: "Felipe Oliveira", cargo: "Frontend Developer", xp: 1200, engajamento: 90 },
      { id: "24", nome: "Beatriz Santos", cargo: "Backend Developer", xp: 1320, engajamento: 92 },
      { id: "25", nome: "Gabriel Lima", cargo: "QA Engineer", xp: 1100, engajamento: 88 },
      { id: "26", nome: "Larissa Costa", cargo: "UX/UI Designer", xp: 1250, engajamento: 91 },
      { id: "27", nome: "Ricardo Alves", cargo: "Tech Lead", xp: 1500, engajamento: 96 },
      { id: "28", nome: "Fernanda Souza", cargo: "Scrum Master", xp: 1180, engajamento: 89 },
      { id: "29", nome: "Paulo Mendes", cargo: "Database Admin", xp: 1350, engajamento: 93 },
      { id: "30", nome: "Tatiana Silva", cargo: "Security Analyst", xp: 1280, engajamento: 91 },
      { id: "31", nome: "André Costa", cargo: "Mobile Developer", xp: 1150, engajamento: 87 },
      { id: "32", nome: "Roberta Lima", cargo: "Cloud Architect", xp: 1420, engajamento: 94 },
      { id: "33", nome: "Diego Santos", cargo: "Data Engineer", xp: 1300, engajamento: 92 },
      { id: "34", nome: "Patrícia Alves", cargo: "Solutions Architect", xp: 1380, engajamento: 93 },
      { id: "35", nome: "Vinícius Souza", cargo: "Junior Developer", xp: 850, engajamento: 82 },
    ],
  },
  "7": {
    id: "7",
    nome: "Patricia Costa",
    email: "patricia.costa@engageai.com",
    avatar: "/professional-avatar-woman-suit.jpg",
    cargo: "Gerente Comercial",
    departamento: "Vendas",
    timeSize: 12,
    colaboradores: [
      { id: "41", nome: "João Pedro", cargo: "Executivo de Vendas", xp: 1150, engajamento: 85 },
      { id: "42", nome: "Isabela Martins", cargo: "Consultora Comercial", xp: 980, engajamento: 78 },
      { id: "43", nome: "Marcelo Oliveira", cargo: "Account Manager", xp: 1250, engajamento: 82 },
      { id: "44", nome: "Aline Santos", cargo: "SDR", xp: 850, engajamento: 75 },
      { id: "45", nome: "Gustavo Lima", cargo: "BDR", xp: 920, engajamento: 77 },
      { id: "46", nome: "Carolina Souza", cargo: "Customer Success", xp: 1100, engajamento: 80 },
      { id: "47", nome: "Leonardo Costa", cargo: "Closer", xp: 1200, engajamento: 83 },
      { id: "48", nome: "Renata Alves", cargo: "Inside Sales", xp: 950, engajamento: 76 },
      { id: "49", nome: "Bruno Ferreira", cargo: "Sales Manager", xp: 1350, engajamento: 86 },
      { id: "50", nome: "Vanessa Silva", cargo: "Key Account Manager", xp: 1280, engajamento: 84 },
      { id: "51", nome: "Rodrigo Santos", cargo: "Field Sales", xp: 1050, engajamento: 79 },
      { id: "52", nome: "Luciana Costa", cargo: "Sales Operations", xp: 1120, engajamento: 81 },
    ],
  },
}

const engagementWeekData = [
  { day: "Seg", engajamento: 82 },
  { day: "Ter", engajamento: 85 },
  { day: "Qua", engajamento: 83 },
  { day: "Qui", engajamento: 87 },
  { day: "Sex", engajamento: 90 },
  { day: "Sáb", engajamento: 78 },
  { day: "Dom", engajamento: 75 },
]

export default function GestorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const gestorId = params?.id as string

  const [gestor, setGestor] = useState<GestorDetalhado | null>(null)
  const [engajamentos, setEngajamentos] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [treinamentos, setTreinamentos] = useState<any[]>([])
  const [pesquisas, setPesquisas] = useState<any[]>([])

  useEffect(() => {
    if (!hasPermission("super-admin")) {
      router.push("/")
      return
    }

    const gestorData = mockGestoresDetalhados[gestorId]
    if (gestorData) {
      setGestor(gestorData)
    }

    const allEngajamentos = EngajamentoService.getAll()
    const allEventos = EventoService.getAll()
    const allTreinamentos = TrainingService.getAllCourses()
    const allPesquisas = SurveyService.getAll()

    // Filtrar por criador (simulado - em produção viria do backend)
    setEngajamentos(allEngajamentos.slice(0, 5))
    setEventos(allEventos.slice(0, 3))
    setTreinamentos(allTreinamentos.slice(0, 4))
    setPesquisas(allPesquisas.slice(0, 3))
  }, [gestorId, hasPermission, router])

  if (!hasPermission("super-admin") || !gestor) {
    return null
  }

  const engajamentoMedioTime =
    Math.round(gestor.colaboradores.reduce((acc, c) => acc + c.engajamento, 0) / gestor.colaboradores.length) || 0

  return (
    <div className="container mx-auto max-w-7xl space-y-8 p-8">
      {/* Header com botão voltar */}
      <div>
        <Button variant="ghost" onClick={() => router.push("/super-admin")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>

        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={`/diverse-group-avatars.png?query=${gestor.nome}`} />
            <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
              {gestor.nome
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">{gestor.nome}</h1>
            <p className="mt-1 text-lg text-muted-foreground">
              {gestor.cargo} | {gestor.departamento}
            </p>
            <p className="text-sm text-muted-foreground">{gestor.email}</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge variant="outline" className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                {gestor.timeSize} colaboradores
              </Badge>
              <Badge variant="outline" className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                {engajamentoMedioTime}% engajamento médio
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Rápidos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engajamentos Criados</p>
                <p className="text-3xl font-bold text-primary">{engajamentos.length}</p>
              </div>
              <Target className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos Realizados</p>
                <p className="text-3xl font-bold text-chart-1">{eventos.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-chart-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Treinamentos Ativos</p>
                <p className="text-3xl font-bold text-accent">{treinamentos.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pesquisas Criadas</p>
                <p className="text-3xl font-bold text-chart-3">{pesquisas.length}</p>
              </div>
              <FileQuestion className="h-8 w-8 text-chart-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="time" className="space-y-6">
        <TabsList className="clay-card border-0">
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="engajamentos">Engajamentos</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>
          <TabsTrigger value="pesquisas">Pesquisas</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
        </TabsList>

        {/* Aba Time */}
        <TabsContent value="time" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Evolução do Engajamento do Time */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Engajamento do Time - Última Semana</CardTitle>
                <CardDescription>Média diária de todos os colaboradores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsLineChart data={engagementWeekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="engajamento" stroke="hsl(var(--primary))" strokeWidth={3} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de XP */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Distribuição de XP no Time</CardTitle>
                <CardDescription>Comparativo entre colaboradores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsBarChart data={gestor.colaboradores.slice(0, 6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="nome" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="xp" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Colaboradores */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Todos os Colaboradores ({gestor.colaboradores.length})</CardTitle>
              <CardDescription>Performance individual de cada membro do time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gestor.colaboradores
                  .sort((a, b) => b.xp - a.xp)
                  .map((colab, index) => (
                    <div key={colab.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                          index < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/diverse-group-avatars.png?query=${colab.nome}`} />
                        <AvatarFallback>
                          {colab.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{colab.nome}</p>
                        <p className="text-sm text-muted-foreground">{colab.cargo}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">XP</p>
                          <p className="text-lg font-bold text-primary">{colab.xp}</p>
                        </div>
                        <div className="w-32">
                          <div className="mb-1 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Engajamento</p>
                            <p className="text-xs font-semibold text-foreground">{colab.engajamento}%</p>
                          </div>
                          <Progress value={colab.engajamento} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Engajamentos */}
        <TabsContent value="engajamentos" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Engajamentos Criados pelo Gestor</CardTitle>
              <CardDescription>Missões, desafios e campanhas ativas</CardDescription>
            </CardHeader>
            <CardContent>
              {engajamentos.length === 0 ? (
                <div className="py-12 text-center">
                  <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">Nenhum engajamento criado ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {engajamentos.map((eng) => (
                    <div key={eng.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-foreground">{eng.titulo}</h4>
                            <Badge
                              variant={
                                eng.tipo === "missao" ? "default" : eng.tipo === "desafio" ? "secondary" : "outline"
                              }
                            >
                              {eng.tipo}
                            </Badge>
                            <Badge variant={eng.status === "ativo" ? "default" : "secondary"}>{eng.status}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{eng.descricao}</p>
                          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Award className="h-4 w-4" />
                              {eng.xpRecompensa} XP
                            </span>
                            {eng.dataLimite && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Até {new Date(eng.dataLimite).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="clay-button bg-transparent">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Eventos */}
        <TabsContent value="eventos" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Eventos Criados pelo Gestor</CardTitle>
              <CardDescription>Eventos corporativos e atividades</CardDescription>
            </CardHeader>
            <CardContent>
              {eventos.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">Nenhum evento criado ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventos.map((evento) => (
                    <div key={evento.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-foreground">{evento.titulo}</h4>
                            <Badge>{evento.tipo}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{evento.descricao}</p>
                          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(evento.data).toLocaleDateString("pt-BR")} às {evento.horario}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {evento.confirmacoes || 0} confirmados
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="clay-button bg-transparent">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Treinamentos */}
        <TabsContent value="treinamentos" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Treinamentos Criados pelo Gestor</CardTitle>
              <CardDescription>Cursos e programas de capacitação</CardDescription>
            </CardHeader>
            <CardContent>
              {treinamentos.length === 0 ? (
                <div className="py-12 text-center">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">Nenhum treinamento criado ainda</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {treinamentos.map((treinamento) => (
                    <Card key={treinamento.id} className="clay-button border-border">
                      <CardContent className="pt-6">
                        <div className="mb-3 flex items-center justify-between">
                          <GraduationCap className="h-8 w-8 text-primary" />
                          <Badge variant="outline">{treinamento.lessons?.length || 0} aulas</Badge>
                        </div>
                        <h4 className="font-bold text-foreground">{treinamento.title}</h4>
                        <p className="mt-2 text-sm text-muted-foreground">{treinamento.description}</p>
                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{treinamento.duration || "40 min"}</span>
                          <span className="font-semibold text-primary">+{treinamento.xpReward} XP</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Pesquisas */}
        <TabsContent value="pesquisas" className="space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Pesquisas Criadas pelo Gestor</CardTitle>
              <CardDescription>Questionários e surveys</CardDescription>
            </CardHeader>
            <CardContent>
              {pesquisas.length === 0 ? (
                <div className="py-12 text-center">
                  <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">Nenhuma pesquisa criada ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pesquisas.map((pesquisa) => (
                    <div key={pesquisa.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-foreground">{pesquisa.title}</h4>
                            <Badge variant={pesquisa.status === "active" ? "default" : "secondary"}>
                              {pesquisa.status}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{pesquisa.description}</p>
                          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {pesquisa.questions?.length || 0} perguntas
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              {pesquisa.responses || 0} respostas
                            </span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="clay-button bg-transparent">
                          Ver Resultados
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Resultados */}
        <TabsContent value="resultados" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Taxa de Participação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-5xl font-bold text-primary">92%</p>
                  <p className="mt-2 text-sm text-muted-foreground">Dos colaboradores participam ativamente</p>
                  <Progress value={92} className="mt-4 h-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Taxa de Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-5xl font-bold text-chart-1">78%</p>
                  <p className="mt-2 text-sm text-muted-foreground">Dos engajamentos são concluídos</p>
                  <Progress value={78} className="mt-4 h-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Satisfação do Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-5xl font-bold text-accent">4.5</p>
                  <p className="mt-2 text-sm text-muted-foreground">de 5.0 estrelas</p>
                  <Progress value={90} className="mt-4 h-3" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Performance Comparativa</CardTitle>
              <CardDescription>Comparação com outros gestores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Engajamento do Time</span>
                    <span className="text-sm font-bold text-primary">{engajamentoMedioTime}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={engajamentoMedioTime} className="h-2 flex-1" />
                    <Badge variant="outline">Top 25%</Badge>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Criação de Conteúdo</span>
                    <span className="text-sm font-bold text-primary">Alto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="h-2 flex-1" />
                    <Badge variant="outline">Top 15%</Badge>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Resposta às Solicitações</span>
                    <span className="text-sm font-bold text-primary">Excelente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={95} className="h-2 flex-1" />
                    <Badge variant="outline">Top 10%</Badge>
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
