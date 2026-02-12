"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { SurveyService, type Survey } from "@/lib/survey-service"
import { useState, useEffect } from "react"
import { ClipboardList, AlertCircle, CheckCircle2, Clock, Star, TrendingUp, Play, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function PesquisasPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([])
  const [completedSurveys, setCompletedSurveys] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  const canCreateSurveys = hasPermission(["gestor", "super-admin"])

  useEffect(() => {
    if (!user) return

    loadData()
  }, [user])

  const loadData = () => {
    if (!user) return

    setActiveSurveys(SurveyService.getActiveSurveys(user.id, user.departamento))
    setCompletedSurveys(SurveyService.getUserResponses(user.id))
    setStats(SurveyService.getUserStats(user.id))
  }

  const handleStartSurvey = (surveyId: string) => {
    router.push(`/pesquisas/${surveyId}`)
  }

  if (!user) return null

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="container mx-auto max-w-7xl space-y-8 py-6 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Pesquisas</h1>
            <p className="mt-2 text-lg text-muted-foreground">Compartilhe sua opinião e ajude a melhorar a empresa</p>
          </div>
          {canCreateSurveys && (
            <Button className="clay-button" size="lg" onClick={() => router.push("/pesquisas/criar")}>
              <Plus className="mr-2 h-5 w-5" />
              Criar Pesquisa
            </Button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="clay-card border-0">
            <CardContent className="pt-6 text-center">
              <div className="mb-2 text-4xl">📝</div>
              <p className="text-3xl font-bold text-primary">{stats?.totalResponded || 0}</p>
              <p className="text-sm text-muted-foreground">Respondidas</p>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="pt-6 text-center">
              <div className="mb-2 text-4xl">⏳</div>
              <p className="text-3xl font-bold text-chart-3">{stats?.pendingSurveys || 0}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="pt-6 text-center">
              <div className="mb-2 text-4xl">⭐</div>
              <p className="text-3xl font-bold text-accent">+{stats?.totalXP || 0} XP</p>
              <p className="text-sm text-muted-foreground">Ganhos Total</p>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardContent className="pt-6 text-center">
              <div className="mb-2 text-4xl">📈</div>
              <p className="text-3xl font-bold text-chart-1">{stats?.participationRate || 0}%</p>
              <p className="text-sm text-muted-foreground">Taxa de Participação</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendentes" className="space-y-6">
          <TabsList className="clay-card border-0">
            <TabsTrigger value="pendentes">
              Pendentes
              {stats?.pendingSurveys > 0 && (
                <Badge className="ml-2 bg-chart-3 text-white">{stats.pendingSurveys}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="respondidas">Respondidas ({stats?.totalResponded || 0})</TabsTrigger>
          </TabsList>

          {/* Pesquisas Pendentes */}
          <TabsContent value="pendentes" className="space-y-6">
            {activeSurveys.length === 0 ? (
              <Card className="clay-card border-0">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
                  <p className="mt-4 text-xl font-semibold text-foreground">Tudo em dia!</p>
                  <p className="mt-2 text-muted-foreground">Você não tem pesquisas pendentes no momento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeSurveys.map((survey) => (
                  <Card key={survey.id} className="clay-card border-0 w-full max-w-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="truncate">{survey.title}</span>
                          </CardTitle>
                          <CardDescription>
                            {survey.deadline && `Prazo: ${new Date(survey.deadline).toLocaleDateString("pt-BR")}`}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                        <p className="text-sm text-muted-foreground">{survey.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            <span>{survey.questions.length} perguntas</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>~{Math.ceil(survey.questions.length * 0.5)} minutos</span>
                          </div>
                          {survey.rewards && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                              <Star className="h-4 w-4" />
                              <span>
                                +{survey.rewards.xp} XP · ⭐ {survey.rewards.stars} estrelas
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button onClick={() => handleStartSurvey(survey.id)} className="w-full clay-button" size="lg">
                        <Play className="mr-2 h-4 w-4" />
                        Responder Agora
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pesquisas Respondidas */}
          <TabsContent value="respondidas" className="space-y-6">
            <Card className="clay-card border-0 w-full max-w-full">
              <CardHeader>
                <CardTitle>Histórico de Pesquisas</CardTitle>
                <CardDescription>
                  Você respondeu {stats?.totalResponded || 0} pesquisas e ganhou +{stats?.totalXP || 0} XP
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedSurveys.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-muted bg-muted/10 p-12 text-center">
                    <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold text-foreground">Nenhuma pesquisa respondida ainda</p>
                    <p className="mt-2 text-sm text-muted-foreground">Comece respondendo as pesquisas pendentes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedSurveys.map((response) => {
                      const survey = SurveyService.getSurveyById(response.surveyId)
                      if (!survey) return null

                      return (
                        <div
                          key={response.id}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-lg border border-border bg-card p-4"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
                              <CheckCircle2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">{survey.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {survey.questions.length} perguntas · Respondida em{" "}
                                {new Date(response.completedAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge className="bg-primary text-primary-foreground">Concluída</Badge>
                            {survey.rewards && (
                              <p className="mt-1 text-sm font-semibold text-primary">
                                +{survey.rewards.xp} XP · ⭐ {survey.rewards.stars}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Impacto das Suas Respostas */}
            {completedSurveys.length > 0 && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle>Seu Impacto</CardTitle>
                  <CardDescription>Suas respostas ajudam a melhorar o ambiente de trabalho</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 text-center">
                      <div className="text-3xl mb-2">💡</div>
                      <p className="text-2xl font-bold text-primary">{completedSurveys.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">Pesquisas Respondidas</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-accent/10 to-accent/5 p-4 text-center">
                      <div className="text-3xl mb-2">⚡</div>
                      <p className="text-2xl font-bold text-accent">+{stats?.totalXP || 0}</p>
                      <p className="text-sm text-muted-foreground mt-1">XP Ganhos</p>
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-chart-1/10 to-chart-1/5 p-4 text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <p className="text-2xl font-bold text-chart-1">{stats?.participationRate || 0}%</p>
                      <p className="text-sm text-muted-foreground mt-1">Taxa de Participação</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
