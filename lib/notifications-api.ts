"use client"

import { apiFetch } from "./api-client"

// ─── Tipos espelhando o backend ───────────────────────────────────────────────

export type ApiNotificationType =
  | "xp_gained"
  | "level_up"
  | "achievement"
  | "feedback_received"
  | "feedback_approved"
  | "survey_available"
  | "event_reminder"
  | "mission_complete"
  | "reward_redeemed"
  | "mention"
  | "system"
  | "post_pending_approval"
  | "post_approved"
  | "post_rejected"
  | "post_liked"
  | "post_commented"
  | "store_item_created"
  | "store_item_activated"
  | "store_item_available_to_manager"
  | "store_item_available_to_team"
  | "store_item_sent_to_manager"
  | "store_manager_item_activated"
  | "store_manager_item_deactivated"
  | "store_reward_requested"
  | "store_reward_request_reviewed"
  | "feedback_request_received"
  | "feedback_rejected"

export interface ApiNotification {
  id: string
  userId: string
  type: ApiNotificationType
  title: string
  message: string
  data: Record<string, unknown> | null
  status: "unread" | "read"
  createdAt: string
  readAt: string | null
}

export interface NotificationListResponse {
  data: ApiNotification[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    unreadCount: number
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Busca notificações do usuário autenticado */
export async function fetchNotifications(
  page = 1,
  limit = 50,
  status?: "unread" | "read",
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set("status", status)
  return apiFetch<NotificationListResponse>(`/notifications?${params}`)
}

/** Marca uma notificação como lida */
export async function markNotificationRead(id: string): Promise<void> {
  return apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" })
}

/** Marca todas as notificações como lidas */
export async function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>("/notifications/read-all", { method: "PATCH" })
}
