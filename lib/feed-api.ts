"use client"

import { apiFetch } from "./api-client"

// ─── Tipos espelhando o backend ───────────────────────────────────────────────

export type FeedPostStatus = "pending" | "approved" | "rejected"
export type ReactionType = "like" | "love" | "celebrate" | "support" | "insightful"

export interface FeedApiUser {
  id: string
  nome: string
  cargo: string
  departamento: string
  avatar: string | null
  role: string
}

export interface FeedApiComment {
  id: string
  content: string
  createdAt: string
  user: FeedApiUser
}

export interface FeedApiPost {
  id: string
  content: string
  imageUrl: string | null
  videoUrl: string | null
  status: FeedPostStatus
  isPinned: boolean
  viewsCount: number
  approvedAt: string | null
  rejectedReason: string | null
  createdAt: string
  updatedAt: string
  user: FeedApiUser
  _count: { reactions: number; comments: number }
  userReaction: ReactionType | null
  // só presente no GET /:id
  comments?: FeedApiComment[]
  reactions?: { type: ReactionType; userId: string }[]
}

export interface FeedApiPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface FeedListResponse {
  data: FeedApiPost[]
  meta: FeedApiPagination
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Lista posts aprovados do feed com paginação */
export async function listFeedPosts(page = 1, limit = 20): Promise<FeedListResponse> {
  return apiFetch<FeedListResponse>(`/feed?page=${page}&limit=${limit}`)
}

/** Lista posts aguardando aprovação (gestor+) */
export async function listPendingPosts(page = 1, limit = 50): Promise<FeedListResponse> {
  return apiFetch<FeedListResponse>(`/feed/pending?page=${page}&limit=${limit}`)
}

/** Lista posts pendentes do usuário atual (colaborador) */
export async function listMyPendingPosts(): Promise<{ data: FeedApiPost[] }> {
  return apiFetch<{ data: FeedApiPost[] }>("/feed/mine/pending")
}

/** Lista posts recusados do usuário atual (colaborador) */
export async function listMyRejectedPosts(): Promise<{ data: FeedApiPost[] }> {
  return apiFetch<{ data: FeedApiPost[] }>("/feed/mine/rejected")
}

/** Busca um post por ID (com comentários e reações) */
export async function getFeedPost(id: string): Promise<{ data: FeedApiPost }> {
  return apiFetch<{ data: FeedApiPost }>(`/feed/${id}`)
}

/** Cria uma nova publicação */
export async function createFeedPost(body: {
  content: string
  imageUrl?: string | null
  videoUrl?: string | null
}): Promise<{ data: FeedApiPost }> {
  return apiFetch<{ data: FeedApiPost }>("/feed", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

/** Edita um post pendente (autor) */
export async function updateFeedPost(
  id: string,
  body: { content?: string; imageUrl?: string | null; videoUrl?: string | null },
): Promise<{ data: FeedApiPost }> {
  return apiFetch<{ data: FeedApiPost }>(`/feed/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

/** Exclui um post (soft delete) */
export async function deleteFeedPost(id: string): Promise<void> {
  return apiFetch<void>(`/feed/${id}`, { method: "DELETE" })
}

/** Aprova ou rejeita um post (gestor+) */
export async function setFeedPostStatus(
  id: string,
  action: "approve" | "reject",
  reason?: string,
): Promise<{ data: { id: string; status: FeedPostStatus } }> {
  return apiFetch(`/feed/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ action, reason }),
  })
}

/** Adiciona/alterna reação em um post */
export async function reactToPost(
  postId: string,
  type: ReactionType,
): Promise<{ data: { reacted: boolean; type: ReactionType } }> {
  return apiFetch(`/feed/${postId}/react`, {
    method: "POST",
    body: JSON.stringify({ type }),
  })
}

/** Adiciona um comentário */
export async function addComment(
  postId: string,
  content: string,
): Promise<{ data: FeedApiComment }> {
  return apiFetch(`/feed/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  })
}

/** Remove um comentário */
export async function deleteComment(postId: string, commentId: string): Promise<void> {
  return apiFetch<void>(`/feed/${postId}/comments/${commentId}`, { method: "DELETE" })
}

/** Registra uma visualização (idempotente) */
export async function registerPostView(postId: string): Promise<void> {
  return apiFetch<void>(`/feed/${postId}/view`, { method: "POST" })
}

/** Fixa/defixa um post (gestor+) */
export async function pinPost(postId: string): Promise<{ data: { id: string; isPinned: boolean } }> {
  return apiFetch(`/feed/${postId}/pin`, { method: "PATCH" })
}

// ─── Feed Social Config (gestor+) ─────────────────────────────────────────────

export interface FeedSocialConfig {
  requireApproval: boolean
}

/** Busca a configuração de aprovação do gestor autenticado */
export async function getFeedConfig(): Promise<{ data: FeedSocialConfig }> {
  return apiFetch<{ data: FeedSocialConfig }>("/feed/config")
}

/** Atualiza a configuração de aprovação do gestor autenticado */
export async function updateFeedConfig(
  requireApproval: boolean,
): Promise<{ data: FeedSocialConfig }> {
  return apiFetch<{ data: FeedSocialConfig }>("/feed/config", {
    method: "PATCH",
    body: JSON.stringify({ requireApproval }),
  })
}
