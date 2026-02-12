"use client"

import { SurveyService, type Survey, type SurveyResponse } from "./survey-service"
import { mockUsers } from "./auth-context"

export interface SurveyUserAnalytics {
  userId: string
  nome: string
  avatar?: string
  time: string
  departamento: string
  pesquisasVisualizadas: number
  pesquisasIniciadas: number
  pesquisasConcluidas: number
  pesquisasPendentes: number
  obrigatoriasPendentes: number
  taxaParticipacao: number // 0-100
  taxaConclusao: number // 0-100
  tempoMedioResposta: number // em minutos
  engajamento: "alto" | "medio" | "baixo" | "inativo"
  ultimaInteracao: string
  pesquisasDetalhes: {
    respondidas: SurveyResponse[]
    pendentes: Survey[]
  }
}

export interface SurveyAnalytics {
  totalCriadas: number
  totalAtivas: number
  totalEncerradas: number
  taxaParticipacaoMedia: number
  tempoMedioPermanencia: number // em minutos
  taxaConclusaoGeral: number
  usuariosAtivos: number
  usuariosInativos: number
  evolucaoParticipacao: Array<{
    dia: string
    participacao: number
    inicios: number
    conclusoes: number
  }>
  usoPorPesquisa: Array<{
    surveyId: string
    titulo: string
    visualizacoes: number
    inicios: number
    conclusoes: number
    taxaParticipacao: number
    taxaAbandono: number
    tempoMedio: number
  }>
  usuariosPorTime: Record<string, SurveyUserAnalytics[]>
}

export interface SurveyDetailedAnalytics {
  survey: Survey
  totalParticipantes: number
  taxaParticipacao: number
  taxaAbandono: number
  tempoConclusaoMedio: number
  evolucaoRespostas: Array<{
    dia: string
    respostas: number
  }>
  comparacaoTimes?: Record<
    string,
    {
      participantes: number
      taxa: number
    }
  >
}

export class SurveyAnalyticsService {
  // Guard clause: Validar se o usuário existe
  private static isValidUser(userId: string): boolean {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return false
    }
    return true
  }

  // Guard clause: Validar array de surveys
  private static validateSurveysArray(surveys: any): surveys is Survey[] {
    return Array.isArray(surveys)
  }

  // Guard clause: Validar array de responses
  private static validateResponsesArray(responses: any): responses is SurveyResponse[] {
    return Array.isArray(responses)
  }

  // Calcular tempo médio de resposta em minutos
  private static calculateAvgResponseTime(responses: SurveyResponse[]): number {
    if (!this.validateResponsesArray(responses) || responses.length === 0) {
      return 0
    }

    // Estimativa: assumir 2-10 minutos por pesquisa dependendo do número de questões
    const surveys = SurveyService.getAllSurveys()
    const avgQuestionsCount =
      responses.reduce((sum, r) => {
        const survey = surveys.find((s) => s.id === r.surveyId)
        return sum + (survey?.questions.length || 0)
      }, 0) / responses.length

    return Math.round(Math.max(2, Math.min(10, avgQuestionsCount * 1.5)))
  }

  // Determinar nível de engajamento
  private static determineEngagement(
    concluidas: number,
    pendentes: number,
    taxaConclusao: number,
  ): "alto" | "medio" | "baixo" | "inativo" {
    const totalAtividades = concluidas + pendentes

    if (totalAtividades === 0 && concluidas === 0) {
      return "inativo"
    }

    if (concluidas >= 5 && taxaConclusao >= 80) {
      return "alto"
    }

    if (concluidas >= 2 && taxaConclusao >= 50) {
      return "medio"
    }

    if (totalAtividades > 0) {
      return "baixo"
    }

    return "inativo"
  }

  // Obter última interação formatada
  private static getLastInteraction(userId: string): string {
    const userResponses = SurveyService.getUserResponses(userId)
    if (!this.validateResponsesArray(userResponses) || userResponses.length === 0) {
      return "Nunca"
    }

    const lastResponse = userResponses[0] // Já vem ordenado por data decrescente

    const diffMs = Date.now() - new Date(lastResponse.completedAt).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Ontem"
    if (diffDays <= 7) return `${diffDays} dias atrás`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} semanas atrás`
    return `${Math.floor(diffDays / 30)} meses atrás`
  }

  // Obter analytics por usuário
  static getUserAnalytics(userId: string, userDepartment?: string): SurveyUserAnalytics | null {
    // Guard clauses
    if (!this.isValidUser(userId)) {
      return null
    }

    const user = mockUsers.find((u) => u.id === userId)
    if (!user) {
      return null
    }

    const userResponses = SurveyService.getUserResponses(userId)
    const activeSurveys = SurveyService.getActiveSurveys(userId, user.departamento)
    const allSurveys = SurveyService.getAllSurveys()

    // Guard clauses para arrays
    const responses = this.validateResponsesArray(userResponses) ? userResponses : []
    const pendentes = this.validateSurveysArray(activeSurveys) ? activeSurveys : []

    // Contar pesquisas visualizadas (estimativa: pesquisas ativas + respondidas)
    const pesquisasVisualizadas = pendentes.length + responses.length

    // Assumir que todas as respondidas foram iniciadas
    const pesquisasIniciadas = responses.length
    const pesquisasConcluidas = responses.length

    const obrigatoriasPendentes = pendentes.filter((s) => s.isRequired).length

    // Taxa de participação: respostas / (respostas + pendentes)
    const totalOportunidades = responses.length + pendentes.length
    const taxaParticipacao = totalOportunidades > 0 ? Math.round((responses.length / totalOportunidades) * 100) : 0

    // Taxa de conclusão: assumir 100% pois se respondeu, concluiu
    const taxaConclusao = pesquisasIniciadas > 0 ? Math.round((pesquisasConcluidas / pesquisasIniciadas) * 100) : 0

    const tempoMedioResposta = this.calculateAvgResponseTime(responses)

    const engajamento = this.determineEngagement(pesquisasConcluidas, pendentes.length, taxaConclusao)

    const ultimaInteracao = this.getLastInteraction(userId)

    return {
      userId: user.id,
      nome: user.nome,
      avatar: user.avatar,
      time: user.departamento,
      departamento: user.departamento,
      pesquisasVisualizadas,
      pesquisasIniciadas,
      pesquisasConcluidas,
      pesquisasPendentes: pendentes.length,
      obrigatoriasPendentes,
      taxaParticipacao,
      taxaConclusao,
      tempoMedioResposta,
      engajamento,
      ultimaInteracao,
      pesquisasDetalhes: {
        respondidas: responses,
        pendentes: pendentes,
      },
    }
  }

  // Obter analytics gerais
  static getGeneralAnalytics(): SurveyAnalytics {
    const allSurveys = SurveyService.getAllSurveys()
    const allResponses = SurveyService.getAllResponses()

    // Guard clauses
    const surveys = this.validateSurveysArray(allSurveys) ? allSurveys : []
    const responses = this.validateResponsesArray(allResponses) ? allResponses : []

    const totalCriadas = surveys.length
    const totalAtivas = surveys.filter((s) => s.status === "active").length
    const totalEncerradas = surveys.filter((s) => s.status === "closed").length

    // Taxa de participação média: média das taxas de cada pesquisa
    const taxasParticipacao = surveys.map((s) => {
      const surveyResponses = responses.filter((r) => r.surveyId === s.id)
      // Estimativa: assumir que o público-alvo é todos os usuários
      return surveyResponses.length > 0 ? (surveyResponses.length / mockUsers.length) * 100 : 0
    })

    const taxaParticipacaoMedia =
      taxasParticipacao.length > 0
        ? Math.round(taxasParticipacao.reduce((sum, taxa) => sum + taxa, 0) / taxasParticipacao.length)
        : 0

    const tempoMedioPermanencia = this.calculateAvgResponseTime(responses)

    // Taxa de conclusão geral: 100% pois assumimos que quem responde, conclui
    const taxaConclusaoGeral = 100

    // Contar usuários ativos (responderam pelo menos uma pesquisa)
    const usersWithActivity = new Set<string>()
    responses.forEach((r) => {
      usersWithActivity.add(r.userId)
    })

    const usuariosAtivos = usersWithActivity.size
    const usuariosInativos = Math.max(0, mockUsers.length - usuariosAtivos)

    // Evolução de participação (últimos 7 dias)
    const evolucaoParticipacao = this.getParticipationEvolution(responses)

    // Uso por pesquisa
    const usoPorPesquisa = this.getSurveyUsage(surveys, responses)

    // Agrupar por time
    const usuariosPorTime: Record<string, SurveyUserAnalytics[]> = {}
    mockUsers.forEach((user) => {
      const analytics = this.getUserAnalytics(user.id, user.departamento)
      if (analytics) {
        if (!usuariosPorTime[user.departamento]) {
          usuariosPorTime[user.departamento] = []
        }
        usuariosPorTime[user.departamento].push(analytics)
      }
    })

    return {
      totalCriadas,
      totalAtivas,
      totalEncerradas,
      taxaParticipacaoMedia,
      tempoMedioPermanencia,
      taxaConclusaoGeral,
      usuariosAtivos,
      usuariosInativos,
      evolucaoParticipacao,
      usoPorPesquisa,
      usuariosPorTime,
    }
  }

  // Obter evolução de participação
  private static getParticipationEvolution(
    responses: SurveyResponse[],
  ): Array<{ dia: string; participacao: number; inicios: number; conclusoes: number }> {
    if (!this.validateResponsesArray(responses) || responses.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        dia: `Dia ${i + 1}`,
        participacao: 0,
        inicios: 0,
        conclusoes: 0,
      }))
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date, index) => {
      const dayResponses = responses.filter((r) => r.completedAt.startsWith(date))

      return {
        dia: `Dia ${index + 1}`,
        participacao: dayResponses.length,
        inicios: dayResponses.length,
        conclusoes: dayResponses.length,
      }
    })
  }

  // Obter uso por pesquisa
  private static getSurveyUsage(
    surveys: Survey[],
    responses: SurveyResponse[],
  ): Array<{
    surveyId: string
    titulo: string
    visualizacoes: number
    inicios: number
    conclusoes: number
    taxaParticipacao: number
    taxaAbandono: number
    tempoMedio: number
  }> {
    if (!this.validateSurveysArray(surveys) || surveys.length === 0) {
      return []
    }

    return surveys
      .map((survey) => {
        const surveyResponses = responses.filter((r) => r.surveyId === survey.id)

        // Estimativas
        const conclusoes = surveyResponses.length
        const inicios = conclusoes // Assumir que todos que responderam, iniciaram
        const visualizacoes = Math.max(conclusoes, Math.round(conclusoes * 1.5)) // Estimar visualizações

        const taxaParticipacao = visualizacoes > 0 ? Math.round((conclusoes / visualizacoes) * 100) : 0
        const taxaAbandono = inicios > 0 ? Math.round(((inicios - conclusoes) / inicios) * 100) : 0

        const tempoMedio = this.calculateAvgResponseTime(surveyResponses)

        return {
          surveyId: survey.id,
          titulo: survey.title,
          visualizacoes,
          inicios,
          conclusoes,
          taxaParticipacao,
          taxaAbandono,
          tempoMedio,
        }
      })
      .sort((a, b) => b.conclusoes - a.conclusoes) // Ordenar por conclusões
  }

  // Obter analytics detalhadas de uma pesquisa
  static getSurveyDetailedAnalytics(surveyId: string, isSuperAdmin = false): SurveyDetailedAnalytics | null {
    // Guard clauses
    if (!surveyId || typeof surveyId !== "string" || surveyId.trim() === "") {
      return null
    }

    const survey = SurveyService.getSurveyById(surveyId)
    if (!survey) {
      return null
    }

    const responses = SurveyService.getSurveyResponses(surveyId)
    const validResponses = this.validateResponsesArray(responses) ? responses : []

    const totalParticipantes = validResponses.length
    const taxaParticipacao = mockUsers.length > 0 ? Math.round((totalParticipantes / mockUsers.length) * 100) : 0

    // Taxa de abandono: 0% pois assumimos que quem responde, conclui
    const taxaAbandono = 0

    const tempoConclusaoMedio = this.calculateAvgResponseTime(validResponses)

    // Evolução de respostas (últimos 7 dias)
    const evolucaoRespostas = this.getSurveyResponseEvolution(validResponses)

    // Comparação por times (apenas para Super Admin)
    let comparacaoTimes: Record<string, { participantes: number; taxa: number }> | undefined

    if (isSuperAdmin) {
      comparacaoTimes = {}
      const teams = [...new Set(mockUsers.map((u) => u.departamento))]

      teams.forEach((team) => {
        const teamUsers = mockUsers.filter((u) => u.departamento === team)
        const teamResponses = validResponses.filter((r) => teamUsers.some((u) => u.id === r.userId))

        comparacaoTimes![team] = {
          participantes: teamResponses.length,
          taxa: teamUsers.length > 0 ? Math.round((teamResponses.length / teamUsers.length) * 100) : 0,
        }
      })
    }

    return {
      survey,
      totalParticipantes,
      taxaParticipacao,
      taxaAbandono,
      tempoConclusaoMedio,
      evolucaoRespostas,
      comparacaoTimes,
    }
  }

  // Obter evolução de respostas de uma pesquisa
  private static getSurveyResponseEvolution(responses: SurveyResponse[]): Array<{ dia: string; respostas: number }> {
    if (!this.validateResponsesArray(responses) || responses.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        dia: `Dia ${i + 1}`,
        respostas: 0,
      }))
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date, index) => {
      const dayResponses = responses.filter((r) => r.completedAt.startsWith(date))

      return {
        dia: `Dia ${index + 1}`,
        respostas: dayResponses.length,
      }
    })
  }

  // Filtrar analytics por time
  static filterByTeam(team: string): SurveyUserAnalytics[] {
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
  static filterByPeriod(days: number): SurveyAnalytics {
    if (typeof days !== "number" || days <= 0) {
      return this.getGeneralAnalytics()
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const allResponses = SurveyService.getAllResponses()
    const filteredResponses = this.validateResponsesArray(allResponses)
      ? allResponses.filter((r) => new Date(r.completedAt) >= cutoffDate)
      : []

    // Usar as respostas filtradas para recalcular as métricas
    const allSurveys = SurveyService.getAllSurveys()
    const surveys = this.validateSurveysArray(allSurveys) ? allSurveys : []

    const totalCriadas = surveys.length
    const totalAtivas = surveys.filter((s) => s.status === "active").length
    const totalEncerradas = surveys.filter((s) => s.status === "closed").length

    const usersWithActivity = new Set<string>()
    filteredResponses.forEach((r) => {
      usersWithActivity.add(r.userId)
    })

    const usuariosAtivos = usersWithActivity.size
    const usuariosInativos = Math.max(0, mockUsers.length - usuariosAtivos)

    const tempoMedioPermanencia = this.calculateAvgResponseTime(filteredResponses)
    const taxaConclusaoGeral = 100

    const taxasParticipacao = surveys.map((s) => {
      const surveyResponses = filteredResponses.filter((r) => r.surveyId === s.id)
      return surveyResponses.length > 0 ? (surveyResponses.length / mockUsers.length) * 100 : 0
    })

    const taxaParticipacaoMedia =
      taxasParticipacao.length > 0
        ? Math.round(taxasParticipacao.reduce((sum, taxa) => sum + taxa, 0) / taxasParticipacao.length)
        : 0

    const evolucaoParticipacao = this.getParticipationEvolution(filteredResponses)
    const usoPorPesquisa = this.getSurveyUsage(surveys, filteredResponses)

    const usuariosPorTime: Record<string, SurveyUserAnalytics[]> = {}
    mockUsers.forEach((user) => {
      const analytics = this.getUserAnalytics(user.id, user.departamento)
      if (analytics) {
        if (!usuariosPorTime[user.departamento]) {
          usuariosPorTime[user.departamento] = []
        }
        usuariosPorTime[user.departamento].push(analytics)
      }
    })

    return {
      totalCriadas,
      totalAtivas,
      totalEncerradas,
      taxaParticipacaoMedia,
      tempoMedioPermanencia,
      taxaConclusaoGeral,
      usuariosAtivos,
      usuariosInativos,
      evolucaoParticipacao,
      usoPorPesquisa,
      usuariosPorTime,
    }
  }
}
