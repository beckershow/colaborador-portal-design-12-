"use client"

import { EngagementTrackingService } from "./engagement-tracking-service"

export type SurveyType = "pulse" | "long" | "event" | "satisfaction"
export type QuestionType = "rating" | "multiple-choice" | "text" | "yes-no" | "nps" | "checkbox"

export interface SurveyQuestion {
  id: string
  type: QuestionType
  question: string
  options?: string[]
  required: boolean
}

export interface Survey {
  id: string
  title: string
  description: string
  type: SurveyType
  questions: SurveyQuestion[]
  createdBy: string
  createdByName: string
  targetAudience: "all" | "department" | "specific"
  targetIds?: string[]
  isRequired: boolean
  deadline?: string
  reward: {
    xp: number
    stars: number
  }
  status: "draft" | "active" | "closed"
  createdAt: string
}

export interface SurveyResponse {
  id: string
  surveyId: string
  userId: string
  userName: string
  answers: Record<string, any>
  completedAt: string
}

const SURVEYS_KEY = "engageai-surveys"
const RESPONSES_KEY = "engageai-survey-responses"

export class SurveyService {
  static createSurvey(survey: Omit<Survey, "id" | "status" | "createdAt">): Survey {
    const newSurvey: Survey = {
      ...survey,
      id: `survey-${Date.now()}`,
      status: "draft",
      createdAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      const surveys = this.getAllSurveys()
      surveys.push(newSurvey)
      localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys))
    }

    return newSurvey
  }

  static getAllSurveys(): Survey[] {
    if (typeof window === "undefined") {
      return []
    }
    const stored = localStorage.getItem(SURVEYS_KEY)
    if (stored) {
      try {
        const surveys: Survey[] = JSON.parse(stored)
        if (surveys.length > 5) return surveys // Já tem dados suficientes
      } catch {}
    }

    // Gerar pesquisas mock
    const mockSurveys: Survey[] = [
      {
        id: "survey-1",
        title: "Satisfação com o Ambiente de Trabalho",
        description: "Avalie sua satisfação geral com o ambiente",
        type: "satisfaction",
        questions: [
          {
            id: "q1",
            type: "rating",
            question: "Como você avalia o ambiente de trabalho?",
            required: true,
          },
          {
            id: "q2",
            type: "nps",
            question: "Recomendaria nossa empresa? (0-10)",
            required: true,
          },
        ],
        createdBy: "admin",
        createdByName: "RH",
        targetAudience: "all",
        isRequired: false,
        reward: { xp: 50, stars: 10 },
        status: "active",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "survey-2",
        title: "Pulse Check Semanal",
        description: "Como foi sua semana?",
        type: "pulse",
        questions: [
          {
            id: "q1",
            type: "rating",
            question: "Como você avalia sua produtividade esta semana?",
            required: true,
          },
        ],
        createdBy: "admin",
        createdByName: "Gestão",
        targetAudience: "all",
        isRequired: true,
        reward: { xp: 20, stars: 5 },
        status: "active",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    localStorage.setItem(SURVEYS_KEY, JSON.stringify(mockSurveys))

    // Gerar respostas mock
    this.generateMockResponses(mockSurveys)

    return mockSurveys
  }

  private static generateMockResponses(surveys: Survey[]): void {
    const stored = localStorage.getItem(RESPONSES_KEY)
    if (stored) {
      try {
        const responses: SurveyResponse[] = JSON.parse(stored)
        if (responses.length > 50) return // Já tem dados suficientes
      } catch {}
    }

    const mockResponses: SurveyResponse[] = []
    const userIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

    surveys.forEach((survey) => {
      // 70-90% dos usuários respondem cada pesquisa
      const respondents = Math.floor(userIds.length * (0.7 + Math.random() * 0.2))

      for (let i = 0; i < respondents; i++) {
        const userId = userIds[i]
        const answers: Record<string, any> = {}

        survey.questions.forEach((q) => {
          if (q.type === "rating") {
            answers[q.id] = Math.floor(Math.random() * 3) + 3 // 3-5
          } else if (q.type === "nps") {
            answers[q.id] = Math.floor(Math.random() * 4) + 7 // 7-10
          }
        })

        mockResponses.push({
          id: `response-${survey.id}-${userId}`,
          surveyId: survey.id,
          userId,
          userName: `Colaborador ${userId}`,
          answers,
          completedAt: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    })

    localStorage.setItem(RESPONSES_KEY, JSON.stringify(mockResponses))
  }

  static getActiveSurveys(userId?: string, userDepartment?: string): Survey[] {
    const now = new Date()

    return this.getAllSurveys()
      .filter((s) => {
        if (s.status !== "active") return false

        if (s.deadline && new Date(s.deadline) < now) return false

        if (userId && this.hasUserResponded(s.id, userId)) return false

        if (s.targetAudience === "all") return true
        if (s.targetAudience === "department" && s.targetIds?.includes(userDepartment || "")) return true
        if (s.targetAudience === "specific" && s.targetIds?.includes(userId || "")) return true

        return false
      })
      .sort((a, b) => {
        if (a.isRequired && !b.isRequired) return -1
        if (!a.isRequired && b.isRequired) return 1

        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        }

        return 0
      })
  }

  static getSurveyById(surveyId: string): Survey | null {
    const surveys = this.getAllSurveys()
    return surveys.find((s) => s.id === surveyId) || null
  }

  static updateSurveyStatus(surveyId: string, status: "draft" | "active" | "closed"): void {
    if (typeof window === "undefined") {
      return
    }
    const surveys = this.getAllSurveys()
    const survey = surveys.find((s) => s.id === surveyId)
    if (survey) {
      survey.status = status
      localStorage.setItem(SURVEYS_KEY, JSON.stringify(surveys))
    }
  }

  static submitResponse(response: Omit<SurveyResponse, "id" | "completedAt">): SurveyResponse {
    const newResponse: SurveyResponse = {
      ...response,
      id: `response-${Date.now()}`,
      completedAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      const responses = this.getAllResponses()
      responses.push(newResponse)
      localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses))
      EngagementTrackingService.trackSurveyResponse(response.userId, response.surveyId)
    }

    return newResponse
  }

  static getAllResponses(): SurveyResponse[] {
    if (typeof window === "undefined") {
      return []
    }
    const stored = localStorage.getItem(RESPONSES_KEY)
    return stored ? JSON.parse(stored) : []
  }

  static getSurveyResponses(surveyId: string): SurveyResponse[] {
    return this.getAllResponses().filter((r) => r.surveyId === surveyId)
  }

  static getUserResponses(userId: string): SurveyResponse[] {
    return this.getAllResponses()
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  }

  static hasUserResponded(surveyId: string, userId: string): boolean {
    return this.getAllResponses().some((r) => r.surveyId === surveyId && r.userId === userId)
  }

  static getUserStats(userId: string) {
    const responses = this.getUserResponses(userId)
    const activeSurveys = this.getActiveSurveys(userId)

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const responsesThisMonth = responses.filter((r) => new Date(r.completedAt) >= thisMonth).length

    const totalXP = responses.reduce((sum, r) => {
      const survey = this.getSurveyById(r.surveyId)
      return sum + (survey?.reward.xp || 0)
    }, 0)

    const totalStars = responses.reduce((sum, r) => {
      const survey = this.getSurveyById(r.surveyId)
      return sum + (survey?.reward.stars || 0)
    }, 0)

    return {
      totalResponded: responses.length,
      respondedThisMonth: responsesThisMonth,
      pendingSurveys: activeSurveys.length,
      requiredPending: activeSurveys.filter((s) => s.isRequired).length,
      totalXP,
      totalStars,
      participationRate: responses.length > 0 ? Math.min(100, Math.round((responses.length / 15) * 100)) : 0,
    }
  }

  static getSurveyResults(surveyId: string): any {
    const survey = this.getSurveyById(surveyId)
    if (!survey) return null

    const responses = this.getSurveyResponses(surveyId)

    const results: any = {
      totalResponses: responses.length,
      questions: {},
    }

    survey.questions.forEach((q) => {
      const answers = responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined)

      if (q.type === "rating" || q.type === "nps") {
        const sum = answers.reduce((s: number, a: number) => s + a, 0)
        results.questions[q.id] = {
          type: q.type,
          question: q.question,
          average: answers.length > 0 ? (sum / answers.length).toFixed(1) : 0,
          distribution: answers.reduce(
            (dist: any, a: number) => {
              dist[a] = (dist[a] || 0) + 1
              return dist
            },
            {} as Record<number, number>,
          ),
        }
      } else if (q.type === "multiple-choice" || q.type === "yes-no") {
        const distribution = answers.reduce(
          (dist: any, a: string) => {
            dist[a] = (dist[a] || 0) + 1
            return dist
          },
          {} as Record<string, number>,
        )

        results.questions[q.id] = {
          type: q.type,
          question: q.question,
          distribution,
          total: answers.length,
        }
      } else if (q.type === "text") {
        results.questions[q.id] = {
          type: q.type,
          question: q.question,
          answers: answers,
          total: answers.length,
        }
      }
    })

    return results
  }
}
