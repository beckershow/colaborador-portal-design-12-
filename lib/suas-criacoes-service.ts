import { EngajamentoService, type Engajamento } from "@/lib/engajamento-service"
import { SurveyService, type Survey } from "@/lib/survey-service"
import { TrainingService, type Course } from "@/lib/training-service"
import { MetasService, type Meta } from "@/lib/metas-service"
import { MissaoDoDiaService, type MissaoDoDia } from "@/lib/missao-do-dia-service"
import { EventoService, type Evento } from "@/lib/evento-service"

export type CreationType = "campanha" | "pesquisa" | "treinamento" | "meta" | "missao-do-dia" | "evento"

export interface Creation {
  id: string
  tipo: CreationType
  titulo: string
  status: string
  dataUltimaEdicao: string
  criadoPor: string
  data: Engajamento | Survey | Course | Meta | MissaoDoDia | Evento
}

export class SuasCriacoesService {
  /**
   * Obtém todas as criações de um gestor (base local/mock, sem treinamentos)
   */
  static getBaseCreations(userId: string): Creation[] {
    const creations: Creation[] = []

    // Campanhas (Engajamentos)
    const campanhas = EngajamentoService.getAllEngajamentos().filter(
      (eng) => eng.createdBy === userId
    )
    campanhas.forEach((campanha) => {
      creations.push({
        id: campanha.id,
        tipo: "campanha",
        titulo: campanha.title,
        status: campanha.isActive ? "Ativo" : "Inativo",
        dataUltimaEdicao: campanha.createdAt, // Using createdAt as last edit for now
        criadoPor: campanha.createdBy,
        data: campanha,
      })
    })

    // Pesquisas
    const pesquisas = SurveyService.getAllSurveys().filter(
      (survey) => survey.createdBy === userId
    )
    pesquisas.forEach((pesquisa) => {
      creations.push({
        id: pesquisa.id,
        tipo: "pesquisa",
        titulo: pesquisa.title,
        status: pesquisa.status,
        dataUltimaEdicao: pesquisa.createdAt,
        criadoPor: pesquisa.createdBy,
        data: pesquisa,
      })
    })

    // Metas
    const metas = MetasService.getAllMetas().filter(
      (meta) => meta.criadoPor === userId
    )
    metas.forEach((meta) => {
      creations.push({
        id: meta.id,
        tipo: "meta",
        titulo: meta.titulo,
        status: meta.status,
        dataUltimaEdicao: meta.criadaEm,
        criadoPor: meta.criadoPor,
        data: meta,
      })
    })

    // Missões do Dia
    const missoes = MissaoDoDiaService.getAllMissoes().filter(
      (missao) => missao.criadoPor === userId
    )
    missoes.forEach((missao) => {
      creations.push({
        id: missao.id,
        tipo: "missao-do-dia",
        titulo: missao.titulo,
        status: missao.ativa ? "Ativo" : "Inativo",
        dataUltimaEdicao: missao.criadaEm,
        criadoPor: missao.criadoPor,
        data: missao,
      })
    })

    // Eventos
    const eventos = EventoService.getAllEventos().filter(
      (evento) => evento.createdBy === userId
    )
    eventos.forEach((evento) => {
      creations.push({
        id: evento.id,
        tipo: "evento",
        titulo: evento.title,
        status: evento.isActive ? "Ativo" : "Inativo",
        dataUltimaEdicao: evento.createdAt,
        criadoPor: evento.createdBy,
        data: evento,
      })
    })

    // Ordenar por data de última edição (mais recente primeiro)
    return creations.sort((a, b) => {
      return new Date(b.dataUltimaEdicao).getTime() - new Date(a.dataUltimaEdicao).getTime()
    })
  }

  /**
   * Obtém todas as criações de um gestor (inclui treinamentos locais/mock)
   */
  static getAllCreations(userId: string): Creation[] {
    const creations = this.getBaseCreations(userId)

    const treinamentos = TrainingService.getAllCourses().filter(
      (training) => training.instructor === userId
    )
    treinamentos.forEach((treinamento) => {
      creations.push({
        id: treinamento.id,
        tipo: "treinamento",
        titulo: treinamento.title,
        status: "Ativo",
        dataUltimaEdicao: treinamento.createdAt,
        criadoPor: treinamento.instructor,
        data: treinamento,
      })
    })

    return creations.sort((a, b) => {
      return new Date(b.dataUltimaEdicao).getTime() - new Date(a.dataUltimaEdicao).getTime()
    })
  }

  /**
   * Obtém criações por tipo
   */
  static getCreationsByType(userId: string, tipo: CreationType): Creation[] {
    return this.getAllCreations(userId).filter((creation) => creation.tipo === tipo)
  }

  /**
   * Busca criações por nome
   */
  static searchCreations(userId: string, searchTerm: string): Creation[] {
    const allCreations = this.getAllCreations(userId)
    return allCreations.filter((creation) =>
      creation.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  /**
   * Filtra criações por tipo e termo de busca
   */
  static filterCreations(userId: string, tipo?: CreationType, searchTerm?: string): Creation[] {
    let creations = this.getAllCreations(userId)

    if (tipo) {
      creations = creations.filter((creation) => creation.tipo === tipo)
    }

    if (searchTerm && searchTerm.trim()) {
      creations = creations.filter((creation) =>
        creation.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return creations
  }

  /**
   * Obtém uma criação específica
   */
  static getCreation(id: string, tipo: CreationType): Creation | null {
    let data: any = null

    switch (tipo) {
      case "campanha":
        data = EngajamentoService.getAllEngajamentos().find((e) => e.id === id)
        break
      case "pesquisa":
        data = SurveyService.getAllSurveys().find((s) => s.id === id)
        break
      case "treinamento":
        data = TrainingService.getAllCourses().find((t) => t.id === id)
        break
      case "meta":
        data = MetasService.getAllMetas().find((m) => m.id === id)
        break
      case "missao-do-dia":
        data = MissaoDoDiaService.getAllMissoes().find((m) => m.id === id)
        break
      case "evento":
        data = EventoService.getAllEventos().find((e) => e.id === id)
        break
    }

    if (!data) return null

    return {
      id: data.id,
      tipo,
      titulo: this.getTituloFromData(data, tipo),
      status: this.getStatusFromData(data, tipo),
      dataUltimaEdicao: this.getDataUltimaEdicaoFromData(data, tipo),
      criadoPor: this.getCriadoPorFromData(data, tipo),
      data,
    }
  }

  private static getTituloFromData(data: any, tipo: CreationType): string {
    switch (tipo) {
      case "campanha":
        return data.title
      case "pesquisa":
        return data.title
      case "treinamento":
        return data.title
      case "meta":
        return data.titulo
      case "missao-do-dia":
        return data.titulo
      case "evento":
        return data.title
      default:
        return ""
    }
  }

  private static getStatusFromData(data: any, tipo: CreationType): string {
    switch (tipo) {
      case "campanha":
        return data.isActive ? "Ativo" : "Inativo"
      case "pesquisa":
        return data.status
      case "treinamento":
        return "Ativo" // Courses don't have isActive property
      case "meta":
        return data.status
      case "missao-do-dia":
        return data.ativa ? "Ativo" : "Inativo"
      case "evento":
        return data.isActive ? "Ativo" : "Inativo"
      default:
        return ""
    }
  }

  private static getDataUltimaEdicaoFromData(data: any, tipo: CreationType): string {
    switch (tipo) {
      case "campanha":
        return data.createdAt
      case "pesquisa":
        return data.createdAt
      case "treinamento":
        return data.createdAt
      case "meta":
        return data.criadaEm
      case "missao-do-dia":
        return data.criadaEm
      case "evento":
        return data.createdAt
      default:
        return ""
    }
  }

  private static getCriadoPorFromData(data: any, tipo: CreationType): string {
    switch (tipo) {
      case "campanha":
        return data.createdBy
      case "pesquisa":
        return data.createdBy
      case "treinamento":
        return data.instructor
      case "meta":
        return data.criadoPor
      case "missao-do-dia":
        return data.criadoPor
      case "evento":
        return data.createdBy
      default:
        return ""
    }
  }

  /**
   * Traduz o tipo para exibição
   */
  static translateType(tipo: CreationType): string {
    const translations: Record<CreationType, string> = {
      campanha: "Campanha",
      pesquisa: "Pesquisa",
      treinamento: "Treinamento",
      meta: "Meta",
      "missao-do-dia": "Missão do Dia",
      evento: "Evento",
    }
    return translations[tipo]
  }

  /**
   * Obtém o URL de edição para um tipo de criação
   */
  static getEditUrl(tipo: CreationType, id: string): string {
    const urls: Record<CreationType, string> = {
      campanha: `/gestor/criar-engajamento?edit=${id}`,
      pesquisa: `/pesquisas/criar?edit=${id}`,
      treinamento: `/gestor/criar-treinamento?edit=${id}`,
      meta: `/admin/criar-meta?edit=${id}`,
      "missao-do-dia": `/gestor/criar-missao-do-dia?edit=${id}`,
      evento: `/gestor/criar-evento?edit=${id}`,
    }
    return urls[tipo]
  }
}
