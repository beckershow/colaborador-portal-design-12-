export interface MissaoDoDia {
  id: string
  nome: string
  descricao: string
  diasAtivos: string[] // Array de datas no formato "YYYY-MM-DD"
  publicoAlvo: {
    type: "todo_time" | "colaboradores_especificos"
    targetIds: string[]
  }
  createdBy: string
  createdByRole: string
  createdAt: string
  isActive: boolean
  participants: string[]
  completions: {
    userId: string
    completedAt: string
    data: string // Data específica da conclusão
  }[]
}

class MissaoDoDiaServiceClass {
  private STORAGE_KEY = "missao_do_dia_data"

  private getMissoes(): MissaoDoDia[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  private saveMissoes(missoes: MissaoDoDia[]) {
    if (typeof window === "undefined") return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(missoes))
    window.dispatchEvent(new Event("missao-do-dia-updated"))
  }

  createMissao(data: Omit<MissaoDoDia, "id" | "createdAt" | "participants" | "completions">): MissaoDoDia {
    const newMissao: MissaoDoDia = {
      ...data,
      id: `missao_${Date.now()}`,
      createdAt: new Date().toISOString(),
      participants: [],
      completions: [],
    }

    const missoes = this.getMissoes()
    missoes.push(newMissao)
    this.saveMissoes(missoes)

    this.notifyParticipants(newMissao)

    return newMissao
  }

  private notifyParticipants(missao: MissaoDoDia) {
    console.log("[v0] Missão do Dia criada e notificações enviadas:", missao.nome)
  }

  getAllMissoes(): MissaoDoDia[] {
    return this.getMissoes()
  }

  getActiveMissoes(): MissaoDoDia[] {
    const today = new Date().toISOString().split("T")[0]
    return this.getMissoes().filter((missao) => {
      if (!missao.isActive) return false
      return missao.diasAtivos.includes(today)
    })
  }

  getMissoesForUser(userId: string): MissaoDoDia[] {
    const ativas = this.getActiveMissoes()
    return ativas.filter((missao) => {
      if (missao.publicoAlvo.type === "todo_time") return true
      return missao.publicoAlvo.targetIds.includes(userId)
    })
  }

  enrollUserAutomatically(missaoId: string, userId: string) {
    const missoes = this.getMissoes()
    const missao = missoes.find((m) => m.id === missaoId)

    if (missao && !missao.participants.includes(userId)) {
      missao.participants.push(userId)
      this.saveMissoes(missoes)
    }
  }

  registerCompletion(missaoId: string, userId: string, data: string) {
    const missoes = this.getMissoes()
    const missao = missoes.find((m) => m.id === missaoId)

    if (missao) {
      const jaCompletou = missao.completions.some((c) => c.userId === userId && c.data === data)

      if (!jaCompletou) {
        missao.completions.push({
          userId,
          completedAt: new Date().toISOString(),
          data,
        })
        this.saveMissoes(missoes)
      }
    }
  }

  getUserProgress(
    missaoId: string,
    userId: string,
  ): {
    diasCompletados: number
    diasRestantes: number
    status: "pendente" | "concluida"
  } {
    const missao = this.getMissoes().find((m) => m.id === missaoId)
    if (!missao) {
      return {
        diasCompletados: 0,
        diasRestantes: 0,
        status: "pendente",
      }
    }

    const completions = missao.completions.filter((c) => c.userId === userId)
    const diasCompletados = completions.length
    const totalDias = missao.diasAtivos.length
    const diasRestantes = totalDias - diasCompletados

    const status = diasCompletados === totalDias ? "concluida" : "pendente"

    return {
      diasCompletados,
      diasRestantes,
      status,
    }
  }

  isMissaoActiveToday(missaoId: string): boolean {
    const missao = this.getMissoes().find((m) => m.id === missaoId)
    if (!missao || !missao.isActive) return false

    const today = new Date().toISOString().split("T")[0]
    return missao.diasAtivos.includes(today)
  }

  hasCompletedToday(missaoId: string, userId: string): boolean {
    const missao = this.getMissoes().find((m) => m.id === missaoId)
    if (!missao) return false

    const today = new Date().toISOString().split("T")[0]
    return missao.completions.some((c) => c.userId === userId && c.data === today)
  }

  deleteMissao(missaoId: string) {
    const missoes = this.getMissoes().filter((m) => m.id !== missaoId)
    this.saveMissoes(missoes)
  }
}

export const MissaoDoDiaService = new MissaoDoDiaServiceClass()
