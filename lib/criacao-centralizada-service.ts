"use client"

import { EngajamentoService, type Engajamento } from "./engajamento-service"
import { SurveyService, type Survey } from "./survey-service"
import { TrainingService, type Course } from "./training-service"
import { EventoService, type Evento } from "./evento-service"
import { RecompensasService, type Recompensa } from "./recompensas-service"
import { MissaoDoDiaService, type MissaoDoDia } from "./missao-do-dia-service"

export type CriacaoType = "engajamento" | "pesquisa" | "treinamento" | "evento" | "recompensa" | "missao-do-dia"

export interface CriacaoUnificada {
  id: string
  title: string
  type: CriacaoType
  creator: string
  createdAt: string
  status: string
  originalData: Engajamento | Survey | Course | Evento | Recompensa | MissaoDoDia
}

export class CriacaoCentralizadaService {
  static getAllCriacoes(): CriacaoUnificada[] {
    const criacoes: CriacaoUnificada[] = []

    // Engajamentos
    const engajamentos = EngajamentoService.getAllEngajamentos()
    engajamentos.forEach((eng) => {
      criacoes.push({
        id: eng.id,
        title: eng.title,
        type: "engajamento",
        creator: eng.createdBy,
        createdAt: eng.createdAt,
        status: eng.isActive ? "Ativo" : "Inativo",
        originalData: eng,
      })
    })

    // Pesquisas
    const pesquisas = SurveyService.getAllSurveys()
    pesquisas.forEach((survey) => {
      criacoes.push({
        id: survey.id,
        title: survey.title,
        type: "pesquisa",
        creator: survey.createdByName,
        createdAt: survey.createdAt,
        status: survey.status === "active" ? "Ativo" : survey.status === "draft" ? "Rascunho" : "Encerrado",
        originalData: survey,
      })
    })

    // Treinamentos
    const treinamentos = TrainingService.getAllCourses()
    treinamentos.forEach((course) => {
      criacoes.push({
        id: course.id,
        title: course.title,
        type: "treinamento",
        creator: course.instructor,
        createdAt: course.createdAt,
        status: course.isRequired ? "Obrigatório" : "Opcional",
        originalData: course,
      })
    })

    // Eventos
    const eventos = EventoService.getAllEventos()
    eventos.forEach((evento) => {
      criacoes.push({
        id: evento.id,
        title: evento.title,
        type: "evento",
        creator: evento.createdBy,
        createdAt: evento.createdAt,
        status: evento.isActive ? "Ativo" : "Inativo",
        originalData: evento,
      })
    })

    // Recompensas
    const recompensas = RecompensasService.getAll()
    recompensas.forEach((rec) => {
      criacoes.push({
        id: rec.id,
        title: rec.nome,
        type: "recompensa",
        creator: "Sistema",
        createdAt: rec.createdAt,
        status: rec.ativo ? "Ativo" : "Inativo",
        originalData: rec,
      })
    })

    const missoes = MissaoDoDiaService.getAllMissoes()
    missoes.forEach((missao) => {
      criacoes.push({
        id: missao.id,
        title: missao.title,
        type: "missao-do-dia",
        creator: missao.createdBy,
        createdAt: missao.createdAt,
        status: missao.isActive ? "Ativo" : "Inativo",
        originalData: missao,
      })
    })

    // Ordenar por data de criação (mais recentes primeiro)
    return criacoes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  static getCriacaoById(id: string, type: CriacaoType): any {
    switch (type) {
      case "engajamento":
        return EngajamentoService.getEngajamentoById(id)
      case "pesquisa":
        return SurveyService.getSurveyById(id)
      case "treinamento":
        return TrainingService.getCourseById(id)
      case "evento":
        return EventoService.getAllEventos().find((e) => e.id === id)
      case "recompensa":
        return RecompensasService.getById(id)
      case "missao-do-dia":
        return MissaoDoDiaService.getMissaoById(id)
      default:
        return null
    }
  }

  static getEditUrl(id: string, type: CriacaoType): string {
    switch (type) {
      case "engajamento":
        return `/gestor/criar-engajamento?edit=${id}`
      case "pesquisa":
        return `/pesquisas/criar?edit=${id}`
      case "treinamento":
        return `/gestor/criar-treinamento?edit=${id}`
      case "evento":
        return `/gestor/criar-evento?edit=${id}`
      case "recompensa":
        return `/admin?tab=lojinha&edit=${id}`
      case "missao-do-dia":
        return `/gestor/criar-missao-do-dia?edit=${id}`
      default:
        return "#"
    }
  }

  static getViewUrl(id: string, type: CriacaoType): string {
    switch (type) {
      case "engajamento":
        return `/engajamentos/${id}`
      case "pesquisa":
        return `/pesquisas/${id}`
      case "treinamento":
        return `/treinamentos/${id}`
      case "evento":
        return `/eventos/${id}`
      case "recompensa":
        return `/recompensas?id=${id}`
      case "missao-do-dia":
        return `/missao-do-dia/${id}`
      default:
        return "#"
    }
  }

  static getTypeLabel(type: CriacaoType): string {
    const labels: Record<CriacaoType, string> = {
      engajamento: "Engajamento",
      pesquisa: "Pesquisa",
      treinamento: "Treinamento",
      evento: "Evento",
      recompensa: "Recompensa",
      "missao-do-dia": "Missão do Dia",
    }
    return labels[type]
  }
}
