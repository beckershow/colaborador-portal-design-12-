import { EngajamentoService } from "./engajamento-service"

export class EngagementTrackingService {
  private static TRACKING_KEY = "engageai_engagement_tracking"

  // Rastrear acesso à plataforma
  static trackPlatformAccess(userId: string): void {
    const today = new Date().toISOString().split("T")[0]
    const tracking = this.getTracking(userId)

    if (!tracking.dailyAccess.includes(today)) {
      tracking.dailyAccess.push(today)
      tracking.lastAccessDate = today
      this.saveTracking(userId, tracking)

      // Atualizar engajamentos relacionados
      this.updateEngagementsForAction(userId, "acessar_plataforma")
      this.checkConsecutiveAccess(userId)
    }
  }

  // Rastrear conclusão de treinamento
  static trackTrainingCompletion(userId: string, trainingId: string): void {
    const tracking = this.getTracking(userId)

    if (!tracking.completedTrainings.includes(trainingId)) {
      tracking.completedTrainings.push(trainingId)
      this.saveTracking(userId, tracking)

      // Atualizar engajamentos relacionados
      this.updateEngagementsForAction(userId, "completar_treinamento")
    }
  }

  // Rastrear interação no feed
  static trackFeedInteraction(userId: string, type: "post" | "comment" | "like"): void {
    const tracking = this.getTracking(userId)
    const today = new Date().toISOString().split("T")[0]

    tracking.feedInteractions.push({
      type,
      date: today,
    })
    this.saveTracking(userId, tracking)

    // Atualizar engajamentos relacionados
    this.updateEngagementsForAction(userId, "interagir_feed")
  }

  // Rastrear feedback dado
  static trackFeedbackGiven(userId: string, feedbackId: string): void {
    const tracking = this.getTracking(userId)

    if (!tracking.feedbacksGiven.includes(feedbackId)) {
      tracking.feedbacksGiven.push(feedbackId)
      this.saveTracking(userId, tracking)

      // Atualizar engajamentos relacionados
      this.updateEngagementsForAction(userId, "dar_feedback")
    }
  }

  // Rastrear resposta de pesquisa
  static trackSurveyResponse(userId: string, surveyId: string): void {
    const tracking = this.getTracking(userId)

    if (!tracking.surveysAnswered.includes(surveyId)) {
      tracking.surveysAnswered.push(surveyId)
      this.saveTracking(userId, tracking)

      // Atualizar engajamentos relacionados
      this.updateEngagementsForAction(userId, "responder_pesquisa")
    }
  }

  // Rastrear participação em evento
  static trackEventParticipation(userId: string, eventId: string): void {
    const tracking = this.getTracking(userId)

    if (!tracking.eventsParticipated.includes(eventId)) {
      tracking.eventsParticipated.push(eventId)
      this.saveTracking(userId, tracking)

      // Atualizar engajamentos relacionados
      this.updateEngagementsForAction(userId, "participar_evento")
    }
  }

  // Verificar acessos consecutivos
  private static checkConsecutiveAccess(userId: string): void {
    const tracking = this.getTracking(userId)
    const sortedDates = tracking.dailyAccess.sort()

    let consecutiveCount = 1
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1])
      const curr = new Date(sortedDates[i])
      const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        consecutiveCount++
      } else if (diffDays > 1) {
        consecutiveCount = 1
      }
    }

    // Atualizar engajamentos de acesso consecutivo
    const engajamentos = EngajamentoService.getAllEngajamentos()
    engajamentos.forEach((eng) => {
      if (!eng.isActive || !eng.participantsProgress) return

      const progress = eng.participantsProgress.find((p) => p.userId === userId)
      if (!progress || progress.status === "completed" || progress.status === "failed") return

      // Verificar ações de acesso consecutivo
      if (!eng.validationRules?.requiredActions) return

      eng.validationRules.requiredActions.forEach((action) => {
        if (action.type === "acessar_consecutivo" && action.target) {
          if (consecutiveCount >= action.target) {
            EngajamentoService.updateActionProgress(eng.id, userId, action.id, true)
          }
        }
      })
    })
  }

  // Atualizar engajamentos baseado em uma ação
  private static updateEngagementsForAction(userId: string, actionType: string): void {
    const engajamentos = EngajamentoService.getAllEngajamentos()
    const tracking = this.getTracking(userId)

    engajamentos.forEach((eng) => {
      if (!eng.isActive || !eng.participantsProgress || !eng.validationRules?.requiredActions) return

      const progress = eng.participantsProgress.find((p) => p.userId === userId)
      if (!progress || progress.status === "completed" || progress.status === "failed") return

      // Verificar se o usuário faz parte do público-alvo
      if (!eng.publicoAlvo) return

      const isTargeted =
        eng.publicoAlvo.type === "todo_time" ||
        (eng.publicoAlvo.type === "colaboradores_especificos" && eng.publicoAlvo.targetIds?.includes(userId))

      if (!isTargeted) return

      // Processar cada ação obrigatória
      eng.validationRules.requiredActions.forEach((action) => {
        if (action.type === actionType) {
          let shouldComplete = false

          switch (actionType) {
            case "acessar_plataforma":
              shouldComplete = tracking.dailyAccess.length >= (action.target || 1)
              break
            case "completar_treinamento":
              shouldComplete = tracking.completedTrainings.length >= (action.target || 1)
              break
            case "interagir_feed":
              shouldComplete = tracking.feedInteractions.length >= (action.target || 1)
              break
            case "dar_feedback":
              shouldComplete = tracking.feedbacksGiven.length >= (action.target || 1)
              break
            case "responder_pesquisa":
              shouldComplete = tracking.surveysAnswered.length >= (action.target || 1)
              break
            case "participar_evento":
              shouldComplete = tracking.eventsParticipated.length >= (action.target || 1)
              break
          }

          if (shouldComplete) {
            EngajamentoService.updateActionProgress(eng.id, userId, action.id, true)
          }
        }
      })

      // Verificar se o engajamento expirou
      if (eng.endDate) {
        const now = new Date()
        const endDate = new Date(eng.endDate)
        if (now > endDate && progress.status === "in_progress") {
          EngajamentoService.failEngajamento(eng.id, userId, "Prazo expirado")
        }
      }
    })
  }

  // Obter rastreamento do usuário
  private static getTracking(userId: string): UserTracking {
    if (typeof window === "undefined") {
      return this.getEmptyTracking()
    }

    const allTracking = localStorage.getItem(this.TRACKING_KEY)
    const trackingData = allTracking ? JSON.parse(allTracking) : {}

    return (
      trackingData[userId] || {
        userId,
        dailyAccess: [],
        lastAccessDate: null,
        completedTrainings: [],
        feedInteractions: [],
        feedbacksGiven: [],
        surveysAnswered: [],
        eventsParticipated: [],
      }
    )
  }

  // Salvar rastreamento do usuário
  private static saveTracking(userId: string, tracking: UserTracking): void {
    if (typeof window === "undefined") return

    const allTracking = localStorage.getItem(this.TRACKING_KEY)
    const trackingData = allTracking ? JSON.parse(allTracking) : {}

    trackingData[userId] = tracking
    localStorage.setItem(this.TRACKING_KEY, JSON.stringify(trackingData))
  }

  // Obter rastreamento vazio
  private static getEmptyTracking(): UserTracking {
    return {
      userId: "",
      dailyAccess: [],
      lastAccessDate: null,
      completedTrainings: [],
      feedInteractions: [],
      feedbacksGiven: [],
      surveysAnswered: [],
      eventsParticipated: [],
    }
  }

  // Inicializar engajamento automaticamente para usuários no público-alvo
  static initializeEngagementsForUser(userId: string): void {
    const engajamentos = EngajamentoService.getAllEngajamentos()

    engajamentos.forEach((eng) => {
      if (!eng.isActive || !eng.publicoAlvo) return

      const isTargeted =
        eng.publicoAlvo.type === "todo_time" ||
        (eng.publicoAlvo.type === "colaboradores_especificos" && eng.publicoAlvo.targetIds?.includes(userId))

      if (isTargeted && !EngajamentoService.hasStarted(eng.id, userId)) {
        // Iniciar automaticamente engajamentos para usuários no público-alvo
        EngajamentoService.startEngajamento(eng.id, userId)
      }
    })
  }
}

interface UserTracking {
  userId: string
  dailyAccess: string[] // Array de datas "YYYY-MM-DD"
  lastAccessDate: string | null
  completedTrainings: string[]
  feedInteractions: Array<{ type: string; date: string }>
  feedbacksGiven: string[]
  surveysAnswered: string[]
  eventsParticipated: string[]
}
