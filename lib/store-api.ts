"use client"

import { apiFetch } from "./api-client"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type StoreItemStatus = "draft" | "created" | "active" | "inactive"
export type StoreTeamScope = "all" | "specific"
export type StoreManagerInventoryStatus = "in_stock" | "active_for_team" | "inactive_for_team"

export interface StoreCategory {
  id: string
  name: string
}

export interface StoreManagerSummary {
  id: string
  nome: string
}

export interface StoreManagerVisibility {
  id: string
  itemId: string
  managerId: string
  manager: StoreManagerSummary
}

export interface StoreTeamVisibilityUser {
  id: string
  nome: string
  avatar: string | null
}

export interface StoreTeamVisibility {
  id: string
  itemId: string
  managerId: string
  userId: string | null
  teamScope: StoreTeamScope
  user?: StoreTeamVisibilityUser | null
}

export interface StoreItem {
  id: string
  name: string
  categoryId: string
  category: StoreCategory
  description: string
  costCurrency: number
  costStars: number
  quantity: number | null
  imageUrl: string | null
  internalNotes: string | null
  allowMultipleRedemptions: boolean
  maxRedemptionsPerUser: number | null
  status: StoreItemStatus
  createdById: string
  createdAt: string
  updatedAt: string
  managerVisibility?: StoreManagerVisibility[]
  teamVisibility?: StoreTeamVisibility[]
  _count?: { redemptions: number }
}

export interface StoreRedemption {
  id: string
  itemId: string
  userId: string
  status: string
  redeemedAt: string
  item: StoreItem
  user?: {
    id: string
    nome: string
    avatar: string | null
    cargo: string
  }
}

export interface StoreManagerInventory {
  id: string
  itemId: string
  managerId: string
  status: StoreManagerInventoryStatus
  activatedAt: string | null
  item: StoreItem
}

export interface StoreRewardRequest {
  id: string
  managerId: string
  name: string
  description: string
  category: string
  estimatedStarCost: number
  justification: string
  imageUrl: string | null
  status: "pending" | "approved" | "rejected" | "refused" | "proceeded" | "converted"
  reviewNote: string | null
  reviewedById: string | null
  reviewedAt: string | null
  convertedItemId: string | null
  createdAt: string
  updatedAt: string
  manager?: { id: string; nome: string }
  reviewedBy?: { id: string; nome: string } | null
}

export interface StoreAuditLog {
  id: string
  itemId: string | null
  action: string
  performedById: string
  metadata: Record<string, unknown> | null
  createdAt: string
  item?: { id: string; name: string } | null
  performedBy?: { id: string; nome: string; role: string }
}

export interface CreateStoreItemData {
  name: string
  categoryId: string
  description: string
  costStars?: number
  quantity?: number | null
  imageUrl?: string | null
  internalNotes?: string | null
  allowMultipleRedemptions?: boolean
  maxRedemptionsPerUser?: number | null
  status?: "draft" | "created"
  managerIds?: string[]
  fromRequestId?: string
}

export interface UpdateStoreItemData {
  name?: string
  categoryId?: string
  description?: string
  costStars?: number
  quantity?: number | null
  imageUrl?: string | null
  internalNotes?: string | null
  allowMultipleRedemptions?: boolean
  maxRedemptionsPerUser?: number | null
  managerIds?: string[]
}

// ─── Categorias ──────────────────────────────────────────────────────────────

export async function getStoreCategories(): Promise<{ data: StoreCategory[] }> {
  return apiFetch<{ data: StoreCategory[] }>("/store/categories")
}

export async function createStoreCategory(name: string): Promise<{ data: StoreCategory }> {
  return apiFetch<{ data: StoreCategory }>("/store/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

// ─── Itens (Super Admin) ──────────────────────────────────────────────────────

export async function getStoreItems(
  status?: StoreItemStatus,
  page = 1,
  limit = 50,
): Promise<{ data: StoreItem[]; meta: { page: number; limit: number; total: number } }> {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  params.set("page", String(page))
  params.set("limit", String(limit))
  return apiFetch(`/store/items?${params.toString()}`)
}

export async function createStoreItem(data: CreateStoreItemData): Promise<{ data: StoreItem }> {
  return apiFetch<{ data: StoreItem }>("/store/items", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateStoreItem(
  id: string,
  data: UpdateStoreItemData,
): Promise<{ data: StoreItem }> {
  return apiFetch<{ data: StoreItem }>(`/store/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function deleteStoreItem(id: string): Promise<void> {
  await apiFetch(`/store/items/${id}`, { method: "DELETE" })
}

export async function setStoreItemStatus(
  id: string,
  status: StoreItemStatus,
): Promise<{ data: StoreItem }> {
  return apiFetch<{ data: StoreItem }>(`/store/items/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

// ─── Inventário do Gestor ─────────────────────────────────────────────────────

export async function getManagerInventory(): Promise<{ data: StoreManagerInventory[] }> {
  return apiFetch<{ data: StoreManagerInventory[] }>("/store/manager-inventory")
}

export async function setManagerInventoryStatus(
  itemId: string,
  status: "active_for_team" | "inactive_for_team",
  teamScope?: "all" | "specific",
  userIds?: string[],
): Promise<{ data: StoreManagerInventory }> {
  return apiFetch<{ data: StoreManagerInventory }>(`/store/manager-inventory/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, teamScope, userIds }),
  })
}

// ─── Gestor (compatibilidade) ─────────────────────────────────────────────────

export async function getManagerStoreItems(): Promise<{ data: StoreItem[] }> {
  return apiFetch<{ data: StoreItem[] }>("/store/manager-items")
}

export async function setTeamVisibility(
  itemId: string,
  options: { scope: StoreTeamScope; userIds?: string[] },
): Promise<{ data: StoreTeamVisibility[] }> {
  return apiFetch<{ data: StoreTeamVisibility[] }>(`/store/items/${itemId}/team-visibility`, {
    method: "PATCH",
    body: JSON.stringify(options),
  })
}

// ─── Colaborador ─────────────────────────────────────────────────────────────

export async function getAvailableStoreItems(): Promise<{ data: StoreItem[] }> {
  return apiFetch<{ data: StoreItem[] }>("/store/available")
}

export async function redeemStoreItem(itemId: string): Promise<{ data: StoreRedemption }> {
  return apiFetch<{ data: StoreRedemption }>(`/store/items/${itemId}/redeem`, {
    method: "POST",
  })
}

export async function getMyStoreRedemptions(): Promise<{ data: StoreRedemption[] }> {
  return apiFetch<{ data: StoreRedemption[] }>("/store/my-redemptions")
}

// ─── Gestor (resgates do time) ────────────────────────────────────────────────

export async function getTeamRedemptions(): Promise<{ data: StoreRedemption[] }> {
  return apiFetch<{ data: StoreRedemption[] }>("/store/team-redemptions")
}

export async function updateRedemptionStatus(
  redemptionId: string,
  status: "pending" | "fulfilled" | "cancelled",
): Promise<{ data: StoreRedemption }> {
  return apiFetch<{ data: StoreRedemption }>(`/store/redemptions/${redemptionId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

// ─── Solicitações de Recompensa ───────────────────────────────────────────────

export interface CreateRewardRequestData {
  name: string
  description: string
  category: string
  estimatedStarCost: number
  justification: string
  imageUrl?: string | null
}

export async function createRewardRequest(data: CreateRewardRequestData): Promise<{ data: StoreRewardRequest }> {
  return apiFetch<{ data: StoreRewardRequest }>("/store/reward-requests", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getRewardRequests(): Promise<{ data: StoreRewardRequest[] }> {
  return apiFetch<{ data: StoreRewardRequest[] }>("/store/reward-requests")
}

export async function updateRewardRequest(
  id: string,
  data: Partial<CreateRewardRequestData>,
): Promise<{ data: StoreRewardRequest }> {
  return apiFetch<{ data: StoreRewardRequest }>(`/store/reward-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function reviewRewardRequest(
  id: string,
  data: {
    status: "approved" | "rejected" | "refused" | "proceeded" | "converted"
    reviewNote?: string
    name?: string
    description?: string
    category?: string
    estimatedStarCost?: number
  },
): Promise<{ data: StoreRewardRequest }> {
  return apiFetch<{ data: StoreRewardRequest }>(`/store/reward-requests/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

// ─── Auditoria ────────────────────────────────────────────────────────────────

export async function getAuditLogs(params?: {
  page?: number
  limit?: number
  itemId?: string
}): Promise<{ data: StoreAuditLog[]; meta: { page: number; limit: number; total: number } }> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set("page", String(params.page))
  if (params?.limit) qs.set("limit", String(params.limit))
  if (params?.itemId) qs.set("itemId", params.itemId)
  return apiFetch(`/store/audit-logs?${qs.toString()}`)
}
