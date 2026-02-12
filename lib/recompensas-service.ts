"use client"

export interface Recompensa {
  id: string
  nome: string
  categoria: string
  descricao: string
  custo: number
  quantidade: number | null
  imagem?: string
  ativo: boolean
  resgatado: number
  createdAt: string
}

const STORAGE_KEY = "engageai-recompensas"

export class RecompensasService {
  static getAll(): Recompensa[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      const defaultRecompensas: Recompensa[] = [
        {
          id: "1",
          nome: "Vale-Presente Amazon R$ 50",
          categoria: "Vale-Presente",
          custo: 500,
          quantidade: 25,
          ativo: true,
          resgatado: 12,
          descricao: "Um vale presente para usar na Amazon",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          nome: "Dia de Folga Extra",
          categoria: "Benefício",
          custo: 1000,
          quantidade: 10,
          ativo: true,
          resgatado: 8,
          descricao: "Um dia extra de folga remunerada",
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          nome: "Fone de Ouvido Bluetooth",
          categoria: "Eletrônico",
          custo: 800,
          quantidade: 15,
          ativo: true,
          resgatado: 15,
          descricao: "Fone de ouvido sem fio com cancelamento de ruído",
          createdAt: new Date().toISOString(),
        },
        {
          id: "4",
          nome: "Curso Online Premium",
          categoria: "Educação",
          custo: 600,
          quantidade: 50,
          ativo: true,
          resgatado: 23,
          descricao: "Acesso vitalício a cursos de alta qualidade",
          createdAt: new Date().toISOString(),
        },
        {
          id: "5",
          nome: "Kit Home Office",
          categoria: "Escritório",
          custo: 400,
          quantidade: 0,
          ativo: false,
          resgatado: 30,
          descricao: "Tudo o que você precisa para um home office produtivo",
          createdAt: new Date().toISOString(),
        },
      ]

      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultRecompensas))
      return defaultRecompensas
    }

    return JSON.parse(stored)
  }

  static getById(id: string): Recompensa | null {
    const all = this.getAll()
    return all.find((r) => r.id === id) || null
  }

  static getActive(): Recompensa[] {
    return this.getAll().filter((r) => r.ativo && (r.quantidade === null || r.quantidade > 0))
  }

  static create(data: Omit<Recompensa, "id" | "resgatado" | "createdAt">): Recompensa {
    const all = this.getAll()
    const newRecompensa: Recompensa = {
      ...data,
      id: Date.now().toString(),
      resgatado: 0,
      createdAt: new Date().toISOString(),
    }

    all.push(newRecompensa)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))

    return newRecompensa
  }

  static update(id: string, data: Partial<Omit<Recompensa, "id" | "resgatado" | "createdAt">>): Recompensa | null {
    const all = this.getAll()
    const index = all.findIndex((r) => r.id === id)

    if (index === -1) return null

    all[index] = {
      ...all[index],
      ...data,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    return all[index]
  }

  static delete(id: string): boolean {
    const all = this.getAll()
    const filtered = all.filter((r) => r.id !== id)

    if (filtered.length === all.length) return false

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  }

  static toggleStatus(id: string): Recompensa | null {
    const recompensa = this.getById(id)
    if (!recompensa) return null

    return this.update(id, { ativo: !recompensa.ativo })
  }

  static resgatar(id: string, userId: string): { success: boolean; message: string } {
    const recompensa = this.getById(id)

    if (!recompensa) {
      return { success: false, message: "Recompensa não encontrada" }
    }

    if (!recompensa.ativo) {
      return { success: false, message: "Recompensa não está ativa" }
    }

    if (recompensa.quantidade !== null && recompensa.quantidade <= 0) {
      return { success: false, message: "Recompensa esgotada" }
    }

    const all = this.getAll()
    const index = all.findIndex((r) => r.id === id)

    all[index] = {
      ...all[index],
      resgatado: all[index].resgatado + 1,
      quantidade: all[index].quantidade !== null ? all[index].quantidade! - 1 : null,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))

    return { success: true, message: "Recompensa resgatada com sucesso!" }
  }
}
