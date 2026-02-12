import { EngajamentoService } from "./engajamento-service"
import { TrainingService } from "./training-service"
import { EventoService } from "./evento-service"
import { SurveyService } from "./survey-service"
import { HumorService } from "./humor-service"

export interface KPIGlobal {
  label: string
  value: number | string
  change: string
  trend: "up" | "down" | "stable"
}

export interface CollaboratorEngagement {
  userId: string
  nome: string
  avatar: string
  time: string
  departamento: string
  taxaEngajamento: number
  frequenciaParticipacao: number
  ultimaInteracao: string
  tendencia: "alta" | "estavel" | "queda"
  acessosSemana: number
  treinamentosConcluidos: number
  interacoesFeed: number
  pesquisasRespondidas: number
  eventosParticipados: number
}

export interface HumorData {
  userId: string
  nome: string
  time: string
  humorMedio: number
  distribuicao: {
    muitoFeliz: number
    feliz: number
    neutro: number
    triste: number
    muitoTriste: number
  }
  evolucao: { data: string; humor: number }[]
  ultimoRegistro: string
  taxaRegistro: number
}

export interface TeamHumorData {
  teamName: string
  humorMedio: number
  variacao: string
  colaboradores: number
  tendencia: "positiva" | "estavel" | "negativa"
  alertas: string[]
}

export class AnalyticsService {
  // ========== VISÃO GERAL - KPIs GLOBAIS ==========

  static getTotalColaboradoresAtivos(): number {
    // Simular total de colaboradores ativos no sistema
    // Em produção, viria do backend
    return 47
  }

  static getTaxaGeralEngajamento(): number {
    const engajamentos = EngajamentoService.getAllEngajamentos()
    if (engajamentos.length === 0) return 0

    let totalParticipants = 0
    let totalCompleted = 0

    engajamentos.forEach((eng) => {
      if (eng.participantsProgress) {
        totalParticipants += eng.participantsProgress.length
        totalCompleted += eng.participantsProgress.filter((p) => p.engagementStatus === "concluido").length
      }
    })

    return totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0
  }

  static getTaxaGeralParticipacao(): number {
    // Calcular baseado em múltiplas fontes de participação
    const surveyParticipation = this.getSurveyParticipationRate()
    const eventParticipation = this.getEventParticipationRate()
    const feedParticipation = 75 // Mock: taxa de interação no feed

    return Math.round((surveyParticipation + eventParticipation + feedParticipation) / 3)
  }

  static getMediaGeralHumor(): number {
    const allMoods = HumorService.getAllMoodRecords()
    if (allMoods.length === 0) return 3.5

    const sum = allMoods.reduce((acc, record) => acc + record.mood, 0)
    return Math.round((sum / allMoods.length) * 10) / 10
  }

  static getNumeroAlertasAtivos(): number {
    let alertCount = 0

    // Alertas de engajamento baixo
    const colaboradores = this.getAllCollaboratorsEngagement()
    alertCount += colaboradores.filter((c) => c.taxaEngajamento < 50).length

    // Alertas de humor baixo
    const humorData = this.getAllCollaboratorsHumor()
    alertCount += humorData.filter((h) => h.humorMedio < 3.0).length

    return alertCount
  }

  static getKPIsGlobais(): KPIGlobal[] {
    return [
      {
        label: "Colaboradores Ativos",
        value: this.getTotalColaboradoresAtivos(),
        change: "+3 vs mês anterior",
        trend: "up",
      },
      {
        label: "Taxa de Engajamento",
        value: `${this.getTaxaGeralEngajamento()}%`,
        change: "+8% vs período anterior",
        trend: "up",
      },
      {
        label: "Taxa de Participação",
        value: `${this.getTaxaGeralParticipacao()}%`,
        change: "+5% vs período anterior",
        trend: "up",
      },
      {
        label: "Humor Médio Geral",
        value: this.getMediaGeralHumor().toFixed(1),
        change: "+0.2 vs mês anterior",
        trend: "up",
      },
      {
        label: "Alertas Ativos",
        value: this.getNumeroAlertasAtivos(),
        change: "-2 vs período anterior",
        trend: "down",
      },
    ]
  }

  static getEvolucaoEngajamentoTemporal(dias = 30): { data: string; taxa: number }[] {
    const result: { data: string; taxa: number }[] = []
    const hoje = new Date()

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

      // Simulação de taxa de engajamento por dia
      const taxa = Math.round(60 + Math.random() * 35)
      result.push({ data: dataStr, taxa })
    }

    return result
  }

  // ========== ENGAJAMENTO - ANÁLISE INDIVIDUAL ==========

  static getAllCollaboratorsEngagement(): CollaboratorEngagement[] {
    // Mock de colaboradores - em produção viria do backend
    const mockCollaborators = [
      {
        id: "3",
        nome: "Ana Carolina Silva",
        avatar: "/professional-avatar-smiling-woman.jpg",
        time: "Time Criativo",
        departamento: "Marketing",
      },
      {
        id: "4",
        nome: "Bruno Costa",
        avatar: "/professional-avatar-man.jpg",
        time: "Time Criativo",
        departamento: "Marketing",
      },
      {
        id: "5",
        nome: "Camila Rodrigues",
        avatar: "/professional-avatar-woman-glasses.jpg",
        time: "Time Criativo",
        departamento: "Marketing",
      },
      {
        id: "6",
        nome: "Daniel Ferreira",
        avatar: "/professional-avatar-smiling.jpg",
        time: "Time Tech",
        departamento: "Tecnologia",
      },
      {
        id: "7",
        nome: "Eduarda Mendes",
        avatar: "/professional-avatar-smiling-woman.jpg",
        time: "Time Tech",
        departamento: "Tecnologia",
      },
      {
        id: "8",
        nome: "Fernando Lima",
        avatar: "/professional-avatar-man.jpg",
        time: "Time Vendas",
        departamento: "Vendas",
      },
      {
        id: "9",
        nome: "Gabriela Santos",
        avatar: "/professional-avatar-woman-glasses.jpg",
        time: "Time Vendas",
        departamento: "Vendas",
      },
      {
        id: "10",
        nome: "Henrique Alves",
        avatar: "/professional-avatar-smiling.jpg",
        time: "Time RH",
        departamento: "Recursos Humanos",
      },
    ]

    return mockCollaborators.map((collab) => {
      const engagementData = this.calculateCollaboratorEngagement(collab.id)
      return {
        userId: collab.id,
        nome: collab.nome,
        avatar: collab.avatar,
        time: collab.time,
        departamento: collab.departamento,
        ...engagementData,
      }
    })
  }

  static calculateCollaboratorEngagement(
    userId: string,
  ): Omit<CollaboratorEngagement, "userId" | "nome" | "avatar" | "time" | "departamento"> {
    if (typeof window === "undefined") {
      return {
        taxaEngajamento: 0,
        frequenciaParticipacao: 0,
        ultimaInteracao: "N/A",
        tendencia: "estavel",
        acessosSemana: 0,
        treinamentosConcluidos: 0,
        interacoesFeed: 0,
        pesquisasRespondidas: 0,
        eventosParticipados: 0,
      }
    }

    const engajamentos = EngajamentoService.getAllEngajamentos()
    const courses = TrainingService.getAllCourses()
    const surveys = SurveyService.getActiveSurveys()
    const eventos = EventoService.getAllEventos()

    // Calcular métricas reais
    const acessosSemana = Math.floor(Math.random() * 7) + 3
    let treinamentosConcluidos = 0
    const interacoesFeed = Math.floor(Math.random() * 20) + 5
    let pesquisasRespondidas = 0
    let eventosParticipados = 0

    // Contar treinamentos concluídos
    courses.forEach((course) => {
      if (course.progress && course.progress[userId]) {
        if (course.progress[userId].completedLessons === course.lessons.length) {
          treinamentosConcluidos++
        }
      }
    })

    // Contar pesquisas respondidas
    surveys.forEach((survey) => {
      if (survey.responses && survey.responses.some((r) => r.userId === userId)) {
        pesquisasRespondidas++
      }
    })

    // Contar eventos participados
    eventos.forEach((evento) => {
      if (evento.participants && evento.participants.includes(userId)) {
        eventosParticipados++
      }
    })

    // Calcular taxa de engajamento total
    const maxPossivel = 100
    const pontos =
      acessosSemana * 5 +
      treinamentosConcluidos * 15 +
      interacoesFeed * 2 +
      pesquisasRespondidas * 10 +
      eventosParticipados * 10

    const taxaEngajamento = Math.min(Math.round((pontos / maxPossivel) * 100), 100)

    // Calcular frequência de participação (% de dias ativos na semana)
    const frequenciaParticipacao = Math.round((acessosSemana / 7) * 100)

    // Definir tendência
    const tendencia: "alta" | "estavel" | "queda" =
      taxaEngajamento >= 80 ? "alta" : taxaEngajamento >= 50 ? "estavel" : "queda"

    // Última interação
    const hoje = new Date()
    const diasAtras = Math.floor(Math.random() * 3)
    hoje.setDate(hoje.getDate() - diasAtras)
    const ultimaInteracao = hoje.toLocaleDateString("pt-BR")

    return {
      taxaEngajamento,
      frequenciaParticipacao,
      ultimaInteracao,
      tendencia,
      acessosSemana,
      treinamentosConcluidos,
      interacoesFeed,
      pesquisasRespondidas,
      eventosParticipados,
    }
  }

  static getEngajamentoPorTime(): { time: string; taxa: number; colaboradores: number }[] {
    const colaboradores = this.getAllCollaboratorsEngagement()
    const timeMap = new Map<string, { total: number; count: number }>()

    colaboradores.forEach((collab) => {
      const existing = timeMap.get(collab.time) || { total: 0, count: 0 }
      timeMap.set(collab.time, {
        total: existing.total + collab.taxaEngajamento,
        count: existing.count + 1,
      })
    })

    return Array.from(timeMap.entries()).map(([time, data]) => ({
      time,
      taxa: Math.round(data.total / data.count),
      colaboradores: data.count,
    }))
  }

  static getEngajamentoPorDepartamento(): { departamento: string; taxa: number }[] {
    const colaboradores = this.getAllCollaboratorsEngagement()
    const deptMap = new Map<string, { total: number; count: number }>()

    colaboradores.forEach((collab) => {
      const existing = deptMap.get(collab.departamento) || { total: 0, count: 0 }
      deptMap.set(collab.departamento, {
        total: existing.total + collab.taxaEngajamento,
        count: existing.count + 1,
      })
    })

    return Array.from(deptMap.entries())
      .map(([departamento, data]) => ({
        departamento,
        taxa: Math.round(data.total / data.count),
      }))
      .sort((a, b) => b.taxa - a.taxa)
  }

  // ========== HUMOR ORGANIZACIONAL - ANÁLISE EMOCIONAL ==========

  static getAllCollaboratorsHumor(): HumorData[] {
    const mockCollaborators = [
      { id: "3", nome: "Ana Carolina Silva", time: "Time Criativo" },
      { id: "4", nome: "Bruno Costa", time: "Time Criativo" },
      { id: "5", nome: "Camila Rodrigues", time: "Time Criativo" },
      { id: "6", nome: "Daniel Ferreira", time: "Time Tech" },
      { id: "7", nome: "Eduarda Mendes", time: "Time Tech" },
      { id: "8", nome: "Fernando Lima", time: "Time Vendas" },
      { id: "9", nome: "Gabriela Santos", time: "Time Vendas" },
      { id: "10", nome: "Henrique Alves", time: "Time RH" },
    ]

    return mockCollaborators.map((collab) => {
      const userMoods = HumorService.getUserMoodHistory(collab.id, 30)

      // Calcular humor médio
      const humorMedio = userMoods.length > 0 ? userMoods.reduce((acc, m) => acc + m.mood, 0) / userMoods.length : 3.5

      // Calcular distribuição
      const distribuicao = {
        muitoFeliz: userMoods.filter((m) => m.mood === 5).length,
        feliz: userMoods.filter((m) => m.mood === 4).length,
        neutro: userMoods.filter((m) => m.mood === 3).length,
        triste: userMoods.filter((m) => m.mood === 2).length,
        muitoTriste: userMoods.filter((m) => m.mood === 1).length,
      }

      // Calcular evolução (últimos 7 dias)
      const evolucao = userMoods.slice(-7).map((m) => ({
        data: new Date(m.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        humor: m.mood,
      }))

      // Última registro
      const ultimoRegistro =
        userMoods.length > 0 ? new Date(userMoods[userMoods.length - 1].date).toLocaleDateString("pt-BR") : "Nunca"

      // Taxa de registro (% de dias com registro nos últimos 30 dias)
      const taxaRegistro = Math.round((userMoods.length / 30) * 100)

      return {
        userId: collab.id,
        nome: collab.nome,
        time: collab.time,
        humorMedio: Math.round(humorMedio * 10) / 10,
        distribuicao,
        evolucao,
        ultimoRegistro,
        taxaRegistro,
      }
    })
  }

  static getHumorPorTime(): TeamHumorData[] {
    const colaboradores = this.getAllCollaboratorsHumor()
    const timeMap = new Map<string, HumorData[]>()

    colaboradores.forEach((collab) => {
      const existing = timeMap.get(collab.time) || []
      existing.push(collab)
      timeMap.set(collab.time, existing)
    })

    return Array.from(timeMap.entries()).map(([teamName, members]) => {
      const humorMedio = members.reduce((acc, m) => acc + m.humorMedio, 0) / members.length

      // Calcular variação (simulada)
      const variacao = (Math.random() * 0.6 - 0.3).toFixed(1)
      const tendencia: "positiva" | "estavel" | "negativa" =
        Number.parseFloat(variacao) > 0.1 ? "positiva" : Number.parseFloat(variacao) < -0.1 ? "negativa" : "estavel"

      // Gerar alertas
      const alertas: string[] = []
      if (humorMedio < 3.0) {
        alertas.push("Humor médio abaixo de 3.0")
      }
      const membrosComHumorBaixo = members.filter((m) => m.humorMedio < 2.5).length
      if (membrosComHumorBaixo > 0) {
        alertas.push(`${membrosComHumorBaixo} colaborador(es) com humor muito baixo`)
      }

      return {
        teamName,
        humorMedio: Math.round(humorMedio * 10) / 10,
        variacao: variacao >= "0" ? `+${variacao}` : variacao,
        colaboradores: members.length,
        tendencia,
        alertas,
      }
    })
  }

  static getDistribuicaoHumorGeral(): {
    muitoFeliz: number
    feliz: number
    neutro: number
    triste: number
    muitoTriste: number
  } {
    const allMoods = HumorService.getAllMoodRecords()
    const total = allMoods.length

    if (total === 0) {
      return {
        muitoFeliz: 0,
        feliz: 0,
        neutro: 0,
        triste: 0,
        muitoTriste: 0,
      }
    }

    return {
      muitoFeliz: Math.round((allMoods.filter((m) => m.mood === 5).length / total) * 100),
      feliz: Math.round((allMoods.filter((m) => m.mood === 4).length / total) * 100),
      neutro: Math.round((allMoods.filter((m) => m.mood === 3).length / total) * 100),
      triste: Math.round((allMoods.filter((m) => m.mood === 2).length / total) * 100),
      muitoTriste: Math.round((allMoods.filter((m) => m.mood === 1).length / total) * 100),
    }
  }

  static getEvolucaoHumorTemporal(dias = 30): { data: string; humor: number }[] {
    const result: { data: string; humor: number }[] = []
    const hoje = new Date()

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date(hoje)
      data.setDate(data.getDate() - i)
      const dataStr = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })

      // Pegar registros desse dia
      const moodsDodia = HumorService.getAllMoodRecords().filter((m) => {
        const moodDate = new Date(m.date)
        return (
          moodDate.getDate() === data.getDate() &&
          moodDate.getMonth() === data.getMonth() &&
          moodDate.getFullYear() === data.getFullYear()
        )
      })

      const humorMedio =
        moodsDodia.length > 0 ? moodsDodia.reduce((acc, m) => acc + m.mood, 0) / moodsDodia.length : 3.5

      result.push({ data: dataStr, humor: Math.round(humorMedio * 10) / 10 })
    }

    return result
  }

  static getAlertasHumor(): { tipo: string; mensagem: string; severidade: "alta" | "media" | "baixa" }[] {
    const alertas: { tipo: string; mensagem: string; severidade: "alta" | "media" | "baixa" }[] = []

    const teams = this.getHumorPorTime()
    teams.forEach((team) => {
      if (team.alertas.length > 0) {
        team.alertas.forEach((alerta) => {
          alertas.push({
            tipo: `Time ${team.teamName}`,
            mensagem: alerta,
            severidade: team.humorMedio < 2.5 ? "alta" : team.humorMedio < 3.5 ? "media" : "baixa",
          })
        })
      }
    })

    return alertas
  }

  // ========== HELPERS ==========

  private static getSurveyParticipationRate(): number {
    const surveys = SurveyService.getActiveSurveys()
    if (surveys.length === 0) return 0

    let totalTargeted = 0
    let totalResponses = 0

    surveys.forEach((survey) => {
      if (survey.responses) {
        totalResponses += survey.responses.length
        totalTargeted += 47 // Mock: total de colaboradores
      }
    })

    return totalTargeted > 0 ? Math.round((totalResponses / totalTargeted) * 100) : 0
  }

  private static getEventParticipationRate(): number {
    const eventos = EventoService.getAllEventos()
    if (eventos.length === 0) return 0

    let totalCapacity = 0
    let totalParticipants = 0

    eventos.forEach((evento) => {
      if (evento.participants) {
        totalParticipants += evento.participants.length
        totalCapacity += evento.maxParticipants || 50
      }
    })

    return totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0
  }
}
