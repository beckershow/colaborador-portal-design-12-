"use client"

export interface HumorOption {
  id: string
  nome: string
  emoji: string
  cor: string
  ordem: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export interface HumorConfig {
  id: string
  ativo: boolean
  obrigatorio: boolean
  bloquearAcesso: boolean
  permitePular: boolean
  frequencia: "diaria" | "semanal" | "personalizada"
  diasSemana: number[] // 0=domingo, 6=sábado
  dataInicio: string | null
  dataFim: string | null
  apresentacao: "modal" | "card" | "notificacao"
  momentoExibicao: "primeiro-acesso" | "horario-especifico" | "apos-login"
  horarioEspecifico: string | null
  rewardsEnabled: boolean // Habilitar ganhos no Humor do Dia
  rewardsXp: number // XP por registro de humor
  rewardsStars: number // Estrelas por registro de humor
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface HumorSchedule {
  id: string
  data: string
  ativo: boolean
  configuracaoId: string
}

const STORAGE_KEY_CONFIG = "engageai-humor-config"
const STORAGE_KEY_OPTIONS = "engageai-humor-options"
const STORAGE_KEY_SCHEDULE = "engageai-humor-schedule"

export class HumorConfigService {
  // Configuração padrão inicial
  private static getDefaultConfig(): HumorConfig {
    return {
      id: "config-1",
      ativo: true,
      obrigatorio: false,
      bloquearAcesso: false,
      permitePular: true,
      frequencia: "diaria",
      diasSemana: [1, 2, 3, 4, 5], // Segunda a sexta
      dataInicio: null,
      dataFim: null,
      apresentacao: "modal",
      momentoExibicao: "primeiro-acesso",
      horarioEspecifico: null,
      rewardsEnabled: false, // Desabilitado por padrão
      rewardsXp: 5,
      rewardsStars: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
    }
  }

  // Opções de humor padrão
  private static getDefaultOptions(): HumorOption[] {
    return [
      {
        id: "humor-1",
        nome: "Ótimo",
        emoji: "😄",
        cor: "#22c55e",
        ordem: 1,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "humor-2",
        nome: "Bem",
        emoji: "😊",
        cor: "#3b82f6",
        ordem: 2,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "humor-3",
        nome: "Neutro",
        emoji: "😐",
        cor: "#6b7280",
        ordem: 3,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "humor-4",
        nome: "Triste",
        emoji: "😔",
        cor: "#f59e0b",
        ordem: 4,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "humor-5",
        nome: "Estressado",
        emoji: "😰",
        cor: "#ef4444",
        ordem: 5,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]
  }

  // Obter configuração atual
  static getConfig(): HumorConfig {
    if (typeof window === "undefined") return this.getDefaultConfig()

    const stored = localStorage.getItem(STORAGE_KEY_CONFIG)
    if (!stored) {
      const defaultConfig = this.getDefaultConfig()
      this.saveConfig(defaultConfig)
      return defaultConfig
    }

    return JSON.parse(stored)
  }

  // Salvar configuração
  static saveConfig(config: HumorConfig): void {
    if (typeof window === "undefined") return

    config.updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config))
  }

  // Obter todas as opções de humor
  static getOptions(): HumorOption[] {
    if (typeof window === "undefined") return this.getDefaultOptions()

    const stored = localStorage.getItem(STORAGE_KEY_OPTIONS)
    if (!stored) {
      const defaultOptions = this.getDefaultOptions()
      this.saveOptions(defaultOptions)
      return defaultOptions
    }

    return JSON.parse(stored)
  }

  // Obter apenas opções ativas
  static getActiveOptions(): HumorOption[] {
    return this.getOptions()
      .filter((opt) => opt.ativo)
      .sort((a, b) => a.ordem - b.ordem)
  }

  // Salvar opções
  static saveOptions(options: HumorOption[]): void {
    if (typeof window === "undefined") return

    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(options))
  }

  // Criar nova opção
  static createOption(option: Omit<HumorOption, "id" | "createdAt" | "updatedAt">): HumorOption {
    const options = this.getOptions()
    const newOption: HumorOption = {
      ...option,
      id: `humor-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    options.push(newOption)
    this.saveOptions(options)
    return newOption
  }

  // Atualizar opção
  static updateOption(id: string, updates: Partial<HumorOption>): HumorOption | null {
    const options = this.getOptions()
    const index = options.findIndex((opt) => opt.id === id)

    if (index === -1) return null

    options[index] = {
      ...options[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.saveOptions(options)
    return options[index]
  }

  // Deletar opção
  static deleteOption(id: string): boolean {
    const options = this.getOptions()
    const filtered = options.filter((opt) => opt.id !== id)

    if (filtered.length === options.length) return false

    this.saveOptions(filtered)
    return true
  }

  // Validar configuração
  static validateConfig(config: Partial<HumorConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Se está ativo, deve ter pelo menos um humor ativo
    if (config.ativo) {
      const activeOptions = this.getActiveOptions()
      if (activeOptions.length === 0) {
        errors.push("Deve haver pelo menos uma opção de humor ativa")
      }
    }

    // Se tem data de início e fim, validar
    if (config.dataInicio && config.dataFim) {
      const inicio = new Date(config.dataInicio)
      const fim = new Date(config.dataFim)

      if (fim <= inicio) {
        errors.push("Data de fim deve ser posterior à data de início")
      }
    }

    // Se é frequência semanal, deve ter dias selecionados
    if (config.frequencia === "semanal" && (!config.diasSemana || config.diasSemana.length === 0)) {
      errors.push("Selecione pelo menos um dia da semana")
    }

    // Se momento é horário específico, deve ter horário
    if (config.momentoExibicao === "horario-especifico" && !config.horarioEspecifico) {
      errors.push("Defina um horário específico")
    }

    // Se é obrigatório e bloqueia acesso, não pode permitir pular
    if (config.obrigatorio && config.bloquearAcesso && config.permitePular) {
      errors.push("Não pode permitir pular se bloqueia o acesso")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  // Obter cronograma (próximos 30 dias)
  static getSchedule(): HumorSchedule[] {
    const config = this.getConfig()
    const schedule: HumorSchedule[] = []

    if (!config.ativo) return schedule

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    for (let i = 0; i < 30; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() + i)

      let ativo = false

      // Verificar se está no período
      if (config.dataInicio && config.dataFim) {
        const inicio = new Date(config.dataInicio)
        const fim = new Date(config.dataFim)
        ativo = data >= inicio && data <= fim
      } else if (config.dataInicio) {
        const inicio = new Date(config.dataInicio)
        ativo = data >= inicio
      } else if (config.dataFim) {
        const fim = new Date(config.dataFim)
        ativo = data <= fim
      } else {
        ativo = true
      }

      // Verificar frequência
      if (ativo) {
        if (config.frequencia === "semanal") {
          const diaSemana = data.getDay()
          ativo = config.diasSemana.includes(diaSemana)
        }
        // Se é diária, já está ativo
      }

      schedule.push({
        id: `schedule-${i}`,
        data: data.toISOString(),
        ativo,
        configuracaoId: config.id,
      })
    }

    return schedule
  }

  // Obter próxima data de exibição
  static getNextExhibitionDate(): Date | null {
    const schedule = this.getSchedule()
    const proxima = schedule.find((s) => s.ativo)

    return proxima ? new Date(proxima.data) : null
  }

  // Estatísticas da configuração
  static getConfigStats() {
    const config = this.getConfig()
    const options = this.getOptions()
    const activeOptions = this.getActiveOptions()
    const schedule = this.getSchedule()
    const activeScheduleDays = schedule.filter((s) => s.ativo).length

    return {
      ativo: config.ativo,
      obrigatorio: config.obrigatorio,
      totalOptions: options.length,
      activeOptions: activeOptions.length,
      proximaExibicao: this.getNextExhibitionDate(),
      diasAtivosProximos30: activeScheduleDays,
      frequencia: config.frequencia,
    }
  }
}
