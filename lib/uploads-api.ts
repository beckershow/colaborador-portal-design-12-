"use client"

import { getAccessToken } from "@/lib/api-client"
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

/**
 * Converte uma key do R2 (ex: "store/user-id/img.jpg") em URL completa servida pelo proxy do backend.
 * Se já for uma URL completa (http/https), retorna como está.
 * Se for null/undefined, retorna null.
 */
export function getImageUrl(key: string | null | undefined): string | null {
  if (!key) return null
  if (key.startsWith("http://") || key.startsWith("https://")) return key
  return `${BASE_URL}/uploads/${key}`
}

export async function uploadFileToBackend(file: File, folder = "trainings") {
  const token = getAccessToken()
  const form = new FormData()
  form.append("file", file)

  const url = `${BASE_URL}/uploads?folder=${encodeURIComponent(folder)}`

  const res = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error(err.error?.message || err.message || `Erro ${res.status}`)
  }

  return res.json() as Promise<{ data: { key: string; filename: string } }>
}
