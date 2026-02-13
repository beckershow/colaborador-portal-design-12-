"use client"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

const STORAGE_ACCESS_TOKEN = "engageai-access-token"
const STORAGE_REFRESH_TOKEN = "engageai-refresh-token"

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_ACCESS_TOKEN)
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(STORAGE_ACCESS_TOKEN, accessToken)
  localStorage.setItem(STORAGE_REFRESH_TOKEN, refreshToken)
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_REFRESH_TOKEN)
}

let isRefreshing = false
let refreshQueue: Array<(token: string | null) => void> = []

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(STORAGE_REFRESH_TOKEN)
  if (!refreshToken) return null

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) {
      clearTokens()
      return null
    }
    const json = await res.json()
    // Backend wraps in { data: { accessToken, refreshToken } }
    const data = json.data ?? json
    setTokens(data.accessToken, data.refreshToken)
    return data.accessToken
  } catch {
    clearTokens()
    return null
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = getAccessToken()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  const hasBody = typeof options.body !== "undefined"
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData
  if (hasBody && !isFormData && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json"
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    // Try to refresh token
    if (!isRefreshing) {
      isRefreshing = true
      const newToken = await refreshAccessToken()
      isRefreshing = false
      refreshQueue.forEach((cb) => cb(newToken))
      refreshQueue = []

      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
      } else {
        // Redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login"
        }
        throw new Error("Sessão expirada. Faça login novamente.")
      }
    } else {
      // Wait for the ongoing refresh
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve)
      })
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
      } else {
        throw new Error("Sessão expirada. Faça login novamente.")
      }
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: `HTTP ${res.status}` }))
    throw new Error(error.message || `Erro ${res.status}`)
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
