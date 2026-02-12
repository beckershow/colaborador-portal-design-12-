"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { HumorService } from "@/lib/humor-service"
import { useState, useEffect } from "react"
import { Heart, TrendingUp, Calendar, Sparkles, Clock, Ban } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, Line, LineChart } from "recharts"

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  if (!payload.emoji) return null

  return (
    <g>
      <circle cx={cx} cy={cy} r={20} fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth={2} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={20}>
        {payload.emoji}
      </text>
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-foreground">{data.date}</p>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{data.emoji}</span>
          <div>
            <p className="text-lg font-bold text-primary">{data.label}</p>
            <p className="text-xs text-muted-foreground">Humor do dia</p>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function HumorPage() {
  const { user } = useAuth()
  const [hasRegisteredToday, setHasRegisteredToday] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [timeUntilNext, setTimeUntilNext] = useState("")
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return

    // Carregar dados
    setHasRegisteredToday(HumorService.hasRegisteredToday(user.id))
    setStats(HumorService.getStats(user.id))
    setHistory(HumorService.getLast14Days(user.id))
    setTimeUntilNext(HumorService.getTimeUntilNextCheck(user.id))

    // Atualizar tempo restante a cada minuto
    const interval = setInterval(() => {
      setTimeUntilNext(HumorService.getTimeUntilNextCheck(user.id))
    }, 60000)

    return () => clearInterval(interval)
  }, [user])

  const handleRegisterMood = async (moodValue: number) => {
    if (!user || hasRegisteredToday) return

    setSelectedMood(moodValue)
    setIsSubmitting(true)

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 800))

    HumorService.registerMood(user.id, moodValue)

    // Recarregar dados
    setHasRegisteredToday(true)
    setStats(HumorService.getStats(user.id))
    setHistory(HumorService.getLast14Days(user.id))
    setTimeUntilNext(HumorService.getTimeUntilNextCheck(user.id))

    setIsSubmitting(false)
    setSelectedMood(null)
  }

  if (!user) return null

  const moods = [
    { value: 5, emoji: "😄", label: "Ótimo", color: "bg-primary/10 hover:bg-primary/20 border-primary" },
    { value: 4, emoji: "😊", label: "Bem", color: "bg-chart-1/10 hover:bg-chart-1/20 border-chart-1" },
    { value: 3, emoji: "😐", label: "Neutro", color: "bg-muted hover:bg-muted/80 border-muted-foreground" },
    { value: 2, emoji: "😔", label: "Triste", color: "bg-chart-3/10 hover:bg-chart-3/20 border-chart-3" },
    {
      value: 1,
      emoji: "😰",
      label: "Estressado",
      color: "bg-destructive/10 hover:bg-destructive/20 border-destructive",
    },
  ]

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Jornada do Humor</h1>
        <p className="mt-2 text-lg text-muted-foreground">Acompanhe sua jornada emocional e identifique padrões</p>
      </div>

      <div className="grid gap-6">
        {/* Registro de Humor Hoje */}
        <Card className="clay-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-chart-3" />
                  Como você está hoje?
                </CardTitle>
                <CardDescription>
                  {hasRegisteredToday
                    ? "Você já registrou seu humor hoje. Obrigado!"
                    : "Registre seu humor e ganhe +20 XP e ⭐ 5 estrelas"}
                </CardDescription>
              </div>
              <Badge className="bg-primary text-primary-foreground">
                <Calendar className="mr-1 h-3.5 w-3.5" />
                {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {!hasRegisteredToday ? (
              <div className="grid grid-cols-5 gap-4">
                {moods.map((mood) => (
                  <Button
                    key={mood.value}
                    variant="outline"
                    onClick={() => handleRegisterMood(mood.value)}
                    disabled={isSubmitting}
                    className={`h-auto flex-col gap-3 p-6 clay-button ${mood.color} border-2 transition-all ${
                      selectedMood === mood.value ? "animate-pulse" : ""
                    }`}
                  >
                    <span className="text-5xl">{mood.emoji}</span>
                    <span className="text-sm font-semibold">{mood.label}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-muted bg-muted/20 p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <Ban className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground">Humor já registrado hoje!</h3>
                <p className="mt-2 text-muted-foreground">
                  Seu próximo check-in estará disponível em{" "}
                  <span className="font-semibold text-primary">{timeUntilNext}</span>
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Apenas 1 registro por dia é permitido</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas do Mês */}
        {stats && (
          <div className="grid grid-cols-4 gap-6">
            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mb-2 text-5xl">😄</div>
                  <p className="text-3xl font-bold text-primary">{stats.daysThisMonth[5] || 0} dias</p>
                  <p className="text-sm text-muted-foreground">Dias Ótimos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mb-2 text-5xl">😊</div>
                  <p className="text-3xl font-bold text-chart-1">{stats.daysThisMonth[4] || 0} dias</p>
                  <p className="text-sm text-muted-foreground">Dias Bons</p>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mb-2 text-5xl">📈</div>
                  <p className="text-3xl font-bold text-primary">{stats.positiveRate}%</p>
                  <p className="text-sm text-muted-foreground">Taxa Positiva</p>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mb-2 text-5xl">🔥</div>
                  <p className="text-3xl font-bold text-accent">{stats.currentStreak} dias</p>
                  <p className="text-sm text-muted-foreground">Sequência Atual</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {history.length > 0 && (
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Histórico dos Últimos 14 Dias
              </CardTitle>
              <CardDescription>Visualização da sua jornada emocional</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={history} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    domain={[0.5, 5.5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 20 }}
                    tickMargin={10}
                    tickFormatter={(value) => {
                      const labels: { [key: number]: string } = {
                        1: "😰",
                        2: "😔",
                        3: "😐",
                        4: "😊",
                        5: "😄",
                      }
                      return labels[value] || ""
                    }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={<CustomDot />}
                    activeDot={{ r: 8 }}
                  />
                  <Area type="monotone" dataKey="mood" stroke="none" fill="url(#colorMood)" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-6 flex items-center justify-center gap-8 rounded-lg bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium text-muted-foreground">Linha de Tendência</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-card">
                    <span className="text-sm">😊</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Humor Registrado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights e Recomendações */}
        <div className="grid grid-cols-2 gap-6">
          

          
        </div>
      </div>
    </>
  )
}
