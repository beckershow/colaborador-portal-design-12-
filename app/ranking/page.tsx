"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Medal, Award, TrendingUp, Star, Crown, Flame } from "lucide-react"
import { RankingService, type RankingFilters } from "@/lib/ranking-service"
import { useAuth } from "@/lib/auth-context"

export default function RankingPage() {
  const { user } = useAuth()
  const [filters, setFilters] = useState<RankingFilters>({ periodo: "semana" })
  const ranking = RankingService.getRanking(filters)
  const topPerformers = ranking.slice(0, 3)
  const restOfRanking = ranking.slice(3)

  const userPosition = ranking.find((u) => u.id === user?.id)

  const getPodiumIcon = (posicao: number) => {
    switch (posicao) {
      case 1:
        return <Crown className="h-6 w-6 text-accent" />
      case 2:
        return <Medal className="h-6 w-6 text-chart-1" />
      case 3:
        return <Award className="h-6 w-6 text-chart-3" />
      default:
        return null
    }
  }

  const getPodiumBg = (posicao: number) => {
    switch (posicao) {
      case 1:
        return "bg-gradient-to-br from-accent/30 via-accent/20 to-accent/10"
      case 2:
        return "bg-gradient-to-br from-chart-1/30 via-chart-1/20 to-chart-1/10"
      case 3:
        return "bg-gradient-to-br from-chart-3/30 via-chart-3/20 to-chart-3/10"
      default:
        return "bg-muted/30"
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Ranking de Engajamento</h1>
        <p className="mt-2 text-lg text-muted-foreground">Acompanhe os colaboradores mais engajados e motivados</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Período:</label>
          <Select
            value={filters.periodo}
            onValueChange={(value) =>
              setFilters({ ...filters, periodo: value as "semana" | "mes" | "trimestre" | "ano" })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
              <SelectItem value="trimestre">Este Trimestre</SelectItem>
              <SelectItem value="ano">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Departamento:</label>
          <Select
            value={filters.departamento || "todos"}
            onValueChange={(value) => setFilters({ ...filters, departamento: value === "todos" ? undefined : value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Departamentos</SelectItem>
              {RankingService.getDepartamentos().map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Top 3 Podium */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Podium */}
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-accent" />
                <CardTitle>Top 3 da {filters.periodo === "semana" ? "Semana" : "Período"}</CardTitle>
              </div>
              <CardDescription>Os colaboradores mais engajados do período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {topPerformers.map((performer) => (
                  <div key={performer.id} className={`rounded-xl p-6 ${getPodiumBg(performer.posicao)}`}>
                    <div className="flex flex-col items-center text-center">
                      <div className="mb-3">{getPodiumIcon(performer.posicao)}</div>
                      <Avatar className="h-20 w-20 border-4 border-white/80">
                        <AvatarImage
                          src={`/diverse-group-avatars.png?height=80&width=80&query=avatar ${performer.nome}`}
                        />
                        <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                          {performer.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="mt-4 font-bold text-foreground">{performer.nome}</h3>
                      <p className="text-xs text-muted-foreground">{performer.cargo}</p>
                      <p className="text-xs text-muted-foreground">{performer.departamento}</p>

                      <div className="mt-4 flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{performer.xp}</p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-accent">⭐ {performer.estrelas}</p>
                          <p className="text-xs text-muted-foreground">Estrelas</p>
                        </div>
                      </div>

                      <Badge className="mt-3 bg-primary/20 text-primary">Nível {performer.nivel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full Ranking Table */}
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Ranking Completo</CardTitle>
              </div>
              <CardDescription>Posição de todos os colaboradores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {restOfRanking.map((rankedUser) => {
                  const isCurrentUser = rankedUser.id === user?.id
                  return (
                    <div
                      key={rankedUser.id}
                      className={`flex items-center gap-4 rounded-lg p-4 transition-colors ${
                        isCurrentUser
                          ? "border-2 border-primary bg-primary/10"
                          : "border border-border bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                          isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rankedUser.posicao}
                      </div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={`/diverse-group-avatars.png?height=48&width=48&query=avatar ${rankedUser.nome}`}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {rankedUser.avatar}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {rankedUser.nome}
                          {isCurrentUser && (
                            <Badge variant="outline" className="ml-2 border-primary text-primary">
                              Você
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rankedUser.cargo} • {rankedUser.departamento}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-lg font-bold text-primary">{rankedUser.xp}</p>
                          <p className="text-xs text-muted-foreground">XP</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-accent">⭐ {rankedUser.estrelas}</p>
                          <p className="text-xs text-muted-foreground">Estrelas</p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          Nv. {rankedUser.nivel}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - User Stats & Info */}
        <div className="space-y-6">
          {/* Your Position */}
          {user?.role === "colaborador" && userPosition && (
            <Card className="clay-card border-0 border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <CardTitle>Sua Posição</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                    {userPosition.posicao}
                  </div>
                  <p className="text-2xl font-bold text-foreground">{userPosition.nome}</p>
                  <p className="text-sm text-muted-foreground">{userPosition.cargo}</p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-card p-3">
                      <p className="text-2xl font-bold text-primary">{userPosition.xp}</p>
                      <p className="text-xs text-muted-foreground">XP Total</p>
                    </div>
                    <div className="rounded-lg bg-card p-3">
                      <p className="text-2xl font-bold text-accent">⭐ {userPosition.estrelas}</p>
                      <p className="text-xs text-muted-foreground">Estrelas</p>
                    </div>
                  </div>

                  <Badge className="mt-4 bg-primary text-primary-foreground">Nível {userPosition.nivel}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Engagement Breakdown */}
          {user?.role === "colaborador" && userPosition && (
            <Card className="clay-card border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-chart-2" />
                  <CardTitle>Seu Engajamento</CardTitle>
                </div>
                <CardDescription>Detalhamento da sua participação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                        <span className="text-lg">😊</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Check-ins de Humor</span>
                    </div>
                    <Badge variant="outline">{userPosition.progresso.humorDias} dias</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-1/20">
                        <span className="text-lg">💬</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Feedbacks Enviados</span>
                    </div>
                    <Badge variant="outline">{userPosition.progresso.feedbacksEnviados}</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-2/20">
                        <span className="text-lg">📋</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Pesquisas Completas</span>
                    </div>
                    <Badge variant="outline">{userPosition.progresso.pesquisasCompletas}</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                        <span className="text-lg">🎓</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Treinamentos</span>
                    </div>
                    <Badge variant="outline">{userPosition.progresso.treinamentosConcluidos}</Badge>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chart-3/20">
                        <span className="text-lg">✍️</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">Posts no Feed</span>
                    </div>
                    <Badge variant="outline">{userPosition.progresso.postsFeed}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* How to Climb */}
          <Card className="clay-card border-0 bg-gradient-to-br from-accent/10 to-chart-1/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <CardTitle>Como Subir no Ranking</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Registre seu humor todos os dias</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Envie e responda feedbacks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Complete pesquisas e treinamentos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Participe ativamente do Feed Social</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">•</span>
                  <span>Resgate recompensas e conquiste badges</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
