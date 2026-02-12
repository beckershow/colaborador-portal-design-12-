import { mockUsers } from "./auth-context"
import { AnalyticsService } from "./analytics-service"
import { TrainingService } from "./training-service"
import { SurveyService } from "./survey-service"
import { FeedbackService } from "./feedback-service"

export interface GestorMetrics {
  gestorId: string
  nome: string
  email: string
  avatar: string
  departamento: string
  timesGerenciados: string[]
  totalColaboradores: number
  status: "ativo" | "inativo"
  ultimaAtividade: string
  scoreGestao: number
  frequenciaUso: number
  frequenciaLogin: number
  tempoMedioUso: number
  funcionalidadesMaisUsadas: { nome: string; usos: number }[]
  frequenciaAnaliseMetricas: number
  frequenciaCriacaoConteudos: number
  engajamentoMedioTime: number
  taxaParticipacaoTime: number
  tendenciaTime: "alta" | "estavel" | "queda"
}

export interface GestorPermissions {
  gestorId: string
  criarTreinamentos: boolean
  criarPesquisas: boolean
  criarTrilhas: boolean
  configurarRecompensas: boolean
  acessarAnalyticsAvancado: boolean
  gerenciarFeedbacks: boolean
  criarEventos: boolean
  moderarConteudo: boolean
}

export interface GestorActivity {
  id: string
  gestorId: string
  tipo: "login" | "criacao" | "alteracao" | "analise" | "interacao"
  descricao: string
  timestamp: string
  impacto?: string
}

export interface GestorTeamMember {
  userId: string
  nome: string
  avatar: string
  cargo: string
  engajamento: number
  participacaoPesquisas: number
  participacaoTreinamentos: number
  participacaoFeedbacks: number
  progresso: number
  tendencia: "alta" | "estavel" | "queda"
}

export class GestoresManagementService {
  // ========== DASHBOARD GERAL DE GESTORES ==========

  static getAllGestores(): GestorMetrics[] {
    const gestores = mockUsers.filter((u) => u.role === "gestor")

    return gestores.map((gestor) => this.getGestorMetrics(gestor.id))
  }

  static getGestorMetrics(gestorId: string): GestorMetrics {
    const gestor = mockUsers.find((u) => u.id === gestorId)
    if (!gestor) {
      throw new Error(`Gestor ${gestorId} não encontrado`)
    }

    const timesGerenciados = gestor.timeGerenciado || []
    const colaboradores = mockUsers.filter((u) => timesGerenciados.includes(u.id))

    // Calcular métricas reais do time
    const engajamentos = colaboradores.map((collab) => {
      const collabData = AnalyticsService.calculateCollaboratorEngagement(collab.id)
      return collabData.taxaEngajamento
    })
    const engajamentoMedio =
      engajamentos.length > 0 ? Math.round(engajamentos.reduce((acc, val) => acc + val, 0) / engajamentos.length) : 0

    // Calcular frequência de uso (simulada com base em dados reais)
    const frequenciaUso = Math.round(65 + Math.random() * 30) // 65-95%
    const frequenciaLogin = Math.round(4 + Math.random() * 3) // 4-7 vezes por semana
    const tempoMedioUso = Math.round(45 + Math.random() * 75) // 45-120 minutos por dia

    // Funcionalidades mais usadas
    const funcionalidadesMaisUsadas = [
      { nome: "Análise de Métricas", usos: Math.round(15 + Math.random() * 25) },
      { nome: "Criação de Conteúdos", usos: Math.round(10 + Math.random() * 20) },
      { nome: "Gestão de Time", usos: Math.round(20 + Math.random() * 30) },
      { nome: "Feedbacks", usos: Math.round(8 + Math.random() * 15) },
    ].sort((a, b) => b.usos - a.usos)

    const frequenciaAnaliseMetricas = Math.round(3 + Math.random() * 4) // 3-7 vezes por semana
    const frequenciaCriacaoConteudos = Math.round(2 + Math.random() * 3) // 2-5 vezes por semana

    // Calcular taxa de participação
    const surveys = SurveyService.getActiveSurveys()
    const treinamentos = TrainingService.getAllCourses()
    let totalParticipacoes = 0
    let totalOportunidades = 0

    colaboradores.forEach((collab) => {
      totalOportunidades += surveys.length + treinamentos.length
      surveys.forEach((survey) => {
        if (survey.responses?.some((r) => r.userId === collab.id)) {
          totalParticipacoes++
        }
      })
      treinamentos.forEach((training) => {
        if (training.progress && training.progress[collab.id]) {
          totalParticipacoes++
        }
      })
    })

    const taxaParticipacaoTime =
      totalOportunidades > 0 ? Math.round((totalParticipacoes / totalOportunidades) * 100) : 0

    // Calcular score de gestão
    const scoreGestao = this.calculateGestorScore({
      frequenciaUso,
      frequenciaLogin,
      engajamentoTime: engajamentoMedio,
      frequenciaAnaliseMetricas,
      frequenciaCriacaoConteudos,
      taxaParticipacaoTime,
    })

    // Determinar tendência
    const tendenciaTime: "alta" | "estavel" | "queda" =
      engajamentoMedio >= 75 ? "alta" : engajamentoMedio >= 50 ? "estavel" : "queda"

    // Última atividade (simulada)
    const diasAtras = Math.floor(Math.random() * 3)
    const ultimaAtividade = new Date()
    ultimaAtividade.setDate(ultimaAtividade.getDate() - diasAtras)

    return {
      gestorId: gestor.id,
      nome: gestor.nome,
      email: gestor.email,
      avatar: gestor.avatar,
      departamento: gestor.departamento,
      timesGerenciados,
      totalColaboradores: colaboradores.length,
      status: frequenciaUso >= 50 ? "ativo" : "inativo",
      ultimaAtividade: ultimaAtividade.toLocaleDateString("pt-BR"),
      scoreGestao,
      frequenciaUso,
      frequenciaLogin,
      tempoMedioUso,
      funcionalidadesMaisUsadas,
      frequenciaAnaliseMetricas,
      frequenciaCriacaoConteudos,
      engajamentoMedioTime: engajamentoMedio,
      taxaParticipacaoTime,
      tendenciaTime,
    }
  }

  private static calculateGestorScore(params: {
    frequenciaUso: number
    frequenciaLogin: number
    engajamentoTime: number
    frequenciaAnaliseMetricas: number
    frequenciaCriacaoConteudos: number
    taxaParticipacaoTime: number
  }): number {
    // Fórmula transparente e explicável
    const pesoUso = 0.15
    const pesoLogin = 0.1
    const pesoEngajamento = 0.35
    const pesoAnalise = 0.15
    const pesoCriacao = 0.15
    const pesoParticipacao = 0.1

    const score =
      params.frequenciaUso * pesoUso +
      (params.frequenciaLogin / 7) * 100 * pesoLogin +
      params.engajamentoTime * pesoEngajamento +
      (params.frequenciaAnaliseMetricas / 7) * 100 * pesoAnalise +
      (params.frequenciaCriacaoConteudos / 5) * 100 * pesoCriacao +
      params.taxaParticipacaoTime * pesoParticipacao

    return Math.round(score)
  }

  // ========== MÉTRICAS GERAIS ==========

  static getGestoresMetricsOverview() {
    const gestores = this.getAllGestores()

    const totalGestores = gestores.length
    const gestoresAtivos = gestores.filter((g) => g.status === "ativo").length
    const gestoresInativos = totalGestores - gestoresAtivos

    const mediaUsoPlataforma =
      gestores.length > 0 ? Math.round(gestores.reduce((acc, g) => acc + g.frequenciaUso, 0) / gestores.length) : 0

    const mediaEngajamentoTimes =
      gestores.length > 0
        ? Math.round(gestores.reduce((acc, g) => acc + g.engajamentoMedioTime, 0) / gestores.length)
        : 0

    const scoreMedioGestao =
      gestores.length > 0 ? Math.round(gestores.reduce((acc, g) => acc + g.scoreGestao, 0) / gestores.length) : 0

    return {
      totalGestores,
      gestoresAtivos,
      gestoresInativos,
      mediaUsoPlataforma,
      mediaEngajamentoTimes,
      scoreMedioGestao,
    }
  }

  static getGestoresMaisAtivos(limit = 5): GestorMetrics[] {
    return this.getAllGestores()
      .sort((a, b) => b.frequenciaUso - a.frequenciaUso)
      .slice(0, limit)
  }

  static getGestoresComBaixoUso(threshold = 50): GestorMetrics[] {
    return this.getAllGestores().filter((g) => g.frequenciaUso < threshold)
  }

  // ========== PERMISSÕES DO GESTOR ==========

  static getGestorPermissions(gestorId: string): GestorPermissions {
    if (typeof window === "undefined") {
      // Retornar permissões padrão durante SSR
      return {
        gestorId,
        criarTreinamentos: true,
        criarPesquisas: true,
        criarTrilhas: true,
        configurarRecompensas: true,
        acessarAnalyticsAvancado: true,
        gerenciarFeedbacks: true,
        criarEventos: true,
        moderarConteudo: false,
      }
    }

    const savedPermissions = localStorage.getItem(`gestor-permissions-${gestorId}`)

    if (savedPermissions) {
      return JSON.parse(savedPermissions)
    }

    // Permissões padrão
    return {
      gestorId,
      criarTreinamentos: true,
      criarPesquisas: true,
      criarTrilhas: true,
      configurarRecompensas: true,
      acessarAnalyticsAvancado: true,
      gerenciarFeedbacks: true,
      criarEventos: true,
      moderarConteudo: false,
    }
  }

  static updateGestorPermissions(permissions: GestorPermissions): void {
    if (typeof window === "undefined") {
      return
    }

    localStorage.setItem(`gestor-permissions-${permissions.gestorId}`, JSON.stringify(permissions))

    window.dispatchEvent(
      new CustomEvent("gestor-permissions-updated", {
        detail: { gestorId: permissions.gestorId, permissions },
      }),
    )
  }

  // ========== HISTÓRICO E AUDITORIA ==========

  static getGestorActivityHistory(gestorId: string, dias = 30): GestorActivity[] {
    if (typeof window === "undefined") {
      // Retornar array vazio durante SSR
      return []
    }

    const savedHistory = localStorage.getItem(`gestor-activity-${gestorId}`)

    if (savedHistory) {
      return JSON.parse(savedHistory)
    }

    // Gerar histórico mock realista
    const activities: GestorActivity[] = []
    const hoje = new Date()

    for (let i = 0; i < dias; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)

      // Login diário
      if (Math.random() > 0.2) {
        activities.push({
          id: `activity-${gestorId}-${i}-login`,
          gestorId,
          tipo: "login",
          descricao: "Login na plataforma",
          timestamp: data.toISOString(),
        })
      }

      // Análise de métricas
      if (Math.random() > 0.5) {
        activities.push({
          id: `activity-${gestorId}-${i}-analise`,
          gestorId,
          tipo: "analise",
          descricao: "Visualizou métricas do time",
          timestamp: data.toISOString(),
        })
      }

      // Criações
      if (Math.random() > 0.7) {
        const tipos = ["treinamento", "pesquisa", "feedback"]
        const tipo = tipos[Math.floor(Math.random() * tipos.length)]
        activities.push({
          id: `activity-${gestorId}-${i}-criacao`,
          gestorId,
          tipo: "criacao",
          descricao: `Criou novo ${tipo}`,
          timestamp: data.toISOString(),
          impacto: "Disponibilizado para o time",
        })
      }
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  static addGestorActivity(activity: Omit<GestorActivity, "id">): void {
    if (typeof window === "undefined") {
      return
    }

    const activities = this.getGestorActivityHistory(activity.gestorId, 90)
    const newActivity: GestorActivity = {
      ...activity,
      id: `activity-${activity.gestorId}-${Date.now()}`,
    }

    activities.unshift(newActivity)
    localStorage.setItem(`gestor-activity-${activity.gestorId}`, JSON.stringify(activities))
  }

  static exportGestorAudit(gestorId: string): string {
    const gestor = this.getGestorMetrics(gestorId)
    const activities = this.getGestorActivityHistory(gestorId, 90)
    const permissions = this.getGestorPermissions(gestorId)

    const csv = [
      ["Data Exportação", new Date().toLocaleDateString("pt-BR")],
      [],
      ["DADOS DO GESTOR"],
      ["Nome", gestor.nome],
      ["Email", gestor.email],
      ["Departamento", gestor.departamento],
      ["Total Colaboradores", gestor.totalColaboradores.toString()],
      ["Status", gestor.status],
      ["Score de Gestão", gestor.scoreGestao.toString()],
      [],
      ["PERMISSÕES"],
      ["Criar Treinamentos", permissions.criarTreinamentos ? "Sim" : "Não"],
      ["Criar Pesquisas", permissions.criarPesquisas ? "Sim" : "Não"],
      ["Criar Trilhas", permissions.criarTrilhas ? "Sim" : "Não"],
      ["Configurar Recompensas", permissions.configurarRecompensas ? "Sim" : "Não"],
      ["Acessar Analytics Avançado", permissions.acessarAnalyticsAvancado ? "Sim" : "Não"],
      [],
      ["HISTÓRICO DE ATIVIDADES"],
      ["Data", "Tipo", "Descrição", "Impacto"],
      ...activities.map((a) => [new Date(a.timestamp).toLocaleString("pt-BR"), a.tipo, a.descricao, a.impacto || ""]),
    ]

    return csv.map((row) => row.join(",")).join("\n")
  }

  // ========== ANÁLISE DO TIME DO GESTOR ==========

  static getGestorTeamMembers(gestorId: string): GestorTeamMember[] {
    const gestor = mockUsers.find((u) => u.id === gestorId)
    if (!gestor || !gestor.timeGerenciado) {
      return []
    }

    const colaboradores = mockUsers.filter((u) => gestor.timeGerenciado?.includes(u.id))

    return colaboradores.map((collab) => {
      const engagementData = AnalyticsService.calculateCollaboratorEngagement(collab.id)

      // Calcular participação em pesquisas
      const surveys = SurveyService.getActiveSurveys()
      const pesquisasRespondidas = surveys.filter((s) => s.responses?.some((r) => r.userId === collab.id)).length
      const participacaoPesquisas = surveys.length > 0 ? Math.round((pesquisasRespondidas / surveys.length) * 100) : 0

      // Calcular participação em treinamentos
      const treinamentos = TrainingService.getAllCourses()
      const treinamentosIniciados = treinamentos.filter((t) => t.progress && t.progress[collab.id]).length
      const participacaoTreinamentos =
        treinamentos.length > 0 ? Math.round((treinamentosIniciados / treinamentos.length) * 100) : 0

      // Calcular participação em feedbacks
      const feedbacks = FeedbackService.getAllFeedbacks()
      const feedbacksRespondidos = feedbacks.filter((f) => f.resposta !== undefined && f.userId === collab.id).length
      const participacaoFeedbacks =
        feedbacks.length > 0 ? Math.round((feedbacksRespondidos / feedbacks.length) * 100) : 0

      // Calcular progresso médio
      const progresso = Math.round((participacaoPesquisas + participacaoTreinamentos + participacaoFeedbacks) / 3)

      return {
        userId: collab.id,
        nome: collab.nome,
        avatar: collab.avatar,
        cargo: collab.cargo,
        engajamento: engagementData.taxaEngajamento,
        participacaoPesquisas,
        participacaoTreinamentos,
        participacaoFeedbacks,
        progresso,
        tendencia: engagementData.tendencia,
      }
    })
  }

  static getGestorTeamOverview(gestorId: string) {
    const members = this.getGestorTeamMembers(gestorId)

    if (members.length === 0) {
      return {
        totalColaboradores: 0,
        engajamentoMedio: 0,
        participacaoMedia: 0,
        progressoMedio: 0,
        colaboradoresAltoEngajamento: 0,
        colaboradoresBaixoEngajamento: 0,
      }
    }

    const engajamentoMedio = Math.round(members.reduce((acc, m) => acc + m.engajamento, 0) / members.length)

    const participacaoMedia = Math.round(
      members.reduce(
        (acc, m) => acc + (m.participacaoPesquisas + m.participacaoTreinamentos + m.participacaoFeedbacks) / 3,
        0,
      ) / members.length,
    )

    const progressoMedio = Math.round(members.reduce((acc, m) => acc + m.progresso, 0) / members.length)

    const colaboradoresAltoEngajamento = members.filter((m) => m.engajamento >= 75).length
    const colaboradoresBaixoEngajamento = members.filter((m) => m.engajamento < 50).length

    return {
      totalColaboradores: members.length,
      engajamentoMedio,
      participacaoMedia,
      progressoMedio,
      colaboradoresAltoEngajamento,
      colaboradoresBaixoEngajamento,
    }
  }
}
