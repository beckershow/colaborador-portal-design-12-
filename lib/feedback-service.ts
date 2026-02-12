"use client"

export interface FeedbackSettings {
  allowAnyUser: boolean
  allowedRecipients: string[] // IDs dos usuários permitidos
  allowPublic: boolean
  allowPrivate: boolean
  allowAnonymous: boolean
  limitPerDay: number
  limitPerWeek: number
  requireApproval: boolean
  feedbackTypes: string[]
}

export interface Feedback {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  type: string
  message: string
  isPublic: boolean
  isAnonymous: boolean
  status: "pending" | "approved" | "rejected" | "sent"
  createdAt: string
  viewedAt?: string
}

export interface FeedbackRequest {
  id: string
  fromUserId: string
  fromUserName: string
  toUserId: string
  toUserName: string
  topic: string
  message?: string
  status: "pending" | "completed"
  createdAt: string
}

const SETTINGS_KEY = "engageai-feedback-settings"
const FEEDBACKS_KEY = "engageai-feedbacks"
const REQUESTS_KEY = "engageai-feedback-requests"

export class FeedbackService {
  // Configurações padrão (gestor pode modificar)
  static getDefaultSettings(): FeedbackSettings {
    return {
      allowAnyUser: true, // Por padrão, qualquer colaborador pode enviar feedback para qualquer pessoa
      allowedRecipients: [],
      allowPublic: true,
      allowPrivate: true,
      allowAnonymous: false,
      limitPerDay: 5,
      limitPerWeek: 20,
      requireApproval: false,
      feedbackTypes: ["Excelente Trabalho", "Colaboração", "Inovação", "Liderança", "Desenvolvimento"],
    }
  }

  static getSettings(): FeedbackSettings {
    const stored = localStorage.getItem(SETTINGS_KEY)
    return stored ? JSON.parse(stored) : this.getDefaultSettings()
  }

  static updateSettings(settings: Partial<FeedbackSettings>): void {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  }

  static canSendFeedback(
    userId: string,
    toUserId: string,
  ): {
    allowed: boolean
    reason?: string
  } {
    const settings = this.getSettings()

    // Verificar se pode enviar para qualquer pessoa
    if (!settings.allowAnyUser && !settings.allowedRecipients.includes(toUserId)) {
      return {
        allowed: false,
        reason: "Você só pode enviar feedback para pessoas autorizadas pelo seu gestor",
      }
    }

    // Verificar limite diário
    const todayCount = this.getFeedbacksSentToday(userId)
    if (todayCount >= settings.limitPerDay) {
      return {
        allowed: false,
        reason: `Você atingiu o limite de ${settings.limitPerDay} feedbacks por dia`,
      }
    }

    // Verificar limite semanal
    const weekCount = this.getFeedbacksSentThisWeek(userId)
    if (weekCount >= settings.limitPerWeek) {
      return {
        allowed: false,
        reason: `Você atingiu o limite de ${settings.limitPerWeek} feedbacks por semana`,
      }
    }

    return { allowed: true }
  }

  static sendFeedback(feedback: Omit<Feedback, "id" | "status" | "createdAt">): Feedback {
    const settings = this.getSettings()

    const newFeedback: Feedback = {
      ...feedback,
      id: `feedback-${Date.now()}`,
      status: settings.requireApproval ? "pending" : "sent",
      createdAt: new Date().toISOString(),
    }

    const feedbacks = this.getAllFeedbacks()
    feedbacks.push(newFeedback)
    localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks))

    return newFeedback
  }

  static getAllFeedbacks(): Feedback[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(FEEDBACKS_KEY)
    if (stored) {
      try {
        const feedbacks: Feedback[] = JSON.parse(stored)
        if (feedbacks.length > 30) return feedbacks // Já tem dados suficientes
      } catch {}
    }

    // Gerar dados mock
    const mockFeedbacks: Feedback[] = []
    const today = new Date()
    const userIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
    const types = ["Excelente Trabalho", "Colaboração", "Inovação", "Liderança", "Desenvolvimento"]

    for (let i = 0; i < 60; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - Math.floor(i / 2))

      const fromUserId = userIds[Math.floor(Math.random() * userIds.length)]
      let toUserId = userIds[Math.floor(Math.random() * userIds.length)]
      while (toUserId === fromUserId) {
        toUserId = userIds[Math.floor(Math.random() * userIds.length)]
      }

      mockFeedbacks.push({
        id: `feedback-${i}`,
        fromUserId,
        fromUserName: `Colaborador ${fromUserId}`,
        toUserId,
        toUserName: `Colaborador ${toUserId}`,
        type: types[Math.floor(Math.random() * types.length)],
        message: `Feedback positivo sobre desempenho`,
        isPublic: Math.random() > 0.3,
        isAnonymous: Math.random() > 0.8,
        status: "sent",
        createdAt: date.toISOString(),
      })
    }

    localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(mockFeedbacks))
    return mockFeedbacks
  }

  static getReceivedFeedbacks(userId: string): Feedback[] {
    return this.getAllFeedbacks()
      .filter((f) => f.toUserId === userId && f.status !== "rejected")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static getSentFeedbacks(userId: string): Feedback[] {
    return this.getAllFeedbacks()
      .filter((f) => f.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static getPendingFeedbacks(): Feedback[] {
    return this.getAllFeedbacks().filter((f) => f.status === "pending")
  }

  static approveFeedback(feedbackId: string): void {
    const feedbacks = this.getAllFeedbacks()
    const feedback = feedbacks.find((f) => f.id === feedbackId)
    if (feedback) {
      feedback.status = "sent"
      localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks))
    }
  }

  static rejectFeedback(feedbackId: string): void {
    const feedbacks = this.getAllFeedbacks()
    const feedback = feedbacks.find((f) => f.id === feedbackId)
    if (feedback) {
      feedback.status = "rejected"
      localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks))
    }
  }

  static markAsViewed(feedbackId: string): void {
    const feedbacks = this.getAllFeedbacks()
    const feedback = feedbacks.find((f) => f.id === feedbackId)
    if (feedback && !feedback.viewedAt) {
      feedback.viewedAt = new Date().toISOString()
      localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks))
    }
  }

  static getFeedbacksSentToday(userId: string): number {
    const today = new Date().toDateString()
    return this.getAllFeedbacks().filter((f) => {
      return f.fromUserId === userId && new Date(f.createdAt).toDateString() === today
    }).length
  }

  static getFeedbacksSentThisWeek(userId: string): number {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return this.getAllFeedbacks().filter((f) => {
      return f.fromUserId === userId && new Date(f.createdAt) >= weekAgo
    }).length
  }

  // Sistema de Solicitação de Feedback
  static requestFeedback(request: Omit<FeedbackRequest, "id" | "status" | "createdAt">): FeedbackRequest {
    const newRequest: FeedbackRequest = {
      ...request,
      id: `request-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
    }

    const requests = this.getAllRequests()
    requests.push(newRequest)
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))

    return newRequest
  }

  static getAllRequests(): FeedbackRequest[] {
    const stored = localStorage.getItem(REQUESTS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  static getSentRequests(userId: string): FeedbackRequest[] {
    return this.getAllRequests()
      .filter((r) => r.fromUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static getReceivedRequests(userId: string): FeedbackRequest[] {
    return this.getAllRequests()
      .filter((r) => r.toUserId === userId && r.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static completeRequest(requestId: string): void {
    const requests = this.getAllRequests()
    const request = requests.find((r) => r.id === requestId)
    if (request) {
      request.status = "completed"
      localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests))
    }
  }

  static getStats(userId: string) {
    const received = this.getReceivedFeedbacks(userId)
    const sent = this.getSentFeedbacks(userId)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const receivedThisMonth = received.filter((f) => new Date(f.createdAt) >= thisMonth).length
    const sentThisMonth = sent.filter((f) => new Date(f.createdAt) >= thisMonth).length

    return {
      totalReceived: received.length,
      receivedThisMonth,
      totalSent: sent.length,
      sentThisMonth,
      unreadReceived: received.filter((f) => !f.viewedAt).length,
    }
  }
}
