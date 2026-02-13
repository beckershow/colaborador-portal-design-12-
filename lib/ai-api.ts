"use client"

import { apiFetch } from "@/lib/api-client"

export async function requestTrainingAssist(objective: string, context?: string) {
  return apiFetch<{ data: { title: string; description: string } }>("/ai/training-assist", {
    method: "POST",
    body: JSON.stringify({ objective, context }),
  })
}

export async function requestTrainingQuestions(payload: {
  objective: string
  content: string
  fileUrls?: string[]
  summaryPercent?: number
  quantidade: number
  tipoResposta: "multipla-escolha" | "descritiva" | "checkbox"
  dificuldade: "iniciante" | "intermediario" | "avancado"
}) {
  return apiFetch<{ data: { questions: Array<{
    pergunta: string
    tipo: "multipla-escolha" | "descritiva" | "checkbox"
    tiposResposta: Array<"multipla-escolha" | "descritiva" | "checkbox">
    alternativas?: string[]
    alternativaCorreta?: number | null
  }> } }>("/ai/training-questions", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function requestTrainingSummary(payload: {
  content?: string
  fileUrls?: string[]
  summaryPercent: number
  objective?: string
}) {
  return apiFetch<{ data: { summary: string } }>("/ai/training-summary", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function requestTrainingSummaryAudio(payload: {
  summaryText: string
}) {
  return apiFetch<{ data: { key: string; url: string } }>("/ai/training-summary-audio", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
