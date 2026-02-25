"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, ClipboardList, BookOpen, Send, MessageSquare, Gift, Loader2 } from "lucide-react"
import Link from "next/link"

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface Survey {
  id: string
  title: string
  description: string | null
  type: string
  rewardXP: number
  hasResponded: boolean
  createdAt: string
  creator: { id: string; nome: string }
}

interface TrainingProgress {
  trainingId: string
  progress: number
  score: number | null
  completedAt: string | null
  startedAt: string | null
}

interface Training {
  id: string
  title: string
  description: string | null
  rewardXP: number
  status: string
}

interface Feedback {
  id: string
  type: string
  content: string
  status: string
  isAnonymous: boolean
  createdAt: string
  fromUser: { id: string; nome: string; cargo: string; avatar?: string } | null
  toUser: { id: string; nome: string; cargo: string; avatar?: string }
}

interface Redemption {
  id: string
  starsCost: number
  redeemedAt: string
  reward: {
    id: string
    nome: string
    descricao: string | null
    imageUrl: string | null
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const FEEDBACK_TYPE_LABEL: Record<string, string> = {
  reconhecimento: "Reconhecimento",
  sugestao: "Sugestão",
  critica_construtiva: "Crítica Construtiva",
  agradecimento: "Agradecimento",
  desenvolvimento: "Desenvolvimento",
}

const STATUS_VARIANT: Record<string, string> = {
  aprovado: "default",
  pendente: "secondary",
  rejeitado: "destructive",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <p className="text-sm">Nenhum(a) {label} encontrado(a).</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function HistoricoInteracoesPage() {
  const { user } = useAuth()

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress[]>([])
  const [feedbacksSent, setFeedbacksSent] = useState<Feedback[]>([])
  const [feedbacksReceived, setFeedbacksReceived] = useState<Feedback[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      apiFetch<{ data: Survey[] }>("/surveys?limit=100"),
      apiFetch<{ data: Training[] }>("/trainings?limit=100"),
      apiFetch<{ data: TrainingProgress[] }>("/trainings/progress/me"),
      apiFetch<{ data: Feedback[] }>("/feedbacks?type=sent&limit=100"),
      apiFetch<{ data: Feedback[] }>("/feedbacks?type=received&limit=100"),
      apiFetch<{ data: Redemption[] }>("/rewards/redemptions"),
    ])
      .then(([sv, tr, tp, fs, fr, rd]) => {
        setSurveys(sv.data.filter((s) => s.hasResponded))
        setTrainings(tr.data)
        setTrainingProgress(tp.data.filter((p) => p.completedAt !== null))
        setFeedbacksSent(fs.data)
        setFeedbacksReceived(fr.data)
        setRedemptions(rd.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  // Join training progress with training info
  const completedTrainings = trainingProgress
    .map((tp) => ({
      ...tp,
      training: trainings.find((t) => t.id === tp.trainingId),
    }))
    .filter((t) => t.training)

  return (
    <div className="container mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <Link href="/perfil">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Meu Perfil
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-foreground">Histórico de Interações</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Todas as suas atividades e interações na plataforma
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pesquisas">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pesquisas" className="flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Pesquisas
          </TabsTrigger>
          <TabsTrigger value="treinamentos" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Treinamentos
          </TabsTrigger>
          <TabsTrigger value="enviados" className="flex items-center gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Feedbacks Enviados
          </TabsTrigger>
          <TabsTrigger value="recebidos" className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Feedbacks Recebidos
          </TabsTrigger>
          <TabsTrigger value="recompensas" className="flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            Recompensas
          </TabsTrigger>
        </TabsList>

        {/* ── Pesquisas Respondidas ── */}
        <TabsContent value="pesquisas" className="mt-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Pesquisas Respondidas</CardTitle>
              <CardDescription>{surveys.length} pesquisa(s) respondida(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState />
              ) : surveys.length === 0 ? (
                <EmptyState label="pesquisa respondida" />
              ) : (
                <div className="divide-y divide-border">
                  {surveys.map((s) => (
                    <div key={s.id} className="flex items-start justify-between gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{s.title}</p>
                        {s.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{s.description}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Criada por {s.creator.nome} · {formatDate(s.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">+{s.rewardXP} XP</Badge>
                        <Badge className="text-xs bg-chart-1/20 text-chart-1 border-0">Respondida</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Treinamentos Concluídos ── */}
        <TabsContent value="treinamentos" className="mt-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Treinamentos Concluídos</CardTitle>
              <CardDescription>{completedTrainings.length} treinamento(s) concluído(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState />
              ) : completedTrainings.length === 0 ? (
                <EmptyState label="treinamento concluído" />
              ) : (
                <div className="divide-y divide-border">
                  {completedTrainings.map((t) => (
                    <div key={t.trainingId} className="flex items-start justify-between gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{t.training!.title}</p>
                        {t.training!.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{t.training!.description}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Concluído em {formatDate(t.completedAt!)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.score !== null && (
                          <Badge variant="secondary" className="text-xs">Nota: {t.score}%</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">+{t.training!.rewardXP} XP</Badge>
                        <Badge className="text-xs bg-chart-1/20 text-chart-1 border-0">Concluído</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Feedbacks Enviados ── */}
        <TabsContent value="enviados" className="mt-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Feedbacks Enviados</CardTitle>
              <CardDescription>{feedbacksSent.length} feedback(s) enviado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState />
              ) : feedbacksSent.length === 0 ? (
                <EmptyState label="feedback enviado" />
              ) : (
                <div className="divide-y divide-border">
                  {feedbacksSent.map((f) => (
                    <div key={f.id} className="flex items-start gap-4 py-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={f.toUser.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/20 text-sm">
                          {f.toUser.nome.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">Para {f.toUser.nome}</p>
                          <Badge variant="outline" className="text-xs">{FEEDBACK_TYPE_LABEL[f.type] ?? f.type}</Badge>
                          <Badge variant={STATUS_VARIANT[f.status] as "default" | "secondary" | "destructive"} className="text-xs capitalize">
                            {f.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{f.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(f.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Feedbacks Recebidos ── */}
        <TabsContent value="recebidos" className="mt-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Feedbacks Recebidos</CardTitle>
              <CardDescription>{feedbacksReceived.length} feedback(s) recebido(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState />
              ) : feedbacksReceived.length === 0 ? (
                <EmptyState label="feedback recebido" />
              ) : (
                <div className="divide-y divide-border">
                  {feedbacksReceived.map((f) => (
                    <div key={f.id} className="flex items-start gap-4 py-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        {f.isAnonymous || !f.fromUser ? (
                          <AvatarFallback className="bg-muted text-sm">?</AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src={f.fromUser.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="bg-primary/20 text-sm">
                              {f.fromUser.nome.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">
                            De {f.isAnonymous || !f.fromUser ? "Anônimo" : f.fromUser.nome}
                          </p>
                          <Badge variant="outline" className="text-xs">{FEEDBACK_TYPE_LABEL[f.type] ?? f.type}</Badge>
                          <Badge variant={STATUS_VARIANT[f.status] as "default" | "secondary" | "destructive"} className="text-xs capitalize">
                            {f.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{f.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(f.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Recompensas Resgatadas ── */}
        <TabsContent value="recompensas" className="mt-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Recompensas Resgatadas</CardTitle>
              <CardDescription>{redemptions.length} recompensa(s) resgatada(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState />
              ) : redemptions.length === 0 ? (
                <EmptyState label="recompensa resgatada" />
              ) : (
                <div className="divide-y divide-border">
                  {redemptions.map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{r.reward.nome}</p>
                        {r.reward.descricao && (
                          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{r.reward.descricao}</p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          Resgatado em {formatDate(r.redeemedAt)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        ⭐ {r.starsCost} estrelas
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
