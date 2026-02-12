// Service para gerenciar configurações de gamificação da plataforma
// Exclusivo para Super Admin calibrar XP, Estrelas, Badges, Níveis e Eventos

export interface NivelConfig {
  nivel: number
  xpNecessario: number
  classificacao: "Iniciante" | "Intermediário" | "Avançado" | "Explorador" | "Mestre" | "Lenda"
}

export interface EventoGanhoConfig {
  evento: string
  label: string
  xp: number
  estrelas: number
  pesoGestor?: number // multiplicador para gestores (1.0 = mesmo peso)
}

export interface BadgeConfig {
  id: string
  nome: string
  descricao: string
  tipo: string
  icone: string
  criterios: { tipo: string; quantidade?: number; periodo?: string }[]
  ativo: boolean
}

export interface GamificationConfig {
  niveis: NivelConfig[]
  eventos: EventoGanhoConfig[]
  versao: string
  ultimaAtualizacao: string
}

class GamificationConfigService {
  private readonly STORAGE_KEY = "engageai-gamification-config"

  // Valores padrão recomendados (NGI / NDE)
  private readonly DEFAULT_CONFIG: GamificationConfig = {
    versao: "1.0.0",
    ultimaAtualizacao: new Date().toISOString(),
    niveis: [
      { nivel: 1, xpNecessario: 0, classificacao: "Iniciante" },
      { nivel: 2, xpNecessario: 100, classificacao: "Iniciante" },
      { nivel: 3, xpNecessario: 250, classificacao: "Iniciante" },
      { nivel: 4, xpNecessario: 500, classificacao: "Intermediário" },
      { nivel: 5, xpNecessario: 850, classificacao: "Intermediário" },
      { nivel: 6, xpNecessario: 1300, classificacao: "Intermediário" },
      { nivel: 7, xpNecessario: 1900, classificacao: "Avançado" },
      { nivel: 8, xpNecessario: 2700, classificacao: "Avançado" },
      { nivel: 9, xpNecessario: 3700, classificacao: "Explorador" },
      { nivel: 10, xpNecessario: 5000, classificacao: "Explorador" },
      { nivel: 11, xpNecessario: 6800, classificacao: "Mestre" },
      { nivel: 12, xpNecessario: 9000, classificacao: "Mestre" },
      { nivel: 13, xpNecessario: 12000, classificacao: "Lenda" },
      { nivel: 14, xpNecessario: 16000, classificacao: "Lenda" },
      { nivel: 15, xpNecessario: 21000, classificacao: "Lenda" },
    ],
    eventos: [
      { evento: "responder_pesquisa", label: "Responder Pesquisa", xp: 10, estrelas: 2, pesoGestor: 1.0 },
      { evento: "concluir_treinamento", label: "Concluir Treinamento", xp: 50, estrelas: 10, pesoGestor: 1.0 },
      { evento: "enviar_feedback", label: "Enviar Feedback", xp: 15, estrelas: 3, pesoGestor: 1.0 },
      { evento: "participar_trilha", label: "Participar de Trilha", xp: 30, estrelas: 5, pesoGestor: 1.0 },
      {
        evento: "concluir_trilha",
        label: "Concluir Trilha Completa",
        xp: 200,
        estrelas: 40,
        pesoGestor: 1.0,
      },
      { evento: "interacao_recorrente", label: "Interação Recorrente (Diária)", xp: 5, estrelas: 1, pesoGestor: 1.0 },
      { evento: "registrar_humor", label: "Registrar Humor do Dia", xp: 5, estrelas: 1, pesoGestor: 1.0 },
      { evento: "publicar_feed", label: "Publicar no Feed Social", xp: 8, estrelas: 2, pesoGestor: 1.0 },
      { evento: "comentar_feed", label: "Comentar no Feed Social", xp: 3, estrelas: 1, pesoGestor: 1.0 },
      { evento: "curtir_feed", label: "Curtir Publicação", xp: 1, estrelas: 0, pesoGestor: 1.0 },
    ],
  }

  getConfig(): GamificationConfig {
    if (typeof window === "undefined") return this.DEFAULT_CONFIG

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (error) {
        console.error("Erro ao carregar configuração de gamificação:", error)
        return this.DEFAULT_CONFIG
      }
    }
    return this.DEFAULT_CONFIG
  }

  saveConfig(config: GamificationConfig): void {
    if (typeof window === "undefined") return

    const updatedConfig = {
      ...config,
      ultimaAtualizacao: new Date().toISOString(),
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedConfig))

    // Emitir evento para atualizar a UI
    window.dispatchEvent(new CustomEvent("gamification-config-updated", { detail: updatedConfig }))
  }

  resetToDefault(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.STORAGE_KEY)
    window.dispatchEvent(new CustomEvent("gamification-config-updated", { detail: this.DEFAULT_CONFIG }))
  }

  // Métodos auxiliares para buscar valores específicos
  getXpForEvent(evento: string, isGestor = false): number {
    const config = this.getConfig()
    const eventoConfig = config.eventos.find((e) => e.evento === evento)
    if (!eventoConfig) return 0

    const baseXp = eventoConfig.xp
    const peso = isGestor && eventoConfig.pesoGestor ? eventoConfig.pesoGestor : 1.0
    return Math.floor(baseXp * peso)
  }

  getEstrelasForEvent(evento: string, isGestor = false): number {
    const config = this.getConfig()
    const eventoConfig = config.eventos.find((e) => e.evento === evento)
    if (!eventoConfig) return 0

    const baseEstrelas = eventoConfig.estrelas
    const peso = isGestor && eventoConfig.pesoGestor ? eventoConfig.pesoGestor : 1.0
    return Math.floor(baseEstrelas * peso)
  }

  getXpForLevel(nivel: number): number {
    const config = this.getConfig()
    const nivelConfig = config.niveis.find((n) => n.nivel === nivel)
    return nivelConfig?.xpNecessario || 0
  }


}

export const GamificationConfigService_Instance = new GamificationConfigService()
