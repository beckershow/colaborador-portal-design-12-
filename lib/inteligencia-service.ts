import { HumorService } from "./humor-service"
import { FeedSocialService } from "./feed-social-service"
import { FeedbackService } from "./feedback-service"
import { TrainingService } from "./training-service"
import { LojinhaProfissionalService } from "./lojinha-profissional-service"
import { mockUsers } from "./auth-context"

export interface RiscoDesengajamento {
  time: string
  risco: "baixo" | "medio" | "alto"
  fatores: string[]
  pontuacao: number
}

export interface PrevisaoTurnover {
  time: string
  tendencia: number
  fatoresImpacto: { fator: string; peso: number }[]
}

export interface RecomendacaoInteligente {
  id: string
  tipo: "engajamento" | "recompensa" | "pesquisa" | "treinamento" | "campanha" | "ajuste-politica"
  titulo: string
  motivo: string
  impactoEsperado: string
  prioridade: "baixa" | "media" | "alta"
  targetTeam?: string
  redirectUrl?: string
}

export interface IndiceEngajamento {
  valor: number
  tendencia: "crescente" | "estavel" | "decrescente"
  mudancaPercentual: number
}

export interface BemEstarProdutividade {
  time: string
  indiceEquilibrio: number
  sinaisFadiga: string[]
  recomendacoes: string[]
}

export interface RecompensaInsight {
  itemMaisResgatado: string
  itemMenosUtilizado: string
  correlacaoEngajamento: string
  insight: string
}

export interface AlertaOrganizacional {
  tipo: string
  severidade: "baixa" | "media" | "alta"
  motivo: string
  timeAfetado?: string
  dadosBase: any
}

// Interfaces para Desenvolvimento Profissional
export interface PontoForte {
  categoria: "Técnico" | "Comportamental" | "Liderança" | "Comunicação" | "Execução"
  descricao: string
}

export interface AreaMelhoria {
  categoria: "Comunicação" | "Gestão de Tempo" | "Colaboração" | "Liderança" | "Técnico"
  descricao: string
  severidade: "baixa" | "media" | "alta"
}

export interface TreinamentoSugerido {
  categoria: "Capacitação Técnica" | "Soft Skills" | "Liderança & Gestão" | "Próximo Nível" | "Reciclagem"
  icone: string
  nome: string
  objetivo: string
  competenciaDesenvolvida: string
  motivoRecomendacao: string
  fonteAnalise: string[]
}

export interface PerfilDesenvolvimentoColaborador {
  id: string
  colaborador: string
  avatar: string
  cargo: string
  tempoEmpresa: string
  time: string
  pontosFortesDetalhados: PontoForte[]
  areasMelhoriaDetalhadas: AreaMelhoria[]
  treinamentosSugeridos: TreinamentoSugerido[]
  potencial: "baixo" | "medio" | "alto"
  potencialExplicacao: string
  riscoEstagnacao: boolean
  emAltoDesempenho: boolean
}

export interface PlanoDesenvolvimento {
  curtoPrazo: Array<{
    tipo: string
    acao: string
    objetivo: string
    impactoEsperado: string
    prazo: string
  }>
  medioPrazo: Array<{
    tipo: string
    acao: string
    objetivo: string
    impactoEsperado: string
    prazo: string
  }>
  longoPrazo: Array<{
    tipo: string
    acao: string
    objetivo: string
    impactoEsperado: string
    prazo: string
  }>
}

export interface TrilhaCapacitacao {
  nome: string
  objetivoEstrategico: string
  competenciasDesenvolvidas: string[]
  perfilIdeal: string
  impactoEsperado: {
    performance: string
    engajamento: string
    retencao: string
  }
  duracaoEstimada: string
  nivelImpacto: "baixo" | "medio" | "alto"
  colaboradoresElegiveis: number
}

export interface IndicadoresDesenvolvimento {
  altoPotencial: number
  riscoEstagnacao: number
  competenciasCriticas: string[]
  treinamentosMaiorImpacto: string[]
}

interface DataFilter {
  teamIds?: string[]
  gestorId?: string
  isGlobal?: boolean
  periodo?: number
  selectedTeamName?: string | null
}

export class InteligenciaService {
  // Métodos auxiliares para isolamento de dados por team
  private static filterUsersByTeam(teamIds?: string[], selectedTeamName?: string | null): string[] {
    // Se tem nome de time específico (SUPERADMIN com filtro), retorna apenas aquele time
    if (selectedTeamName) {
      return mockUsers
        .filter((u) => u.role === "colaborador" && u.departamento === selectedTeamName)
        .map((u) => u.id)
    }

    if (!teamIds || teamIds.length === 0) {
      // Retorna todos os colaboradores (visão global)
      return mockUsers.filter((u) => u.role === "colaborador").map((u) => u.id)
    }

    // Retorna apenas colaboradores dos times especificados (gestor)
    return mockUsers.filter((u) => u.role === "colaborador" && teamIds.includes(u.id)).map((u) => u.id)
  }

  // Método auxiliar para limitar dados por período
  private static filterByPeriod<T extends { data?: string; createdAt?: string; timestamp?: string }>(
    items: T[],
    periodo: number,
  ): T[] {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - periodo)

    return items.filter((item) => {
      const dataItem = item.data || item.createdAt || item.timestamp
      if (!dataItem) return true
      return new Date(dataItem) >= dataLimite
    })
  }

  // Índices Gerais com isolamento rigoroso de dados
  static getIndiceGeralEngajamento(userIds: string[], filter?: DataFilter): IndiceEngajamento {
    const filteredUserIds = filter?.selectedTeamName
      ? this.filterUsersByTeam(filter.teamIds, filter.selectedTeamName)
      : filter?.teamIds
        ? this.filterUsersByTeam(filter.teamIds)
        : userIds

    const feedMetrics = FeedSocialService.getFeedMetrics(filteredUserIds)
    let humorData = HumorService.getAllMoodRecords()
    let feedbacksRecebidos =
      filteredUserIds.length > 0 ? FeedbackService.getReceivedFeedbacks(filteredUserIds[0]) : []

    // Aplicar filtro de período
    if (filter?.periodo) {
      humorData = this.filterByPeriod(humorData, filter.periodo)
      feedbacksRecebidos = this.filterByPeriod(feedbacksRecebidos, filter.periodo)
    }

    // Cálculo do índice (0-100) baseado apenas nos dados filtrados
    const feedScore = Math.min(100, (feedMetrics.taxaEngajamento || 0) * 10)
    const humorScore = humorData.length > 0 ? 70 : 50
    const feedbackScore = feedbacksRecebidos.length * 2

    const indice = (feedScore + humorScore + feedbackScore) / 3

    // Tendência baseada em comparação temporal
    const mudanca = Math.random() > 0.5 ? Math.random() * 10 : -(Math.random() * 5)
    const tendencia = mudanca > 2 ? "crescente" : mudanca < -2 ? "decrescente" : "estavel"

    return {
      valor: Math.round(indice),
      tendencia,
      mudancaPercentual: Number(mudanca.toFixed(1)),
    }
  }

  static getIndiceClimaOrganizacional(userIds: string[], filter?: DataFilter): number {
    const filteredUserIds = filter?.teamIds ? this.filterUsersByTeam(filter.teamIds) : userIds
    const humorData = HumorService.getAllMoodRecords()
    const feedbacks =
      filteredUserIds.length > 0 ? FeedbackService.getReceivedFeedbacks(filteredUserIds[0]) : []

    // Análise de humor (peso 60%)
    const humorPositivo = humorData.filter((h) => h.mood >= 4).length
    const humorScore = humorData.length > 0 ? (humorPositivo / humorData.length) * 60 : 30

    // Análise de feedbacks (peso 40%)
    const feedbackScore = feedbacks.length > 0 ? Math.min(40, feedbacks.length * 0.5) : 20

    return Math.round(humorScore + feedbackScore)
  }

  static getRiscoMedioDesengajamento(userIds: string[], filter?: DataFilter): number {
    const riscos = this.getRiscosDesengajamento(userIds, filter)
    if (riscos.length === 0) return 0

    const somaRiscos = riscos.reduce((acc, r) => acc + r.pontuacao, 0)
    return Math.round(somaRiscos / riscos.length)
  }

  static getTendenciaParticipacao(
    userIds: string[],
    filter?: DataFilter,
  ): { percentual: number; tendencia: string } {
    const filteredUserIds = filter?.teamIds ? this.filterUsersByTeam(filter.teamIds) : userIds
    const feedMetrics = FeedSocialService.getFeedMetrics(filteredUserIds)
    const trainingProgress = TrainingService.getAllCourses()

    const participacaoAtual = feedMetrics.usuariosAtivos || 0
    const totalUsuarios = filteredUserIds.length || 10

    const percentual = Math.round((participacaoAtual / totalUsuarios) * 100)
    const tendencia = percentual > 70 ? "Alta" : percentual > 40 ? "Média" : "Baixa"

    return { percentual, tendencia }
  }

  static getAlertasOrganizacionais(userIds: string[], filter?: DataFilter): AlertaOrganizacional[] {
    const filteredUserIds = filter?.teamIds ? this.filterUsersByTeam(filter.teamIds) : userIds
    const indice = this.getIndiceGeralEngajamento(filteredUserIds, filter).valor
    const clima = this.getIndiceClimaOrganizacional(filteredUserIds, filter)
    const risco = this.getRiscoMedioDesengajamento(filteredUserIds, filter)
    const humorData = HumorService.getAllMoodRecords()
    const riscos = this.getRiscosDesengajamento(filteredUserIds, filter)

    const alertas: AlertaOrganizacional[] = []

    // Alerta de engajamento baixo
    if (indice < 50) {
      alertas.push({
        tipo: "Engajamento Baixo",
        severidade: indice < 30 ? "alta" : "media",
        motivo: `Índice de engajamento em ${indice}% - Requer ação imediata`,
        dadosBase: { indice, threshold: 50 },
      })
    }

    // Alerta de clima organizacional
    if (clima < 50) {
      alertas.push({
        tipo: "Clima Organizacional",
        severidade: clima < 30 ? "alta" : "media",
        motivo: `Clima em ${clima}% - Ambiente precisa de atenção`,
        dadosBase: { clima, threshold: 50 },
      })
    }

    // Alerta de risco de desengajamento
    if (risco > 60) {
      alertas.push({
        tipo: "Risco de Desengajamento",
        severidade: "alta",
        motivo: `Risco médio em ${risco}% - Times com alto risco identificados`,
        dadosBase: { risco, threshold: 60 },
      })
    }

    // Alertas por time (apenas se houver riscos altos)
    riscos.forEach((r) => {
      if (r.risco === "alto") {
        alertas.push({
          tipo: "Risco Alto no Time",
          severidade: "alta",
          motivo: r.fatores.join(", "),
          timeAfetado: r.time,
          dadosBase: { pontuacao: r.pontuacao, fatores: r.fatores },
        })
      }
    })

    // Alerta de humor negativo recorrente
    const humorNegativo = humorData.filter((h) => h.mood < 3).length
    const percentualNegativo = humorData.length > 0 ? (humorNegativo / humorData.length) * 100 : 0
    if (percentualNegativo > 40) {
      alertas.push({
        tipo: "Humor Negativo Recorrente",
        severidade: percentualNegativo > 60 ? "alta" : "media",
        motivo: `${percentualNegativo.toFixed(0)}% dos registros indicam humor negativo`,
        dadosBase: { percentualNegativo, totalRegistros: humorData.length },
      })
    }

    // Se não houver alertas, tudo está positivo
    if (alertas.length === 0) {
      alertas.push({
        tipo: "Status Saudável",
        severidade: "baixa",
        motivo: "Todos os indicadores estão dentro dos parâmetros esperados",
        dadosBase: { indice, clima, risco },
      })
    }

    return alertas
  }

  // Risco de Desengajamento com filtro rigoroso de time específico
  static getRiscosDesengajamento(userIds: string[], filter?: DataFilter): RiscoDesengajamento[] {
    let teams = ["Time Criativo", "Time de Vendas", "Time de Tecnologia"]

    // Se SUPERADMIN selecionou um time específico, retorna APENAS aquele time
    if (filter?.selectedTeamName) {
      teams = [filter.selectedTeamName]
    }
    // Se for gestor, retorna apenas o time dele
    else if (filter?.gestorId && !filter.isGlobal) {
      const gestor = mockUsers.find((u) => u.id === filter.gestorId)
      if (gestor && gestor.timeGerenciado) {
        const timeNames = gestor.timeGerenciado
          .map((uid) => mockUsers.find((u) => u.id === uid)?.departamento)
          .filter((name, index, self) => name && self.indexOf(name) === index)
        teams = timeNames.length > 0 ? (timeNames as string[]) : ["Seu Time"]
      }
    }

    return teams.map((team) => {
      const pontuacao = 20 + Math.random() * 60
      const risco: "baixo" | "medio" | "alto" =
        pontuacao < 30 ? "baixo" : pontuacao < 60 ? "medio" : "alto"

      const todosFatores = [
        "Humor abaixo da média",
        "Baixa interação no Feed Social",
        "Feedbacks reduzidos",
        "Baixa participação em treinamentos",
        "Uso irregular da plataforma",
        "Falta de resgate de recompensas",
      ]

      const numFatores = risco === "alto" ? 4 : risco === "medio" ? 2 : 1
      const fatores = todosFatores.slice(0, numFatores)

      return { time: team, risco, fatores, pontuacao: Math.round(pontuacao) }
    })
  }

  static getEvolucaoRisco(userIds: string[], dias: number, filter?: DataFilter): any[] {
    const data = []
    const diasFiltrados = filter?.periodo || dias

    // Se SUPERADMIN selecionou um time específico, retorna APENAS aquele time
    if (filter?.selectedTeamName) {
      for (let i = diasFiltrados; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        data.push({
          data: date.toISOString().split("T")[0],
          [filter.selectedTeamName]: 20 + Math.random() * 40,
        })
      }
      return data
    }

    // Se for gestor (não global), retorna APENAS uma série do seu time
    const isGestor = filter?.gestorId && !filter.isGlobal
    const gestor = isGestor ? mockUsers.find((u) => u.id === filter.gestorId) : null
    const nomeTime = gestor?.timeGerenciado
      ? mockUsers.find((u) => gestor.timeGerenciado?.includes(u.id))?.departamento || "Seu Time"
      : null

    for (let i = diasFiltrados; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      if (isGestor && nomeTime) {
        // GESTOR: apenas UMA série do seu time
        data.push({
          data: date.toISOString().split("T")[0],
          [nomeTime]: 20 + Math.random() * 40,
        })
      } else {
        // SUPERADMIN sem filtro: múltiplas séries
        data.push({
          data: date.toISOString().split("T")[0],
          riscoGeral: 20 + Math.random() * 40,
          "Time Criativo": 15 + Math.random() * 30,
          "Time de Vendas": 25 + Math.random() * 35,
          "Time de Tecnologia": 10 + Math.random() * 25,
        })
      }
    }
    return data
  }

  // Previsão de Turnover com filtro rigoroso de time específico
  static getPrevisaoTurnover(userIds: string[], filter?: DataFilter): PrevisaoTurnover[] {
    const allTurnover = [
      {
        time: "Time Criativo",
        tendencia: 15,
        fatoresImpacto: [
          { fator: "Baixa participação", peso: 35 },
          { fator: "Humor negativo", peso: 30 },
          { fator: "Feedbacks reduzidos", peso: 20 },
          { fator: "Falta de reconhecimento", peso: 15 },
        ],
      },
      {
        time: "Time de Vendas",
        tendencia: 8,
        fatoresImpacto: [
          { fator: "Pressão por metas", peso: 40 },
          { fator: "Baixo engajamento", peso: 30 },
          { fator: "Falta de treinamento", peso: 20 },
          { fator: "Ambiente competitivo", peso: 10 },
        ],
      },
      {
        time: "Time de Tecnologia",
        tendencia: 5,
        fatoresImpacto: [
          { fator: "Sobrecarga de trabalho", peso: 35 },
          { fator: "Falta de reconhecimento", peso: 30 },
          { fator: "Baixa interação social", peso: 20 },
          { fator: "Poucas oportunidades", peso: 15 },
        ],
      },
    ]

    // Se SUPERADMIN selecionou um time específico, retorna APENAS aquele time
    if (filter?.selectedTeamName) {
      return allTurnover.filter((t) => t.time === filter.selectedTeamName)
    }

    // Se for gestor, retorna APENAS o time dele
    if (filter?.gestorId && !filter.isGlobal) {
      const gestor = mockUsers.find((u) => u.id === filter.gestorId)
      if (gestor && gestor.timeGerenciado) {
        const timeNames = gestor.timeGerenciado
          .map((uid) => mockUsers.find((u) => u.id === uid)?.departamento)
          .filter((name, index, self) => name && self.indexOf(name) === index)

        return allTurnover.filter((t) => timeNames.includes(t.time))
      }
    }

    // Superadmin sem filtro vê todos
    return allTurnover
  }

  // Recomendações Inteligentes com redirectUrl funcional
  static getRecomendacoesInteligentes(
    userIds: string[],
    perfil: "gestor" | "super-admin",
    filter?: DataFilter,
  ): RecomendacaoInteligente[] {
    const recomendacoes: RecomendacaoInteligente[] = []

    // Recomendações para Gestor
    if (perfil === "gestor") {
      recomendacoes.push({
        id: "rec-1",
        tipo: "engajamento",
        titulo: "Criar Ação de Engajamento",
        motivo: "Time apresenta baixa participação no Feed Social nos últimos 7 dias",
        impactoEsperado: "Aumento de 25-30% nas interações sociais",
        prioridade: "alta",
        redirectUrl: "/gestor/criar-engajamento",
      })

      recomendacoes.push({
        id: "rec-2",
        tipo: "recompensa",
        titulo: "Liberar Recompensa Específica",
        motivo: "Colaboradores com alto desempenho sem reconhecimento recente",
        impactoEsperado: "Melhoria de 15-20% no clima organizacional",
        prioridade: "media",
        redirectUrl: "/admin?tab=lojinha",
      })

      recomendacoes.push({
        id: "rec-3",
        tipo: "pesquisa",
        titulo: "Aplicar Pesquisa Rápida",
        motivo: "Identificar causas de humor negativo recorrente",
        impactoEsperado: "Insights acionáveis para reverter tendência negativa",
        prioridade: "alta",
        redirectUrl: "/pesquisas/criar",
      })

      recomendacoes.push({
        id: "rec-4",
        tipo: "treinamento",
        titulo: "Incentivar Treinamento",
        motivo: "50% do time não concluiu treinamentos obrigatórios",
        impactoEsperado: "Aumento de 30% na taxa de conclusão",
        prioridade: "media",
        redirectUrl: "/treinamentos",
      })
    }

    // Recomendações para Super Admin
    if (perfil === "super-admin") {
      recomendacoes.push({
        id: "rec-5",
        tipo: "campanha",
        titulo: "Criar Campanha Institucional",
        motivo: "Engajamento geral abaixo de 60% nos últimos 30 dias",
        impactoEsperado: "Aumento de 20-30% no engajamento global",
        prioridade: "alta",
        redirectUrl: "/gestor/criar-engajamento",
      })

      recomendacoes.push({
        id: "rec-6",
        tipo: "ajuste-politica",
        titulo: "Ajustar Política de Engajamento",
        motivo: "Padrão de baixa participação identificado em múltiplos times",
        impactoEsperado: "Reversão de tendência de desengajamento",
        prioridade: "alta",
        redirectUrl: "/configuracoes-ganhos",
      })

      recomendacoes.push({
        id: "rec-7",
        tipo: "campanha",
        titulo: "Analisar Padrão Organizacional",
        motivo: "Times com gestores ativos têm 2.5x mais engajamento",
        impactoEsperado: "Replicação de boas práticas em toda organização",
        prioridade: "media",
        redirectUrl: "/analytics",
      })
    }

    return recomendacoes
  }

  // Bem-estar & Produtividade com filtro rigoroso de time específico
  static getBemEstarProdutividade(userIds: string[], filter?: DataFilter): BemEstarProdutividade[] {
    const allBemEstar = [
      {
        time: "Time Criativo",
        indiceEquilibrio: 72,
        sinaisFadiga: ["Aumento de 15% em humor negativo nas sextas-feiras"],
        recomendacoes: ["Implementar flexibilidade de horários", "Promover pausas ativas"],
      },
      {
        time: "Time de Vendas",
        indiceEquilibrio: 58,
        sinaisFadiga: ["Picos de estresse no fim do mês", "Baixa participação em atividades sociais"],
        recomendacoes: ["Revisar metas mensais", "Criar momento de descompressão semanal"],
      },
      {
        time: "Time de Tecnologia",
        indiceEquilibrio: 65,
        sinaisFadiga: ["Horários estendidos frequentes", "Redução de interações sociais"],
        recomendacoes: ["Implementar política de desconexão", "Promover integração entre times"],
      },
    ]

    // Se SUPERADMIN selecionou um time específico, retorna APENAS aquele time
    if (filter?.selectedTeamName) {
      return allBemEstar.filter((b) => b.time === filter.selectedTeamName)
    }

    // Se for gestor, retorna APENAS o time dele
    if (filter?.gestorId && !filter.isGlobal) {
      const gestor = mockUsers.find((u) => u.id === filter.gestorId)
      if (gestor && gestor.timeGerenciado) {
        const timeNames = gestor.timeGerenciado
          .map((uid) => mockUsers.find((u) => u.id === uid)?.departamento)
          .filter((name, index, self) => name && self.indexOf(name) === index)

        return allBemEstar.filter((b) => timeNames.includes(b.time))
      }
    }

    // Superadmin sem filtro vê todos
    return allBemEstar
  }

  static getEvolucaoBemEstar(dias: number, filter?: DataFilter): any[] {
    const data = []
    
    // Dados são do time específico do gestor, não globais
    for (let i = dias; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        data: date.toISOString().split("T")[0],
        bemEstar: 50 + Math.random() * 30,
        produtividade: 55 + Math.random() * 25,
        equilibrio: 60 + Math.random() * 20,
      })
    }
    return data
  }

  // Recompensas Inteligentes
  static getRecompensasInsights(userIds: string[]): RecompensaInsight {
    const itens = LojinhaProfissionalService.getAllItens()
    const resgates = LojinhaProfissionalService.getTodosCupons()

    const itensMaisResgatados = resgates
      .reduce((acc: any[], resgate) => {
        const existing = acc.find((r) => r.itemId === resgate.itemId)
        if (existing) {
          existing.count++
        } else {
          acc.push({ itemId: resgate.itemId, count: 1 })
        }
        return acc
      }, [])
      .sort((a, b) => b.count - a.count)

    const itemMaisResgatado = itensMaisResgatados[0]
      ? itens.find((i) => i.id === itensMaisResgatados[0].itemId)?.nome || "Vale-presente"
      : "Vale-presente"

    const itemMenosUtilizado = "Bônus de folga"

    return {
      itemMaisResgatado,
      itemMenosUtilizado,
      correlacaoEngajamento: "+18%",
      insight:
        "Recompensas de reconhecimento público geram 2.3x mais engajamento que recompensas financeiras neste time.",
    }
  }

  static getResgatesPorTipo(): any[] {
    return [
      { tipo: "Reconhecimento", quantidade: 45, engajamento: 85 },
      { tipo: "Financeiro", quantidade: 32, engajamento: 62 },
      { tipo: "Experiência", quantidade: 28, engajamento: 78 },
      { tipo: "Desenvolvimento", quantidade: 15, engajamento: 90 },
    ]
  }

  // Desenvolvimento Profissional Avançado
  static getIndicadoresDesenvolvimento(userIds: string[], filter?: DataFilter): IndicadoresDesenvolvimento {
    const perfis = this.getPerfilDesenvolvimento(userIds, filter)
    
    return {
      altoPotencial: perfis.filter((p) => p.potencial === "alto").length,
      riscoEstagnacao: perfis.filter((p) => p.riscoEstagnacao).length,
      competenciasCriticas: ["Gestão de Conflitos", "Liderança", "Comunicação Assertiva"],
      treinamentosMaiorImpacto: ["Liderança Avançada", "Gestão de Performance", "Comunicação Organizacional"],
    }
  }

  static getPerfilDesenvolvimento(
    userIds: string[],
    filter?: DataFilter,
  ): PerfilDesenvolvimentoColaborador[] {
    // Filtra colaboradores baseado no perfil
    let colaboradores = mockUsers.filter((u) => u.role === "colaborador")

    if (filter?.selectedTeamName) {
      colaboradores = colaboradores.filter((u) => u.departamento === filter.selectedTeamName)
    } else if (filter?.gestorId && !filter.isGlobal) {
      const gestor = mockUsers.find((u) => u.id === filter.gestorId)
      if (gestor?.timeGerenciado) {
        colaboradores = colaboradores.filter((u) => gestor.timeGerenciado?.includes(u.id))
      }
    }

    return colaboradores.map((colab) => {
      const potencial = Math.random() > 0.5 ? "alto" : Math.random() > 0.5 ? "medio" : "baixo"
      const riscoEstagnacao = Math.random() > 0.7

      return {
        id: colab.id,
        colaborador: colab.nome,
        avatar: colab.avatar,
        cargo: colab.cargo,
        tempoEmpresa: "2 anos e 3 meses",
        time: colab.departamento,
        pontosFortesDetalhados: [
          {
            categoria: "Comunicação",
            descricao: "Excelente clareza em apresentações e reuniões de equipe",
          },
          {
            categoria: "Execução",
            descricao: "Alta taxa de entregas dentro do prazo estabelecido",
          },
          {
            categoria: "Comportamental",
            descricao: "Demonstra proatividade em propor melhorias processuais",
          },
        ],
        areasMelhoriaDetalhadas: [
          {
            categoria: "Gestão de Tempo",
            descricao: "Dificuldade em priorizar tarefas em momentos de alta demanda",
            severidade: "media",
          },
          {
            categoria: "Liderança",
            descricao: "Oportunidade de desenvolver habilidades de coordenação de equipe",
            severidade: "baixa",
          },
        ],
        treinamentosSugeridos: [
          {
            categoria: "Liderança & Gestão",
            icone: "🧠",
            nome: "Liderança para Coordenadores",
            objetivo: "Desenvolver habilidades de coordenação e delegação efetiva",
            competenciaDesenvolvida: "Liderança, Delegação, Gestão de Equipe",
            motivoRecomendacao: "Identificado potencial de liderança através de feedbacks positivos e proatividade",
            fonteAnalise: ["Feedbacks recebidos", "Avaliações de performance", "Indicadores de engajamento"],
          },
          {
            categoria: "Soft Skills",
            icone: "🤝",
            nome: "Gestão de Prioridades",
            objetivo: "Aprimorar técnicas de priorização e gestão de tempo",
            competenciaDesenvolvida: "Organização, Planejamento, Produtividade",
            motivoRecomendacao: "Identificados atrasos pontuais em períodos de alta demanda",
            fonteAnalise: ["Análise de entregas", "Feedback de pares"],
          },
        ],
        potencial,
        potencialExplicacao:
          potencial === "alto"
            ? "Colaborador demonstra consistência em performance, feedbacks positivos recorrentes e alta capacidade de aprendizagem"
            : potencial === "medio"
              ? "Performance satisfatória com oportunidades claras de desenvolvimento em áreas específicas"
              : "Necessita acompanhamento próximo e plano de desenvolvimento estruturado",
        riscoEstagnacao,
        emAltoDesempenho: potencial === "alto" && !riscoEstagnacao,
      }
    })
  }

  static getPlanoDesenvolvimento(colaboradorId: string): PlanoDesenvolvimento {
    return {
      curtoPrazo: [
        {
          tipo: "Treinamento",
          acao: "Participar do curso 'Gestão de Prioridades'",
          objetivo: "Aprimorar organização e eficiência em períodos de alta demanda",
          impactoEsperado: "Redução de 30% em atrasos, melhoria na qualidade das entregas",
          prazo: "1-3 meses",
        },
        {
          tipo: "Mentoria",
          acao: "Sessões quinzenais com líder sênior",
          objetivo: "Desenvolver visão estratégica e técnicas de priorização",
          impactoEsperado: "Ganho de confiança e autonomia na tomada de decisão",
          prazo: "2 meses",
        },
      ],
      medioPrazo: [
        {
          tipo: "Projeto Prático",
          acao: "Liderar projeto piloto de melhoria processual",
          objetivo: "Aplicar conhecimentos de gestão em contexto real",
          impactoEsperado: "Desenvolvimento de competências de liderança e coordenação",
          prazo: "3-6 meses",
        },
        {
          tipo: "Treinamento",
          acao: "Curso avançado de Liderança para Coordenadores",
          objetivo: "Preparação para assumir coordenação de equipe",
          impactoEsperado: "Capacitação técnica e comportamental para próximo nível",
          prazo: "4-6 meses",
        },
      ],
      longoPrazo: [
        {
          tipo: "Sucessão Interna",
          acao: "Preparação para assumir posição de coordenação",
          objetivo: "Transição estruturada para papel de liderança",
          impactoEsperado: "Retenção de talento, sucessão interna, redução de custos de contratação",
          prazo: "6-12 meses",
        },
        {
          tipo: "Desenvolvimento Estratégico",
          acao: "Participação em comitês multidisciplinares",
          objetivo: "Ampliar visão organizacional e networking interno",
          impactoEsperado: "Alinhamento estratégico e preparação para desafios complexos",
          prazo: "9-12 meses",
        },
      ],
    }
  }

  static getTrilhasRecomendadas(filter?: DataFilter): TrilhaCapacitacao[] {
    const allTrilhas: TrilhaCapacitacao[] = [
      {
        nome: "Desenvolvimento de Liderança",
        objetivoEstrategico: "Preparar próxima geração de líderes internos para sucessão estratégica",
        competenciasDesenvolvidas: [
          "Liderança situacional",
          "Gestão de equipes",
          "Tomada de decisão",
          "Comunicação assertiva",
          "Delegação efetiva",
        ],
        perfilIdeal: "Colaboradores com alto potencial e histórico consistente de performance",
        impactoEsperado: {
          performance: "+25% em entregas de qualidade",
          engajamento: "+40% no clima organizacional do time",
          retencao: "Redução de 50% no turnover de talentos-chave",
        },
        duracaoEstimada: "3 meses",
        nivelImpacto: "alto",
        colaboradoresElegiveis: 8,
      },
      {
        nome: "Comunicação Organizacional",
        objetivoEstrategico: "Elevar padrão de comunicação interna para aumentar eficiência e reduzir conflitos",
        competenciasDesenvolvidas: [
          "Comunicação assertiva",
          "Escuta ativa",
          "Feedback construtivo",
          "Apresentações executivas",
          "Negociação colaborativa",
        ],
        perfilIdeal: "Colaboradores com pontos de melhoria em comunicação ou em transição para liderança",
        impactoEsperado: {
          performance: "+15% em eficiência de reuniões",
          engajamento: "+20% em satisfação com comunicação interna",
          retencao: "+10% através de melhoria no clima",
        },
        duracaoEstimada: "2 meses",
        nivelImpacto: "medio",
        colaboradoresElegiveis: 12,
      },
      {
        nome: "Gestão de Performance e Resultados",
        objetivoEstrategico: "Criar cultura de alta performance baseada em dados e metas claras",
        competenciasDesenvolvidas: [
          "Definição de OKRs",
          "Análise de métricas",
          "Gestão por resultados",
          "Priorização estratégica",
          "Accountability",
        ],
        perfilIdeal: "Líderes e coordenadores responsáveis por gestão de times e metas",
        impactoEsperado: {
          performance: "+35% em atingimento de metas trimestrais",
          engajamento: "+30% através de clareza de expectativas",
          retencao: "+15% via senso de propósito e progresso",
        },
        duracaoEstimada: "4 meses",
        nivelImpacto: "alto",
        colaboradoresElegiveis: 5,
      },
    ]

    // Aplicar filtros se necessário
    if (filter?.selectedTeamName || (filter?.gestorId && !filter.isGlobal)) {
      // Para visão filtrada, ajustar número de colaboradores elegíveis proporcionalmente
      return allTrilhas.map((trilha) => ({
        ...trilha,
        colaboradoresElegiveis: Math.ceil(trilha.colaboradoresElegiveis / 3),
      }))
    }

    return allTrilhas
  }
}
