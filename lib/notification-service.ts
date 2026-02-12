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

// Sistema de notificações em memória (não persistido)
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
    this.notifyListeners()
  }

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

  static notifyPostPendingApproval(userId: string, userName: string, post: { content: string; hasImage: boolean }) {
    this.addNotification(
      {
        type: "post_pending_approval",
        userId,
        userName,
        data: { post },
      },
      "medium",
    )
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
