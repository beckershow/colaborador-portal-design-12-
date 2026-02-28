"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getFeedbackAnalytics, getFeedbackInsights, type FeedbackAnalyticsData, type FeedbackInsightsData } from "@/lib/feedback-api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { TrendingUp, MessageSquare, Star, BarChart2, Lightbulb, Loader2 } from "lucide-react"

const SENTIMENT_LABELS: Record<string, string> = {
  POSITIVE: "Positivo",
  CONSTRUCTIVE: "Construtivo",
  NEUTRAL: "Neutro",
  NEGATIVE: "Negativo",
}

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: "#22c55e",
  CONSTRUCTIVE: "#3b82f6",
  NEUTRAL: "#a3a3a3",
  NEGATIVE: "#ef4444",
}

export function FeedbackAnalyticsPanel() {
  const { toast } = useToast()
  const [days, setDays] = useState(30)
  const [analytics, setAnalytics] = useState<FeedbackAnalyticsData | null>(null)
  const [insights, setInsights] = useState<FeedbackInsightsData | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const [loadingInsights, setLoadingInsights] = useState(false)

  useEffect(() => {
    setLoadingAnalytics(true)
    setInsights(null)
    getFeedbackAnalytics(days)
      .then(res => setAnalytics(res.data))
      .catch(() => toast({ title: "Erro ao carregar analytics de feedbacks", variant: "destructive" }))
      .finally(() => setLoadingAnalytics(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const loadInsights = () => {
    setLoadingInsights(true)
    getFeedbackInsights(days)
      .then(res => setInsights(res.data))
      .catch(() => toast({ title: "Erro ao carregar insights", variant: "destructive" }))
      .finally(() => setLoadingInsights(false))
  }

  const sentimentChartData = analytics
    ? Object.entries(analytics.sentimentDistribution)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => ({ name: SENTIMENT_LABELS[key] ?? key, count, key }))
    : []

  const categoryChartData =
    analytics?.topCategories.slice(0, 8).map(c => ({ name: c.name.replace(/_/g, " "), count: c.count })) ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          Análise de Feedbacks
        </h3>
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadingAnalytics ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : analytics ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Total aprovados</span>
                </div>
                <p className="text-2xl font-bold">{analytics.total}</p>
                <p className="text-xs text-muted-foreground">em {analytics.period} dias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Positivos</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.sentimentDistribution["POSITIVE"] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.total > 0
                    ? Math.round(((analytics.sentimentDistribution["POSITIVE"] ?? 0) / analytics.total) * 100)
                    : 0}
                  % do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-muted-foreground">Construtivos</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.sentimentDistribution["CONSTRUCTIVE"] ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {analytics.total > 0
                    ? Math.round(
                        ((analytics.sentimentDistribution["CONSTRUCTIVE"] ?? 0) / analytics.total) * 100,
                      )
                    : 0}
                  % do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Intensidade média</span>
                </div>
                <p className="text-2xl font-bold">
                  {analytics.averageIntensity !== null ? analytics.averageIntensity.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">escala 1–5</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sentimentChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Distribuição de Sentimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={sentimentChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {sentimentChartData.map(entry => (
                          <Cell key={entry.key} fill={SENTIMENT_COLORS[entry.key] ?? "#6366f1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
            {categoryChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Principais Categorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryChartData.map(cat => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <span className="text-xs capitalize min-w-[100px] text-muted-foreground">{cat.name}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.round((cat.count / (categoryChartData[0]?.count || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Insights */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  Insights de IA
                </CardTitle>
                {!insights && (
                  <button
                    onClick={loadInsights}
                    disabled={loadingInsights}
                    className="text-xs text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                  >
                    {loadingInsights && <Loader2 className="h-3 w-3 animate-spin" />}
                    Gerar insights
                  </button>
                )}
              </div>
              <CardDescription className="text-xs">
                Análise inteligente gerada por IA sobre os feedbacks do período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInsights && (
                <div className="flex items-center justify-center h-16">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {insights && !loadingInsights && (
                <div className="space-y-3">
                  {insights.summary && <p className="text-sm text-muted-foreground">{insights.summary}</p>}
                  {insights.teamHealthScore !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Saúde do time:</span>
                      <Badge
                        variant={
                          insights.teamHealthScore >= 70
                            ? "default"
                            : insights.teamHealthScore >= 40
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {insights.teamHealthScore}/100
                      </Badge>
                    </div>
                  )}
                  {insights.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-1">Pontos fortes</p>
                      <ul className="space-y-1">
                        {insights.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-green-500 mt-0.5">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.areasForImprovement?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-yellow-600 mb-1">Áreas de melhoria</p>
                      <ul className="space-y-1">
                        {insights.areasForImprovement.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-yellow-500 mt-0.5">!</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.recommendations?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-blue-600 mb-1">Recomendações</p>
                      <ul className="space-y-1">
                        {insights.recommendations.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-blue-500 mt-0.5">→</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {!insights && !loadingInsights && (
                <p className="text-xs text-muted-foreground">
                  Clique em "Gerar insights" para obter uma análise inteligente do período.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum dado disponível para o período selecionado.
        </p>
      )}
    </div>
  )
}
