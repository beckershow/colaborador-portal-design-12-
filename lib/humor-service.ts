"use client"

export interface HumorEntry {
  id: string
  userId: string
  date: string
  mood: number
  emoji: string
  label: string
  timestamp: string
}

export interface HumorStats {
  totalDays: number
  positiveRate: number
  currentStreak: number
  daysThisMonth: Record<number, number>
}

// Simulação de backend - em produção, virá de API
const STORAGE_KEY = "engageai-humor-entries"
const LAST_CHECK_KEY = "engageai-last-humor-check"

export class HumorService {
  static getMoodData(moodValue: number): { emoji: string; label: string; color: string } {
    const moods: Record<number, { emoji: string; label: string; color: string }> = {
      5: { emoji: "😄", label: "Ótimo", color: "primary" },
      4: { emoji: "😊", label: "Bem", color: "chart-1" },
      3: { emoji: "😐", label: "Neutro", color: "muted" },
      2: { emoji: "😔", label: "Triste", color: "chart-3" },
      1: { emoji: "😰", label: "Estressado", color: "destructive" },
    }
    return moods[moodValue] || moods[3]
  }

  static getAllMoodRecords(): HumorEntry[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const entries: HumorEntry[] = JSON.parse(stored)
        if (entries.length > 50) return entries // Já tem dados suficientes
      } catch {}
    }

    // Gerar dados mock para demonstração
    const mockEntries: HumorEntry[] = []
    const today = new Date()
    const userIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

    for (let i = 0; i < 90; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // 60-80% dos usuários registram humor por dia
      const activeUsers = Math.floor(userIds.length * (0.6 + Math.random() * 0.2))

      for (let j = 0; j < activeUsers; j++) {
        const userId = userIds[j]
        // Distribuição realista: 40% positivo, 35% neutro, 25% negativo
        let mood: number
        const rand = Math.random()
        if (rand < 0.4)
          mood = Math.random() < 0.5 ? 5 : 4 // Positivo
        else if (rand < 0.75)
          mood = 3 // Neutro
        else mood = Math.random() < 0.5 ? 2 : 1 // Negativo

        const moodData = this.getMoodData(mood)
        mockEntries.push({
          id: `${userId}-${date.getTime()}`,
          userId,
          date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          mood,
          emoji: moodData.emoji,
          label: moodData.label,
          timestamp: date.toISOString(),
        })
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockEntries))
    return mockEntries
  }

  static getUserMoodHistory(userId: string, days = 30): HumorEntry[] {
    const entries = this.getUserEntries(userId)

    // Filter entries from the last N days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return entries
      .filter((entry) => {
        const entryDate = new Date(entry.timestamp)
        return entryDate >= cutoffDate
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  static hasRegisteredToday(userId: string): boolean {
    const lastCheck = localStorage.getItem(`${LAST_CHECK_KEY}-${userId}`)
    if (!lastCheck) return false

    const today = new Date().toDateString()
    return lastCheck === today
  }

  static registerMood(userId: string, mood: number): HumorEntry {
    const moodData = this.getMoodData(mood)
    const today = new Date()

    const entry: HumorEntry = {
      id: `${userId}-${Date.now()}`,
      userId,
      date: today.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      mood,
      emoji: moodData.emoji,
      label: moodData.label,
      timestamp: today.toISOString(),
    }

    // Salvar no localStorage
    const entries = this.getUserEntries(userId)
    entries.push(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

    // Marcar como registrado hoje
    localStorage.setItem(`${LAST_CHECK_KEY}-${userId}`, today.toDateString())

    return entry
  }

  static getUserEntries(userId: string): HumorEntry[] {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const allEntries: HumorEntry[] = JSON.parse(stored)
    return allEntries.filter((entry) => entry.userId === userId)
  }

  static getLast14Days(userId: string): HumorEntry[] {
    const entries = this.getUserEntries(userId)
    return entries.slice(-14)
  }

  static getStats(userId: string): HumorStats {
    const entries = this.getUserEntries(userId)

    // Total de dias registrados
    const totalDays = entries.length

    // Taxa positiva (humor >= 4)
    const positiveDays = entries.filter((e) => e.mood >= 4).length
    const positiveRate = totalDays > 0 ? Math.round((positiveDays / totalDays) * 100) : 0

    // Sequência atual
    let currentStreak = 0
    const today = new Date()
    const checkDate = new Date(today)

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toDateString()
      const hasEntry = entries.some((e) => new Date(e.timestamp).toDateString() === dateStr)

      if (hasEntry) {
        currentStreak++
      } else {
        break
      }

      checkDate.setDate(checkDate.getDate() - 1)
    }

    // Dias este mês por humor
    const thisMonth = today.getMonth()
    const thisYear = today.getFullYear()
    const daysThisMonth: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

    entries.forEach((entry) => {
      const entryDate = new Date(entry.timestamp)
      if (entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear) {
        daysThisMonth[entry.mood] = (daysThisMonth[entry.mood] || 0) + 1
      }
    })

    return {
      totalDays,
      positiveRate,
      currentStreak,
      daysThisMonth,
    }
  }

  static getNextCheckTime(userId: string): Date | null {
    const lastCheck = localStorage.getItem(`${LAST_CHECK_KEY}-${userId}`)
    if (!lastCheck) return null

    const nextCheck = new Date(lastCheck)
    nextCheck.setDate(nextCheck.getDate() + 1)
    nextCheck.setHours(0, 0, 0, 0)

    return nextCheck
  }

  static getTimeUntilNextCheck(userId: string): string {
    const nextCheck = this.getNextCheckTime(userId)
    if (!nextCheck) return ""

    const now = new Date()
    const diff = nextCheck.getTime() - now.getTime()

    if (diff <= 0) return "disponível agora"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours >= 24) {
      return "amanhã às 00:00"
    }

    return `${hours}h ${minutes}m`
  }
}
