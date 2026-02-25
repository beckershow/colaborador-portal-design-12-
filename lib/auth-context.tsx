"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { apiFetch, setTokens, clearTokens, getAccessToken } from "@/lib/api-client"

export type UserRole = "super-admin" | "gestor" | "colaborador"

export interface User {
  id: string
  nome: string
  email: string
  avatar: string
  cargo: string
  departamento: string
  role: UserRole
  nivel: number
  xp: number
  xpProximo: number
  estrelas: number
  timeGerenciado?: string[] // IDs dos colaboradores (apenas para gestores)
  telefone?: string
  localizacao?: string
  hiredAt?: string
  bio?: string
  createdAt?: string
  managerId?: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean
  canManageUser: (targetUserId: string) => boolean
  hasRegisteredMood: boolean
  setHasRegisteredMood: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Static user list kept for backward compatibility with analytics services that still use mock data
export const mockUsers: User[] = [
  { id: "1", nome: "Carlos Eduardo Santos", email: "carlos.eduardo@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Diretor de RH", departamento: "Recursos Humanos", role: "super-admin", nivel: 10, xp: 5000, xpProximo: 6000, estrelas: 500 },
  { id: "2", nome: "Marina Oliveira", email: "marina.oliveira@engageai.com", avatar: "/professional-avatar-woman-glasses.jpg", cargo: "Gerente de Marketing", departamento: "Time Criativo", role: "gestor", nivel: 7, xp: 3200, xpProximo: 4000, estrelas: 280, timeGerenciado: ["3", "4", "5"] },
  { id: "3", nome: "Ana Carolina Silva", email: "ana.carolina@engageai.com", avatar: "/professional-avatar-smiling-woman.jpg", cargo: "Analista de Marketing", departamento: "Time Criativo", role: "colaborador", nivel: 4, xp: 1200, xpProximo: 2300, estrelas: 150 },
  { id: "4", nome: "João Silva", email: "joao.silva@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Designer", departamento: "Time Criativo", role: "colaborador", nivel: 5, xp: 2100, xpProximo: 3000, estrelas: 180 },
  { id: "5", nome: "Pedro Costa", email: "pedro.costa@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Copywriter", departamento: "Time Criativo", role: "colaborador", nivel: 3, xp: 800, xpProximo: 1500, estrelas: 120 },
  { id: "6", nome: "Lucas Andrade", email: "lucas.andrade@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Gerente de Vendas", departamento: "Comercial", role: "gestor", nivel: 8, xp: 3800, xpProximo: 4500, estrelas: 320, timeGerenciado: ["11", "12", "13", "14", "15", "16", "17"] },
  { id: "7", nome: "Fernanda Costa", email: "fernanda.costa@engageai.com", avatar: "/professional-avatar-woman.jpg", cargo: "Gerente de Tecnologia", departamento: "TI", role: "gestor", nivel: 9, xp: 4200, xpProximo: 5000, estrelas: 380, timeGerenciado: ["18", "19", "20", "21", "22", "23", "24", "25", "26", "27"] },
  { id: "8", nome: "Rafael Lima", email: "rafael.lima@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Gerente de Operações", departamento: "Operações", role: "gestor", nivel: 7, xp: 3100, xpProximo: 4000, estrelas: 260, timeGerenciado: ["28", "29", "30", "31", "32", "33"] },
  { id: "9", nome: "Bruno Martins", email: "bruno.martins@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Gerente de Produtos", departamento: "Produto", role: "gestor", nivel: 8, xp: 3600, xpProximo: 4500, estrelas: 300, timeGerenciado: ["34", "35", "36", "37", "38", "39", "40"] },
  { id: "10", nome: "Juliana Santos", email: "juliana.santos@engageai.com", avatar: "/professional-avatar-woman-glasses.jpg", cargo: "Gerente de Atendimento", departamento: "Customer Success", role: "gestor", nivel: 6, xp: 2800, xpProximo: 3500, estrelas: 240, timeGerenciado: ["41", "42", "43", "44", "45"] },
  { id: "11", nome: "Rodrigo Ferreira", email: "rodrigo.ferreira@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Executivo de Vendas", departamento: "Comercial", role: "colaborador", nivel: 5, xp: 2200, xpProximo: 3000, estrelas: 190 },
  { id: "12", nome: "Camila Alves", email: "camila.alves@engageai.com", avatar: "/professional-avatar-smiling-woman.jpg", cargo: "Executiva de Vendas", departamento: "Comercial", role: "colaborador", nivel: 6, xp: 2600, xpProximo: 3500, estrelas: 210 },
  { id: "13", nome: "Thiago Souza", email: "thiago.souza@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Analista de Vendas", departamento: "Comercial", role: "colaborador", nivel: 4, xp: 1400, xpProximo: 2300, estrelas: 140 },
  { id: "14", nome: "Beatriz Rocha", email: "beatriz.rocha@engageai.com", avatar: "/professional-avatar-woman.jpg", cargo: "SDR", departamento: "Comercial", role: "colaborador", nivel: 3, xp: 900, xpProximo: 1500, estrelas: 110 },
  { id: "15", nome: "Felipe Cardoso", email: "felipe.cardoso@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "SDR", departamento: "Comercial", role: "colaborador", nivel: 3, xp: 850, xpProximo: 1500, estrelas: 105 },
  { id: "16", nome: "Larissa Mendes", email: "larissa.mendes@engageai.com", avatar: "/professional-avatar-woman-glasses.jpg", cargo: "Executiva de Vendas", departamento: "Comercial", role: "colaborador", nivel: 5, xp: 2300, xpProximo: 3000, estrelas: 195 },
  { id: "17", nome: "Guilherme Pinto", email: "guilherme.pinto@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Analista de Vendas", departamento: "Comercial", role: "colaborador", nivel: 4, xp: 1500, xpProximo: 2300, estrelas: 155 },
  { id: "18", nome: "Daniel Ribeiro", email: "daniel.ribeiro@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Tech Lead", departamento: "TI", role: "colaborador", nivel: 7, xp: 3300, xpProximo: 4000, estrelas: 285 },
  { id: "19", nome: "Aline Nascimento", email: "aline.nascimento@engageai.com", avatar: "/professional-avatar-smiling-woman.jpg", cargo: "Desenvolvedora Full Stack", departamento: "TI", role: "colaborador", nivel: 6, xp: 2700, xpProximo: 3500, estrelas: 220 },
  { id: "20", nome: "Marcelo Castro", email: "marcelo.castro@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Desenvolvedor Backend", departamento: "TI", role: "colaborador", nivel: 6, xp: 2650, xpProximo: 3500, estrelas: 215 },
  { id: "21", nome: "Patrícia Gomes", email: "patricia.gomes@engageai.com", avatar: "/professional-avatar-woman.jpg", cargo: "Desenvolvedora Frontend", departamento: "TI", role: "colaborador", nivel: 5, xp: 2400, xpProximo: 3000, estrelas: 200 },
  { id: "22", nome: "Vinícius Barros", email: "vinicius.barros@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "DevOps Engineer", departamento: "TI", role: "colaborador", nivel: 7, xp: 3250, xpProximo: 4000, estrelas: 280 },
  { id: "23", nome: "Natália Teixeira", email: "natalia.teixeira@engageai.com", avatar: "/professional-avatar-woman-glasses.jpg", cargo: "QA Engineer", departamento: "TI", role: "colaborador", nivel: 5, xp: 2350, xpProximo: 3000, estrelas: 195 },
  { id: "24", nome: "Roberto Dias", email: "roberto.dias@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Analista de Dados", departamento: "TI", role: "colaborador", nivel: 6, xp: 2550, xpProximo: 3500, estrelas: 210 },
  { id: "25", nome: "Gabriela Moura", email: "gabriela.moura@engageai.com", avatar: "/professional-avatar-smiling-woman.jpg", cargo: "UX Designer", departamento: "TI", role: "colaborador", nivel: 5, xp: 2150, xpProximo: 3000, estrelas: 185 },
  { id: "26", nome: "Henrique Azevedo", email: "henrique.azevedo@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Desenvolvedor Mobile", departamento: "TI", role: "colaborador", nivel: 6, xp: 2600, xpProximo: 3500, estrelas: 215 },
  { id: "27", nome: "Renata Freitas", email: "renata.freitas@engageai.com", avatar: "/professional-avatar-woman.jpg", cargo: "Analista de Infraestrutura", departamento: "TI", role: "colaborador", nivel: 4, xp: 1800, xpProximo: 2300, estrelas: 165 },
  { id: "28", nome: "Leonardo Araújo", email: "leonardo.araujo@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Coordenador de Operações", departamento: "Operações", role: "colaborador", nivel: 6, xp: 2500, xpProximo: 3500, estrelas: 205 },
  { id: "29", nome: "Tatiana Lopes", email: "tatiana.lopes@engageai.com", avatar: "/professional-avatar-smiling-woman.jpg", cargo: "Analista de Processos", departamento: "Operações", role: "colaborador", nivel: 5, xp: 2100, xpProximo: 3000, estrelas: 180 },
  { id: "30", nome: "André Correia", email: "andre.correia@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Analista de Logística", departamento: "Operações", role: "colaborador", nivel: 4, xp: 1650, xpProximo: 2300, estrelas: 160 },
  { id: "31", nome: "Carla Martins", email: "carla.martins@engageai.com", avatar: "/professional-avatar-woman-glasses.jpg", cargo: "Assistente Operacional", departamento: "Operações", role: "colaborador", nivel: 3, xp: 950, xpProximo: 1500, estrelas: 115 },
  { id: "32", nome: "Fábio Pereira", email: "fabio.pereira@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Analista de Qualidade", departamento: "Operações", role: "colaborador", nivel: 5, xp: 2250, xpProximo: 3000, estrelas: 190 },
  { id: "33", nome: "Vanessa Duarte", email: "vanessa.duarte@engageai.com", avatar: "/professional-avatar-woman.jpg", cargo: "Analista de Melhoria Contínua", departamento: "Operações", role: "colaborador", nivel: 5, xp: 2200, xpProximo: 3000, estrelas: 185 },
  { id: "34", nome: "Ricardo Campos", email: "ricardo.campos@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Product Owner", departamento: "Produto", role: "colaborador", nivel: 7, xp: 3150, xpProximo: 4000, estrelas: 275 },
  { id: "35", nome: "Isabela Rodrigues", email: "isabela.rodrigues@engageai.com", avatar: "/professional-avatar-smiling-woman.jpg", cargo: "Product Manager", departamento: "Produto", role: "colaborador", nivel: 6, xp: 2750, xpProximo: 3500, estrelas: 225 },
  { id: "36", nome: "Gustavo Farias", email: "gustavo.farias@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Product Designer", departamento: "Produto", role: "colaborador", nivel: 6, xp: 2650, xpProximo: 3500, estrelas: 220 },
  { id: "37", nome: "Priscila Monteiro", email: "priscila.monteiro@engageai.com", avatar: "/professional-avatar-woman.jpg", cargo: "UX Researcher", departamento: "Produto", role: "colaborador", nivel: 5, xp: 2300, xpProximo: 3000, estrelas: 195 },
  { id: "38", nome: "Eduardo Batista", email: "eduardo.batista@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Analista de Produto", departamento: "Produto", role: "colaborador", nivel: 4, xp: 1750, xpProximo: 2300, estrelas: 165 },
  { id: "39", nome: "Letícia Ramos", email: "leticia.ramos@engageai.com", avatar: "/professional-avatar-woman-glasses.jpg", cargo: "Product Marketing", departamento: "Produto", role: "colaborador", nivel: 5, xp: 2400, xpProximo: 3000, estrelas: 200 },
  { id: "40", nome: "Marcos Vieira", email: "marcos.vieira@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Business Analyst", departamento: "Produto", role: "colaborador", nivel: 5, xp: 2150, xpProximo: 3000, estrelas: 185 },
  { id: "41", nome: "Cristiane Nunes", email: "cristiane.nunes@engageai.com", avatar: "/professional-avatar-smiling-woman.jpg", cargo: "Customer Success Manager", departamento: "Customer Success", role: "colaborador", nivel: 6, xp: 2550, xpProximo: 3500, estrelas: 210 },
  { id: "42", nome: "Paulo Santana", email: "paulo.santana@engageai.com", avatar: "/professional-avatar-man.jpg", cargo: "Customer Success Analyst", departamento: "Customer Success", role: "colaborador", nivel: 4, xp: 1600, xpProximo: 2300, estrelas: 155 },
  { id: "43", nome: "Amanda Tavares", email: "amanda.tavares@engageai.com", avatar: "/professional-avatar-woman.jpg", cargo: "Customer Support", departamento: "Customer Success", role: "colaborador", nivel: 4, xp: 1450, xpProximo: 2300, estrelas: 145 },
  { id: "44", nome: "Diego Brito", email: "diego.brito@engageai.com", avatar: "/professional-avatar-smiling.jpg", cargo: "Customer Support", departamento: "Customer Success", role: "colaborador", nivel: 3, xp: 1050, xpProximo: 1500, estrelas: 125 },
  { id: "45", nome: "Simone Carvalho", email: "simone.carvalho@engageai.com", avatar: "/professional-avatar-woman-glasses.jpg", cargo: "Onboarding Specialist", departamento: "Customer Success", role: "colaborador", nivel: 5, xp: 2050, xpProximo: 3000, estrelas: 175 },
]

/** Maps backend role (super_admin) to frontend convention (super-admin) */
function mapRole(backendRole: string): UserRole {
  if (backendRole === "super_admin") return "super-admin"
  return backendRole as UserRole
}

/** Maps a backend user object to the frontend User shape */
function mapBackendUser(data: Record<string, unknown>, teamIds?: string[]): User {
  return {
    id: String(data.id),
    nome: String(data.nome),
    email: String(data.email),
    avatar: (data.avatar as string) || "/professional-avatar-man.jpg",
    cargo: String(data.cargo),
    departamento: String(data.departamento),
    role: mapRole(String(data.role)),
    nivel: Number(data.nivel) || 1,
    xp: Number(data.xp) || 0,
    xpProximo: Number(data.xpProximo) || 1000,
    estrelas: Number(data.estrelas) || 0,
    timeGerenciado: teamIds,
    telefone: data.telefone as string | undefined,
    localizacao: data.localizacao as string | undefined,
    hiredAt: data.hiredAt as string | undefined,
    bio: data.bio as string | undefined,
    createdAt: data.createdAt as string | undefined,
    managerId: data.managerId as string | undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasRegisteredMood, setHasRegisteredMood] = useState(false)

  /** Load user from /auth/me if access token exists */
  const loadCurrentUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const meRes = await apiFetch<{ data: Record<string, unknown> }>("/auth/me")
      const backendUser = meRes.data

      let teamIds: string[] | undefined
      const role = mapRole(String(backendUser.role))
      if (role === "gestor") {
        try {
          const userId = String(backendUser.id)
          const teamRes = await apiFetch<{ data: Array<{ id: string }> }>(`/users/${userId}/team`)
          teamIds = teamRes.data.map((u) => String(u.id))
        } catch {
          teamIds = []
        }
      }

      const mappedUser = mapBackendUser(backendUser, teamIds)
      setUser(mappedUser)

      // Check today's mood
      try {
        const moodRes = await apiFetch<{ data: Array<unknown> }>("/mood/history?days=1")
        setHasRegisteredMood((moodRes.data?.length ?? 0) > 0)
      } catch {
        setHasRegisteredMood(false)
      }
    } catch {
      clearTokens()
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCurrentUser()
  }, [loadCurrentUser])

  const login = async (email: string, password: string): Promise<void> => {
    const json = await apiFetch<{
      data: { accessToken: string; refreshToken: string; user: Record<string, unknown> }
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    const res = json.data

    setTokens(res.accessToken, res.refreshToken)

    const role = mapRole(String(res.user.role))
    let teamIds: string[] | undefined
    if (role === "gestor") {
      try {
        const userId = String(res.user.id)
        const teamRes = await apiFetch<{ data: Array<{ id: string }> }>(`/users/${userId}/team`)
        teamIds = teamRes.data.map((u) => String(u.id))
      } catch {
        teamIds = []
      }
    }

    setUser(mapBackendUser(res.user, teamIds))

    // Check mood
    try {
      const today = new Date().toISOString().split("T")[0]
      const moodRes = await apiFetch<{ data: Array<unknown> }>(
        `/mood/history?startDate=${today}&endDate=${today}`,
      )
      setHasRegisteredMood((moodRes.data?.length ?? 0) > 0)
    } catch {
      setHasRegisteredMood(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem("engageai-refresh-token")
      if (refreshToken) {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch {
      // Ignore errors on logout
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  const hasPermission = (requiredRole: UserRole | UserRole[]) => {
    if (!user) return false
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const roleHierarchy: Record<UserRole, number> = {
      colaborador: 1,
      gestor: 2,
      "super-admin": 3,
    }
    const userLevel = roleHierarchy[user.role]
    return roles.some((role) => userLevel >= roleHierarchy[role])
  }

  const canManageUser = (targetUserId: string) => {
    if (!user) return false
    if (user.role === "super-admin") return true
    if (user.role === "gestor" && user.timeGerenciado) {
      return user.timeGerenciado.includes(targetUserId)
    }
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        login,
        logout,
        hasPermission,
        canManageUser,
        hasRegisteredMood,
        setHasRegisteredMood,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
