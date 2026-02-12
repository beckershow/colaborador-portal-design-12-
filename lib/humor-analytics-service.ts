import { HumorService, type HumorEntry } from "./humor-service"
import { mockUsers } from "./auth-context"

export interface HumorUserAnalytics {
  userId: string
  nome: string
  time: string
  totalRegistros: number
  humorMedio: number
  ultimoRegistro: string
  tendencia: "alta" | "estavel" | "queda"
  diasConsecutivos: number
  distribuicao: {
    otiimo: number
    bem: number
    neutro: number
    triste: number
    estressado: number
  }
}

export interface HumorMetrics {
  humorMedioGeral: number
  taxaRegistro: number
  percentualPositivo: number
  timesComQueda: number
  alertasAtivos: number
}

export interface HumorEvolution {
  data: string
  humorMedio: number
  registros: number
}

export interface HumorDistribution {
  categoria: string
  valor: number
  percentual: number
  emoji: string
}

export interface HumorByTeam {
  time: string
  humorMedio: number
  registros: number
  tendencia: "alta" | "estavel" | "queda"
}

export class HumorAnalyticsService {
  // Obter todas as entradas de humor filtradas por usuários
  private static getFilteredEntries(userIds?: string[]): HumorEntry[] {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return []
    }

    const allEntries = HumorService.getAllMoodRecords()
    if (!Array.isArray(allEntries)) {
      return []
    }

    return allEntries.filter((entry) => entry && entry.userId && userIds.includes(entry.userId))
  }

  // Calcular métricas principais
  static getMetrics(userIds?: string[]): HumorMetrics {
    const entries = this.getFilteredEntries(userIds)

    if (entries.length === 0) {
      return {
        humorMedioGeral: 0,
        taxaRegistro: 0,
        percentualPositivo: 0,
        timesComQueda: 0,
        alertasAtivos: 0,
      }
    }

    // Humor médio geral
    const totalMood = entries.reduce((acc, entry) => acc + (entry.mood || 0), 0)
    const humorMedioGeral = Math.round((totalMood / entries.length) * 10) / 10

    // Taxa de registro (assumindo 30 dias)
    const uniqueUsers = new Set(entries.map((e) => e.userId)).size
    const totalUsers = userIds?.length || uniqueUsers
    const taxaRegistro = totalUsers > 0 ? Math.round((uniqueUsers / totalUsers) * 100) : 0

    // Percentual positivo (humor >= 4)
    const positivoCount = entries.filter((e) => e.mood >= 4).length
    const percentualPositivo = Math.round((positivoCount / entries.length) * 100)

    // Times com queda (mock - em produção seria calculado baseado em histórico)
    const timesComQueda = Math.floor(Math.random() * 3)

    // Alertas ativos (humor <= 2 nos últimos 3 dias)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const alertasAtivos = entries.filter((e) => {
      const entryDate = new Date(e.timestamp)
      return e.mood <= 2 && entryDate >= threeDaysAgo
    }).length

    return {
      humorMedioGeral,
      taxaRegistro,
      percentualPositivo,
      timesComQueda,
      alertasAtivos,
    }
  }

  // Obter evolução do humor ao longo do tempo
  static getEvolution(userIds?: string[], days = 30): HumorEvolution[] {
    const entries = this.getFilteredEntries(userIds)

    if (entries.length === 0) {
      return []
    }

    const today = new Date()
    const evolutionMap = new Map<string, { total: number; count: number }>()

    // Inicializar todos os dias
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split("T")[0]
      evolutionMap.set(dateKey, { total: 0, count: 0 })
    }

    // Agregar dados por dia
    entries.forEach((entry) => {
      if (!entry.timestamp) return
      const dateKey = entry.timestamp.split("T")[0]
      if (evolutionMap.has(dateKey)) {
        const day = evolutionMap.get(dateKey)!
        day.total += entry.mood || 0
        day.count++
      }
    })

    return Array.from(evolutionMap.entries())
      .map(([data, stats]) => ({
        data,
        humorMedio: stats.count > 0 ? Math.round((stats.total / stats.count) * 10) / 10 : 0,
        registros: stats.count,
      }))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }

  // Obter distribuição de humor
  static getDistribution(userIds?: string[]): HumorDistribution[] {
    const entries = this.getFilteredEntries(userIds)

    if (entries.length === 0) {
      return [
        { categoria: "Ótimo", valor: 0, percentual: 0, emoji: "😄" },
        { categoria: "Bem", valor: 0, percentual: 0, emoji: "😊" },
        { categoria: "Neutro", valor: 0, percentual: 0, emoji: "😐" },
        { categoria: "Triste", valor: 0, percentual: 0, emoji: "😔" },
        { categoria: "Estressado", valor: 0, percentual: 0, emoji: "😰" },
      ]
    }

    const distribution = {
      5: { categoria: "Ótimo", valor: 0, emoji: "😄" },
      4: { categoria: "Bem", valor: 0, emoji: "😊" },
      3: { categoria: "Neutro", valor: 0, emoji: "😐" },
      2: { categoria: "Triste", valor: 0, emoji: "😔" },
      1: { categoria: "Estressado", valor: 0, emoji: "😰" },
    }

    entries.forEach((entry) => {
      const mood = entry.mood || 3
      if (distribution[mood]) {
        distribution[mood].valor++
      }
    })

    const total = entries.length

    return Object.values(distribution).map((item) => ({
      ...item,
      percentual: Math.round((item.valor / total) * 100),
    }))
  }

  // Obter humor por time
  static getHumorByTeam(userIds?: string[]): HumorByTeam[] {
    const entries = this.getFilteredEntries(userIds)

    if (entries.length === 0 || !Array.isArray(mockUsers)) {
      return []
    }

    const teamMap = new Map<string, { total: number; count: number; recent: number[] }>()

    entries.forEach((entry) => {
      const user = mockUsers.find((u) => u.id === entry.userId)
      const team = user?.departamento || "Sem Time"

      if (!teamMap.has(team)) {
        teamMap.set(team, { total: 0, count: 0, recent: [] })
      }

      const teamData = teamMap.get(team)!
      teamData.total += entry.mood || 0
      teamData.count++

      // Guardar últimos 5 registros para calcular tendência
      if (teamData.recent.length < 5) {
        teamData.recent.push(entry.mood || 0)
      }
    })

    return Array.from(teamMap.entries())
      .map(([time, stats]) => {
        const humorMedio = Math.round((stats.total / stats.count) * 10) / 10

        // Calcular tendência
        let tendencia: "alta" | "estavel" | "queda" = "estavel"
        if (stats.recent.length >= 3) {
          const firstHalf = stats.recent.slice(0, Math.floor(stats.recent.length / 2))
          const secondHalf = stats.recent.slice(Math.floor(stats.recent.length / 2))

          const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
          const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

          if (secondAvg > firstAvg + 0.3) tendencia = "alta"
          else if (secondAvg < firstAvg - 0.3) tendencia = "queda"
        }

        return {
          time,
          humorMedio,
          registros: stats.count,
          tendencia,
        }
      })
      .sort((a, b) => b.humorMedio - a.humorMedio)
  }

  // Obter análises por usuário
  static getUserAnalytics(userIds?: string[]): HumorUserAnalytics[] {
    const entries = this.getFilteredEntries(userIds)

    if (entries.length === 0 || !Array.isArray(mockUsers)) {
      return []
    }

    const userMap = new Map<string, HumorEntry[]>()

    entries.forEach((entry) => {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, [])
      }
      userMap.get(entry.userId)!.push(entry)
    })

    return Array.from(userMap.entries())
      .map(([userId, userEntries]) => {
        const user = mockUsers.find((u) => u.id === userId)

        if (!user) {
          return null
        }

        const sortedEntries = userEntries.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )

        const totalMood = sortedEntries.reduce((acc, e) => acc + (e.mood || 0), 0)
        const humorMedio = Math.round((totalMood / sortedEntries.length) * 10) / 10

        const ultimoRegistro = sortedEntries[sortedEntries.length - 1]?.timestamp || ""

        // Calcular tendência
        let tendencia: "alta" | "estavel" | "queda" = "estavel"
        if (sortedEntries.length >= 5) {
          const recent = sortedEntries.slice(-5)
          const firstHalf = recent.slice(0, 2)
          const secondHalf = recent.slice(-2)

          const firstAvg = firstHalf.reduce((a, b) => a + (b.mood || 0), 0) / firstHalf.length
          const secondAvg = secondHalf.reduce((a, b) => a + (b.mood || 0), 0) / secondHalf.length

          if (secondAvg > firstAvg + 0.5) tendencia = "alta"
          else if (secondAvg < firstAvg - 0.5) tendencia = "queda"
        }

        // Calcular dias consecutivos
        let diasConsecutivos = 0
        const today = new Date()
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(checkDate.getDate() - i)
          const dateStr = checkDate.toISOString().split("T")[0]

          const hasEntry = sortedEntries.some((e) => e.timestamp.split("T")[0] === dateStr)
          if (hasEntry) {
            diasConsecutivos++
          } else {
            break
          }
        }

        // Calcular distribuição
        const distribuicao = {
          otiimo: sortedEntries.filter((e) => e.mood === 5).length,
          bem: sortedEntries.filter((e) => e.mood === 4).length,
          neutro: sortedEntries.filter((e) => e.mood === 3).length,
          triste: sortedEntries.filter((e) => e.mood === 2).length,
          estressado: sortedEntries.filter((e) => e.mood === 1).length,
        }

        return {
          userId,
          nome: user.nome,
          time: user.departamento,
          totalRegistros: sortedEntries.length,
          humorMedio,
          ultimoRegistro,
          tendencia,
          diasConsecutivos,
          distribuicao,
        }
      })
      .filter((item): item is HumorUserAnalytics => item !== null)
      .sort((a, b) => b.totalRegistros - a.totalRegistros)
  }
}
