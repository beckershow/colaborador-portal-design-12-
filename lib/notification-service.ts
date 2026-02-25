"use client"

export type NotificationType =
  | "profile_change"
  | "reward_request"
  | "feedback"
  | "survey"
  | "engagement_created"
  | "campaign_created"
  | "event_created"
  | "training_created"
  | "challenge_created"
  | "mission_created"
  | "engagement_reminder"
  | "engagement_ending_soon"
  | "engagement_completed"
  | "reward_granted"
  | "post_pending_approval"
  | "post_approved"
  | "post_rejected"

export interface Notification {
  id: string
  type: NotificationType
  userId: string
  userName: string
  timestamp: string
  read: boolean
  data: any
  priority?: "low" | "medium" | "high"
}

// Notificação para o colaborador sobre o resultado da publicação
export interface CollabFeedNotification {
  id: string
  userId: string
  type: "post_approved" | "post_rejected" | "post_liked" | "post_commented"
  title: string
  message: string
  postId?: string
  read: boolean
  createdAt: string
}

// Keys de persistência
const PENDING_POST_NOTIFS_KEY = "engageai-pending-post-notifications"
const COLLAB_FEED_NOTIFS_KEY = "engageai-collab-feed-notifications"

// Sistema de notificações em memória (para gestores/admins)
let notifications: Notification[] = []
let listeners: Array<(notifications: Notification[]) => void> = []

export class NotificationService {
  static subscribe(callback: (notifications: Notification[]) => void) {
    listeners.push(callback)
    callback(notifications)

    return () => {
      listeners = listeners.filter((l) => l !== callback)
    }
  }

  static notifyListeners() {
    listeners.forEach((listener) => listener([...notifications]))
  }

  static addNotification(
    notification: Omit<Notification, "id" | "timestamp" | "read">,
    priority: "low" | "medium" | "high" = "medium",
  ) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
      priority,
    }

    notifications.unshift(newNotification)
    this.notifyListeners()

    console.log("[v0] Nova notificação adicionada:", newNotification)
  }

  static getNotifications(): Notification[] {
    return [...notifications]
  }

  static getUnreadCount(): number {
    return notifications.filter((n) => !n.read).length
  }

  static markAsRead(id: string) {
    const notification = notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.notifyListeners()
    }
  }

  static markAllAsRead() {
    notifications.forEach((n) => (n.read = true))
    this.notifyListeners()
  }

  static clearAll() {
    notifications = []
    this.notifyListeners()
  }

  static removeNotification(id: string) {
    notifications = notifications.filter((n) => n.id !== id)
    // Remover também da persistência (para que não reapareça após reload)
    if (typeof window !== "undefined") {
      try {
        const stored: Notification[] = JSON.parse(localStorage.getItem(PENDING_POST_NOTIFS_KEY) || "[]")
        localStorage.setItem(
          PENDING_POST_NOTIFS_KEY,
          JSON.stringify(stored.filter((n) => n.id !== id)),
        )
      } catch {
        // ignore
      }
    }
    this.notifyListeners()
  }

  // ─── Persistência para gestores (post_pending_approval) ───────────────────

  /**
   * Carrega notificações de posts pendentes do localStorage para o estado em memória.
   * Deve ser chamado pelo NotificationCenter no mount para que gestores vejam
   * as notificações mesmo após reload da página.
   */
  static loadPersistedPendingPostNotifications() {
    if (typeof window === "undefined") return
    try {
      const stored: Notification[] = JSON.parse(localStorage.getItem(PENDING_POST_NOTIFS_KEY) || "[]")
      const existingIds = new Set(notifications.map((n) => n.id))
      stored.forEach((n) => {
        if (!existingIds.has(n.id)) {
          notifications.push(n)
        }
      })
      this.notifyListeners()
    } catch {
      // ignore
    }
  }

  // ─── Store de notificações para colaboradores (feed) ──────────────────────

  /**
   * Escreve uma notificação de resultado de publicação para o colaborador.
   * Chamado pelo gestor ao aprovar ou rejeitar um post.
   */
  static writeCollabFeedNotification(
    userId: string,
    type: CollabFeedNotification["type"],
    title: string,
    message: string,
    postId?: string,
  ) {
    if (typeof window === "undefined") return
    try {
      const stored: CollabFeedNotification[] = JSON.parse(localStorage.getItem(COLLAB_FEED_NOTIFS_KEY) || "[]")
      const notif: CollabFeedNotification = {
        id: `collab-${Date.now()}-${Math.random()}`,
        userId,
        type,
        title,
        message,
        postId,
        read: false,
        createdAt: new Date().toISOString(),
      }
      stored.unshift(notif)
      // Manter no máximo 100 registros
      localStorage.setItem(COLLAB_FEED_NOTIFS_KEY, JSON.stringify(stored.slice(0, 100)))
    } catch {
      // ignore
    }
  }

  static getCollabFeedNotifications(userId: string): CollabFeedNotification[] {
    if (typeof window === "undefined") return []
    try {
      const stored: CollabFeedNotification[] = JSON.parse(localStorage.getItem(COLLAB_FEED_NOTIFS_KEY) || "[]")
      return stored.filter((n) => n.userId === userId)
    } catch {
      return []
    }
  }

  static markCollabFeedNotificationRead(id: string) {
    if (typeof window === "undefined") return
    try {
      const stored: CollabFeedNotification[] = JSON.parse(localStorage.getItem(COLLAB_FEED_NOTIFS_KEY) || "[]")
      localStorage.setItem(
        COLLAB_FEED_NOTIFS_KEY,
        JSON.stringify(stored.map((n) => (n.id === id ? { ...n, read: true } : n))),
      )
    } catch {
      // ignore
    }
  }

  static markAllCollabFeedNotificationsRead(userId: string) {
    if (typeof window === "undefined") return
    try {
      const stored: CollabFeedNotification[] = JSON.parse(localStorage.getItem(COLLAB_FEED_NOTIFS_KEY) || "[]")
      localStorage.setItem(
        COLLAB_FEED_NOTIFS_KEY,
        JSON.stringify(stored.map((n) => (n.userId === userId ? { ...n, read: true } : n))),
      )
    } catch {
      // ignore
    }
  }

  // ─── Métodos de notificação ───────────────────────────────────────────────

  static notifyProfileChangeRequest(userId: string, userName: string, changes: Record<string, string>) {
    this.addNotification(
      {
        type: "profile_change",
        userId,
        userName,
        data: { changes },
      },
      "high",
    )
  }

  static notifyRewardRequest(userId: string, userName: string, reward: { name: string; cost: number }) {
    this.addNotification(
      {
        type: "reward_request",
        userId,
        userName,
        data: { reward },
      },
      "medium",
    )
  }

  static notifyEngagementCreated(
    userId: string,
    userName: string,
    engagement: { title: string; type: string; endDate: string },
  ) {
    this.addNotification(
      {
        type: "engagement_created",
        userId,
        userName,
        data: { engagement },
      },
      "high",
    )
  }

  static notifyCampaignCreated(
    userId: string,
    userName: string,
    campaign: { title: string; duration: string; rewards: string },
  ) {
    this.addNotification(
      {
        type: "campaign_created",
        userId,
        userName,
        data: { campaign },
      },
      "high",
    )
  }

  static notifyEventCreated(
    userId: string,
    userName: string,
    event: { title: string; date: string; location: string },
  ) {
    this.addNotification(
      {
        type: "event_created",
        userId,
        userName,
        data: { event },
      },
      "high",
    )
  }

  static notifyTrainingCreated(
    userId: string,
    userName: string,
    training: { title: string; duration: string; xpReward: number },
  ) {
    this.addNotification(
      {
        type: "training_created",
        userId,
        userName,
        data: { training },
      },
      "medium",
    )
  }

  static notifyPostPendingApproval(
    userId: string,
    userName: string,
    post: { content: string; hasImage: boolean; hasVideo?: boolean; id?: string },
  ) {
    // Criar a notificação em memória
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type: "post_pending_approval",
      userId,
      userName,
      timestamp: new Date().toISOString(),
      read: false,
      priority: "medium",
      data: { post },
    }

    notifications.unshift(newNotification)
    this.notifyListeners()

    // Persistir no localStorage para sobreviver a reloads do gestor
    if (typeof window !== "undefined") {
      try {
        const stored: Notification[] = JSON.parse(localStorage.getItem(PENDING_POST_NOTIFS_KEY) || "[]")
        stored.unshift(newNotification)
        localStorage.setItem(PENDING_POST_NOTIFS_KEY, JSON.stringify(stored.slice(0, 50)))
      } catch {
        // ignore
      }
    }

    console.log("[v0] Nova notificação adicionada:", newNotification)
  }

  static notifyPostApproved(userId: string, userName: string) {
    this.addNotification(
      {
        type: "post_approved",
        userId,
        userName,
        data: {},
      },
      "low",
    )
  }

  static notifyPostRejected(userId: string, userName: string, reason?: string) {
    this.addNotification(
      {
        type: "post_rejected",
        userId,
        userName,
        data: { reason },
      },
      "medium",
    )
  }

  static notifyRewardGranted(userId: string, userName: string, reward: { name: string; stars: number }) {
    this.addNotification(
      {
        type: "reward_granted",
        userId,
        userName,
        data: { reward },
      },
      "medium",
    )
  }
}
