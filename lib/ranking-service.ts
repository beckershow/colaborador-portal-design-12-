export interface RankingUser {
  id: string
  nome: string
  avatar: string
  cargo: string
  departamento: string
  xp: number
  estrelas: number
  nivel: number
  posicao: number
  progresso: {
    humorDias: number
    feedbacksEnviados: number
    pesquisasCompletas: number
    treinamentosConcluidos: number
    postsFeed: number
  }
}

export interface RankingFilters {
  periodo: "semana" | "mes" | "trimestre" | "ano"
  departamento?: string
  time?: string
}

export class RankingService {
  private static STORAGE_KEY = "engageai-ranking"

  static getRanking(filters: RankingFilters = { periodo: "semana" }): RankingUser[] {
    // Simular dados de ranking - em produção, viria do backend
    const mockRanking: RankingUser[] = [
      {
        id: "1",
        nome: "João Silva",
        avatar: "JS",
        cargo: "Desenvolvedor Sênior",
        departamento: "Tecnologia",
        xp: 2850,
        estrelas: 280,
        nivel: 8,
        posicao: 1,
        progresso: {
          humorDias: 7,
          feedbacksEnviados: 5,
          pesquisasCompletas: 3,
          treinamentosConcluidos: 2,
          postsFeed: 8,
        },
      },
      {
        id: "2",
        nome: "Maria Santos",
        avatar: "MS",
        cargo: "Analista de Marketing",
        departamento: "Marketing",
        xp: 2650,
        estrelas: 265,
        nivel: 7,
        posicao: 2,
        progresso: {
          humorDias: 7,
          feedbacksEnviados: 4,
          pesquisasCompletas: 4,
          treinamentosConcluidos: 1,
          postsFeed: 6,
        },
      },
      {
        id: "3",
        nome: "Julia Lima",
        avatar: "JL",
        cargo: "Coordenadora de RH",
        departamento: "Recursos Humanos",
        xp: 2400,
        estrelas: 240,
        nivel: 7,
        posicao: 3,
        progresso: {
          humorDias: 6,
          feedbacksEnviados: 6,
          pesquisasCompletas: 2,
          treinamentosConcluidos: 2,
          postsFeed: 5,
        },
      },
      {
        id: "4",
        nome: "Pedro Costa",
        avatar: "PC",
        cargo: "Designer UX",
        departamento: "Design",
        xp: 2200,
        estrelas: 220,
        nivel: 6,
        posicao: 4,
        progresso: {
          humorDias: 7,
          feedbacksEnviados: 3,
          pesquisasCompletas: 3,
          treinamentosConcluidos: 1,
          postsFeed: 7,
        },
      },
      {
        id: "5",
        nome: "Ana Carolina Silva",
        avatar: "AC",
        cargo: "Analista de Marketing",
        departamento: "Time Criativo",
        xp: 1950,
        estrelas: 195,
        nivel: 5,
        posicao: 5,
        progresso: {
          humorDias: 5,
          feedbacksEnviados: 4,
          pesquisasCompletas: 2,
          treinamentosConcluidos: 1,
          postsFeed: 4,
        },
      },
      {
        id: "6",
        nome: "Lucas Oliveira",
        avatar: "LO",
        cargo: "Analista de Dados",
        departamento: "Tecnologia",
        xp: 1850,
        estrelas: 185,
        nivel: 5,
        posicao: 6,
        progresso: {
          humorDias: 6,
          feedbacksEnviados: 2,
          pesquisasCompletas: 3,
          treinamentosConcluidos: 2,
          postsFeed: 3,
        },
      },
      {
        id: "7",
        nome: "Carla Souza",
        avatar: "CS",
        cargo: "Gerente de Vendas",
        departamento: "Comercial",
        xp: 1750,
        estrelas: 175,
        nivel: 5,
        posicao: 7,
        progresso: {
          humorDias: 7,
          feedbacksEnviados: 3,
          pesquisasCompletas: 1,
          treinamentosConcluidos: 1,
          postsFeed: 6,
        },
      },
      {
        id: "8",
        nome: "Rafael Mendes",
        avatar: "RM",
        cargo: "Coordenador de TI",
        departamento: "Tecnologia",
        xp: 1650,
        estrelas: 165,
        nivel: 4,
        posicao: 8,
        progresso: {
          humorDias: 5,
          feedbacksEnviados: 2,
          pesquisasCompletas: 2,
          treinamentosConcluidos: 2,
          postsFeed: 2,
        },
      },
      {
        id: "9",
        nome: "Fernanda Lima",
        avatar: "FL",
        cargo: "Analista Financeiro",
        departamento: "Financeiro",
        xp: 1550,
        estrelas: 155,
        nivel: 4,
        posicao: 9,
        progresso: {
          humorDias: 6,
          feedbacksEnviados: 1,
          pesquisasCompletas: 2,
          treinamentosConcluidos: 1,
          postsFeed: 4,
        },
      },
      {
        id: "10",
        nome: "Bruno Almeida",
        avatar: "BA",
        cargo: "Especialista em Marketing",
        departamento: "Marketing",
        xp: 1450,
        estrelas: 145,
        nivel: 4,
        posicao: 10,
        progresso: {
          humorDias: 4,
          feedbacksEnviados: 2,
          pesquisasCompletas: 1,
          treinamentosConcluidos: 1,
          postsFeed: 5,
        },
      },
    ]

    // Aplicar filtros
    let filteredRanking = [...mockRanking]

    if (filters.departamento) {
      filteredRanking = filteredRanking.filter((user) => user.departamento === filters.departamento)
    }

    // Recalcular posições após filtros
    filteredRanking = filteredRanking.map((user, index) => ({
      ...user,
      posicao: index + 1,
    }))

    return filteredRanking
  }

  static getUserPosition(userId: string, filters?: RankingFilters): number {
    const ranking = this.getRanking(filters)
    const user = ranking.find((u) => u.id === userId)
    return user?.posicao || 0
  }

  static getTopPerformers(limit = 3, filters?: RankingFilters): RankingUser[] {
    const ranking = this.getRanking(filters)
    return ranking.slice(0, limit)
  }

  static getDepartamentos(): string[] {
    return ["Tecnologia", "Marketing", "Design", "Recursos Humanos", "Comercial", "Financeiro", "Time Criativo"]
  }
}
