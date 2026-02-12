"use client"

import { FeedbackService, type Feedback, type FeedbackRequest } from "./feedback-service"
import { mockUsers } from "./auth-context"

export interface FeedbackUserAnalytics {
  userId: string
  nome: string
  avatar?: string
  time: string
  departamento: string
  feedbacksEnviados: number
  feedbacksRecebidos: number
  solicitacoesEnviadas: number
  solicitacoesRecebidas: number
  feedbacksRespondidos: number
  feedbacksNaoRespondidos: number
  taxaResposta: number // 0-100
  tempoMedioResposta: number // em horas
  engajamento: "alto" | "medio" | "baixo" | "inativo"
  ultimaInteracao: string
  feedbacksDetalhes: {
    enviados: Feedback[]
    recebidos: Feedback[]
    solicitacoes: FeedbackRequest[]
  }
}

export interface FeedbackAnalytics {
  totalEnviados: number
  totalRecebidos: number
  totalRespondidos: number
  totalNaoRespondidos: number
  totalSolicitados: number
  taxaRespostaGeral: number
  usuariosAtivos: number
  usuariosInativos: number
  evolucaoTemporal: Array<{
    dia: string
    enviados: number
    recebidos: number
    respondidos: number
  }>
  usuariosPorTime: Record<string, FeedbackUserAnalytics[]>
}

export class FeedbackAnalyticsService {
  // Guard clause: Validar se o usuário existe
  private static isValidUser(userId: string): boolean {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return false
    }
    return true
  }

  // Guard clause: Validar array de feedbacks
  private static validateFeedbacksArray(feedbacks: any): feedbacks is Feedback[] {
    return Array.isArray(feedbacks)
  }

  // Calcular tempo médio de resposta em horas
  private static calculateAvgResponseTime(feedbacks: Feedback[]): number {
    if (!this.validateFeedbacksArray(feedbacks) || feedbacks.length === 0) {
      return 0
    }

    const responseTimes = feedbacks
      .filter((f) => f.viewedAt && f.createdAt)
      .map((f) => {
        const created = new Date(f.createdAt).getTime()
        const viewed = new Date(f.viewedAt!).getTime()
        return (viewed - created) / (1000 * 60 * 60) // converter para horas
      })

    if (responseTimes.length === 0) {
      return 0
    }

    const sum = responseTimes.reduce((acc, time) => acc + time, 0)
    return Math.round(sum / responseTimes.length)
  }

  // Determinar nível de engajamento
  private static determineEngagement(
    enviados: number,
    recebidos: number,
    taxaResposta: number,
  ): "alto" | "medio" | "baixo" | "inativo" {
    const totalAtividades = enviados + recebidos

    if (totalAtividades === 0) {
      return "inativo"
    }

    if (totalAtividades >= 10 && taxaResposta >= 70) {
      return "alto"
    }

    if (totalAtividades >= 5 && taxaResposta >= 50) {
      return "medio"
    }

    if (totalAtividades > 0) {
      return "baixo"
    }

    return "inativo"
  }

  // Obter última interação formatada
  private static getLastInteraction(userId: string): string {
    const allFeedbacks = FeedbackService.getAllFeedbacks()
    if (!this.validateFeedbacksArray(allFeedbacks)) {
      return "Nunca"
    }

    const userFeedbacks = allFeedbacks.filter((f) => f.fromUserId === userId || f.toUserId === userId)

    if (userFeedbacks.length === 0) {
      return "Nunca"
    }

    const lastFeedback = userFeedbacks.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]

    const diffMs = Date.now() - new Date(lastFeedback.createdAt).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Ontem"
    if (diffDays <= 7) return `${diffDays} dias atrás`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} semanas atrás`
    return `${Math.floor(diffDays / 30)} meses atrás`
  }

  // Obter analytics por usuário
  static getUserAnalytics(userId: string): FeedbackUserAnalytics | null {
    // Guard clauses
    if (!this.isValidUser(userId)) {
      return null
    }

    const user = mockUsers.find((u) => u.id === userId)
    if (!user) {
      return null
    }

    const feedbacksEnviados = FeedbackService.getSentFeedbacks(userId)
    const feedbacksRecebidos = FeedbackService.getReceivedFeedbacks(userId)
    const solicitacoesEnviadas = FeedbackService.getSentRequests(userId)
    const solicitacoesRecebidas = FeedbackService.getReceivedRequests(userId)

    // Guard clauses para arrays
    const enviados = this.validateFeedbacksArray(feedbacksEnviados) ? feedbacksEnviados : []
    const recebidos = this.validateFeedbacksArray(feedbacksRecebidos) ? feedbacksRecebidos : []
    const solicitacoesEnv = Array.isArray(solicitacoesEnviadas) ? solicitacoesEnviadas : []
    const solicitacoesRec = Array.isArray(solicitacoesRecebidas) ? solicitacoesRecebidas : []

    const recebidosRespondidos = recebidos.filter((f) => f.viewedAt).length
    const recebidosNaoRespondidos = recebidos.filter((f) => !f.viewedAt).length

    const taxaResposta = recebidos.length > 0 ? Math.round((recebidosRespondidos / recebidos.length) * 100) : 0

    const tempoMedioResposta = this.calculateAvgResponseTime(recebidos)

    const engajamento = this.determineEngagement(enviados.length, recebidos.length, taxaResposta)

    const ultimaInteracao = this.getLastInteraction(userId)

    return {
      userId: user.id,
      nome: user.nome,
      avatar: user.avatar,
      time: user.departamento,
      departamento: user.departamento,
      feedbacksEnviados: enviados.length,
      feedbacksRecebidos: recebidos.length,
      solicitacoesEnviadas: solicitacoesEnv.length,
      solicitacoesRecebidas: solicitacoesRec.length,
      feedbacksRespondidos: recebidosRespondidos,
      feedbacksNaoRespondidos: recebidosNaoRespondidos,
      taxaResposta,
      tempoMedioResposta,
      engajamento,
      ultimaInteracao,
      feedbacksDetalhes: {
        enviados,
        recebidos,
        solicitacoes: [...solicitacoesEnv, ...solicitacoesRec],
      },
    }
  }

  // Obter analytics gerais
  static getGeneralAnalytics(): FeedbackAnalytics {
    const allFeedbacks = FeedbackService.getAllFeedbacks()
    const allRequests = FeedbackService.getAllRequests()

    // Guard clauses
    const feedbacks = this.validateFeedbacksArray(allFeedbacks) ? allFeedbacks : []
    const requests = Array.isArray(allRequests) ? allRequests : []

    const totalEnviados = feedbacks.length
    const totalRespondidos = feedbacks.filter((f) => f.viewedAt).length
    const totalNaoRespondidos = feedbacks.filter((f) => !f.viewedAt && f.status === "sent").length
    const totalSolicitados = requests.length

    const taxaRespostaGeral = feedbacks.length > 0 ? Math.round((totalRespondidos / feedbacks.length) * 100) : 0

    // Contar usuários ativos (enviaram ou receberam feedback)
    const usersWithActivity = new Set<string>()
    feedbacks.forEach((f) => {
      usersWithActivity.add(f.fromUserId)
      usersWithActivity.add(f.toUserId)
    })

    const usuariosAtivos = usersWithActivity.size
    const usuariosInativos = Math.max(0, mockUsers.length - usuariosAtivos)

    // Evolução temporal (últimos 7 dias)
    const evolucaoTemporal = this.getTemporalEvolution(feedbacks)

    // Agrupar por time
    const usuariosPorTime: Record<string, FeedbackUserAnalytics[]> = {}
    mockUsers.forEach((user) => {
      const analytics = this.getUserAnalytics(user.id)
      if (analytics) {
        if (!usuariosPorTime[user.departamento]) {
          usuariosPorTime[user.departamento] = []
        }
        usuariosPorTime[user.departamento].push(analytics)
      }
    })

    return {
      totalEnviados,
      totalRecebidos: totalEnviados, // Total recebido = total enviado
      totalRespondidos,
      totalNaoRespondidos,
      totalSolicitados,
      taxaRespostaGeral,
      usuariosAtivos,
      usuariosInativos,
      evolucaoTemporal,
      usuariosPorTime,
    }
  }

  // Obter evolução temporal
  private static getTemporalEvolution(
    feedbacks: Feedback[],
  ): Array<{ dia: string; enviados: number; recebidos: number; respondidos: number }> {
    if (!this.validateFeedbacksArray(feedbacks) || feedbacks.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        dia: `Dia ${i + 1}`,
        enviados: 0,
        recebidos: 0,
        respondidos: 0,
      }))
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date, index) => {
      const dayFeedbacks = feedbacks.filter((f) => f.createdAt.startsWith(date))

      return {
        dia: `Dia ${index + 1}`,
        enviados: dayFeedbacks.length,
        recebidos: dayFeedbacks.length,
        respondidos: dayFeedbacks.filter((f) => f.viewedAt).length,
      }
    })
  }

  // Filtrar analytics por time
  static filterByTeam(team: string): FeedbackUserAnalytics[] {
    if (!team || typeof team !== "string" || team.trim() === "") {
      return []
    }

    const allAnalytics = this.getGeneralAnalytics()

    if (!allAnalytics.usuariosPorTime[team]) {
      return []
    }

    return allAnalytics.usuariosPorTime[team]
  }

  // Filtrar analytics por período
  static filterByPeriod(days: number): FeedbackAnalytics {
    if (typeof days !== "number" || days <= 0) {
      return this.getGeneralAnalytics()
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const allFeedbacks = FeedbackService.getAllFeedbacks()
    const filteredFeedbacks = this.validateFeedbacksArray(allFeedbacks)
      ? allFeedbacks.filter((f) => new Date(f.createdAt) >= cutoffDate)
      : []

    // Recalcular métricas com feedbacks filtrados
    const totalEnviados = filteredFeedbacks.length
    const totalRespondidos = filteredFeedbacks.filter((f) => f.viewedAt).length
    const totalNaoRespondidos = filteredFeedbacks.filter((f) => !f.viewedAt && f.status === "sent").length

    const taxaRespostaGeral =
      filteredFeedbacks.length > 0 ? Math.round((totalRespondidos / filteredFeedbacks.length) * 100) : 0

    const usersWithActivity = new Set<string>()
    filteredFeedbacks.forEach((f) => {
      usersWithActivity.add(f.fromUserId)
      usersWithActivity.add(f.toUserId)
    })

    const usuariosAtivos = usersWithActivity.size
    const usuariosInativos = Math.max(0, mockUsers.length - usuariosAtivos)

    const evolucaoTemporal = this.getTemporalEvolution(filteredFeedbacks)

    const usuariosPorTime: Record<string, FeedbackUserAnalytics[]> = {}
    mockUsers.forEach((user) => {
      const analytics = this.getUserAnalytics(user.id)
      if (analytics) {
        if (!usuariosPorTime[user.departamento]) {
          usuariosPorTime[user.departamento] = []
        }
        usuariosPorTime[user.departamento].push(analytics)
      }
    })

    return {
      totalEnviados,
      totalRecebidos: totalEnviados,
      totalRespondidos,
      totalNaoRespondidos,
      totalSolicitados: 0, // Não temos filtro por período para requests ainda
      taxaRespostaGeral,
      usuariosAtivos,
      usuariosInativos,
      evolucaoTemporal,
      usuariosPorTime,
    }
  }
}
