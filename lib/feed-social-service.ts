// Service para analytics do Feed Social da plataforma
export interface Post {
  id: string
  autor: string
  userId: string
  departamento: string
  tempo: string
  conteudo: string
  reacoes: {
    likes: number
    estrelas: number
    comentarios: number
  }
}

export interface FeedUserActivity {
  userId: string
  nome: string
  departamento: string
  totalPostagens: number
  totalComentarios: number
  totalCurtidas: number
  totalCompartilhamentos: number
  ultimaInteracao: string
  statusAtividade: "ativo" | "moderado" | "inativo"
  engajamentoRecebido: number
}

export interface FeedMetrics {
  totalPostagens: number
  totalComentarios: number
  totalCurtidas: number
  totalCompartilhamentos: number
  usuariosAtivos: number
  taxaEngajamento: number
}

export interface FeedContent {
  id: string
  tipo: "post" | "comentario" | "compartilhamento"
  autor: string
  userId: string
  data: string
  alcance: number
  interacoes: number
  engajamento: number
}

export class FeedSocialService {
  private static readonly STORAGE_KEY = "engageai-feed-posts"

  private static getPosts(): Post[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return this.getMockPosts()
      }
    }

    return this.getMockPosts()
  }

  private static getMockPosts(): Post[] {
    const today = new Date()
    const posts: Post[] = []

    // Gerar postagens dos últimos 30 dias
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // 2-5 postagens por dia
      const postsPerDay = 2 + Math.floor(Math.random() * 4)

      for (let j = 0; j < postsPerDay; j++) {
        const postId = `post-${i}-${j}`
        const userId = String(Math.floor(Math.random() * 10) + 1)
        posts.push({
          id: postId,
          autor: `Colaborador ${userId}`,
          userId,
          departamento: ["Time Criativo", "Time Comercial", "Time TI", "Time Operações"][Math.floor(Math.random() * 4)],
          tempo: date.toISOString(),
          conteudo: `Postagem do dia ${date.toLocaleDateString("pt-BR")}`,
          reacoes: {
            likes: Math.floor(Math.random() * 50),
            estrelas: Math.floor(Math.random() * 20),
            comentarios: Math.floor(Math.random() * 15),
          },
        })
      }
    }

    return posts.sort((a, b) => new Date(b.tempo).getTime() - new Date(a.tempo).getTime())
  }

  static getFeedMetrics(userIds?: string[]): FeedMetrics {
    const posts = this.getPosts()
    const filteredPosts = userIds ? posts.filter((p) => userIds.includes(p.userId)) : posts

    if (!Array.isArray(filteredPosts) || filteredPosts.length === 0) {
      return {
        totalPostagens: 0,
        totalComentarios: 0,
        totalCurtidas: 0,
        totalCompartilhamentos: 0,
        usuariosAtivos: 0,
        taxaEngajamento: 0,
      }
    }

    const totalPostagens = filteredPosts.length
    const totalComentarios = filteredPosts.reduce((acc, p) => acc + (p.reacoes?.comentarios || 0), 0)
    const totalCurtidas = filteredPosts.reduce((acc, p) => acc + (p.reacoes?.likes || 0), 0)
    const totalCompartilhamentos = filteredPosts.reduce((acc, p) => acc + (p.reacoes?.estrelas || 0), 0)

    const usuariosAtivos = new Set(filteredPosts.map((p) => p.userId)).size
    const totalInteracoes = totalComentarios + totalCurtidas + totalCompartilhamentos
    const taxaEngajamento = totalPostagens > 0 ? Math.round((totalInteracoes / totalPostagens) * 100) / 100 : 0

    return {
      totalPostagens,
      totalComentarios,
      totalCurtidas,
      totalCompartilhamentos,
      usuariosAtivos,
      taxaEngajamento,
    }
  }

  static getUserActivities(userIds?: string[]): FeedUserActivity[] {
    const posts = this.getPosts()
    const filteredPosts = userIds ? posts.filter((p) => userIds.includes(p.userId)) : posts

    if (!Array.isArray(filteredPosts) || filteredPosts.length === 0) {
      return []
    }

    const userMap = new Map<string, FeedUserActivity>()

    filteredPosts.forEach((post) => {
      if (!post.userId) return

      if (!userMap.has(post.userId)) {
        userMap.set(post.userId, {
          userId: post.userId,
          nome: post.autor || "Usuário Desconhecido",
          departamento: post.departamento || "Sem Departamento",
          totalPostagens: 0,
          totalComentarios: 0,
          totalCurtidas: 0,
          totalCompartilhamentos: 0,
          ultimaInteracao: post.tempo || new Date().toISOString(),
          statusAtividade: "inativo",
          engajamentoRecebido: 0,
        })
      }

      const activity = userMap.get(post.userId)!
      activity.totalPostagens++
      activity.totalComentarios += post.reacoes?.comentarios || 0
      activity.totalCurtidas += post.reacoes?.likes || 0
      activity.totalCompartilhamentos += post.reacoes?.estrelas || 0
      activity.engajamentoRecebido +=
        (post.reacoes?.likes || 0) + (post.reacoes?.estrelas || 0) + (post.reacoes?.comentarios || 0)

      // Atualizar última interação
      if (post.tempo && new Date(post.tempo) > new Date(activity.ultimaInteracao)) {
        activity.ultimaInteracao = post.tempo
      }
    })

    // Calcular status de atividade
    userMap.forEach((activity) => {
      const totalInteracoes = activity.totalPostagens + activity.totalComentarios
      if (totalInteracoes >= 5) {
        activity.statusAtividade = "ativo"
      } else if (totalInteracoes >= 2) {
        activity.statusAtividade = "moderado"
      } else {
        activity.statusAtividade = "inativo"
      }
    })

    return Array.from(userMap.values()).sort((a, b) => b.totalPostagens - a.totalPostagens)
  }

  static getFeedContents(userIds?: string[]): FeedContent[] {
    const posts = this.getPosts()
    const filteredPosts = userIds ? posts.filter((p) => userIds.includes(p.userId)) : posts

    if (!Array.isArray(filteredPosts) || filteredPosts.length === 0) {
      return []
    }

    return filteredPosts
      .map((post) => {
        const interacoes = (post.reacoes?.likes || 0) + (post.reacoes?.estrelas || 0) + (post.reacoes?.comentarios || 0)
        return {
          id: post.id,
          tipo: "post" as const,
          autor: post.autor || "Usuário Desconhecido",
          userId: post.userId,
          data: post.tempo || new Date().toISOString(),
          alcance: 100, // Mock - em produção seria calculado
          interacoes,
          engajamento: interacoes > 0 ? Math.round((interacoes / 100) * 100) : 0,
        }
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  }

  static getInactiveUsers(
    allUserIds: string[],
  ): Array<{ userId: string; nome: string; departamento: string; diasInativo: number }> {
    const posts = this.getPosts()
    const activeUserIds = new Set(posts.map((p) => p.userId))

    return allUserIds
      .filter((id) => !activeUserIds.has(id))
      .map((id) => ({
        userId: id,
        nome: "Colaborador " + id,
        departamento: "Time Criativo",
        diasInativo: 30, // Mock - em produção seria calculado
      }))
  }

  static getPostsEvolution(
    userIds?: string[],
    days = 30,
  ): Array<{ data: string; postagens: number; interacoes: number }> {
    const posts = this.getPosts()
    const filteredPosts = userIds ? posts.filter((p) => userIds.includes(p.userId)) : posts

    if (!Array.isArray(filteredPosts) || filteredPosts.length === 0) {
      return []
    }

    const today = new Date()
    const evolutionMap = new Map<string, { postagens: number; interacoes: number }>()

    // Inicializar todos os dias
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split("T")[0]
      evolutionMap.set(dateKey, { postagens: 0, interacoes: 0 })
    }

    // Contar postagens e interações por dia
    filteredPosts.forEach((post) => {
      if (!post.tempo) return
      const dateKey = post.tempo.split("T")[0]
      if (evolutionMap.has(dateKey)) {
        const day = evolutionMap.get(dateKey)!
        day.postagens++
        day.interacoes += (post.reacoes?.likes || 0) + (post.reacoes?.estrelas || 0) + (post.reacoes?.comentarios || 0)
      }
    })

    return Array.from(evolutionMap.entries())
      .map(([data, stats]) => ({ data, ...stats }))
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
  }

  static getEngagementByTeam(): Array<{ time: string; postagens: number; engajamento: number }> {
    const posts = this.getPosts()

    if (!Array.isArray(posts) || posts.length === 0) {
      return []
    }

    const teamMap = new Map<string, { postagens: number; engajamento: number }>()

    posts.forEach((post) => {
      const team = post.departamento || "Sem Time"
      if (!teamMap.has(team)) {
        teamMap.set(team, { postagens: 0, engajamento: 0 })
      }
      const teamData = teamMap.get(team)!
      teamData.postagens++
      teamData.engajamento +=
        (post.reacoes?.likes || 0) + (post.reacoes?.estrelas || 0) + (post.reacoes?.comentarios || 0)
    })

    return Array.from(teamMap.entries())
      .map(([time, stats]) => ({ time, ...stats }))
      .sort((a, b) => b.engajamento - a.engajamento)
  }
}
