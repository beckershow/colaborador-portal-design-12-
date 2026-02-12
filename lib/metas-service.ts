"use client"

import { GamificationGuard } from "@/lib/gamification-guard"
import type { UserRole } from "@/lib/auth-context"

export type MetaStatus = "rascunho" | "ativa" | "inativa" | "concluida"
export type TipoMeta = "engajamento" | "desenvolvimento" | "lideranca"
export type PublicoAlvo = "colaboradores" | "gestores"
export type EscopoMeta = "individual" | "time"
export type PeriodoMeta = "semanal" | "mensal" | "trimestral"

export interface CriterioMeta {
  id: string
  acao:
    | "registro-humor"
    | "publicacao-feed"
    | "curtida"
    | "comentario"
    | "envio-feedback"
    | "resposta-pesquisa"
    | "conclusao-treinamento"
    | "participacao-trilha"
    | "participacao-evento"
    | "interacao-recorrente"
  quantidadeMinima: number
  descricao: string
}

export interface Meta {
  id: string
  // Informações Básicas
  nome: string
  descricao: string
  tipo: TipoMeta
  publicoAlvo: PublicoAlvo
  escopo: EscopoMeta
  periodo: PeriodoMeta

  // Configuração de Critérios
  criterios: CriterioMeta[]

  // Governança
  status: MetaStatus
  disponivelParaGestores: boolean // Se gestores podem ativar para seus times

  // Auditoria
  criadoPor: string
  criadoEm: string
  atualizadoPor?: string
  atualizadoEm?: string
  ativadoPor?: string
  ativadoEm?: string

  // Controle
  gestoresQueAtivaram: string[] // IDs dos gestores que ativaram para seus times
  timesAtivos: string[] // IDs dos times onde está ativa
}

export interface ProgressoMeta {
  metaId: string
  colaboradorId: string
  criteriosCompletos: { [criterioId: string]: number } // criterioId -> quantidade atual
  progresso: number // 0-100
  concluida: boolean
  dataInicio: string
  dataConclusao?: string
}

export interface RecomendacaoMeta {
  categoria: "Engajamento" | "Desenvolvimento" | "Liderança"
  titulo: string
  objetivo: string
  acoesSugeridas: string[]
  beneficioEsperado: string
}

const STORAGE_KEY_METAS = "engageai-metas"
const STORAGE_KEY_PROGRESSOS = "engageai-metas-progressos"

const mockRecomendacoes: RecomendacaoMeta[] = [
  {
    categoria: "Engajamento",
    titulo: "Cultura de Feedback Contínuo",
    objetivo: "Aumentar frequência de feedbacks construtivos entre pares",
    acoesSugeridas: [
      "5 envios de feedback no período",
      "3 participações em pesquisas rápidas",
      "Registro diário de humor por 5 dias",
    ],
    beneficioEsperado: "Aumento de 35% em transparência e comunicação interna",
  },
  {
    categoria: "Engajamento",
    titulo: "Protagonismo no Feed Social",
    objetivo: "Estimular colaboração e visibilidade de realizações",
    acoesSugeridas: [
      "3 publicações no feed com conteúdo relevante",
      "10 curtidas em posts de colegas",
      "5 comentários construtivos",
    ],
    beneficioEsperado: "Aumento de 40% em engajamento social e senso de pertencimento",
  },
  {
    categoria: "Engajamento",
    titulo: "Consistência de Presença",
    objetivo: "Criar hábito de check-in regular na plataforma",
    acoesSugeridas: [
      "Registro de humor diário por 7 dias consecutivos",
      "2 interações no feed por semana",
      "Participação em 1 pesquisa semanal",
    ],
    beneficioEsperado: "Melhoria de 50% na frequência de uso e engajamento recorrente",
  },
  {
    categoria: "Desenvolvimento",
    titulo: "Crescimento Técnico Contínuo",
    objetivo: "Desenvolver novas competências através de aprendizagem estruturada",
    acoesSugeridas: [
      "Conclusão de 2 treinamentos no período",
      "Participação em 1 trilha de aprendizagem",
      "Aplicação prática do conhecimento (evidência no feed)",
    ],
    beneficioEsperado: "Aumento de 60% em capacitação técnica e performance individual",
  },
  {
    categoria: "Desenvolvimento",
    titulo: "Aprendizagem Colaborativa",
    objetivo: "Promover troca de conhecimento entre times",
    acoesSugeridas: [
      "Participação em 2 eventos corporativos",
      "Conclusão de 1 treinamento compartilhado",
      "Publicação de aprendizado no feed (1 post)",
    ],
    beneficioEsperado: "Melhoria de 45% em sinergia entre times e disseminação de conhecimento",
  },
  {
    categoria: "Desenvolvimento",
    titulo: "Construção de Trilha Profissional",
    objetivo: "Estruturar caminho de evolução de carreira",
    acoesSugeridas: [
      "Participação completa em 1 trilha de desenvolvimento",
      "Conclusão de 3 treinamentos complementares",
      "Feedback de performance recebido (mínimo 1)",
    ],
    beneficioEsperado: "Aumento de 55% em clareza de carreira e preparação para próximo nível",
  },
  {
    categoria: "Liderança",
    titulo: "Gestor Desenvolvedor de Talentos",
    objetivo: "Fortalecer acompanhamento e desenvolvimento do time",
    acoesSugeridas: [
      "Envio de 5 feedbacks construtivos para membros do time",
      "Criação de 1 ação de engajamento para o time",
      "Participação em 2 eventos de desenvolvimento",
    ],
    beneficioEsperado: "Aumento de 70% em satisfação do time e retenção de talentos",
  },
  {
    categoria: "Liderança",
    titulo: "Liderança Presente e Engajadora",
    objetivo: "Aumentar presença ativa e reconhecimento no time",
    acoesSugeridas: [
      "Registro de humor diário (exemplo para o time)",
      "5 interações no feed com posts do time",
      "Envio de 3 reconhecimentos públicos",
    ],
    beneficioEsperado: "Melhoria de 65% em clima organizacional e motivação do time",
  },
  {
    categoria: "Liderança",
    titulo: "Gestor Estratégico de Performance",
    objetivo: "Alinhar time com metas e criar cultura de resultados",
    acoesSugeridas: [
      "Definição de 1 meta de time com acompanhamento",
      "Envio de 7 feedbacks direcionados a performance",
      "Participação em trilha de gestão de resultados",
    ],
    beneficioEsperado: "Aumento de 80% em atingimento de metas e clareza de expectativas",
  },
]

export class MetasService {
  // ===== METAS =====

  static getAllMetas(): Meta[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY_METAS)
    return stored ? JSON.parse(stored) : []
  }

  static getMetasByStatus(status: MetaStatus): Meta[] {
    return this.getAllMetas().filter((meta) => meta.status === status)
  }

  static getMetasAtivasParaColaborador(userRole?: UserRole): Meta[] {
    // GAMIFICATION GUARD: Apenas colaboradores têm metas
    if (userRole && !GamificationGuard.canHaveGoals(userRole)) {
      return []
    }
    const metas = this.getAllMetas()
    return metas.filter((meta) => meta.status === "ativa")
  }

  static getMetasAtivasParaGestor(): Meta[] {
    return this.getAllMetas().filter((meta) => meta.status === "ativa" && meta.publicoAlvo === "gestores")
  }

  static getMetasDisponiveisParaGestorAtivar(): Meta[] {
    return this.getAllMetas().filter(
      (meta) => meta.status === "ativa" && meta.disponivelParaGestores && meta.publicoAlvo === "colaboradores",
    )
  }

  static getMetaById(id: string): Meta | undefined {
    return this.getAllMetas().find((meta) => meta.id === id)
  }

  static createMeta(meta: Omit<Meta, "id" | "criadoEm" | "gestoresQueAtivaram" | "timesAtivos">): Meta {
    const newMeta: Meta = {
      ...meta,
      id: `meta-${Date.now()}`,
      criadoEm: new Date().toISOString(),
      gestoresQueAtivaram: [],
      timesAtivos: [],
    }

    const metas = this.getAllMetas()
    metas.push(newMeta)
    localStorage.setItem(STORAGE_KEY_METAS, JSON.stringify(metas))

    return newMeta
  }

  static updateMeta(id: string, updates: Partial<Meta>): boolean {
    const metas = this.getAllMetas()
    const index = metas.findIndex((m) => m.id === id)

    if (index === -1) return false

    metas[index] = {
      ...metas[index],
      ...updates,
      atualizadoEm: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY_METAS, JSON.stringify(metas))
    return true
  }

  static ativarMetaParaTime(metaId: string, gestorId: string, timeId: string): boolean {
    const metas = this.getAllMetas()
    const meta = metas.find((m) => m.id === metaId)

    if (!meta || meta.status !== "ativa" || !meta.disponivelParaGestores) return false

    if (!meta.gestoresQueAtivaram.includes(gestorId)) {
      meta.gestoresQueAtivaram.push(gestorId)
    }

    if (!meta.timesAtivos.includes(timeId)) {
      meta.timesAtivos.push(timeId)
    }

    meta.ativadoPor = gestorId
    meta.ativadoEm = new Date().toISOString()

    localStorage.setItem(STORAGE_KEY_METAS, JSON.stringify(metas))
    return true
  }

  static deleteMeta(id: string): boolean {
    const metas = this.getAllMetas().filter((m) => m.id !== id)
    localStorage.setItem(STORAGE_KEY_METAS, JSON.stringify(metas))
    return true
  }

  // ===== PROGRESSOS =====

  static getAllProgressos(): ProgressoMeta[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESSOS)
    return stored ? JSON.parse(stored) : []
  }

  static getProgressoColaborador(colaboradorId: string): ProgressoMeta[] {
    return this.getAllProgressos().filter((p) => p.colaboradorId === colaboradorId)
  }

  static getProgressoMeta(metaId: string, colaboradorId: string): ProgressoMeta | undefined {
    return this.getAllProgressos().find((p) => p.metaId === metaId && p.colaboradorId === colaboradorId)
  }

  static iniciarProgressoMeta(metaId: string, colaboradorId: string): ProgressoMeta {
    const meta = this.getMetaById(metaId)
    if (!meta) throw new Error("Meta não encontrada")

    const criteriosCompletos: { [key: string]: number } = {}
    meta.criterios.forEach((c) => {
      criteriosCompletos[c.id] = 0
    })

    const progresso: ProgressoMeta = {
      metaId,
      colaboradorId,
      criteriosCompletos,
      progresso: 0,
      concluida: false,
      dataInicio: new Date().toISOString(),
    }

    const progressos = this.getAllProgressos()
    progressos.push(progresso)
    localStorage.setItem(STORAGE_KEY_PROGRESSOS, JSON.stringify(progressos))

    return progresso
  }

  static atualizarProgressoCriterio(
    metaId: string,
    colaboradorId: string,
    criterioId: string,
    novoValor: number,
  ): boolean {
    // GAMIFICATION GUARD: Verificar role do colaborador
    const allUsers = JSON.parse(localStorage.getItem("engageai_users") || "[]")
    const user = allUsers.find((u: any) => u.id === colaboradorId)
    if (!user || !GamificationGuard.canHaveGoals(user.role as UserRole)) {
      console.log("[MetasService] Atualização de critério bloqueada para role:", user?.role)
      return false
    }

    const progressos = this.getAllProgressos()
    const index = progressos.findIndex((p) => p.metaId === metaId && p.colaboradorId === colaboradorId)

    if (index === -1) return false

    const progresso = progressos[index]
    const meta = this.getMetaById(metaId)
    if (!meta) return false

    progresso.criteriosCompletos[criterioId] = novoValor

    // Calcular progresso total
    let totalCompleto = 0
    let totalNecessario = 0

    meta.criterios.forEach((c) => {
      const valorAtual = progresso.criteriosCompletos[c.id] || 0
      totalCompleto += Math.min(valorAtual, c.quantidadeMinima)
      totalNecessario += c.quantidadeMinima
    })

    progresso.progresso = Math.round((totalCompleto / totalNecessario) * 100)

    // Verificar conclusão
    if (progresso.progresso >= 100 && !progresso.concluida) {
      progresso.concluida = true
      progresso.dataConclusao = new Date().toISOString()
    }

    localStorage.setItem(STORAGE_KEY_PROGRESSOS, JSON.stringify(progressos))
    return true
  }

  static getMetasConcluidasColaborador(colaboradorId: string): number {
    return this.getProgressoColaborador(colaboradorId).filter((p) => p.concluida).length
  }

  static getMetasAtivasComProgresso(colaboradorId: string): Array<Meta & { progresso: number; concluida: boolean }> {
    const metasAtivas = this.getMetasAtivasParaColaborador()
    const progressos = this.getProgressoColaborador(colaboradorId)

    return metasAtivas.map((meta) => {
      const progresso = progressos.find((p) => p.metaId === meta.id)
      return {
        ...meta,
        progresso: progresso?.progresso || 0,
        concluida: progresso?.concluida || false,
      }
    })
  }

  // ===== RECOMENDAÇÕES =====

  static getRecomendacoesPorCategoria(categoria: "Engajamento" | "Desenvolvimento" | "Liderança"): RecomendacaoMeta[] {
    return mockRecomendacoes.filter((r) => r.categoria === categoria)
  }

  static getAllRecomendacoes(): RecomendacaoMeta[] {
    return mockRecomendacoes
  }

  // ===== ESTATÍSTICAS =====

  static getEstatisticasGerais() {
    const metas = this.getAllMetas()
    const progressos = this.getAllProgressos()

    return {
      totalMetas: metas.length,
      metasAtivas: metas.filter((m) => m.status === "ativa").length,
      metasRascunho: metas.filter((m) => m.status === "rascunho").length,
      totalConclusoes: progressos.filter((p) => p.concluida).length,
      taxaMedia: progressos.length > 0 ? Math.round(progressos.reduce((acc, p) => acc + p.progresso, 0) / progressos.length) : 0,
    }
  }
}
