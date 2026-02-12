import { GamificationGuard } from "@/lib/gamification-guard"
import type { UserRole } from "@/lib/auth-context"

export type EngajamentoType = "missao" | "desafio" | "campanha"
export type CompletionMethod = "automatico" | "gestor" | "sistema_auditoria"
export type ValidationStatus = "pending" | "in_progress" | "completed" | "failed"
export type EngajamentoStatus = "nao_iniciado" | "em_andamento" | "concluido" | "atrasado" | "ignorado"

export interface RequiredAction {
  id: string
  type:
    | "acessar_plataforma"
    | "acessar_consecutivo"
    | "completar_treinamento"
    | "interagir_feed"
    | "dar_feedback"
    | "responder_pesquisa"
    | "participar_evento"
  description: string
  target?: number // quantidade ou frequência necessária
  completed: boolean
  progress: number // 0-100
}

export interface ValidationRules {
  minActions?: number // quantidade mínima de ações
  frequency?: "diaria" | "semanal" | "mensal"
  deadline?: string // prazo final
  consecutive?: boolean // precisa ser consecutivo
  requiredActions: RequiredAction[]
}

export interface PublicoAlvo {
  type: "todo_time" | "grupos_especificos" | "colaboradores_especificos"
  targetIds: string[] // IDs dos colaboradores ou grupos
}

export interface ParticipantProgress {
  userId: string
  startedAt: string
  lastActivityAt: string
  completedActions: string[] // IDs das ações completadas
  status: ValidationStatus
  engagementStatus: EngajamentoStatus
  failureReason?: string
  completedAt?: string
  progressPercentage: number
}

export interface SystemBehavior {
  autoEnrollment: boolean // Inscrição automática do público-alvo
  mandatoryDirection: boolean // Direcionamento obrigatório ao iniciar
  continuousMonitoring: boolean // Monitoramento contínuo
  cannotBeIgnored: boolean // Engajamento não pode ser ignorado
  automaticNotifications: boolean // Notificações automáticas
  escalateToManager: boolean // Escalonamento para gestor em atraso
}

export interface Engajamento {
  id: string
  title: string
  description: string
  type: EngajamentoType
  objective: string // NOVO: qual comportamento o colaborador deve executar
  rewardXP: number
  rewardStars: number
  startDate?: string
  endDate?: string
  isActive: boolean

  // NOVO: Público-alvo
  publicoAlvo: PublicoAlvo

  // NOVO: Validação e regras
  completionMethod: CompletionMethod
  validationRules: ValidationRules

  // NOVO: Monitoramento de participantes
  participantsProgress: ParticipantProgress[]

  systemBehavior: SystemBehavior

  // Campos legados mantidos para compatibilidade
  participants: string[]
  completedBy: string[]

  createdBy: string
  createdByRole: string // Papel do criador (gestor, super-admin)
  createdAt: string
}

export class EngajamentoService {
  private static STORAGE_KEY = "engageai_engajamentos"

  static getAllEngajamentos(): Engajamento[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : this.getDefaultEngajamentos()
  }

  static getDefaultEngajamentos(): Engajamento[] {
    return [
      {
        id: "eng1",
        title: "Missão: Complete seu Perfil",
        description: "Atualize todas as informações do seu perfil profissional",
        type: "missao",
        objective: "Completar 100% do perfil profissional na plataforma",
        rewardXP: 50,
        rewardStars: 15,
        isActive: true,
        publicoAlvo: {
          type: "todo_time",
          targetIds: [],
        },
        completionMethod: "automatico",
        validationRules: {
          minActions: 1,
          requiredActions: [
            {
              id: "action1",
              type: "completar_treinamento",
              description: "Atualizar foto de perfil",
              completed: false,
              progress: 0,
            },
          ],
        },
        systemBehavior: {
          autoEnrollment: true,
          mandatoryDirection: true,
          continuousMonitoring: true,
          cannotBeIgnored: true,
          automaticNotifications: true,
          escalateToManager: false,
        },
        participantsProgress: [],
        participants: [],
        completedBy: [],
        createdBy: "Sistema",
        createdByRole: "super-admin",
        createdAt: new Date().toISOString(),
      },
      {
        id: "eng2",
        title: "Desafio: 7 Dias de Engajamento",
        description: "Registre seu humor por 7 dias consecutivos",
        type: "desafio",
        objective: "Acessar a plataforma diariamente por 7 dias consecutivos",
        rewardXP: 150,
        rewardStars: 50,
        isActive: true,
        publicoAlvo: {
          type: "todo_time",
          targetIds: [],
        },
        completionMethod: "automatico",
        validationRules: {
          minActions: 7,
          frequency: "diaria",
          consecutive: true,
          requiredActions: [
            {
              id: "action1",
              type: "acessar_consecutivo",
              description: "Acessar a plataforma por 7 dias seguidos",
              target: 7,
              completed: false,
              progress: 0,
            },
          ],
        },
        systemBehavior: {
          autoEnrollment: true,
          mandatoryDirection: false,
          continuousMonitoring: true,
          cannotBeIgnored: false,
          automaticNotifications: true,
          escalateToManager: true,
        },
        participantsProgress: [],
        participants: [],
        completedBy: [],
        createdBy: "Sistema",
        createdByRole: "super-admin",
        createdAt: new Date().toISOString(),
      },
    ]
  }

  static createEngajamento(
    data: Omit<Engajamento, "id" | "createdAt" | "participants" | "completedBy" | "participantsProgress">,
  ): Engajamento {
    const engajamentos = this.getAllEngajamentos()
    const newEngajamento: Engajamento = {
      ...data,
      id: `eng${Date.now()}`,
      participants: [],
      completedBy: [],
      participantsProgress: [],
      createdAt: new Date().toISOString(),
    }
    engajamentos.push(newEngajamento)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))

    if (newEngajamento.systemBehavior.autoEnrollment) {
      this.autoEnrollParticipants(newEngajamento.id, newEngajamento.publicoAlvo)
    }

    window.dispatchEvent(new Event("engajamentosUpdated"))
    return newEngajamento
  }

  static autoEnrollParticipants(engajamentoId: string, publicoAlvo: PublicoAlvo): void {
    const engajamentos = this.getAllEngajamentos()
    const engajamento = engajamentos.find((e) => e.id === engajamentoId)
    if (!engajamento) return

    if (!engajamento.participantsProgress) {
      engajamento.participantsProgress = []
    }

    let targetUserIds: string[] = []

    if (publicoAlvo.type === "todo_time") {
      const allUsers = JSON.parse(localStorage.getItem("engageai_users") || "[]")
      // GAMIFICATION GUARD: Apenas colaboradores podem participar de engajamentos
      targetUserIds = allUsers
        .filter((u: any) => GamificationGuard.canParticipateInGamification(u.role as UserRole))
        .map((u: any) => u.id)
    } else if (publicoAlvo.type === "colaboradores_especificos") {
      const allUsers = JSON.parse(localStorage.getItem("engageai_users") || "[]")
      // GAMIFICATION GUARD: Filtrar apenas colaboradores elegíveis
      targetUserIds = publicoAlvo.targetIds.filter((userId) => {
        const user = allUsers.find((u: any) => u.id === userId)
        return user && GamificationGuard.canParticipateInGamification(user.role as UserRole)
      })
    }

    targetUserIds.forEach((userId) => {
      const existing = engajamento.participantsProgress!.find((p) => p.userId === userId)
      if (!existing) {
        engajamento.participantsProgress!.push({
          userId,
          status: "in_progress",
          engagementStatus: "em_andamento",
          progressPercentage: 0,
          completedActions: [],
          startedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
        })
      }
    })

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
    window.dispatchEvent(new Event("engajamentosUpdated"))
  }

  static getEngajamentoById(id: string): Engajamento | undefined {
    return this.getAllEngajamentos().find((e) => e.id === id)
  }

  static startEngajamento(engajamentoId: string, userId: string): void {
    // GAMIFICATION GUARD: Verificar role do usuário
    const allUsers = JSON.parse(localStorage.getItem("engageai_users") || "[]")
    const user = allUsers.find((u: any) => u.id === userId)
    if (!user || !GamificationGuard.canParticipateInGamification(user.role as UserRole)) {
      console.log("[EngajamentoService] Usuário não elegível para engajamentos:", user?.role)
      return
    }

    const engajamentos = this.getAllEngajamentos()
    const engajamento = engajamentos.find((e) => e.id === engajamentoId)
    if (!engajamento) return

    if (!engajamento.participantsProgress) {
      engajamento.participantsProgress = []
    }

    const existing = engajamento.participantsProgress.find((p) => p.userId === userId)
    if (existing) {
      if (existing.engagementStatus === "nao_iniciado") {
        existing.engagementStatus = "em_andamento"
        existing.lastActivityAt = new Date().toISOString()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
      window.dispatchEvent(new Event("engajamentosUpdated"))
      return
    }

    engajamento.participantsProgress.push({
      userId,
      status: "in_progress",
      engagementStatus: "em_andamento",
      progressPercentage: 0,
      completedActions: [],
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    })

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
    window.dispatchEvent(new Event("engajamentosUpdated"))
  }

  static validateCompletion(engajamentoId: string, userId: string): boolean {
    const engajamento = this.getEngajamentoById(engajamentoId)
    if (!engajamento) return false

    const progress = engajamento.participantsProgress.find((p) => p.userId === userId)
    if (!progress) return false

    const allActionsCompleted = engajamento.validationRules.requiredActions.every((action) =>
      progress.completedActions.includes(action.id),
    )

    return allActionsCompleted
  }

  static updateActionProgress(engajamentoId: string, userId: string, actionId: string, completed: boolean): void {
    // GAMIFICATION GUARD: Verificar role do usuário
    const allUsers = JSON.parse(localStorage.getItem("engageai_users") || "[]")
    const user = allUsers.find((u: any) => u.id === userId)
    if (!user || !GamificationGuard.canParticipateInGamification(user.role as UserRole)) {
      console.log("[EngajamentoService] Atualização de progresso bloqueada para role:", user?.role)
      return
    }

    const engajamentos = this.getAllEngajamentos()
    const engajamento = engajamentos.find((e) => e.id === engajamentoId)
    if (!engajamento) return

    if (!engajamento.participantsProgress) {
      engajamento.participantsProgress = []
    }

    let progress = engajamento.participantsProgress.find((p) => p.userId === userId)

    if (!progress) {
      progress = {
        userId,
        status: "in_progress",
        engagementStatus: "em_andamento",
        progressPercentage: 0,
        completedActions: [],
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      }
      engajamento.participantsProgress.push(progress)
    }

    if (completed && !progress.completedActions.includes(actionId)) {
      progress.completedActions.push(actionId)
    } else if (!completed && progress.completedActions.includes(actionId)) {
      progress.completedActions = progress.completedActions.filter((id) => id !== actionId)
    }

    const totalActions = engajamento.validationRules.requiredActions.length
    progress.progressPercentage = Math.round((progress.completedActions.length / totalActions) * 100)

    if (progress.progressPercentage === 100 && progress.status === "in_progress") {
      this.completeEngajamento(engajamentoId, userId)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
    window.dispatchEvent(new Event("engajamentosUpdated"))
  }

  static completeEngajamento(engajamentoId: string, userId: string): void {
    const engajamentos = this.getAllEngajamentos()
    const engajamento = engajamentos.find((e) => e.id === engajamentoId)
    if (!engajamento) return

    if (!engajamento.participantsProgress) {
      engajamento.participantsProgress = []
    }

    const progress = engajamento.participantsProgress.find((p) => p.userId === userId)
    if (!progress) return

    progress.status = "completed"
    progress.engagementStatus = "concluido"
    progress.completedAt = new Date().toISOString()
    progress.progressPercentage = 100

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
    window.dispatchEvent(new Event("engajamentosUpdated"))
  }

  static failEngajamento(engajamentoId: string, userId: string, reason: string): void {
    const engajamentos = this.getAllEngajamentos()
    const engajamento = engajamentos.find((e) => e.id === engajamentoId)
    if (!engajamento) return

    if (!engajamento.participantsProgress) {
      engajamento.participantsProgress = []
    }

    const progress = engajamento.participantsProgress.find((p) => p.userId === userId)
    if (!progress) return

    progress.status = "failed"
    progress.engagementStatus = "atrasado"
    progress.failureReason = reason
    progress.completedAt = new Date().toISOString()

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
    window.dispatchEvent(new Event("engajamentosUpdated"))
  }

  static markAsIgnored(engajamentoId: string, userId: string): void {
    const engajamentos = this.getAllEngajamentos()
    const engajamento = engajamentos.find((e) => e.id === engajamentoId)
    if (!engajamento) return

    if (!engajamento.participantsProgress) {
      engajamento.participantsProgress = []
    }

    const progress = engajamento.participantsProgress.find((p) => p.userId === userId)
    if (!progress) return

    progress.engagementStatus = "ignorado"
    progress.lastActivityAt = new Date().toISOString()

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
    window.dispatchEvent(new Event("engajamentosUpdated"))
  }

  static getEngagementStatus(engajamentoId: string, userId: string): EngajamentoStatus {
    const progress = this.getParticipantProgress(engajamentoId, userId)
    if (!progress) return "nao_iniciado"
    return progress.engagementStatus
  }

  static updateStatusBasedOnDeadline(): void {
    const engajamentos = this.getAllEngajamentos()
    const now = new Date()

    engajamentos.forEach((engajamento) => {
      if (!engajamento.endDate || !engajamento.participantsProgress) return

      const deadline = new Date(engajamento.endDate)
      if (now > deadline) {
        engajamento.participantsProgress.forEach((progress) => {
          if (progress.engagementStatus === "em_andamento") {
            progress.engagementStatus = "atrasado"
          }
        })
      }
    })

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
  }

  static hasStarted(engajamentoId: string, userId: string): boolean {
    const engajamento = this.getEngajamentoById(engajamentoId)
    if (!engajamento || !engajamento.participantsProgress) return false
    return engajamento.participantsProgress.some((p) => p.userId === userId)
  }

  static hasCompleted(engajamentoId: string, userId: string): boolean {
    const progress = this.getParticipantProgress(engajamentoId, userId)
    return progress?.status === "completed" || false
  }

  static getParticipantProgress(engajamentoId: string, userId: string): ParticipantProgress | undefined {
    const engajamento = this.getEngajamentoById(engajamentoId)
    if (!engajamento || !engajamento.participantsProgress) return undefined
    return engajamento.participantsProgress.find((p) => p.userId === userId)
  }

  static getEngajamentosByGestor(gestorId: string): Engajamento[] {
    return this.getAllEngajamentos().filter((e) => e.createdBy === gestorId)
  }

  static getParticipantsByEngajamento(engajamentoId: string): ParticipantProgress[] {
    const engajamento = this.getEngajamentoById(engajamentoId)
    return engajamento?.participantsProgress || []
  }

  static updateEngajamento(
    id: string,
    data: Partial<Omit<Engajamento, "id" | "createdAt" | "createdBy" | "createdByRole">>,
  ): Engajamento | null {
    const engajamentos = this.getAllEngajamentos()
    const index = engajamentos.findIndex((e) => e.id === id)

    if (index === -1) return null

    const existingEngajamento = engajamentos[index]
    const updatedEngajamento: Engajamento = {
      ...existingEngajamento,
      ...data,
      id: existingEngajamento.id,
      createdAt: existingEngajamento.createdAt,
      createdBy: existingEngajamento.createdBy,
      createdByRole: existingEngajamento.createdByRole,
    }

    engajamentos[index] = updatedEngajamento
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(engajamentos))
    window.dispatchEvent(new Event("engajamentosUpdated"))

    return updatedEngajamento
  }
}
