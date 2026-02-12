"use client"

import { apiFetch } from "@/lib/api-client"

export type TrainingQuestionPayload = {
  pergunta: string
  tipo: "multipla-escolha" | "descritiva"
  tiposResposta?: Array<"multipla-escolha" | "descritiva" | "checkbox" | "audio" | "video">
  alternativas?: string[]
  alternativaCorreta?: number
  order?: number
}

export type TrainingPayload = {
  titulo: string
  descricao?: string
  capa?: {
    tipo?: "upload" | "url"
    valor?: string
  }
  corPrincipal?: string
  vinculadoCampanha?: boolean
  campanhaId?: string
  conteudoOrigem?: "texto" | "documento" | "audio" | "video"
  conteudoTexto?: string
  conteudoArquivo?: string
  conteudoArquivos?: string[]
  semAvaliacao?: boolean
  converterConteudo?: boolean
  tipoConversao?: "audio" | "video"
  disponibilizarOriginal?: boolean
  percentualResumo?: number
  resumoGerado?: string
  resumoConfirmado?: boolean
  iaConfig?: unknown
  iaConversoes?: Array<"texto" | "audio" | "video">
  colaboradorVe?: Array<"texto" | "audio" | "video">
  questoes?: TrainingQuestionPayload[]
  ordemObrigatoria?: boolean
  publicoTipo?: "todo-time" | "colaboradores-especificos" | "por-departamento"
  colaboradoresSelecionados?: string[]
  questoesObrigatorias?: boolean
  dataInicio?: string
  dataFim?: string
  ganhosAtivos?: boolean
  xp?: number
  estrelas?: number
}

export type TrainingSummary = {
  id: string
  title: string
  description?: string | null
  coverType?: string | null
  coverUrl?: string | null
  primaryColor?: string | null
  campaignId?: string | null
  audienceType?: string | null
  rewardXP?: number
  rewardStars?: number
  createdAt?: string
  userProgress?: {
    trainingId: string
    progress: number
    completedAt?: string | null
    startedAt?: string | null
  } | null
}

export type TrainingDetail = {
  id: string
  title: string
  description?: string | null
  coverType?: "upload" | "url" | null
  coverUrl?: string | null
  primaryColor?: string | null
  campaignId?: string | null
  contentOrigin?: "texto" | "documento" | "audio" | "video" | null
  contentText?: string | null
  contentFiles?: string[]
  noAssessment?: boolean
  convertContent?: boolean
  conversionType?: "texto" | "audio" | "video" | null
  allowOriginal?: boolean
  summaryPercent?: number
  summaryText?: string | null
  summaryConfirmed?: boolean
  aiConfig?: unknown
  aiConversions?: Array<"texto" | "audio" | "video">
  visibleFormats?: Array<"texto" | "audio" | "video">
  questionsRequired?: boolean
  requireSequential?: boolean
  audienceType?: "todo_time" | "colaboradores_especificos" | "por_departamento"
  audienceIds?: string[]
  startDate?: string | null
  endDate?: string | null
  rewardsActive?: boolean
  rewardXP?: number
  rewardStars?: number
  createdAt?: string
  updatedAt?: string
  questions?: Array<{
    id: string
    question: string
    type: "multipla_escolha" | "descritiva"
    answerTypes: Array<"multipla_escolha" | "descritiva" | "checkbox" | "audio" | "video">
    options: string[]
    correctOption?: number | null
    order: number
  }>
  userProgress?: {
    progress: number
    score?: number
    completedAt?: string | null
    startedAt?: string | null
  } | null
  userQuestionProgress?: Array<{
    questionId: string
    answeredAt?: string | null
  }>
}

export async function createTraining(payload: TrainingPayload) {
  return apiFetch<{ data: unknown }>("/trainings", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateTraining(id: string, payload: TrainingPayload) {
  return apiFetch<{ data: unknown }>(`/trainings/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function getTraining(id: string) {
  return apiFetch<{ data: TrainingDetail }>(`/trainings/${id}`)
}

export async function deleteTraining(id: string) {
  return apiFetch<void>(`/trainings/${id}`, {
    method: "DELETE",
  })
}

export async function listTrainings(params?: {
  page?: number
  limit?: number
  campaignId?: string
  audienceType?: "todo_time" | "colaboradores_especificos" | "por_departamento"
  creatorId?: string
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))
  if (params?.campaignId) query.set("campaignId", params.campaignId)
  if (params?.audienceType) query.set("audienceType", params.audienceType)
  if (params?.creatorId) query.set("creatorId", params.creatorId)

  const suffix = query.toString() ? `?${query.toString()}` : ""
  return apiFetch<{ data: TrainingSummary[] }>(`/trainings${suffix}`)
}

export async function getMyTrainingProgress() {
  return apiFetch<{ data: Array<{ trainingId: string; progress: number; completedAt?: string | null; startedAt?: string | null }> }>(
    "/trainings/progress/me",
  )
}

export async function startTraining(id: string) {
  return apiFetch<{ data: { trainingId: string; userId: string; progress: number; completedAt?: string | null } }>(
    `/trainings/${id}/start`,
    { method: "POST" },
  )
}

export async function completeTraining(id: string) {
  return apiFetch<{ data: { trainingId: string; userId: string; progress: number; score?: number; completedAt?: string | null } }>(
    `/trainings/${id}/complete`,
    { method: "POST" },
  )
}

export async function answerTrainingQuestion(
  trainingId: string,
  questionId: string,
  value: string | number | string[],
) {
  return apiFetch<{
    data: {
      progress: { progress: number; completedAt?: string | null }
      answered: number
      total: number
    }
  }>(`/trainings/${trainingId}/questions/${questionId}/answer`, {
    method: "POST",
    body: JSON.stringify({ value }),
  })
}
