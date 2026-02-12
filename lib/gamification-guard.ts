/**
 * GamificationGuard
 * 
 * Serviço de segurança que garante que apenas COLABORADORES
 * tenham acesso a mecânicas de gamificação (XP, Níveis, Estrelas, Metas).
 * 
 * REGRAS GLOBAIS:
 * - Superadmin: SEM gamificação
 * - Gestor: SEM gamificação
 * - Colaborador: COM gamificação completa
 */

import type { UserRole } from "@/lib/auth-context"

export class GamificationGuard {
  /**
   * Verifica se o usuário pode participar de gamificação
   */
  static canParticipateInGamification(userRole: UserRole): boolean {
    return userRole === "colaborador"
  }

  /**
   * Verifica se XP pode ser atribuído ao usuário
   */
  static canReceiveXP(userRole: UserRole): boolean {
    return this.canParticipateInGamification(userRole)
  }

  /**
   * Verifica se Estrelas podem ser atribuídas ao usuário
   */
  static canReceiveStars(userRole: UserRole): boolean {
    return this.canParticipateInGamification(userRole)
  }

  /**
   * Verifica se o usuário pode ter metas atribuídas
   */
  static canHaveGoals(userRole: UserRole): boolean {
    return this.canParticipateInGamification(userRole)
  }

  /**
   * Verifica se o usuário pode evoluir níveis
   */
  static canLevelUp(userRole: UserRole): boolean {
    return this.canParticipateInGamification(userRole)
  }

  /**
   * Verifica se indicadores de gamificação devem ser exibidos
   */
  static shouldShowGamificationUI(userRole: UserRole): boolean {
    return this.canParticipateInGamification(userRole)
  }

  /**
   * Filtra lista de usuários para retornar apenas colaboradores elegíveis
   */
  static filterEligibleUsers(users: Array<{ role: UserRole; id: string }>): string[] {
    return users.filter((user) => this.canParticipateInGamification(user.role)).map((user) => user.id)
  }

  /**
   * Valida se uma ação que gera recompensa deve ser processada
   */
  static shouldProcessReward(userRole: UserRole): boolean {
    if (!this.canParticipateInGamification(userRole)) {
      console.log(`[GamificationGuard] Recompensa bloqueada para role: ${userRole}`)
      return false
    }
    return true
  }
}
