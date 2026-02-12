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
