"use client"

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Upload,
  FileText,
  Video,
  Mic,
  Sparkles,
  Plus,
  X,
  Trash2,
  Check,
  Settings,
  Calendar,
  Users,
  Award,
  Target,
  Clock,
  Repeat,
  Zap,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Palette,
  Link as LinkIcon,
  BookOpen,
  GripVertical,
  Info,
  ListOrdered,
  Edit,
  Volume2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EngajamentoService } from "@/lib/engajamento-service"
import { requestTrainingAssist, requestTrainingQuestions, requestTrainingSummary, requestTrainingSummaryAudio } from "@/lib/ai-api"
import { uploadFileToBackend } from "@/lib/uploads-api"
import { createTraining, getTraining, updateTraining } from "@/lib/trainings-api"

// Tipos
  type StepId =
    | "informacoes"
    | "campanha"
    | "conteudo"
    | "ia-parametros"
    | "curadoria"
    | "publico" // TASK 1: Nova etapa após curadoria
    | "avaliacao"
    | "certificado"
    | "prazos"
    | "ganhos"
    | "preview"

type ConteudoOrigem = "texto" | "documento" | "audio" | "video"
type ConteudoFormato = "texto" | "audio" | "video"
type QuestaoTipo = "multipla-escolha" | "descritiva" | "mista"
type Nivel = "iniciante" | "intermediario" | "avancado"

interface Questao {
  id: string
  pergunta: string
  tipo: "multipla-escolha" | "descritiva"
  tiposResposta?: string[] // TASK 3-4: Múltiplos tipos de resposta permitidos
  alternativas?: string[]
  alternativaCorreta?: number
  order: number
}

interface TrainingData {
  // Informações Básicas
  titulo: string
  descricao: string
  capa: {
    tipo: "upload" | "url"
    valor: string
  }
  corPrincipal: string

  // Campanha
  vinculadoCampanha: boolean
  campanhaId?: string

  // Conteúdo
  conteudoOrigem?: ConteudoOrigem
  conteudoTexto: string
  conteudoArquivo?: string
  conteudoArquivos?: string[] // TASK 2 - Múltiplos arquivos
  semAvaliacao: boolean // TASK 5 - Novo campo
  
  // Conversão de Conteúdo
  converterConteudo: boolean
  tipoConversao?: "audio" | "video"
  disponibilizarOriginal: boolean
  percentualResumo: number
  resumoGerado?: string
  resumoConfirmado: boolean
  resumoAudioKey?: string
  resumoAudioUrl?: string
  
  // IA
  iaConfig?: {
    tipoQuestoes: QuestaoTipo
    quantidade: number
    tipoResposta?: "multipla-escolha" | "descritiva" | "audio" | "video" // TASK 3.3
    dificuldade: Nivel
    resumoAtivo: boolean
    resumoPercentual: number
  }
  iaConversoes: ConteudoFormato[]
  colaboradorVe: ConteudoFormato[]

  // Questões
  questoes: Questao[]
  ordemObrigatoria: boolean // TASK 6

  // TASK 2: Público
  publicoTipo: "todo-time" | "colaboradores-especificos"
  colaboradoresSelecionados: string[] // IDs dos colaboradores selecionados

    // Avaliação
    questoesObrigatorias: boolean
    permitirRepeticao: boolean
    emitirCertificado: boolean
    modeloCertificado: "padrao" | "custom"
    textoCertificado?: string

  // Prazos
  dataInicio: string
  dataFim: string

  // Ganhos
  ganhosAtivos: boolean
  xp: number
  estrelas: number
}

// TASK 3 - Nova ordem das etapas
  const STEPS: { id: StepId; label: string; icon: any }[] = [
    { id: "informacoes", label: "Informações Básicas", icon: FileText },
    { id: "campanha", label: "Campanha", icon: Target },
    { id: "conteudo", label: "Conteúdo", icon: BookOpen },
    { id: "ia-parametros", label: "Parametrização IA", icon: Sparkles },
    { id: "curadoria", label: "Curadoria de Questões", icon: CheckCircle2 },
    { id: "publico", label: "Público", icon: Users }, // TASK 1: Nova etapa após curadoria
    { id: "avaliacao", label: "Configuração Avaliação", icon: Settings },
    { id: "prazos", label: "Prazos e Disponibilidade", icon: Calendar },
    { id: "ganhos", label: "Ganhos", icon: Zap },
    { id: "certificado", label: "Certificado", icon: Award },
    { id: "preview", label: "Preview", icon: Eye },
  ]

export default function CriarTreinamentoPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const editId = searchParams.get("edit")
  const isEditMode = !!editId

  const [currentStep, setCurrentStep] = useState<StepId>("informacoes")
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showIaModal, setShowIaModal] = useState(false) // TASK 2
  const [iaPrompt, setIaPrompt] = useState("")
  const [isGeneratingIA, setIsGeneratingIA] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingEdit, setIsLoadingEdit] = useState(false)
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [isGeneratingSummaryAudio, setIsGeneratingSummaryAudio] = useState(false)
  const [isUploadingContent, setIsUploadingContent] = useState(false)
  const [campanhas, setCampanhas] = useState<any[]>([])
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<any>(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)
  const [showNovaQuestaoModal, setShowNovaQuestaoModal] = useState(false) // TASK 5
  const [novaQuestao, setNovaQuestao] = useState<Questao | null>(null) // TASK 5
  const [questaoEditandoId, setQuestaoEditandoId] = useState<string | null>(null) // TASK 1 - ID da questão sendo editada
  const [colaboradoresDoTime, setColaboradoresDoTime] = useState<any[]>([]) // TASK 2 - Lista de colaboradores do time

  const [formData, setFormData] = useState<TrainingData>({
    titulo: "",
    descricao: "",
    capa: { tipo: "url", valor: "" },
    corPrincipal: "#3b82f6",
    
    vinculadoCampanha: false,
    
    conteudoTexto: "",
    semAvaliacao: false,
    
    converterConteudo: false,
    disponibilizarOriginal: false,
    percentualResumo: 0,
    resumoConfirmado: false,
    resumoAudioKey: undefined,
    resumoAudioUrl: undefined,
    
    iaConversoes: [],
    colaboradorVe: [],
    
  questoes: [],
  ordemObrigatoria: false,

  // TASK 2: Público - padrão é "todo o time"
  publicoTipo: "todo-time",
  colaboradoresSelecionados: [],

    questoesObrigatorias: true,
    permitirRepeticao: false,
    emitirCertificado: true,
    modeloCertificado: "padrao",
    textoCertificado: "",

  dataInicio: new Date().toISOString().split("T")[0],
  dataFim: "",

  ganhosAtivos: true,
  xp: 100,
  estrelas: 30,
  })

  const certificatePreviewText = (() => {
    const nome = user?.nome || "Colaborador"
    const titulo = formData.titulo || "Treinamento"
    const custom = formData.textoCertificado?.trim()
    const base = custom && formData.modeloCertificado === "custom"
      ? custom
      : `Certificamos que ${nome} concluiu com êxito o treinamento "${titulo}", demonstrando comprometimento com seu desenvolvimento profissional.`
    return base
      .replaceAll("[NOME]", nome)
      .replaceAll("[TÍTULO]", titulo)
  })()

  const mapBackendToForm = (data: any): TrainingData => {
    const mapQuestionType = (value: string) =>
      value === "multipla_escolha" ? "multipla-escolha" : "descritiva"
    const mapAnswerType = (value: string) =>
      value === "multipla_escolha" ? "multipla-escolha" : value
    const mapAudienceType = (value: string) => {
      if (value === "todo_time") return "todo-time"
      if (value === "colaboradores_especificos") return "colaboradores-especificos"
      if (value === "por_departamento") return "por-departamento"
      return "todo-time"
    }

    return {
      titulo: data.title || "",
      descricao: data.description || "",
      capa: {
        tipo: data.coverType || "url",
        valor: data.coverUrl || "",
      },
      corPrincipal: data.primaryColor || "#3b82f6",
      vinculadoCampanha: !!data.campaignId,
      campanhaId: data.campaignId || undefined,
      conteudoOrigem: data.contentOrigin || undefined,
      conteudoTexto: data.contentText || "",
      conteudoArquivos: data.contentFiles || [],
      semAvaliacao: !!data.noAssessment,
      converterConteudo: !!data.convertContent,
      tipoConversao: data.conversionType || undefined,
      disponibilizarOriginal: !!data.allowOriginal,
      percentualResumo: data.summaryPercent || 0,
      resumoGerado: data.summaryText || undefined,
      resumoConfirmado: !!data.summaryConfirmed,
      resumoAudioKey: data.summaryAudioKey || undefined,
      resumoAudioUrl: data.summaryAudioUrl || undefined,
      iaConfig: data.aiConfig || undefined,
      iaConversoes: data.aiConversions || [],
      colaboradorVe: data.visibleFormats || [],
      questoes: (data.questions || []).map((q: any) => ({
        id: q.id,
        pergunta: q.question,
        tipo: mapQuestionType(q.type),
        tiposResposta: (q.answerTypes || []).map(mapAnswerType),
        alternativas: q.options || [],
        alternativaCorreta: q.correctOption ?? undefined,
        order: q.order ?? 0,
      })),
      ordemObrigatoria: !!data.requireSequential,
      publicoTipo: mapAudienceType(data.audienceType),
      colaboradoresSelecionados: data.audienceIds || [],
      questoesObrigatorias: data.questionsRequired ?? true,
      dataInicio: data.startDate
        ? new Date(data.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      dataFim: data.endDate ? new Date(data.endDate).toISOString().split("T")[0] : "",
      ganhosAtivos: data.rewardsActive ?? true,
      xp: data.rewardXP ?? 0,
      estrelas: data.rewardStars ?? 0,
    }
  }

  // Verificação de permissão
  useEffect(() => {
    if (!user || !hasPermission(["gestor", "super-admin"])) {
      router.push("/")
    }
  }, [user, hasPermission, router])

  // Carregar dados do treinamento em modo edição
  useEffect(() => {
    if (!isEditMode || !editId) return

    const loadTraining = async () => {
      try {
        setIsLoadingEdit(true)
        const res = await getTraining(editId)
        setFormData(mapBackendToForm(res.data))
      } catch (error: any) {
        toast({
          title: "Treinamento não encontrado",
          description: error?.message || "Não foi possível carregar o treinamento.",
          variant: "destructive",
        })
        if (typeof window !== "undefined") {
          localStorage.setItem("open-admin-tab", "suas-criacoes")
        }
        router.push("/admin")
      } finally {
        setIsLoadingEdit(false)
      }
    }

    loadTraining()
  }, [editId, isEditMode, router, toast])

  // Carregar campanhas ativas
  useEffect(() => {
    if (typeof window !== "undefined") {
      const allEngajamentos = EngajamentoService.getAllEngajamentos()
      const campanhasAtivas = allEngajamentos.filter(
        (e) => e.type === "campanha" && new Date(e.endDate) >= new Date()
      )
      setCampanhas(campanhasAtivas)
    }
  }, [])

  // TASK 2 - Carregar colaboradores do time do gestor
  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      // Mock de colaboradores - em produção viria da API
      const colaboradoresMock = [
        { id: "1", nome: "Ana Silva", email: "ana@empresa.com", cargo: "Desenvolvedor" },
        { id: "2", nome: "Bruno Costa", email: "bruno@empresa.com", cargo: "Designer" },
        { id: "3", nome: "Carla Mendes", email: "carla@empresa.com", cargo: "Product Manager" },
        { id: "4", nome: "Daniel Souza", email: "daniel@empresa.com", cargo: "QA" },
        { id: "5", nome: "Elaine Rocha", email: "elaine@empresa.com", cargo: "Desenvolvedor" },
      ]
      setColaboradoresDoTime(colaboradoresMock)
    }
  }, [user])

  // TASK 4 - Herança de campanha
  useEffect(() => {
    if (formData.vinculadoCampanha && formData.campanhaId) {
      const campanha = campanhas.find((c) => c.id === formData.campanhaId)
      if (campanha) {
        setCampanhaSelecionada(campanha)
        // Herdar configurações automáticas
        setFormData((prev) => ({
          ...prev,
          // Público herdado da campanha
          // Prazos herdados da campanha
          // Ganhos herdados da campanha
        }))
      }
    } else {
      setCampanhaSelecionada(null)
    }
  }, [formData.vinculadoCampanha, formData.campanhaId, campanhas])

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission(["gestor", "super-admin"])) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para criar treinamentos.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const goToStep = (stepId: StepId) => {
    setCurrentStep(stepId)
  }

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      let targetStep = STEPS[nextIndex].id
      
      // TASK 3 - Pular etapa de IA se não for necessária
      if (targetStep === "ia-parametros" && (formData.semAvaliacao || !formData.iaConfig)) {
        // Pula para curadoria
        targetStep = "curadoria"
      }
      
      // Pular curadoria, público e avaliação se for sem avaliação
      if ((targetStep === "curadoria" || targetStep === "publico" || targetStep === "avaliacao") && formData.semAvaliacao) {
        targetStep = "prazos"
      }
      
      setCurrentStep(targetStep)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  // TASK 2 - Gerar título e descrição com IA
  const gerarTituloDescricaoIA = async () => {
    if (!iaPrompt.trim()) {
      toast({
        title: "Campo vazio",
        description: "Descreva o objetivo do treinamento para a IA ajudar",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingIA(true)

    try {
      const res = await requestTrainingAssist(iaPrompt)
      setFormData({
        ...formData,
        titulo: res.data.title || formData.titulo,
        descricao: res.data.description || formData.descricao,
      })
      toast({
        title: "Sugestões geradas!",
        description: "A IA sugeriu título e descrição baseados no seu contexto.",
      })
      setShowIaModal(false)
    } catch (error: any) {
      toast({
        title: "Erro ao gerar sugestões",
        description: error?.message || "Não foi possível gerar o conteúdo via IA.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingIA(false)
    }
  }

  const gerarQuestoesIA = async () => {
    const hasText = !!formData.conteudoTexto && formData.conteudoTexto.trim().length >= 20
    const hasFiles = (formData.conteudoArquivos || []).length > 0

    if (!hasText && !hasFiles) {
      toast({
        title: "Conteúdo insuficiente",
        description: "Adicione conteúdo textual ou anexe arquivos para gerar as questões.",
        variant: "destructive",
      })
      return
    }

    const iaCfg = formData.iaConfig
    if (!iaCfg) {
      toast({
        title: "Configuração incompleta",
        description: "Defina os parâmetros de IA antes de gerar questões.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGeneratingQuestions(true)
      const safeTipoResposta =
        iaCfg.tipoResposta === "multipla-escolha" || iaCfg.tipoResposta === "descritiva" || iaCfg.tipoResposta === "checkbox"
          ? iaCfg.tipoResposta
          : "descritiva"
      const contentForAi = hasText
        ? formData.conteudoTexto
        : `Arquivos anexados:\n${(formData.conteudoArquivos || []).join("\n")}`
      const objectiveText =
        (formData.titulo && formData.titulo.trim().length >= 10)
          ? formData.titulo
          : (iaPrompt && iaPrompt.trim().length >= 10)
            ? iaPrompt
            : "Treinamento para colaboradores"
      const fileKeys = formData.conteudoArquivos || []
      const res = await requestTrainingQuestions({
        objective: objectiveText,
        content: contentForAi,
        fileUrls: fileKeys.length > 0 ? fileKeys : undefined,
        summaryPercent: formData.percentualResumo,
        quantidade: iaCfg.quantidade,
        tipoResposta: safeTipoResposta,
        dificuldade: iaCfg.dificuldade,
      })

      const questions = res.data.questions.map((q, idx) => {
        const baseTipo = q.tipo === "descritiva" ? "descritiva" : "multipla-escolha"
        return {
        id: `q${Date.now()}-${idx}`,
        pergunta: q.pergunta,
        tipo: baseTipo,
        tiposResposta: q.tiposResposta || [q.tipo],
        alternativas: q.alternativas || [],
        alternativaCorreta: q.alternativaCorreta ?? undefined,
        order: idx,
        }
      })

      if (questions.length === 0) {
        toast({
          title: "Nenhuma questão gerada",
          description: "Adicione mais conteúdo e tente novamente.",
          variant: "destructive",
        })
        return
      }

        setFormData({
          ...formData,
          questoes: questions,
        })

        toast({
          title: "Questões geradas!",
          description: "A IA gerou as questões com base no conteúdo informado.",
        })

        setCurrentStep("curadoria")
    } catch (error: any) {
      toast({
        title: "Erro ao gerar questões",
        description: error?.message || "Não foi possível gerar as questões.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQuestions(false)
    }
  }

  const gerarResumoIA = async () => {
    const hasText = !!formData.conteudoTexto && formData.conteudoTexto.trim().length >= 20
    const hasFiles = (formData.conteudoArquivos || []).length > 0

    if (!hasText && !hasFiles) {
      toast({
        title: "Conteúdo insuficiente",
        description: "Adicione conteúdo textual ou anexe arquivos para gerar o resumo.",
        variant: "destructive",
      })
      return
    }

    if (formData.percentualResumo <= 0) {
      toast({
        title: "Percentual inválido",
        description: "Defina um percentual de resumo maior que 0%.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGeneratingSummary(true)
      const contentForAi = hasText ? formData.conteudoTexto : ""
      const fileKeys = formData.conteudoArquivos || []
      const objectiveText =
        (formData.titulo && formData.titulo.trim().length >= 10)
          ? formData.titulo
          : (iaPrompt && iaPrompt.trim().length >= 10)
            ? iaPrompt
            : undefined

      const res = await requestTrainingSummary({
        content: contentForAi,
        fileUrls: fileKeys.length > 0 ? fileKeys : undefined,
        summaryPercent: formData.percentualResumo,
        objective: objectiveText,
      })

      setFormData({
        ...formData,
        resumoGerado: res.data.summary,
        resumoConfirmado: false,
        resumoAudioKey: undefined,
        resumoAudioUrl: undefined,
      })

      toast({
        title: "Resumo Gerado",
        description: "A IA gerou uma prévia do resumo. Revise e confirme.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao gerar resumo",
        description: error?.message || "Não foi possível gerar o resumo.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const gerarResumoAudio = async () => {
    if (!formData.resumoGerado || formData.resumoGerado.trim().length < 10) {
      toast({
        title: "Resumo insuficiente",
        description: "Gere e revise o resumo antes de criar o áudio.",
        variant: "destructive",
      })
      return false
    }
    if (formData.resumoAudioKey && formData.resumoAudioUrl) {
      return true
    }

    try {
      setIsGeneratingSummaryAudio(true)
      const res = await requestTrainingSummaryAudio({
        summaryText: formData.resumoGerado,
      })
        setFormData((prev) => ({
          ...prev,
          resumoAudioKey: res.data.key,
          resumoAudioUrl: res.data.url,
        }))
      return true
    } catch (error: any) {
      toast({
        title: "Erro ao gerar áudio",
        description: error?.message || "Não foi possível gerar o áudio do resumo.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsGeneratingSummaryAudio(false)
    }
  }

  const handlePublish = async () => {
    if (!formData.titulo || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      setIsPublishing(true)
      if (isEditMode && editId) {
        await updateTraining(editId, formData)
      } else {
        await createTraining(formData)
      }
      toast({
        title: isEditMode ? "Treinamento Atualizado!" : "Treinamento Publicado!",
        description: `${formData.titulo} foi ${isEditMode ? "atualizado" : "publicado"} com sucesso.`,
      })
      setShowPublishModal(false)
        router.push("/admin?tab=suas-criacoes")
    } catch (error: any) {
      toast({
        title: "Erro ao publicar",
        description: error?.message || "Não foi possível publicar o treinamento.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // TASK 2-4 - Funções de questões (inline, não modal)
  const addQuestaoManual = () => {
    // Criar questão vazia para formulário inline
    setNovaQuestao({
      id: `q${Date.now()}`,
      pergunta: "",
      tipo: "multipla-escolha",
      tiposResposta: ["multipla-escolha"],
      alternativas: ["", ""],
      alternativaCorreta: 0,
      order: formData.questoes.length,
    })
    setShowNovaQuestaoModal(true)
  }

  // TASK 1 - Função para editar questão existente
  const editarQuestao = (questao: Questao) => {
    setNovaQuestao({ ...questao })
    setQuestaoEditandoId(questao.id)
    setShowNovaQuestaoModal(true)
  }

  const salvarNovaQuestao = () => {
    // TASK 3-4: Validações
    if (!novaQuestao || !novaQuestao.pergunta.trim()) {
      toast({
        title: "Erro",
        description: "O enunciado da questão é obrigatório",
        variant: "destructive",
      })
      return
    }

    // TASK 2 - Validar que tipo de resposta foi selecionado explicitamente
    if (!novaQuestao.tiposResposta || novaQuestao.tiposResposta.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de resposta",
        variant: "destructive",
      })
      return
    }

    // TASK 3 - Validar alternativas APENAS se for múltipla escolha ou checkbox
    if (novaQuestao.tiposResposta.includes("multipla-escolha") || novaQuestao.tiposResposta.includes("checkbox")) {
      const alternativasPreenchidas = novaQuestao.alternativas?.filter(alt => alt.trim()) || []
      if (alternativasPreenchidas.length < 2) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos 2 alternativas preenchidas",
          variant: "destructive",
        })
        return
      }
    }

    // TASK 3 - Limpar alternativas se o tipo não for múltipla escolha ou checkbox
    const questaoFinal = { ...novaQuestao }
    if (!questaoFinal.tiposResposta?.includes("multipla-escolha") && 
        !questaoFinal.tiposResposta?.includes("checkbox")) {
      questaoFinal.alternativas = []
      questaoFinal.alternativaCorreta = undefined
    }

    // TASK 1 - Se está editando, atualizar questão existente
    if (questaoEditandoId) {
      setFormData({
        ...formData,
        questoes: formData.questoes.map(q => 
          q.id === questaoEditandoId ? questaoFinal : q
        ),
      })
      toast({
        title: "Questão atualizada",
        description: "A questão foi atualizada com sucesso",
      })
    } else {
      // Criando nova questão
      setFormData({
        ...formData,
        questoes: [...formData.questoes, questaoFinal],
      })
      toast({
        title: "Questão adicionada",
        description: "A questão foi adicionada com sucesso",
      })
    }

    setShowNovaQuestaoModal(false)
    setNovaQuestao(null)
    setQuestaoEditandoId(null)
  }

  const removeQuestao = (id: string) => {
    setFormData({
      ...formData,
      questoes: formData.questoes.filter((q) => q.id !== id),
    })
  }

  const updateQuestao = (id: string, updates: Partial<Questao>) => {
    setFormData({
      ...formData,
      questoes: formData.questoes.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    })
  }

  // TASK 6 - Drag & Drop
  const handleDragStart = (questionId: string) => {
    setDraggedQuestionId(questionId)
  }

  const handleDragOver = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault()
    if (!draggedQuestionId || draggedQuestionId === targetQuestionId) return

    const draggedIndex = formData.questoes.findIndex((q) => q.id === draggedQuestionId)
    const targetIndex = formData.questoes.findIndex((q) => q.id === targetQuestionId)

    const newQuestoes = [...formData.questoes]
    const [removed] = newQuestoes.splice(draggedIndex, 1)
    newQuestoes.splice(targetIndex, 0, removed)

    // Atualizar ordem
    const reordered = newQuestoes.map((q, index) => ({ ...q, order: index }))
    setFormData({ ...formData, questoes: reordered })
  }

  const handleDragEnd = () => {
    setDraggedQuestionId(null)
  }

  // Verificar se deve mostrar etapas específicas baseado em condições
  const shouldShowStep = (stepId: StepId): boolean => {
    // TASK 3 - Ocultar etapa de IA se não escolher gerar com IA
    if (stepId === "ia-parametros" && !formData.iaConfig) {
      return false
    }
    
    // TASK 3 e 5 - Ocultar etapas se não houver avaliação
    if (formData.semAvaliacao) {
      if (["ia-parametros", "curadoria", "avaliacao"].includes(stepId)) {
        return false
      }
    }
    
    return true
  }

  // Preview Card
  const PreviewCard = () => (
    <div className="sticky top-6">
      <Card className="clay-card border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-primary" />
            Preview
          </CardTitle>
          <CardDescription>Como o colaborador verá</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Card Preview */}
            <div
              className="rounded-xl overflow-hidden border-2"
              style={{ borderColor: formData.corPrincipal }}
            >
              <div
                className="h-32 bg-cover bg-center"
                style={{
                  backgroundColor: formData.corPrincipal,
                  backgroundImage: formData.capa.valor ? `url(${formData.capa.valor})` : "none",
                }}
              >
              </div>

              <div className="p-4 space-y-2">
                <h3 className="font-bold text-sm line-clamp-2">
                  {formData.titulo || "Título do treinamento"}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {formData.descricao || "Descrição do treinamento"}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  {formData.ganhosAtivos && !formData.vinculadoCampanha && (
                    <>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-accent" />
                        <span>+{formData.xp} XP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-yellow-500" />
                        <span>+{formData.estrelas} ★</span>
                      </div>
                    </>
                  )}
                  {formData.semAvaliacao && (
                    <Badge variant="secondary" className="text-xs">
                      Sem Avaliação
                    </Badge>
                  )}
                  {/* Mostrar data de término quando preenchida */}
                  {formData.dataFim && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Até {new Date(formData.dataFim).toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• {formData.questoes.length} questões</p>
              {formData.vinculadoCampanha && <p>• Vinculado à campanha</p>}
              {formData.ordemObrigatoria && <p>• Ordem obrigatória</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="container mx-auto max-w-7xl space-y-6 py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Criar Treinamento</h1>
              <p className="text-muted-foreground">Configure e publique um novo treinamento</p>
            </div>
          </div>
          <Button onClick={() => setShowPublishModal(true)} size="lg" className="gap-2">
            <Save className="h-5 w-5" />
            Publicar
          </Button>
        </div>

        {/* TASK 1 - Etapas unificadas (sem barra de progresso) */}
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
              {STEPS.filter((step) => shouldShowStep(step.id)).map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isCompleted = currentStepIndex > index
                const filteredSteps = STEPS.filter((s) => shouldShowStep(s.id))
                const displayIndex = filteredSteps.findIndex((s) => s.id === step.id)

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-2 min-w-fit cursor-pointer transition-all ${
                      isActive ? "scale-105" : "opacity-60 hover:opacity-100"
                    }`}
                    onClick={() => goToStep(step.id)}
                  >
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-lg"
                          : isCompleted
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-muted border-muted-foreground/20"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="font-bold">{displayIndex + 1}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}>
                        {step.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* ETAPA 1: INFORMAÇÕES BÁSICAS + IA */}
            {currentStep === "informacoes" && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados principais do treinamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      placeholder="Ex: Desenvolvimento de Liderança"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição *</Label>
                    <Textarea
                      placeholder="Descreva o objetivo e conteúdo do treinamento..."
                      rows={4}
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    />
                  </div>

                  {/* TASK 2 - Assistente de IA */}
                  <div>
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => setShowIaModal(true)}
                    >
                      <Sparkles className="h-4 w-4 text-accent" />
                      Solicitar ajuda da IA
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor Principal</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData.corPrincipal}
                        onChange={(e) =>
                          setFormData({ ...formData, corPrincipal: e.target.value })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        value={formData.corPrincipal}
                        onChange={(e) =>
                          setFormData({ ...formData, corPrincipal: e.target.value })
                        }
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>

                  {/* TASK 1 - Upload de imagem + URL com UX melhorada */}
                  <div className="space-y-3">
                    <Label>Imagem de Capa</Label>
                    
                    <div className="flex gap-2">
                      <input
                        ref={(el) => {
                          if (el && formData.capa.tipo === "upload" && !formData.capa.valor) {
                            el.click()
                          }
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="capa-upload-input"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onloadend = () => {
                              setFormData({
                                ...formData,
                                capa: { tipo: "upload", valor: reader.result as string },
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant={formData.capa.tipo === "upload" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setFormData({ ...formData, capa: { tipo: "upload", valor: "" } })
                          document.getElementById("capa-upload-input")?.click()
                        }}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button
                        type="button"
                        variant={formData.capa.tipo === "url" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, capa: { tipo: "url", valor: "" } })}
                        className="flex-1"
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        URL
                      </Button>
                    </div>

                    {formData.capa.tipo === "upload" && formData.capa.valor ? (
                      <div className="space-y-2">
                        <div className="relative w-full h-32 rounded border overflow-hidden">
                          <img src={formData.capa.valor || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("capa-upload-input")?.click()}
                          className="w-full"
                        >
                          Trocar Imagem
                        </Button>
                      </div>
                    ) : formData.capa.tipo === "url" ? (
                      <Input
                        placeholder="https://exemplo.com/imagem.jpg"
                        value={formData.capa.valor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            capa: { ...formData.capa, valor: e.target.value },
                          })
                        }
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TASK 3 - ETAPA 2: CAMPANHA (antes de Conteúdo) */}
            {currentStep === "campanha" && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Vincular à Campanha</CardTitle>
                  <CardDescription>
                    Treinamentos vinculados herdam público, prazos e ganhos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Vincular este treinamento a uma campanha</Label>
                    <Switch
                      checked={formData.vinculadoCampanha}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, vinculadoCampanha: checked })
                      }
                    />
                  </div>

                  {formData.vinculadoCampanha && (
                    <div className="space-y-3">
                      <Label>Selecione a Campanha</Label>
                      <Select
                        value={formData.campanhaId}
                        onValueChange={(value) => setFormData({ ...formData, campanhaId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha uma campanha" />
                        </SelectTrigger>
                        <SelectContent>
                          {campanhas.length === 0 && (
                            <SelectItem value="none" disabled>
                              Nenhuma campanha ativa
                            </SelectItem>
                          )}
                          {campanhas.map((campanha) => (
                            <SelectItem key={campanha.id} value={campanha.id}>
                              {campanha.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* TASK 4 - Informações herdadas */}
                      {campanhaSelecionada && (
                        <Card className="bg-primary/10 border-primary/30 mt-4">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h4 className="font-semibold text-sm">Configurações Herdadas</h4>
                                <p className="text-sm text-muted-foreground">
                                  Este treinamento herdará automaticamente:
                                </p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                  <li>Público-alvo da campanha</li>
                                  <li>Período de disponibilidade</li>
                                  <li>Ganhos (XP e Estrelas)</li>
                                  <li>Ordem obrigatória (se existir)</li>
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {!formData.vinculadoCampanha && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">
                          Treinamento avulso. Todas as configurações serão definidas manualmente.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TASK 2 - ETAPA 3: CONTEÚDO REESTRUTURADO */}
            {currentStep === "conteudo" && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Conteúdo do Treinamento</CardTitle>
                  <CardDescription>Adicione o material de aprendizado (obrigatório)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* TASK 2 - Inserção de Conteúdo (OBRIGATÓRIO) */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <span>Tipo de Conteúdo</span>
                        <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                      </Label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.mp3"
                          multiple
                          className="hidden"
                          id="conteudo-upload-input"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || [])
                            if (files.length === 0) return

                            try {
                              setIsUploadingContent(true)
                              const uploadedKeys: string[] = []
                              for (const file of files) {
                                const res = await uploadFileToBackend(file)
                                uploadedKeys.push(res.data.key)
                              }

                              setFormData({
                                ...formData,
                                conteudoArquivos: [...(formData.conteudoArquivos || []), ...uploadedKeys],
                              })
                              toast({
                                title: "Arquivos enviados",
                                description: `${files.length} arquivo(s) enviado(s) para o storage`,
                              })
                            } catch (error: any) {
                              toast({
                                title: "Falha no upload",
                                description: error?.message || "Não foi possível enviar os arquivos.",
                                variant: "destructive",
                              })
                            } finally {
                              setIsUploadingContent(false)
                              // Resetar o valor do input para permitir re-upload do mesmo arquivo se necessário
                              e.target.value = ""
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant={formData.conteudoOrigem === "texto" ? "default" : "outline"}
                          onClick={() => setFormData({ ...formData, conteudoOrigem: "texto" })}
                          className="flex-1"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Texto Manual
                        </Button>
                        <Button
                          type="button"
                          variant={formData.conteudoOrigem === "documento" ? "default" : "outline"}
                          onClick={() => {
                            setFormData({ ...formData, conteudoOrigem: "documento" })
                            setTimeout(() => {
                              document.getElementById("conteudo-upload-input")?.click()
                            }, 100)
                          }}
                          className="flex-1"
                          disabled={isUploadingContent}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploadingContent ? "Enviando..." : "Upload de Documento"}
                        </Button>
                      </div>
                    </div>

                    {formData.conteudoOrigem === "texto" && (
                      <div className="space-y-2">
                        <Label>Conteúdo do Treinamento</Label>
                        <Textarea
                          placeholder="Cole ou digite o conteúdo do treinamento aqui..."
                          rows={10}
                          value={formData.conteudoTexto}
                          onChange={(e) =>
                            setFormData({ ...formData, conteudoTexto: e.target.value })
                          }
                        />
                      </div>
                    )}

                    {formData.conteudoOrigem === "documento" && (
                      <div className="space-y-3">
                        {formData.conteudoArquivos && formData.conteudoArquivos.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm">Arquivos Anexados</Label>
                            <div className="space-y-2">
                              {formData.conteudoArquivos.map((arquivo, index) => (
                                <div key={index} className="flex items-center justify-between gap-2 p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                    <span className="text-sm">{arquivo.split("/").slice(-1)[0]}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newFiles = formData.conteudoArquivos?.filter((_, i) => i !== index)
                                      setFormData({ ...formData, conteudoArquivos: newFiles })
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("conteudo-upload-input")?.click()}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Mais Arquivos
                        </Button>

                        {/* TASK 2.3 - Informativo UX */}
                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                              <div>
                                <h4 className="font-semibold text-sm mb-1">Dica sobre conteúdo</h4>
                                <p className="text-sm text-muted-foreground">
                                  O ideal é anexar apenas conteúdos relacionados ao treinamento. Caso contrário, 
                                  a IA utilizará todos os arquivos fornecidos para gerar as questões.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* NOVO BLOCO - Conversão de Conteúdo */}
                  {(formData.conteudoTexto || formData.conteudoArquivo || (formData.conteudoArquivos && formData.conteudoArquivos.length > 0)) && (
                    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-chart-1/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Deseja converter este conteúdo?
                        </CardTitle>
                        <CardDescription>
                          Converta este conteúdo em áudio ou vídeo para melhorar a experiência do colaborador e aumentar o engajamento no treinamento.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Checkbox Principal */}
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={formData.converterConteudo}
                            onCheckedChange={(checked) => {
                              setFormData({
                                ...formData,
                                converterConteudo: checked,
                                tipoConversao: checked ? formData.tipoConversao : undefined,
                                percentualResumo: checked ? formData.percentualResumo : 0,
                                resumoGerado: undefined,
                                resumoConfirmado: false,
                                resumoAudioKey: undefined,
                                resumoAudioUrl: undefined,
                              })
                            }}
                          />
                          <Label className="text-base font-medium cursor-pointer" onClick={() => {
                            setFormData({
                              ...formData,
                              converterConteudo: !formData.converterConteudo,
                            })
                          }}>
                            Converter este conteúdo
                          </Label>
                        </div>

                        {/* Opções de Conversão */}
                        {formData.converterConteudo && (
                          <div className="space-y-6 pl-8 border-l-2 border-primary/30">
                            {/* Tipo de Conversão */}
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold">Tipo de conversão *</Label>
                              <div className="grid grid-cols-2 gap-3">
                                <Button
                                  type="button"
                                  variant={formData.tipoConversao === "audio" ? "default" : "outline"}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      tipoConversao: "audio",
                                    })
                                  }
                                  className="h-auto py-4 flex-col gap-2"
                                >
                                  <Mic className="h-6 w-6" />
                                  <span>Converter para Áudio</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant={formData.tipoConversao === "video" ? "default" : "outline"}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      tipoConversao: "video",
                                      resumoAudioKey: undefined,
                                      resumoAudioUrl: undefined,
                                    })
                                  }
                                  className="h-auto py-4 flex-col gap-2"
                                >
                                  <Video className="h-6 w-6" />
                                  <span>Converter para Vídeo</span>
                                </Button>
                              </div>
                            </div>

                            {/* Disponibilizar Conteúdo Original */}
                            <div className="flex items-start gap-3">
                              <Switch
                                checked={formData.disponibilizarOriginal}
                                onCheckedChange={(checked) =>
                                  setFormData({ ...formData, disponibilizarOriginal: checked })
                                }
                              />
                              <div className="flex-1">
                                <Label className="text-sm font-medium cursor-pointer">
                                  Disponibilizar também o conteúdo original ao colaborador
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Se marcado, o colaborador verá {formData.conteudoOrigem === "texto" ? "o texto" : "o documento"} original além do {formData.tipoConversao === "audio" ? "áudio" : "vídeo"}
                                </p>
                              </div>
                            </div>

                            {/* Resumo Inteligente por IA */}
                            <div className="space-y-4 p-4 bg-background/50 rounded-lg border">
                              <div className="space-y-2">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-accent" />
                                  Percentual de resumo do conteúdo antes da conversão
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Este controle define o quanto a IA irá resumir o conteúdo antes de gerar o {formData.tipoConversao === "audio" ? "áudio" : "vídeo"}. Isso ajuda a reduzir a duração e o tempo de processamento.
                                </p>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                  <Input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={formData.percentualResumo}
                                    onChange={(e) => {
                                      setFormData({
                                        ...formData,
                                        percentualResumo: Number(e.target.value),
                                        resumoGerado: undefined,
                                        resumoConfirmado: false,
                                        resumoAudioKey: undefined,
                                        resumoAudioUrl: undefined,
                                      })
                                    }}
                                    className="flex-1"
                                  />
                                  <div className="flex items-center gap-2 min-w-24">
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={formData.percentualResumo}
                                      onChange={(e) => {
                                        const value = Math.min(100, Math.max(0, Number(e.target.value)))
                                        setFormData({
                                          ...formData,
                                          percentualResumo: value,
                                          resumoGerado: undefined,
                                          resumoConfirmado: false,
                                          resumoAudioKey: undefined,
                                          resumoAudioUrl: undefined,
                                        })
                                      }}
                                      className="w-16 text-center"
                                    />
                                    <span className="text-sm font-medium">%</span>
                                  </div>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  {formData.percentualResumo === 0 && "Conteúdo completo (sem resumo)"}
                                  {formData.percentualResumo > 0 && formData.percentualResumo <= 25 && "Resumo leve - mantém maior parte do conteúdo"}
                                  {formData.percentualResumo > 25 && formData.percentualResumo <= 50 && "Resumo moderado - reduz pela metade"}
                                  {formData.percentualResumo > 50 && formData.percentualResumo <= 75 && "Resumo significativo - foca nos pontos principais"}
                                  {formData.percentualResumo > 75 && "Resumo máximo - apenas informações essenciais"}
                                </div>
                              </div>

                              {/* Geração de Prévia do Resumo */}
                              {formData.percentualResumo > 0 && (
                                <div className="space-y-3">
                                  {!formData.resumoGerado && !formData.resumoConfirmado && (
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      onClick={gerarResumoIA}
                                      className="w-full"
                                      disabled={isGeneratingSummary}
                                    >
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      {isGeneratingSummary ? "Gerando..." : "Gerar Prévia do Resumo"}
                                    </Button>
                                  )}

                                  {formData.resumoGerado && !formData.resumoConfirmado && (
                                    <div className="space-y-3">
                                      <Card className="bg-muted/50">
                                        <CardHeader>
                                          <CardTitle className="text-sm flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Prévia do Resumo Gerado
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                          <Textarea
                                            value={formData.resumoGerado}
                                            onChange={(e) =>
                                              setFormData({
                                                ...formData,
                                                resumoGerado: e.target.value,
                                                resumoConfirmado: false,
                                                resumoAudioKey: undefined,
                                                resumoAudioUrl: undefined,
                                              })
                                            }
                                            rows={8}
                                            className="font-mono text-xs"
                                          />
                                          {formData.resumoAudioUrl && (
                                            <div className="mt-4 flex items-center gap-3 rounded-md border bg-background p-3">
                                              <Volume2 className="h-4 w-4 text-muted-foreground" />
                                              <audio controls src={formData.resumoAudioUrl} className="w-full" />
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>

                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => {
                                        setFormData({
                                          ...formData,
                                          resumoGerado: undefined,
                                          resumoAudioKey: undefined,
                                          resumoAudioUrl: undefined,
                                        })
                                      }}
                                      className="flex-1"
                                    >
                                          <X className="h-4 w-4 mr-2" />
                                          Ajustar Percentual
                                        </Button>
                                        <Button
                                          type="button"
                                          onClick={async () => {
                                            if (formData.tipoConversao === "audio") {
                                              const ok = await gerarResumoAudio()
                                              if (!ok) return
                                            }
                                              setFormData((prev) => ({
                                                ...prev,
                                                resumoConfirmado: true,
                                              }))
                                            toast({
                                              title: "Resumo Confirmado",
                                              description: `O ${formData.tipoConversao === "audio" ? "áudio" : "vídeo"} será gerado com base neste resumo.`,
                                            })
                                          }}
                                          className="flex-1"
                                          disabled={isGeneratingSummaryAudio}
                                        >
                                          <Check className="h-4 w-4 mr-2" />
                                          {isGeneratingSummaryAudio ? "Gerando áudio..." : "Confirmar e Continuar"}
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {formData.resumoConfirmado && (
                                    <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                                      <CardContent className="pt-4">
                                        <div className="flex items-center gap-2">
                                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                          <div>
                                            <p className="font-medium text-sm">Resumo confirmado</p>
                                            <p className="text-xs text-muted-foreground">
                                              O {formData.tipoConversao === "audio" ? "áudio" : "vídeo"} será gerado com base no resumo aprovado
                                            </p>
                                          </div>
                                        </div>
                                        {formData.resumoAudioUrl && (
                                          <div className="mt-3 flex items-center gap-3 rounded-md border bg-background/70 p-3">
                                            <Volume2 className="h-4 w-4 text-muted-foreground" />
                                            <audio controls src={formData.resumoAudioUrl} className="w-full" />
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* 2.2 - Escolha do Tipo de Treinamento (APÓS CONTEÚDO) */}
                  {(formData.conteudoTexto || formData.conteudoArquivo || (formData.conteudoArquivos && formData.conteudoArquivos.length > 0)) && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label className="text-base">Tipo de Treinamento</Label>
                        <p className="text-sm text-muted-foreground">
                          Escolha como o colaborador será avaliado após consumir o conteúdo
                        </p>
                      </div>

                      <div className="grid gap-3">
                        {/* Opção 1: Sem avaliação */}
                        <Card
                          className={`cursor-pointer transition-all ${
                            formData.semAvaliacao
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() =>
                            setFormData({ ...formData, semAvaliacao: true, iaConfig: undefined })
                          }
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  formData.semAvaliacao
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {formData.semAvaliacao && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">Treinamento sem avaliação</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  O colaborador apenas consome o conteúdo e marca como concluído
                                  manualmente
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Opção 2: Com avaliação - manual */}
                        <Card
                          className={`cursor-pointer transition-all ${
                            !formData.semAvaliacao && !formData.iaConfig
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() =>
                            setFormData({ ...formData, semAvaliacao: false, iaConfig: undefined })
                          }
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  !formData.semAvaliacao && !formData.iaConfig
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {!formData.semAvaliacao && !formData.iaConfig && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">
                                  Com avaliação - criar questões manualmente
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Você criará as questões de avaliação do zero
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Opção 3: Com avaliação - IA */}
                        <Card
                          className={`cursor-pointer transition-all ${
                            !formData.semAvaliacao && formData.iaConfig
                              ? "border-accent bg-accent/5"
                              : "hover:border-accent/50"
                          }`}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              semAvaliacao: false,
                              iaConfig: {
                                tipoQuestoes: "multipla-escolha",
                                quantidade: 5,
                                dificuldade: "intermediario",
                                resumoAtivo: false,
                                resumoPercentual: 50,
                              },
                            })
                          }
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  !formData.semAvaliacao && formData.iaConfig
                                    ? "border-accent bg-accent"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {!formData.semAvaliacao && formData.iaConfig && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-accent" />
                                  Com avaliação - gerar questões com IA
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  A IA gerará questões automaticamente com base no conteúdo fornecido
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Aviso se não houver conteúdo */}
                  {!formData.conteudoTexto && !formData.conteudoArquivo && (!formData.conteudoArquivos || formData.conteudoArquivos.length === 0) && (
                    <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Conteúdo obrigatório</h4>
                            <p className="text-sm text-muted-foreground">
                              Você precisa adicionar conteúdo antes de escolher o tipo de treinamento
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TASK 3 e 4 - ETAPA 4: PARAMETRIZAÇÃO IA (só aparece se escolher gerar com IA) */}
            {currentStep === "ia-parametros" && !formData.semAvaliacao && formData.iaConfig && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    Parametrização IA
                  </CardTitle>
                  <CardDescription>Configure como a IA deve gerar as questões</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* TASK 3.1 - Card: Tipo de Questões (INFORMATIVO) */}
                  <Card className="border-2 bg-accent/10 border-accent/30">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-sm">Tipo de Questão</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            As questões geradas pela IA serão do tipo <strong>descritivo</strong>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card: Quantidade */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base">Quantidade de Questões</CardTitle>
                      <CardDescription>Quantas perguntas devem ser geradas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={formData.iaConfig?.quantidade || 5}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              iaConfig: {
                                ...formData.iaConfig!,
                                quantidade: Number.parseInt(e.target.value) || 5,
                              },
                            })
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">questões</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* TASK 3.3 - Card: Tipo de Resposta (seleção única) */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base">Tipo de Resposta Permitida</CardTitle>
                      <CardDescription>Como o colaborador poderá responder as questões</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={formData.iaConfig?.tipoResposta === "multipla-escolha" ? "default" : "outline"}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              iaConfig: { ...formData.iaConfig!, tipoResposta: "multipla-escolha" },
                            })
                          }
                          className="justify-start h-auto py-3"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Múltipla escolha
                        </Button>
                        <Button
                          type="button"
                          variant={formData.iaConfig?.tipoResposta === "descritiva" ? "default" : "outline"}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              iaConfig: { ...formData.iaConfig!, tipoResposta: "descritiva" },
                            })
                          }
                          className="justify-start h-auto py-3"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Descritiva
                        </Button>
                          <Button
                            type="button"
                            variant={formData.iaConfig?.tipoResposta === "audio" ? "default" : "outline"}
                            disabled
                            onClick={() =>
                              setFormData({
                                ...formData,
                                iaConfig: { ...formData.iaConfig!, tipoResposta: "audio" },
                              })
                            }
                            className="justify-start h-auto py-3 relative opacity-60"
                          >
                            <Mic className="h-4 w-4 mr-2" />
                            Áudio
                            <span className="ml-auto text-[10px] uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                              Em breve
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant={formData.iaConfig?.tipoResposta === "video" ? "default" : "outline"}
                            disabled
                            onClick={() =>
                              setFormData({
                                ...formData,
                                iaConfig: { ...formData.iaConfig!, tipoResposta: "video" },
                              })
                            }
                            className="justify-start h-auto py-3 relative opacity-60"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Vídeo
                            <span className="ml-auto text-[10px] uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                              Em breve
                            </span>
                          </Button>
                      </div>
                      
                      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-3">
                          <p className="text-xs text-muted-foreground">
                            <strong>Importante:</strong> Esse tipo será o padrão de todas as questões geradas pela IA. 
                            Você poderá alterar individualmente na próxima etapa de curadoria.
                          </p>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>

                  {/* TASK 3.4 - Card: Nível de Dificuldade com MAIOR destaque visual */}
                  <Card className="border-2 border-accent bg-gradient-to-br from-accent/10 to-accent/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-accent" />
                        Nível de Dificuldade
                      </CardTitle>
                      <CardDescription className="text-base">Defina a complexidade das questões geradas</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <Button
                          type="button"
                          variant={formData.iaConfig?.dificuldade === "iniciante" ? "default" : "outline"}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              iaConfig: { ...formData.iaConfig!, dificuldade: "iniciante" },
                            })
                          }
                          className="flex-col h-auto py-4 gap-1"
                        >
                          <span className="font-bold text-base">Iniciante</span>
                          <span className="text-xs opacity-80">Questões básicas</span>
                        </Button>
                        <Button
                          type="button"
                          variant={formData.iaConfig?.dificuldade === "intermediario" ? "default" : "outline"}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              iaConfig: { ...formData.iaConfig!, dificuldade: "intermediario" },
                            })
                          }
                          className="flex-col h-auto py-4 gap-1"
                        >
                          <span className="font-bold text-base">Intermediário</span>
                          <span className="text-xs opacity-80">Nível moderado</span>
                        </Button>
                        <Button
                          type="button"
                          variant={formData.iaConfig?.dificuldade === "avancado" ? "default" : "outline"}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              iaConfig: { ...formData.iaConfig!, dificuldade: "avancado" },
                            })
                          }
                          className="flex-col h-auto py-4 gap-1"
                        >
                          <span className="font-bold text-base">Avançado</span>
                          <span className="text-xs opacity-80">Alta complexidade</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                    {/* Botão de gerar */}
                    <Button className="w-full gap-2 h-12" size="lg" onClick={gerarQuestoesIA} disabled={isGeneratingQuestions}>
                      {isGeneratingQuestions ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      {isGeneratingQuestions ? "Gerando..." : "Gerar Questões com IA"}
                    </Button>

                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">
                          A IA gerará questões com base no conteúdo que você forneceu e nas
                          configurações acima. Você poderá revisar e editar todas as questões na
                          próxima etapa.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* TASK 6 - ETAPA 5: CURADORIA DE QUESTÕES */}
            {currentStep === "curadoria" && !formData.semAvaliacao && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Curadoria de Questões</CardTitle>
                  <CardDescription>Revise e organize as questões do treinamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* TASK 6 - Lista com drag & drop sempre ativo */}
                  {formData.questoes.length > 0 && (
                    <div className="space-y-3">
                      <Label>Questões Adicionadas ({formData.questoes.length})</Label>
                      <p className="text-xs text-muted-foreground">
                        Arraste as questões para reordenar
                      </p>
                      <div className="space-y-2">
                        {formData.questoes
                          .sort((a, b) => a.order - b.order)
                          .map((questao, idx) => (
                            <div
                              key={questao.id}
                              draggable
                              onDragStart={() => handleDragStart(questao.id)}
                              onDragOver={(e) => handleDragOver(e, questao.id)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-start gap-3 p-3 border rounded-lg cursor-move hover:border-primary/50 transition-colors ${
                                draggedQuestionId === questao.id ? "opacity-50" : ""
                              }`}
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-2">
                                    <p className="font-medium text-sm break-words">
                                      {idx + 1}. {questao.pergunta || "Nova questão"}
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {questao.tiposResposta && questao.tiposResposta.length > 0 ? (
                                        questao.tiposResposta.map((tipo, tipoIdx) => (
                                          <Badge key={tipoIdx} variant="secondary" className="text-xs">
                                            {tipo === "multipla-escolha" && "Múltipla escolha"}
                                            {tipo === "checkbox" && "Caixa de seleção"}
                                            {tipo === "descritiva" && "Descritiva"}
                                            {tipo === "video" && "Vídeo"}
                                            {tipo === "audio" && "Áudio"}
                                          </Badge>
                                        ))
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          {questao.tipo === "multipla-escolha" ? "Múltipla Escolha" : "Descritiva"}
                                        </Badge>
                                      )}
                                    </div>
                                    {questao.alternativas && questao.alternativas.length > 0 && (
                                      <div className="mt-2 space-y-1 pl-3 border-l-2 border-primary/20">
                                        <p className="text-xs font-semibold text-muted-foreground">
                                          Alternativas:
                                        </p>
                                        {questao.alternativas.map((alt, altIdx) => (
                                          <p key={altIdx} className="text-xs text-muted-foreground">
                                            {String.fromCharCode(65 + altIdx)}) {alt}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {/* TASK 1 - Botões de editar e remover */}
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => editarQuestao(questao)}
                                      className="flex-shrink-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeQuestao(questao.id)}
                                      className="flex-shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* TASK 2-4: Formulário inline para adicionar questão */}
                  {!showNovaQuestaoModal ? (
                    <div>
                      <Button 
                        onClick={() => {
                          // TASK 2 - Sem tipo pré-selecionado
                          setNovaQuestao({
                            id: `q${Date.now()}`,
                            pergunta: "",
                            tipo: "multipla-escolha",
                            tiposResposta: [], // Vazio por padrão
                            alternativas: ["", ""],
                            alternativaCorreta: 0,
                            order: formData.questoes.length,
                          })
                          setQuestaoEditandoId(null) // Garantir que não está editando
                          setShowNovaQuestaoModal(true)
                        }} 
                        variant="outline" 
                        className="w-full gap-2 bg-transparent"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Questão Manual
                      </Button>
                    </div>
                  ) : (
                    <Card className="border-2 border-primary/50 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {questaoEditandoId ? "Editar Questão" : "Nova Questão"}
                        </CardTitle>
                        <CardDescription>
                          {questaoEditandoId 
                            ? "Modifique os campos para atualizar a questão" 
                            : "Preencha os campos para criar uma nova questão"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* 1. Enunciado da questão */}
                        <div className="space-y-2">
                          <Label>Enunciado da Questão *</Label>
                          <Textarea
                            value={novaQuestao?.pergunta || ""}
                            onChange={(e) =>
                              setNovaQuestao({ ...novaQuestao!, pergunta: e.target.value })
                            }
                            placeholder="Digite a pergunta ou enunciado da questão aqui..."
                            rows={3}
                          />
                        </div>

                        {/* TASK 2 - Tipo de resposta (múltipla seleção, SEM pré-seleção) */}
                        <div className="space-y-3">
                          <Label>Tipo de Resposta * (pode selecionar múltiplos)</Label>
                          
                          {/* TASK 2 - Aviso quando nenhum tipo está selecionado */}
                          {(!novaQuestao?.tiposResposta || novaQuestao.tiposResposta.length === 0) && (
                            <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                              <CardContent className="pt-3 pb-3">
                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                  <strong>Atenção:</strong> Selecione pelo menos um tipo de resposta para continuar
                                </p>
                              </CardContent>
                            </Card>
                          )}
                          
                            <div className="space-y-2">
                              {[
                                { value: "multipla-escolha", label: "Múltipla escolha", icon: Check },
                                { value: "checkbox", label: "Caixa de seleção", icon: CheckSquare },
                                { value: "descritiva", label: "Resposta descritiva", icon: FileText },
                                { value: "video", label: "Resposta por vídeo", icon: Video, comingSoon: true },
                                { value: "audio", label: "Resposta por áudio", icon: Mic, comingSoon: true },
                              ].map((tipo) => {
                                const isComingSoon = !!tipo.comingSoon
                                return (
                                  <div
                                    key={tipo.value}
                                    className={`relative flex items-center gap-3 p-3 border rounded hover:bg-accent/5 ${isComingSoon ? "opacity-60 pointer-events-none" : ""}`}
                                  >
                                    {isComingSoon && (
                                      <div className="absolute top-2 right-2">
                                        <Badge
                                          variant="secondary"
                                          className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                        >
                                          Em breve
                                        </Badge>
                                      </div>
                                    )}
                                    <input
                                      type="checkbox"
                                      checked={novaQuestao?.tiposResposta?.includes(tipo.value) || false}
                                      onChange={(e) => {
                                        if (isComingSoon) return
                                        const currentTypes = novaQuestao?.tiposResposta || []
                                        const newTypes = e.target.checked
                                          ? [...currentTypes, tipo.value]
                                          : currentTypes.filter((t) => t !== tipo.value)
                                        
                                        // TASK 3 - Gerenciar alternativas baseado nos tipos selecionados
                                        const precisaAlternativas = newTypes.includes("multipla-escolha") || newTypes.includes("checkbox")
                                        const novaQuestaoAtualizada = { 
                                          ...novaQuestao!, 
                                          tiposResposta: newTypes,
                                          tipo: newTypes[0] || "multipla-escolha"
                                        }
                                        
                                        if (!precisaAlternativas) {
                                          // Limpar alternativas se nenhum tipo que precisa delas está selecionado
                                          novaQuestaoAtualizada.alternativas = []
                                          novaQuestaoAtualizada.alternativaCorreta = undefined
                                        } else if (!novaQuestao?.alternativas || novaQuestao.alternativas.length === 0) {
                                          // Inicializar alternativas se necessário e não existirem
                                          novaQuestaoAtualizada.alternativas = ["", ""]
                                          novaQuestaoAtualizada.alternativaCorreta = 0
                                        }
                                        
                                        setNovaQuestao(novaQuestaoAtualizada)
                                      }}
                                      className="w-4 h-4"
                                      disabled={isComingSoon}
                                    />
                                    <tipo.icon className="h-4 w-4 text-muted-foreground" />
                                    <Label className="cursor-pointer flex-1 m-0">{tipo.label}</Label>
                                  </div>
                                )
                              })}
                            </div>
                        </div>

                        {/* 3. IF múltipla escolha OU checkbox - mostrar alternativas */}
                        {(novaQuestao?.tiposResposta?.includes("multipla-escolha") || 
                          novaQuestao?.tiposResposta?.includes("checkbox")) && (
                          <div className="space-y-3">
                            <Label>
                              {novaQuestao?.tiposResposta?.includes("checkbox") ? "Opções de Seleção" : "Alternativas"}
                            </Label>
                            <div className="space-y-2">
                              {novaQuestao?.alternativas?.map((alt, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  {novaQuestao?.tiposResposta?.includes("multipla-escolha") && (
                                    <input
                                      type="radio"
                                      checked={novaQuestao.alternativaCorreta === index}
                                      onChange={() =>
                                        setNovaQuestao({ ...novaQuestao, alternativaCorreta: index })
                                      }
                                      className="flex-shrink-0"
                                    />
                                  )}
                                  <Input
                                    value={alt}
                                    onChange={(e) => {
                                      const newAlts = [...(novaQuestao.alternativas || [])]
                                      newAlts[index] = e.target.value
                                      setNovaQuestao({ ...novaQuestao, alternativas: newAlts })
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault()
                                        const newAlts = [...(novaQuestao.alternativas || []), ""]
                                        setNovaQuestao({ ...novaQuestao, alternativas: newAlts })
                                      }
                                    }}
                                    placeholder={`${novaQuestao?.tiposResposta?.includes("checkbox") ? "Opção" : "Alternativa"} ${index + 1}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newAlts = novaQuestao.alternativas?.filter((_, i) => i !== index)
                                      setNovaQuestao({ ...novaQuestao, alternativas: newAlts })
                                    }}
                                    disabled={novaQuestao.alternativas.length <= 2}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newAlts = [...(novaQuestao?.alternativas || []), ""]
                                  setNovaQuestao({ ...novaQuestao!, alternativas: newAlts })
                                }}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar {novaQuestao?.tiposResposta?.includes("checkbox") ? "Opção" : "Alternativa"}
                              </Button>
                            </div>
                            {novaQuestao?.tiposResposta?.includes("multipla-escolha") && (
                              <p className="text-xs text-muted-foreground">
                                Selecione a alternativa correta clicando no círculo. Pressione Enter para adicionar nova alternativa.
                              </p>
                            )}
                            {novaQuestao?.tiposResposta?.includes("checkbox") && (
                              <p className="text-xs text-muted-foreground">
                                Pressione Enter para adicionar nova opção.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowNovaQuestaoModal(false)
                              setNovaQuestao(null)
                              setQuestaoEditandoId(null) // TASK 1 - Limpar estado de edição
                            }}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={salvarNovaQuestao}
                            className="flex-1 gap-2"
                          >
                            <Check className="h-4 w-4" />
                            {questaoEditandoId ? "Atualizar Questão" : "Salvar Questão"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* TASK 6 - Toggle de ordem obrigatória no FINAL */}
                  {formData.questoes.length > 0 && (
                    <Card className="bg-accent/10 border-accent/20 mt-6">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <ListOrdered className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-sm">
                                Exigir que as questões sejam respondidas na ordem definida
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Quando ativo, o colaborador só pode avançar após responder a questão
                                anterior
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.ordemObrigatoria}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, ordemObrigatoria: checked })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TASK 1-2-3 - NOVA ETAPA 6: PÚBLICO */}
            {currentStep === "publico" && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Definir Público</CardTitle>
                  <CardDescription>
                    {formData.vinculadoCampanha 
                      ? "O público deste treinamento é definido pela campanha vinculada"
                      : "Escolha quem terá acesso a este treinamento"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* TASK 3 - Se vinculado a campanha, mostrar apenas informativo */}
                  {formData.vinculadoCampanha ? (
                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Público definido pela campanha</h4>
                            <p className="text-sm text-muted-foreground">
                              Este treinamento está vinculado à campanha <strong>{campanhaSelecionada?.title || "selecionada"}</strong>.
                              O público que receberá este treinamento é o mesmo público definido na campanha e não pode ser alterado aqui.
                            </p>
                            {campanhaSelecionada?.audience && (
                              <div className="mt-3 p-3 bg-background rounded border">
                                <p className="text-xs font-medium mb-1">Público da campanha:</p>
                                <p className="text-xs text-muted-foreground">
                                  {campanhaSelecionada.audience === "all" ? "Todo o time" : "Colaboradores específicos"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* TASK 2 - Opções de público quando não há campanha */}
                      <div className="space-y-4">
                        <Label className="text-base">Selecione o público</Label>
                        
                        {/* Opção 1: Todo o time (padrão) */}
                        <Card 
                          className={`cursor-pointer transition-all ${
                            formData.publicoTipo === "todo-time" 
                              ? "border-primary bg-primary/5 border-2" 
                              : "border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, publicoTipo: "todo-time", colaboradoresSelecionados: [] })}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <input
                                  type="radio"
                                  checked={formData.publicoTipo === "todo-time"}
                                  onChange={() => setFormData({ ...formData, publicoTipo: "todo-time", colaboradoresSelecionados: [] })}
                                  className="w-4 h-4"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Todo o meu time</h4>
                                <p className="text-xs text-muted-foreground">
                                  Todos os colaboradores do seu time terão acesso a este treinamento
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Opção 2: Colaboradores específicos */}
                        <Card 
                          className={`cursor-pointer transition-all ${
                            formData.publicoTipo === "colaboradores-especificos" 
                              ? "border-primary bg-primary/5 border-2" 
                              : "border hover:border-primary/50"
                          }`}
                          onClick={() => setFormData({ ...formData, publicoTipo: "colaboradores-especificos" })}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                <input
                                  type="radio"
                                  checked={formData.publicoTipo === "colaboradores-especificos"}
                                  onChange={() => setFormData({ ...formData, publicoTipo: "colaboradores-especificos" })}
                                  className="w-4 h-4"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">Colaboradores específicos do meu time</h4>
                                <p className="text-xs text-muted-foreground">
                                  Selecione apenas os colaboradores que devem receber este treinamento
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* TASK 2 - Card de seleção de colaboradores (quando opção 2 está ativa) */}
                      {formData.publicoTipo === "colaboradores-especificos" && (
                        <Card className="border-2">
                          <CardHeader>
                            <CardTitle className="text-base">Selecionar Colaboradores</CardTitle>
                            <CardDescription>
                              Escolha os colaboradores que terão acesso ao treinamento
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {colaboradoresDoTime.length > 0 ? (
                              <>
                                <div className="space-y-2">
                                  {colaboradoresDoTime.map((colaborador) => (
                                    <div
                                      key={colaborador.id}
                                      className="flex items-center gap-3 p-3 border rounded hover:bg-accent/5 cursor-pointer"
                                      onClick={() => {
                                        const isSelected = formData.colaboradoresSelecionados.includes(colaborador.id)
                                        const newSelected = isSelected
                                          ? formData.colaboradoresSelecionados.filter(id => id !== colaborador.id)
                                          : [...formData.colaboradoresSelecionados, colaborador.id]
                                        setFormData({ ...formData, colaboradoresSelecionados: newSelected })
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={formData.colaboradoresSelecionados.includes(colaborador.id)}
                                        onChange={() => {}}
                                        className="w-4 h-4"
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{colaborador.nome}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {colaborador.cargo} • {colaborador.email}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                {formData.colaboradoresSelecionados.length > 0 && (
                                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                                    <CardContent className="pt-3">
                                      <p className="text-sm">
                                        <strong>{formData.colaboradoresSelecionados.length}</strong> colaborador(es) selecionado(s)
                                      </p>
                                    </CardContent>
                                  </Card>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum colaborador encontrado no seu time
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TASK 7 - ETAPA 7: CONFIGURAÇÃO DA AVALIAÇÃO (sem toggle de ativar/desativar) */}
              {currentStep === "avaliacao" && !formData.semAvaliacao && (
                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Configuração da Avaliação</CardTitle>
                    <CardDescription>Defina as regras de conclusão</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  {/* TASK 6 - Apenas o toggle de obrigatoriedade */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-base">Responder todas as questões para concluir</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          O colaborador precisa responder todas as questões antes de marcar como concluído
                        </p>
                      </div>
                      <Switch
                        checked={formData.questoesObrigatorias}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, questoesObrigatorias: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Label className="text-base">Permitir repetição do treinamento pelo usuário</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Define se o colaborador poderá refazer o treinamento após concluí-lo
                        </p>
                      </div>
                      <Switch
                        checked={formData.permitirRepeticao}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, permitirRepeticao: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentStep === "certificado" && (
                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-6 w-6 text-accent" />
                      Emissão de Certificado
                    </CardTitle>
                    <CardDescription>Configure se deseja emitir certificado de conclusão para este treinamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed">
                      <div className="flex-1">
                        <Label className="text-base font-semibold">Emitir certificado ao concluir</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ao ativar, o colaborador receberá um certificado digital após concluir o treinamento com sucesso
                        </p>
                      </div>
                      <Switch
                        checked={formData.emitirCertificado}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, emitirCertificado: checked })
                        }
                      />
                    </div>

                    {formData.emitirCertificado && (
                      <div className="space-y-6 pl-4 border-l-2 border-accent/30">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Modelo do Certificado</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-md border-2 ${formData.modeloCertificado === "padrao" ? "border-accent bg-accent/5" : "border-transparent"}`}
                              onClick={() => setFormData({ ...formData, modeloCertificado: "padrao" })}
                            >
                              <CardContent className="px-6 pt-6 text-center">
                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mx-auto">
                                  <Award className="h-8 w-8 text-accent" />
                                </div>
                                <h4 className="font-semibold mb-1">Modelo Padrão</h4>
                                <p className="text-xs text-muted-foreground">
                                  Certificado padrão do Engage AI com logo e assinatura da empresa
                                </p>
                              </CardContent>
                            </Card>
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-md border-2 ${formData.modeloCertificado === "custom" ? "border-primary bg-primary/5" : "border-transparent"}`}
                              onClick={() => setFormData({ ...formData, modeloCertificado: "custom" })}
                            >
                              <CardContent className="px-6 pt-6 text-center">
                                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                                  <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                                <h4 className="font-semibold mb-1">Modelo Customizado</h4>
                                <p className="text-xs text-muted-foreground">
                                  Personalize o texto e mensagem do certificado
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {formData.modeloCertificado === "custom" && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Texto do certificado (opcional)</Label>
                            <Textarea
                              rows={6}
                              placeholder="Ex: Certificamos que [NOME] concluiu com êxito o treinamento [TÍTULO], demonstrando excelência e comprometimento..."
                              value={formData.textoCertificado || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, textoCertificado: e.target.value })
                              }
                              className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                              Use [NOME] para o nome do colaborador e [TÍTULO] para o título do treinamento. Se deixar vazio, será usado o texto padrão.
                            </p>
                          </div>
                        )}

                          <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5">
                          <CardContent className="px-6 pt-6 text-center">
                            <Award className="h-12 w-12 text-accent mx-auto mb-3" />
                            <h4 className="font-bold text-lg mb-2">Certificado de Conclusão</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              {certificatePreviewText}
                            </p>
                            <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
                              <div>
                                <p className="font-semibold">Data de Conclusão</p>
                                <p>13/02/2026</p>
                              </div>
                              <div>
                                <p className="font-semibold">Carga Horária</p>
                                <p>-</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                              <div className="text-sm space-y-2 text-blue-800 dark:text-blue-200">
                                <p className="font-medium text-blue-900 dark:text-blue-100">Como funciona?</p>
                                <div>• O certificado será gerado automaticamente após a conclusão</div>
                                <div>• O colaborador poderá baixar o certificado em PDF</div>
                                <div>• O certificado ficará disponível na área "Meus Certificados"</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* TASK 8 - ETAPA 7: PRAZOS E DISPONIBILIDADE */}
              {currentStep === "prazos" && (
                <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Prazos e Disponibilidade</CardTitle>
                  <CardDescription>Configure quando o treinamento estará disponível</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.vinculadoCampanha ? (
                    // Campanha - apenas informativo
                    <Card className="bg-primary/10 border-primary/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Prazos Herdados da Campanha</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Os prazos deste treinamento são definidos pela campanha vinculada.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Sem campanha - configuração manual
                    <>
                      {/* TASK 8 - Data de início = data atual, não editável */}
                      <div className="space-y-2">
                        <Label>Data de Início</Label>
                        <Input
                          type="date"
                          value={formData.dataInicio}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          O treinamento fica disponível imediatamente após a publicação
                        </p>
                      </div>

                      {/* TASK 8 - Data de término configurável */}
                      <div className="space-y-2">
                        <Label>Data de Término</Label>
                        <Input
                          type="date"
                          value={formData.dataFim}
                          min={formData.dataInicio}
                          onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          O treinamento se encerra automaticamente nesta data
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* TASK 9 - ETAPA 8: GANHOS */}
            {currentStep === "ganhos" && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Ganhos e Recompensas</CardTitle>
                  <CardDescription>Configure XP e estrelas por conclusão</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.vinculadoCampanha ? (
                    // Campanha - apenas informativo
                    <Card className="bg-primary/10 border-primary/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Ganhos Herdados da Campanha</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              As recompensas deste treinamento são definidas pela campanha
                              vinculada.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Sem campanha - configuração manual (funciona com e sem avaliação)
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Recompensas por Conclusão</Label>
                        <Switch
                          checked={formData.ganhosAtivos}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, ganhosAtivos: checked })
                          }
                        />
                      </div>

                      {formData.ganhosAtivos && (
                        <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-accent" />
                              Pontos de Experiência (XP)
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.xp}
                              onChange={(e) =>
                                setFormData({ ...formData, xp: Number.parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-500" />
                              Estrelas
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              value={formData.estrelas}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  estrelas: Number.parseInt(e.target.value) || 0,
                                })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* TASK 9 - Funciona com e sem avaliação */}
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">
                            {formData.semAvaliacao
                              ? "O colaborador ganhará as recompensas ao marcar o treinamento como concluído."
                              : "O colaborador ganhará as recompensas ao completar todas as questões."}
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ETAPA 9: PREVIEW FINAL */}
            {currentStep === "preview" && (
              <Card className="clay-card border-0">
                <CardHeader>
                  <CardTitle>Revisão Final</CardTitle>
                  <CardDescription>Confira todas as configurações antes de publicar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Informações Gerais */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-primary uppercase">
                      Informações Gerais
                    </h4>
                    <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Título</p>
                        <p className="font-medium text-sm">{formData.titulo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Descrição</p>
                        <p className="text-sm">{formData.descricao}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vínculos */}
                  {formData.vinculadoCampanha && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-primary uppercase">Vínculos</h4>
                      <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Campanha Vinculada</p>
                          <Badge className="bg-primary mt-1">
                            {campanhas.find((c) => c.id === formData.campanhaId)?.titulo ||
                              "Campanha"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conteúdo e Avaliação */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-primary uppercase">
                      Conteúdo e Avaliação
                    </h4>
                    <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo de Conteúdo</p>
                        <p className="text-sm">{formData.conteudoOrigem || "Texto"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Modo de Avaliação</p>
                        <Badge variant={formData.semAvaliacao ? "secondary" : "default"}>
                          {formData.semAvaliacao ? "Sem Avaliação" : "Com Avaliação"}
                        </Badge>
                      </div>
                      {!formData.semAvaliacao && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground">Total de Questões</p>
                            <p className="text-sm">{formData.questoes.length} questões</p>
                          </div>
                          {formData.ordemObrigatoria && (
                            <div className="flex items-center gap-2 text-sm">
                              <ListOrdered className="h-4 w-4 text-accent" />
                              <span>Ordem sequencial obrigatória</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Prazos */}
                  {!formData.vinculadoCampanha && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-primary uppercase">Prazos</h4>
                      <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Data de Início</p>
                          <p className="text-sm">
                            {formData.dataInicio
                              ? new Date(formData.dataInicio).toLocaleDateString("pt-BR")
                              : "Imediatamente"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Data de Término</p>
                          <p className="text-sm">
                            {formData.dataFim
                              ? new Date(formData.dataFim).toLocaleDateString("pt-BR")
                              : "Não definida"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ganhos */}
                  {!formData.vinculadoCampanha && formData.ganhosAtivos && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-primary uppercase">Recompensas</h4>
                      <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4 text-accent" />
                            <span className="text-sm">{formData.xp} XP</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm">{formData.estrelas} Estrelas</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alertas */}
                  {formData.questoes.length === 0 && !formData.semAvaliacao && (
                    <Card className="bg-destructive/10 border-destructive/20">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertCircle className="h-5 w-5" />
                          <p className="text-sm font-medium">
                            Adicione pelo menos uma questão ou ative o modo "sem avaliação"
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="gap-2 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentStep === "preview" ? (
                <Button onClick={() => setShowPublishModal(true)} className="gap-2">
                  <Save className="h-4 w-4" />
                  Publicar Treinamento
                </Button>
              ) : (
                <Button onClick={nextStep} className="gap-2">
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Preview Card Lateral */}
          <div className="hidden lg:block">
            <PreviewCard />
          </div>
        </div>
      </div>

      {/* TASK 2 - Modal IA para Título e Descrição */}
      <Dialog open={showIaModal} onOpenChange={setShowIaModal}>
        <DialogContent style={{ maxWidth: '760px', width: 'min(90vw, 760px)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Assistente de IA
            </DialogTitle>
            <DialogDescription>
              Descreva o objetivo do treinamento e a IA sugerirá título e descrição
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objetivo do Treinamento</Label>
              <Textarea
                value={iaPrompt}
                onChange={(e) => setIaPrompt(e.target.value)}
                placeholder="Ex: Treinar gestores em técnicas de liderança, comunicação e gestão de conflitos..."
                rows={4}
                className="resize-none w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A IA analisará seu contexto e gerará sugestões de título e descrição otimizadas.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={gerarTituloDescricaoIA} disabled={isGeneratingIA} className="gap-2">
              {isGeneratingIA ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Sugestões
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Publicação */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar Treinamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja publicar "{formData.titulo}"?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              O treinamento ficará disponível{" "}
              {formData.vinculadoCampanha
                ? "conforme as regras da campanha"
                : "imediatamente para o público configurado"}
              .
            </p>
            {!formData.semAvaliacao && formData.questoes.length === 0 && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive font-medium">
                    Atenção: Nenhuma questão foi adicionada!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePublish} className="gap-2" disabled={isPublishing || isLoadingEdit}>
              <Check className="h-4 w-4" />
              {isPublishing ? "Publicando..." : "Confirmar Publicação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
