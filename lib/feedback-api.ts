"use client"

import { apiFetch } from "./api-client"

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FeedbackType =
  | "reconhecimento"
  | "sugestao"
  | "critica_construtiva"
  | "agradecimento"
  | "desenvolvimento"

export type FeedbackStatus = "pendente" | "aprovado" | "rejeitado"
export type FeedbackRequestStatus = "pending" | "fulfilled" | "declined"

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  reconhecimento: "Reconhecimento",
  sugestao: "Sugestão",
  critica_construtiva: "Melhoria Construtiva",
  agradecimento: "Agradecimento",
  desenvolvimento: "Desenvolvimento",
}

export interface FeedbackUser {
  id: string
  nome: string
  cargo: string
  avatar: string | null
}

export interface Feedback {
  id: string
  fromUserId: string
  toUserId: string
  type: FeedbackType
  content: string
  isPublic: boolean
  status: FeedbackStatus
  viewedAt: string | null
  isShared: boolean
  sharedPostId: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  fromUser: FeedbackUser | null
  toUser: FeedbackUser | null
}

export interface FeedbackRequest {
  id: string
  fromUserId: string
  toUserId: string
  topic: string | null
  message: string | null
  status: FeedbackRequestStatus
  feedbackId: string | null
  createdAt: string
  updatedAt: string
  fromUser: FeedbackUser
  toUser: FeedbackUser
}

export interface FeedbackStats {
  sentToday: number
  sentThisWeek: number
  sentThisMonth: number
  totalSent: number
  totalReceived: number
  receivedThisMonth: number
  unreadReceived: number
  pendingRequests: number
  dailyLimit: number
  weeklyLimit: number
  requireApproval: boolean
  allowPublicFeedback: boolean
}

export interface SuggestionUser {
  id: string
  nome: string
  cargo: string
  departamento: string
  avatar: string | null
  role: string
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getFeedbackStats(): Promise<{ data: FeedbackStats }> {
  return apiFetch<{ data: FeedbackStats }>("/feedbacks/stats")
}

export async function getFeedbackSuggestions(search?: string): Promise<{ data: SuggestionUser[] }> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  return apiFetch<{ data: SuggestionUser[] }>(`/feedbacks/suggestions?${params}`)
}

export async function getSentFeedbacks(page = 1, limit = 50): Promise<{ data: Feedback[] }> {
  return apiFetch<{ data: Feedback[] }>(`/feedbacks?type=sent&page=${page}&limit=${limit}`)
}

export async function getReceivedFeedbacks(page = 1, limit = 50): Promise<{ data: Feedback[] }> {
  return apiFetch<{ data: Feedback[] }>(`/feedbacks?type=received&page=${page}&limit=${limit}`)
}

export async function getPendingFeedbacks(page = 1, limit = 50): Promise<{ data: Feedback[] }> {
  return apiFetch<{ data: Feedback[] }>(`/feedbacks?type=pending&page=${page}&limit=${limit}`)
}

export async function sendFeedback(data: {
  toUserId: string
  type: FeedbackType
  content: string
  isPublic?: boolean
  requestId?: string
}): Promise<{ data: Feedback; meta: { sentToday: number; sentThisWeek: number; dailyLimit: number; weeklyLimit: number } }> {
  return apiFetch("/feedbacks", { method: "POST", body: JSON.stringify(data) })
}

export async function markFeedbackViewed(id: string): Promise<{ data: Feedback }> {
  return apiFetch<{ data: Feedback }>(`/feedbacks/${id}/view`, { method: "PATCH" })
}

export async function approveFeedback(id: string, note?: string): Promise<{ data: Feedback }> {
  return apiFetch<{ data: Feedback }>(`/feedbacks/${id}/approve`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  })
}

export async function rejectFeedback(id: string, note?: string): Promise<{ data: Feedback }> {
  return apiFetch<{ data: Feedback }>(`/feedbacks/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ note }),
  })
}

// ─── Solicitações ─────────────────────────────────────────────────────────────

export async function getSentRequests(): Promise<{ data: FeedbackRequest[] }> {
  return apiFetch<{ data: FeedbackRequest[] }>("/feedbacks/requests?type=sent")
}

export async function getReceivedRequests(): Promise<{ data: FeedbackRequest[] }> {
  return apiFetch<{ data: FeedbackRequest[] }>("/feedbacks/requests?type=received")
}

export async function createFeedbackRequest(data: {
  toUserId: string
  topic?: string
  message?: string
}): Promise<{ data: FeedbackRequest }> {
  return apiFetch<{ data: FeedbackRequest }>("/feedbacks/requests", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function declineFeedbackRequest(id: string): Promise<{ data: FeedbackRequest }> {
  return apiFetch<{ data: FeedbackRequest }>(`/feedbacks/requests/${id}/decline`, { method: "PATCH" })
}

// ─── Configuração por gestor ───────────────────────────────────────────────────

export interface GestorFeedbackConfig {
  id: string
  gestorId: string
  allowAnyUser: boolean
  allowPublicFeedback: boolean
  requireApproval: boolean
  updatedAt: string
}

export async function getGestorFeedbackConfig(): Promise<{ data: GestorFeedbackConfig }> {
  return apiFetch<{ data: GestorFeedbackConfig }>("/feedbacks/config")
}

export async function updateGestorFeedbackConfig(data: {
  allowAnyUser?: boolean
  allowPublicFeedback?: boolean
  requireApproval?: boolean
}): Promise<{ data: GestorFeedbackConfig }> {
  return apiFetch<{ data: GestorFeedbackConfig }>("/feedbacks/config", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function getFeedbackSuggestion(intention: string, type: "feedback" | "request"): Promise<{ suggestion: string }> {
  return apiFetch<{ suggestion: string }>("/analytics/feedbacks/suggest", {
    method: "POST",
    body: JSON.stringify({ intention, type }),
  })
}
