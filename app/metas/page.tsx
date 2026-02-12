"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetasService, type Meta, type ProgressoMeta } from "@/lib/metas-service"
import {
  Target,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  TrendingUp,
  Award,
  Zap,
  Heart,
  MessageSquare,
  ThumbsUp,
  BookOpen,
  GraduationCap,
  ArrowLeft,
  Info,
} from "lucide-react"

const acoesPossiveis = [
  { value: "registro-humor", label: "Registro de Humor", icon: Heart },
  { value: "publicacao-feed", label: "Publicação no Feed", icon: MessageSquare },
  { value: "curtida", label: "Curtida", icon: ThumbsUp },
  { value: "comentario", label: "Comentário", icon: MessageSquare },
  { value: "envio-feedback", label: "Envio de Feedback", icon: MessageSquare },
  { value: "resposta-pesquisa", label: "Resposta de Pesquisa", icon: Target },
  { value: "conclusao-treinamento", label: "Conclusão de Treinamento", icon: GraduationCap },
  { value: "participacao-trilha", label: "Participação em Trilha", icon: BookOpen },
  { value: "participacao-evento", label: "Participação em Evento", icon: Calendar },
  { value: "interacao-recorrente", label: "Interação Recorrente", icon: TrendingUp },
]

export default function MetasPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [metasAtivas, setMetasAtivas] = useState<Array<Meta & { progresso: number; concluida: boolean }>>([])
  const [metasConcluidas, setMetasConcluidas] = useState<Array<Meta & { progresso: number; concluida: boolean }>>([])
  const [totalConcluidas, setTotalConcluidas] = useState(0)

  useEffect(() => {
    if (user) {
      const todasMetas = MetasService.getMetasAtivasComProgresso(user.id)
      setMetasAtivas(todasMetas.filter((m) => !m.concluida))
      setMetasConcluidas(todasMetas.filter((m) => m.concluida))
      setTotalConcluidas(MetasService.getMetasConcluidasColaborador(user.id))
    }
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Faça login para ver suas metas</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Minhas Metas</h1>
            <p className="text-muted-foreground">Acompanhe seu progresso e conquiste novas metas</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Metas Ativas</CardDescription>
            <CardTitle className="text-3xl">{metasAtivas.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Metas Concluídas</CardDescription>
            <CardTitle className="text-3xl text-green-500">{totalConcluidas}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Total atingido</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Taxa de Sucesso</CardDescription>
            <CardTitle className="text-3xl">
              {metasAtivas.length + totalConcluidas > 0
                ? Math.round((totalConcluidas / (metasAtivas.length + totalConcluidas)) * 100)
                : 0}
              %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Conclusão geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Progresso Médio</CardDescription>
            <CardTitle className="text-3xl">
              {metasAtivas.length > 0
                ? Math.round(metasAtivas.reduce((acc, m) => acc + m.progresso, 0) / metasAtivas.length)
                : 0}
              %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Metas ativas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Metas */}
      <Tabs defaultValue="ativas" className="w-full">
        <TabsList>
          <TabsTrigger value="ativas">
            <Zap className="h-4 w-4 mr-2" />
            Ativas ({metasAtivas.length})
          </TabsTrigger>
          <TabsTrigger value="concluidas">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Concluídas ({metasConcluidas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativas" className="space-y-4">
          {metasAtivas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma meta ativa no momento</p>
              </CardContent>
            </Card>
          ) : (
            metasAtivas.map((meta) => (
              <Card key={meta.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            meta.tipo === "engajamento"
                              ? "default"
                              : meta.tipo === "desenvolvimento"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {meta.tipo === "engajamento"
                            ? "Engajamento"
                            : meta.tipo === "desenvolvimento"
                              ? "Desenvolvimento"
                              : "Liderança"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {meta.periodo}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {meta.escopo}
                        </Badge>
                      </div>
                      <CardTitle>{meta.nome}</CardTitle>
                      <CardDescription className="mt-2">{meta.descricao}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-primary">{meta.progresso}%</p>
                      <p className="text-xs text-muted-foreground">Progresso</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Barra de Progresso */}
                  <div className="space-y-2">
                    <Progress value={meta.progresso} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {meta.progresso >= 100 ? "Meta completa!" : `Faltam ${100 - meta.progresso}% para concluir`}
                    </p>
                  </div>

                  {/* Critérios */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Critérios para Conclusão:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {meta.criterios.map((criterio) => {
                        const acaoInfo = acoesPossiveis.find((a) => a.value === criterio.acao)
                        const Icon = acaoInfo?.icon || Target
                        const progresso = MetasService.getProgressoMeta(meta.id, user.id)
                        const atual = progresso?.criteriosCompletos[criterio.id] || 0
                        const percentual = Math.round((atual / criterio.quantidadeMinima) * 100)

                        return (
                          <div key={criterio.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{acaoInfo?.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {atual}/{criterio.quantidadeMinima} - {percentual}%
                              </p>
                            </div>
                            {percentual >= 100 && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Info Adicional */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {meta.escopo === "individual" ? "Individual" : "Time"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {meta.periodo}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="concluidas" className="space-y-4">
          {metasConcluidas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma meta concluída ainda</p>
                <p className="text-sm text-muted-foreground mt-2">Continue trabalhando nas suas metas ativas!</p>
              </CardContent>
            </Card>
          ) : (
            metasConcluidas.map((meta) => (
              <Card key={meta.id} className="border-green-500/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Concluída
                        </Badge>
                        <Badge
                          variant={
                            meta.tipo === "engajamento"
                              ? "default"
                              : meta.tipo === "desenvolvimento"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {meta.tipo === "engajamento"
                            ? "Engajamento"
                            : meta.tipo === "desenvolvimento"
                              ? "Desenvolvimento"
                              : "Liderança"}
                        </Badge>
                      </div>
                      <CardTitle>{meta.nome}</CardTitle>
                      <CardDescription className="mt-2">{meta.descricao}</CardDescription>
                    </div>
                    <Award className="h-12 w-12 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Meta concluída com sucesso!</span>
                    <span className="text-green-500 font-semibold">100% ✓</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
