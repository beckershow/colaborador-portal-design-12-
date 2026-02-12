"use client"

export interface EventoParticipacao {
  userId: string
  userName: string
  confirmedAt: string
  participated?: boolean
  participatedAt?: string
  evidencia?: {
    type: "text" | "image"
    content: string
  }
  xpGranted?: boolean
}

export interface Evento {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  rewardXP: number
  rewardStars: number
  maxParticipants?: number
  isActive: boolean
  participants: EventoParticipacao[]
  createdBy: string
  createdAt: string
}

export class EventoService {
  private static STORAGE_KEY = "engageai_eventos"

  static getAllEventos(): Evento[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : this.getDefaultEventos()
  }

  static getDefaultEventos(): Evento[] {
    return [
      {
        id: "evt1",
        title: "Webinar: Engajamento Corporativo",
        description: "Aprenda as melhores práticas de engajamento de equipes",
        date: "2025-02-15",
        time: "14:00",
        location: "Plataforma Online",
        rewardXP: 80,
        rewardStars: 25,
        maxParticipants: 100,
        isActive: true,
        participants: [],
        createdBy: "Sistema",
        createdAt: new Date().toISOString(),
      },
    ]
  }

  static createEvento(data: Omit<Evento, "id" | "createdAt" | "participants">): Evento {
    const eventos = this.getAllEventos()
    const newEvento: Evento = {
      ...data,
      id: `evt${Date.now()}`,
      participants: [],
      createdAt: new Date().toISOString(),
    }
    eventos.push(newEvento)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventos))
    window.dispatchEvent(new Event("eventosUpdated"))
    return newEvento
  }

  static registrarParticipacao(eventoId: string, userId: string, userName?: string): boolean {
    const eventos = this.getAllEventos()
    const evento = eventos.find((e) => e.id === eventoId)
    if (!evento) return false

    const existingParticipant = evento.participants.find((p) => p.userId === userId)
    if (existingParticipant) return false

    if (evento.maxParticipants && evento.participants.length >= evento.maxParticipants) return false

    evento.participants.push({
      userId,
      userName: userName || "Usuário",
      confirmedAt: new Date().toISOString(),
      participated: false,
    })

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventos))
    window.dispatchEvent(new Event("eventosUpdated"))
    return true
  }

  static registrarParticipacaoPos(
    eventoId: string,
    userId: string,
    evidencia?: { type: "text" | "image"; content: string },
  ): { success: boolean; xpGranted: number; starsGranted: number } {
    const eventos = this.getAllEventos()
    const evento = eventos.find((e) => e.id === eventoId)
    if (!evento) return { success: false, xpGranted: 0, starsGranted: 0 }

    const participant = evento.participants.find((p) => p.userId === userId)
    if (!participant) return { success: false, xpGranted: 0, starsGranted: 0 }

    if (participant.participated) return { success: false, xpGranted: 0, starsGranted: 0 }

    participant.participated = true
    participant.participatedAt = new Date().toISOString()
    if (evidencia) {
      participant.evidencia = evidencia
    }
    participant.xpGranted = true

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(eventos))
    window.dispatchEvent(new Event("eventosUpdated"))

    if (typeof window !== "undefined") {
      const EngagementTrackingService = require("./engagement-tracking-service")
      EngagementTrackingService.trackEventParticipation(userId, eventoId)
    }

    return {
      success: true,
      xpGranted: evento.rewardXP,
      starsGranted: evento.rewardStars,
    }
  }

  static isRegistered(eventoId: string, userId: string): boolean {
    const evento = this.getAllEventos().find((e) => e.id === eventoId)
    return evento?.participants.some((p) => p.userId === userId) || false
  }

  static hasRegisteredParticipation(eventoId: string, userId: string): boolean {
    const evento = this.getAllEventos().find((e) => e.id === eventoId)
    const participant = evento?.participants.find((p) => p.userId === userId)
    return participant?.participated || false
  }

  static hasEventPassed(eventoId: string): boolean {
    const evento = this.getAllEventos().find((e) => e.id === eventoId)
    if (!evento) return false

    const eventDateTime = new Date(`${evento.date}T${evento.time}`)
    return eventDateTime < new Date()
  }

  static getUserParticipation(eventoId: string, userId: string): EventoParticipacao | undefined {
    const evento = this.getAllEventos().find((e) => e.id === eventoId)
    return evento?.participants.find((p) => p.userId === userId)
  }
}
