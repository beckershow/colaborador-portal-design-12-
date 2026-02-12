"use client"

import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { EngajamentoService } from "@/lib/engajamento-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

export default function EngajamentoDetalhePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [engajamento, setEngajamento] = useState<ReturnType<typeof EngajamentoService.getEngajamentoById>>(null)
  const [progress, setProgress] = useState<ReturnType<typeof EngajamentoService.getParticipantProgress>>(undefined)

  useEffect(() => {
    if (!user || !params.id) return

    const eng = EngajamentoService.getEngajamentoById(params.id as string)
    setEngajamento(eng)

    if (eng) {
      const prog = EngajamentoService.getParticipantProgress(eng.id, user.id)
      setProgress(prog)
    }
  }, [user, params.id])

  if (!user || !engajamento) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = () => {
    if (!progress) return null

    switch (progress.status) {
      case "completed":
        return (
          <Badge className="bg-primary text-primary-foreground">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Concluído
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="border-primary text-primary">
            <Clock className="mr-1 h-3 w-3" />
            Em Andamento
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Falhou
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-8 py-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="clay-button bg-transparent" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-foreground">{engajamento.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">Acompanhe seu progresso neste engajamento</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Progresso Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{progress?.progressPercentage || 0}%</div>
              <p className="mt-2 text-sm text-muted-foreground">Completo</p>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Recompensa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">XP</span>
                <span className="text-lg font-bold text-primary">+{engajamento.rewardXP}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estrelas</span>
                <span className="text-lg font-bold text-accent">⭐ {engajamento.rewardStars}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                engajamento.type === "missao" ? "default" : engajamento.type === "desafio" ? "secondary" : "outline"
              }
              className="text-lg capitalize py-2 px-4"
            >
              {engajamento.type}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">{engajamento.description}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="clay-card border-0">
        <CardHeader>
          <CardTitle>Objetivo do Engajamento</CardTitle>
          <CardDescription>Comportamento esperado na plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{engajamento.objective}</p>
        </CardContent>
      </Card>

      {progress && (
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle>Seu Progresso</CardTitle>
            <CardDescription>
              {progress.completedActions.length} de {engajamento.validationRules.requiredActions.length} ações
              completadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Progress value={progress.progressPercentage} className="h-3" />
            </div>

            <div className="space-y-4">
              {engajamento.validationRules.requiredActions.map((action) => {
                const isCompleted = progress.completedActions.includes(action.id)

                return (
                  <div
                    key={action.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 ${
                      isCompleted ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <div
                      className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border-2 border-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isCompleted ? "text-primary" : "text-foreground"}`}>
                        {action.description}
                      </h4>
                      {action.target && (
                        <p className="mt-1 text-sm text-muted-foreground">Meta: {action.target} vezes</p>
                      )}
                      {isCompleted && <p className="mt-1 text-sm text-primary font-medium">Completo!</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {progress?.status === "failed" && progress.failureReason && (
        <Card className="clay-card border-0 border-l-4 border-l-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Engajamento Falhou</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{progress.failureReason}</p>
          </CardContent>
        </Card>
      )}

      {engajamento.completionMethod === "automatico" && progress?.status === "in_progress" && (
        <Card className="clay-card border-0 bg-accent/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground">Validação Automática Ativada</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Este engajamento é validado automaticamente pelo sistema. Continue executando as ações necessárias e
                  seu progresso será atualizado em tempo real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {progress?.startedAt && (
            <p>
              Iniciado em:{" "}
              {new Date(progress.startedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          {progress?.completedAt && (
            <p className="mt-1">
              Concluído em:{" "}
              {new Date(progress.completedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => router.push("/")}>
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  )
}
