"use client"

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { SurveyService, type QuestionType, type SurveyType } from "@/lib/survey-service"
import { EngajamentoService, type Engajamento } from "@/lib/engajamento-service"
import { EventoService, type Evento } from "@/lib/evento-service"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle2,
  FileText,
  Target,
  Users,
  Settings,
  HelpCircle,
  Eye,
  Sparkles,
  Plus,
  X,
  Trash2,
  GripVertical,
  Clock,
  Zap,
  Award,
  AlertCircle,
  Link2,
  Info,
  Calendar,
  ListOrdered,
} from "lucide-react"

type Step = "informacoes" | "direcionamento" | "campanha" | "publico" | "regras" | "perguntas" | "preview"

interface Question {
  id: string
  text: string
  type: QuestionType
  options?: string[]
  order: number
}

const STEPS = [
  { id: "informacoes", label: "Informações Básicas", icon: FileText },
  { id: "direcionamento", label: "Direcionamento", icon: Target },
  { id: "campanha", label: "Campanha", icon: Link2 },
  { id: "publico", label: "Público", icon: Users },
  { id: "regras", label: "Regras", icon: Settings },
  { id: "perguntas", label: "Perguntas", icon: HelpCircle },
  { id: "preview", label: "Preview", icon: Eye },
] as const

export default function CreateSurveyPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<Step>("informacoes")
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showIaModal, setShowIaModal] = useState(false)
  const [iaPrompt, setIaPrompt] = useState("")
  const [isGeneratingIA, setIsGeneratingIA] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "pulse" as SurveyType,
    vinculadaEvento: false,
    eventoId: "",
    eventoNovo: { titulo: "", descricao: "" },
    vinculadaCampanha: false,
    campanhaId: "",
    publicoTipo: "todo_time" as "todo_time" | "colaborador_especifico",
    publicoIds: [] as string[],
    dataFinal: "",
    ganhosAtivos: true,
    xp: 30,
    estrelas: 10,
    ordemSequencial: false,
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    text: "",
    type: "rating",
    options: [],
  })
  const [optionInput, setOptionInput] = useState("")
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)

  const [campanhas, setCampanhas] = useState<Engajamento[]>([])
  const [campanhaSelecionada, setCampanhaSelecionada] = useState<Engajamento | null>(null)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [colaboradores] = useState([
    { id: "1", nome: "Ana Silva", avatar: "/professional-avatar-woman.jpg" },
    { id: "2", nome: "Carlos Santos", avatar: "/professional-avatar-smiling.jpg" },
    { id: "3", nome: "Maria Oliveira", avatar: "/professional-avatar-smiling-woman.jpg" },
  ])

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Carregar apenas campanhas ativas
      const allEngajamentos = EngajamentoService.getAllEngajamentos()
      const campanhasAtivas = allEngajamentos.filter(
        (e) => e.type === "campanha" && new Date(e.endDate) >= new Date()
      )
      setCampanhas(campanhasAtivas)

      // Carregar eventos
      setEventos(EventoService.getAllEventos())
    }
  }, [])

  // Verificação de permissão
  useEffect(() => {
    if (!user || !hasPermission(["gestor", "super-admin"])) {
      router.push("/")
    }
  }, [user, hasPermission, router])

  // Ao vincular campanha, herdar regras
  useEffect(() => {
    if (formData.vinculadaCampanha && formData.campanhaId) {
      const campanha = campanhas.find((c) => c.id === formData.campanhaId)
      if (campanha) {
        setCampanhaSelecionada(campanha)
        // Herdar configurações da campanha
        setFormData((prev) => ({
          ...prev,
          publicoTipo: "todo_time", // Campanhas são sempre para todo time
        }))
      }
    } else {
      setCampanhaSelecionada(null)
    }
  }, [formData.vinculadaCampanha, formData.campanhaId, campanhas])

  // Mostrar loading enquanto verifica permissões
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
            <CardDescription>Você não tem permissão para criar pesquisas.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Navegação entre etapas
  const STEP_ORDER: Step[] = ["informacoes", "direcionamento", "campanha", "publico", "regras", "perguntas", "preview"]

  const getVisibleSteps = (): Step[] => {
    const steps: Step[] = ["informacoes", "direcionamento", "campanha"]

    // Se não tem campanha vinculada, mostrar público
    if (!formData.vinculadaCampanha) {
      steps.push("publico")
    }

    steps.push("regras", "perguntas", "preview")
    return steps
  }

  const currentStepIndex = getVisibleSteps().indexOf(currentStep)

  const nextStep = () => {
    const visibleSteps = getVisibleSteps()
    const nextIndex = currentStepIndex + 1
    if (nextIndex < visibleSteps.length) {
      setCurrentStep(visibleSteps[nextIndex])
    }
  }

  const prevStep = () => {
    const visibleSteps = getVisibleSteps()
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(visibleSteps[prevIndex])
    }
  }

  const goToStep = (stepId: Step) => {
    const visibleSteps = getVisibleSteps()
    if (visibleSteps.includes(stepId)) {
      setCurrentStep(stepId)
    }
  }

  // IA - Gerar título e descrição
  const handleGenerateWithIA = async () => {
    if (!iaPrompt.trim()) {
      toast({
        title: "Campo vazio",
        description: "Descreva o objetivo da pesquisa para a IA ajudar.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingIA(true)

    // Simulação de IA
    setTimeout(() => {
      const sugestoes = {
        titulo: `Pesquisa: ${iaPrompt.substring(0, 40)}`,
        descricao: `Esta pesquisa tem como objetivo ${iaPrompt.toLowerCase()}. Os resultados nos ajudarão a tomar decisões mais informadas e melhorar continuamente.`,
      }

      setFormData((prev) => ({
        ...prev,
        titulo: sugestoes.titulo,
        descricao: sugestoes.descricao,
      }))

      setIsGeneratingIA(false)
      setShowIaModal(false)
      setIaPrompt("")

      toast({
        title: "IA gerou sugestões",
        description: "Título e descrição foram preenchidos. Você pode editá-los.",
      })
    }, 1500)
  }

  // Adicionar pergunta
  const addQuestion = () => {
    if (!currentQuestion.text?.trim()) {
      toast({
        title: "Erro",
        description: "Digite o texto da pergunta",
        variant: "destructive",
      })
      return
    }

    if (currentQuestion.type === "multiple-choice" || currentQuestion.type === "checkbox") {
      if (!currentQuestion.options || currentQuestion.options.length < 2) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos 2 opções",
          variant: "destructive",
        })
        return
      }
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      text: currentQuestion.text,
      type: currentQuestion.type || "rating",
      options: currentQuestion.options,
      order: questions.length + 1,
    }

    setQuestions([...questions, newQuestion])
    setCurrentQuestion({ text: "", type: "rating", options: [] })
    setOptionInput("")

    toast({
      title: "Pergunta adicionada",
      description: "A pergunta foi adicionada com sucesso",
    })
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const addOption = () => {
    if (!optionInput.trim()) return
    setCurrentQuestion((prev) => ({
      ...prev,
      options: [...(prev.options || []), optionInput],
    }))
    setOptionInput("")
  }

  const removeOption = (index: number) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index),
    }))
  }

  // Drag and drop para reordenação
  const handleDragStart = (questionId: string) => {
    setDraggedQuestionId(questionId)
  }

  const handleDragOver = (e: React.DragEvent, targetQuestionId: string) => {
    e.preventDefault()
    if (!draggedQuestionId || draggedQuestionId === targetQuestionId) return

    const draggedIndex = questions.findIndex((q) => q.id === draggedQuestionId)
    const targetIndex = questions.findIndex((q) => q.id === targetQuestionId)

    const newQuestions = [...questions]
    const [draggedQuestion] = newQuestions.splice(draggedIndex, 1)
    newQuestions.splice(targetIndex, 0, draggedQuestion)

    // Reordenar
    const reordered = newQuestions.map((q, idx) => ({ ...q, order: idx + 1 }))
    setQuestions(reordered)
  }

  const handleDragEnd = () => {
    setDraggedQuestionId(null)
  }



  // Publicar pesquisa
  const handlePublish = () => {
    if (!formData.titulo.trim() || !formData.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Preencha título e descrição",
        variant: "destructive",
      })
      return
    }

    if (questions.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma pergunta",
        variant: "destructive",
      })
      return
    }

    const novaPesquisa = {
      id: `survey-${Date.now()}`,
      title: formData.titulo,
      description: formData.descricao,
      type: formData.tipo,
      questions: questions.map((q) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        required: false, // Todas opcionais agora
      })),
      targetAudience: formData.publicoTipo === "todo_time" ? "all" : formData.publicoIds,
      deadline: formData.dataFinal ? new Date(formData.dataFinal).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      rewards: formData.ganhosAtivos && !formData.vinculadaCampanha ? { xp: formData.xp, stars: formData.estrelas } : undefined,
      sequentialOrder: formData.ordemSequencial,
      linkedToCampaign: formData.vinculadaCampanha,
      campaignId: formData.campanhaId || undefined,
      linkedToEvent: formData.vinculadaEvento,
      eventId: formData.eventoId || undefined,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      status: "active" as const,
      responses: [],
    }

    SurveyService.createSurvey(novaPesquisa)

    toast({
      title: "Pesquisa publicada!",
      description: "A pesquisa foi criada com sucesso",
    })

    setTimeout(() => {
      router.push("/pesquisas")
    }, 1000)
  }

  // Preview Card Component
  const PreviewCard = () => (
    <div className="sticky top-6">
      <Card className="clay-card border-2 border-primary w-full max-w-full">
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
            <div className="rounded-xl overflow-hidden border-2 border-border bg-card max-w-full">
              <div className="p-4 bg-card">
                <h3 className="font-bold text-foreground break-words">
                  {formData.titulo || "Título da Pesquisa"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-words">
                  {formData.descricao || "Descrição da pesquisa aparecerá aqui"}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  {!formData.vinculadaCampanha && formData.dataFinal && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span>Até {new Date(formData.dataFinal).toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                  {formData.ganhosAtivos && !formData.vinculadaCampanha && (
                    <>
                      {formData.dataFinal && <span>•</span>}
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-accent flex-shrink-0" />
                        <span>+{formData.xp} XP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                        <span>+{formData.estrelas} ★</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Perguntas:</span>
                <Badge variant="outline">{questions.length}</Badge>
              </div>
              {formData.vinculadaCampanha && campanhaSelecionada && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Campanha:</span>
                  <Badge className="bg-primary">{campanhaSelecionada.titulo}</Badge>
                </div>
              )}
              {formData.vinculadaEvento && formData.eventoId && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Evento:</span>
                  <Badge variant="secondary">Vinculado</Badge>
                </div>
              )}
              {formData.ordemSequencial && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ordem:</span>
                  <Badge variant="outline">Sequencial</Badge>
                </div>
              )}
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
            <Button
              variant="outline"
              size="icon"
              className="clay-button bg-transparent"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Criar Pesquisa</h1>
              <p className="text-muted-foreground">Configure sua pesquisa em etapas</p>
            </div>
          </div>
          <Button onClick={() => setShowPublishModal(true)} size="lg" className="clay-button">
            <Save className="mr-2 h-5 w-5" />
            Publicar
          </Button>
        </div>

        {/* Steps Navigation - Unificado sem progresso */}
        <Card className="clay-card border-0 w-full max-w-full">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {getVisibleSteps().map((stepId, index) => {
                const step = STEPS.find((s) => s.id === stepId)
                if (!step) return null

                const Icon = step.icon
                const isActive = step.id === currentStep
                const isPast = getVisibleSteps().indexOf(currentStep) > index

                return (
                  <button
                    key={step.id}
                    onClick={() => goToStep(step.id)}
                    className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isPast
                          ? "bg-primary/20 text-foreground hover:bg-primary/30"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        isActive ? "bg-primary-foreground/20" : ""
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <span>{step.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-full">
          {/* Form Area */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            {/* ETAPA 1: INFORMAÇÕES BÁSICAS */}
            {currentStep === "informacoes" && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Dados principais da pesquisa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 w-full max-w-full">
                  <div className="space-y-2 w-full">
                    <Label>
                      Título <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Ex: Pesquisa de Satisfação Q1 2024"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2 w-full">
                    <Label>
                      Descrição <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva o objetivo da pesquisa..."
                      rows={4}
                      className="w-full resize-none"
                    />
                  </div>

                  {/* Card de ajuda IA */}
                  <Card className="bg-accent/10 border-accent/20">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Precisa de ajuda para criar as informações básicas?</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            A IA pode sugerir título e descrição baseados no seu objetivo
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 bg-transparent"
                            onClick={() => setShowIaModal(true)}
                          >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Usar IA
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* ETAPA 2: DIRECIONAMENTO (Informativa) */}
            {currentStep === "direcionamento" && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Direcionamento
                  </CardTitle>
                  <CardDescription>Recomendações de uso para cada tipo de pesquisa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 w-full max-w-full">
                  <div className="grid gap-4">
                    {/* Pulse Survey */}
                    <Card className="border-2 border-border hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-base">Pulse Survey</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Ideal para feedback rápido e frequente</li>
                          <li>1-3 perguntas objetivas</li>
                          <li>Aplicação semanal ou quinzenal</li>
                          <li>Monitora clima organizacional em tempo real</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Pesquisa Longa */}
                    <Card className="border-2 border-border hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-base">Pesquisa Longa</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Para análises aprofundadas</li>
                          <li>5-15 perguntas variadas</li>
                          <li>Aplicação trimestral ou semestral</li>
                          <li>Permite questões abertas e complexas</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Satisfação */}
                    <Card className="border-2 border-border hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-base">Pesquisa de Satisfação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Mede satisfação com serviços/produtos</li>
                          <li>Recomendado: perguntas NPS</li>
                          <li>Escalas de avaliação de 1-10</li>
                          <li>Aplicação após eventos ou treinamentos</li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Pesquisa por Evento */}
                    <Card className="border-2 border-border hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <CardTitle className="text-base">Pesquisa por Evento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Vinculada a eventos específicos</li>
                          <li>Feedback sobre experiência do evento</li>
                          <li>Enviada automaticamente após participação</li>
                        </ul>

                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between mb-3">
                            <Label>Vincular a um evento?</Label>
                            <Switch
                              checked={formData.vinculadaEvento}
                              onCheckedChange={(checked) =>
                                setFormData({ ...formData, vinculadaEvento: checked })
                              }
                            />
                          </div>

                          {formData.vinculadaEvento && (
                            <div className="space-y-3">
                              <Label>Selecione o Evento</Label>
                              <Select
                                value={formData.eventoId}
                                onValueChange={(value) => setFormData({ ...formData, eventoId: value })}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione um evento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {eventos.length === 0 && (
                                    <SelectItem value="none" disabled>
                                      Nenhum evento disponível
                                    </SelectItem>
                                  )}
                                  {/* Eventos Ativos */}
                                  {eventos.filter((e) => new Date(e.data) >= new Date()).length > 0 && (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-primary">
                                        Eventos Ativos
                                      </div>
                                      {eventos
                                        .filter((e) => new Date(e.data) >= new Date())
                                        .map((evento) => (
                                          <SelectItem key={evento.id} value={evento.id}>
                                            {evento.titulo} - {new Date(evento.data).toLocaleDateString()}
                                          </SelectItem>
                                        ))}
                                    </>
                                  )}
                                  {/* Eventos Anteriores */}
                                  {eventos.filter((e) => new Date(e.data) < new Date()).length > 0 && (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        Eventos Anteriores
                                      </div>
                                      {eventos
                                        .filter((e) => new Date(e.data) < new Date())
                                        .map((evento) => (
                                          <SelectItem key={evento.id} value={evento.id}>
                                            {evento.titulo} - {new Date(evento.data).toLocaleDateString()}
                                          </SelectItem>
                                        ))}
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Selecione um evento ativo ou anterior para vincular esta pesquisa
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ETAPA 3: CAMPANHA */}
            {currentStep === "campanha" && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle>Vinculação a Campanha</CardTitle>
                  <CardDescription>Opcional: associar esta pesquisa a uma campanha ativa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 w-full max-w-full">
                  <div className="flex items-center justify-between">
                    <Label>Vincular a uma campanha?</Label>
                    <Switch
                      checked={formData.vinculadaCampanha}
                      onCheckedChange={(checked) => setFormData({ ...formData, vinculadaCampanha: checked })}
                    />
                  </div>

                  {formData.vinculadaCampanha && (
                    <div className="space-y-3">
                      <Select
                        value={formData.campanhaId}
                        onValueChange={(value) => setFormData({ ...formData, campanhaId: value })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma campanha ativa" />
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

                      {campanhaSelecionada && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="pt-4">
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                <span className="font-medium">Regras herdadas da campanha:</span>
                              </div>
                              <ul className="text-muted-foreground space-y-1 ml-6 list-disc">
                                <li>Público: Todo o time</li>
                                <li>Prazo: Definido pelas regras da campanha</li>
                                <li>Ganhos sincronizados com a campanha</li>
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ETAPA 4: PÚBLICO */}
            {currentStep === "publico" && !formData.vinculadaCampanha && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle>Definição do Público</CardTitle>
                  <CardDescription>Selecione quem receberá esta pesquisa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 w-full max-w-full">
                  <div className="space-y-3">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.publicoTipo === "todo_time"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setFormData({ ...formData, publicoTipo: "todo_time", publicoIds: [] })}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-semibold">Time Inteiro</h4>
                          <p className="text-sm text-muted-foreground">
                            Todos os colaboradores receberão a pesquisa
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.publicoTipo === "colaborador_especifico"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setFormData({ ...formData, publicoTipo: "colaborador_especifico" })}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-semibold">Colaboradores Específicos</h4>
                          <p className="text-sm text-muted-foreground">
                            Selecione manualmente quem participará
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.publicoTipo === "colaborador_especifico" && (
                    <div className="space-y-3 pt-4 border-t">
                      <Label>Selecione os colaboradores</Label>
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {colaboradores.map((colab) => (
                          <div
                            key={colab.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                              formData.publicoIds.includes(colab.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                            onClick={() => {
                              const isSelected = formData.publicoIds.includes(colab.id)
                              setFormData({
                                ...formData,
                                publicoIds: isSelected
                                  ? formData.publicoIds.filter((id) => id !== colab.id)
                                  : [...formData.publicoIds, colab.id],
                              })
                            }}
                          >
                            <img
                              src={colab.avatar || "/placeholder.svg"}
                              alt={colab.nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="font-medium">{colab.nome}</span>
                            {formData.publicoIds.includes(colab.id) && (
                              <CheckCircle2 className="h-5 w-5 text-primary ml-auto" />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formData.publicoIds.length} colaborador(es) selecionado(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ETAPA 5: REGRAS */}
            {currentStep === "regras" && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle>Regras da Pesquisa</CardTitle>
                  <CardDescription>Configure prazo e recompensas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 w-full max-w-full">
                  {formData.vinculadaCampanha ? (
                    // Se vinculada a campanha, exibir apenas texto informativo
                    <Card className="bg-primary/10 border-primary/30">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">Regras Herdadas da Campanha</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              As regras desta pesquisa são definidas pela campanha vinculada.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Sem campanha, exibir regras normalmente
                    <>
                      {/* Data Final */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Data Final
                        </Label>
                        <Input
                          type="date"
                          value={formData.dataFinal}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setFormData({ ...formData, dataFinal: e.target.value })}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          A pesquisa ficará ativa imediatamente após publicação e se encerrará automaticamente na data definida
                        </p>
                      </div>

                      {/* Ganhos */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Recompensas por Conclusão</Label>
                          <Switch
                            checked={formData.ganhosAtivos}
                            onCheckedChange={(checked) => setFormData({ ...formData, ganhosAtivos: checked })}
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
                                className="w-full"
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
                                  setFormData({ ...formData, estrelas: Number.parseInt(e.target.value) || 0 })
                                }
                                className="w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ETAPA 6: PERGUNTAS */}
            {currentStep === "perguntas" && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle>Perguntas da Pesquisa</CardTitle>
                  <CardDescription>Adicione as perguntas que serão feitas aos colaboradores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 w-full max-w-full">
                  {/* Lista de perguntas com reordenação SEMPRE ativa */}
                  {questions.length > 0 && (
                    <div className="space-y-3">
                      <Label>Perguntas Adicionadas ({questions.length})</Label>
                      <p className="text-xs text-muted-foreground">
                        Arraste as perguntas para reordenar
                      </p>
                      <div className="space-y-2">
                        {questions
                          .sort((a, b) => a.order - b.order)
                          .map((question) => (
                            <div
                              key={question.id}
                              draggable
                              onDragStart={() => handleDragStart(question.id)}
                              onDragOver={(e) => handleDragOver(e, question.id)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-start gap-3 p-3 border rounded-lg cursor-move hover:border-primary/50 transition-colors ${
                                draggedQuestionId === question.id ? "opacity-50" : ""
                              }`}
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-2">
                                    <p className="font-medium text-sm break-words">{question.text}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Tipo: {question.type === "rating" ? "Avaliação (1-5 estrelas)" : question.type === "multiple-choice" ? "Múltipla Escolha" : question.type === "checkbox" ? "Caixas de Seleção" : question.type === "text" ? "Texto Livre" : question.type === "yes-no" ? "Sim/Não" : "NPS (0-10)"}
                                    </p>
                                    {/* Exibir opções completas */}
                                    {question.options && question.options.length > 0 && (
                                      <div className="mt-2 space-y-1 pl-3 border-l-2 border-primary/20">
                                        <p className="text-xs font-semibold text-muted-foreground">Opções:</p>
                                        {question.options.map((option, idx) => (
                                          <p key={idx} className="text-xs text-muted-foreground">
                                            • {option}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeQuestion(question.id)}
                                    className="flex-shrink-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Adicionar nova pergunta */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label>Nova Pergunta</Label>

                    <div className="space-y-2">
                      <Label>Texto da Pergunta</Label>
                      <Textarea
                        value={currentQuestion.text}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                        placeholder="Digite a pergunta..."
                        rows={2}
                        className="w-full resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Resposta</Label>
                      <Select
                        value={currentQuestion.type}
                        onValueChange={(value: QuestionType) =>
                          setCurrentQuestion({ ...currentQuestion, type: value, options: [] })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rating">Avaliação (1-5 estrelas)</SelectItem>
                          <SelectItem value="multiple-choice">Múltipla Escolha</SelectItem>
                          <SelectItem value="checkbox">Caixas de Seleção</SelectItem>
                          <SelectItem value="text">Texto Livre</SelectItem>
                          <SelectItem value="yes-no">Sim/Não</SelectItem>
                          <SelectItem value="nps">NPS (0-10)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(currentQuestion.type === "multiple-choice" || currentQuestion.type === "checkbox") && (
                      <div className="space-y-3">
                        <Label>Opções de Resposta</Label>
                        <div className="flex gap-2">
                          <Input
                            value={optionInput}
                            onChange={(e) => setOptionInput(e.target.value)}
                            placeholder="Digite uma opção..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                addOption()
                              }
                            }}
                            className="flex-1"
                          />
                          <Button onClick={addOption} type="button" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {currentQuestion.options && currentQuestion.options.length > 0 && (
                          <div className="space-y-2">
                            {currentQuestion.options.map((option, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                <span className="flex-1 text-sm">{option}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOption(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Button onClick={addQuestion} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Pergunta
                    </Button>
                  </div>

                  {/* Toggle de Ordem Sequencial no final */}
                  {questions.length > 0 && (
                    <Card className="bg-accent/10 border-accent/20 mt-6">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <ListOrdered className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-sm">Exigir que as perguntas sejam respondidas na ordem definida</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Quando ativo, o colaborador só pode avançar após responder a pergunta anterior
                              </p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.ordemSequencial}
                            onCheckedChange={(checked) => setFormData({ ...formData, ordemSequencial: checked })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ETAPA 7: PREVIEW DETALHADO */}
            {currentStep === "preview" && (
              <Card className="clay-card border-0 w-full max-w-full">
                <CardHeader>
                  <CardTitle>Revisão Final</CardTitle>
                  <CardDescription>Confira todas as informações antes de publicar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 w-full max-w-full">
                  {/* Informações Gerais */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-primary uppercase">Informações Gerais</h4>
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
                  {(formData.vinculadaEvento || formData.vinculadaCampanha) && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-primary uppercase">Vínculos</h4>
                      <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                        {formData.vinculadaEvento && formData.eventoId && (
                          <div>
                            <p className="text-xs text-muted-foreground">Evento Vinculado</p>
                            <Badge variant="secondary" className="mt-1">
                              {eventos.find((e) => e.id === formData.eventoId)?.titulo || "Evento"}
                            </Badge>
                          </div>
                        )}
                        {formData.vinculadaCampanha && campanhaSelecionada && (
                          <div>
                            <p className="text-xs text-muted-foreground">Campanha Vinculada</p>
                            <Badge className="bg-primary mt-1">{campanhaSelecionada.titulo}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Público */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-primary uppercase">Público</h4>
                    <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                      {formData.vinculadaCampanha ? (
                        <div>
                          <p className="text-sm">Todo o time (herdado da campanha)</p>
                        </div>
                      ) : formData.publicoTipo === "todo_time" ? (
                        <div>
                          <p className="text-sm">Todo o time</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Todos os colaboradores receberão esta pesquisa
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">{formData.publicoIds.length} colaborador(es) específico(s)</p>
                          <div className="mt-2 space-y-1">
                            {formData.publicoIds.map((id) => {
                              const colab = colaboradores.find((c) => c.id === id)
                              return colab ? (
                                <div key={id} className="flex items-center gap-2 text-xs">
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                  <span>{colab.nome}</span>
                                </div>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Regras */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-primary uppercase">Regras</h4>
                    <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                      {formData.vinculadaCampanha ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Info className="h-4 w-4" />
                          <span>Regras definidas pela campanha vinculada</span>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground">Data Final</p>
                            <p className="text-sm">
                              {formData.dataFinal
                                ? new Date(formData.dataFinal).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "Não definida"}
                            </p>
                          </div>
                          {formData.ganhosAtivos && (
                            <div>
                              <p className="text-xs text-muted-foreground">Recompensas</p>
                              <div className="flex items-center gap-3 mt-1">
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
                          )}
                          {formData.ordemSequencial && (
                            <div className="flex items-center gap-2 text-sm">
                              <ListOrdered className="h-4 w-4 text-accent" />
                              <span>Ordem sequencial obrigatória</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Perguntas */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-primary uppercase">
                      Perguntas ({questions.length})
                    </h4>
                    {questions.length === 0 ? (
                      <Card className="bg-destructive/10 border-destructive/20">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm font-medium">Adicione pelo menos uma pergunta antes de publicar</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {questions
                          .sort((a, b) => a.order - b.order)
                          .map((question, idx) => (
                            <Card key={question.id} className="border-2">
                              <CardContent className="pt-4 space-y-2">
                                <div className="flex items-start gap-2">
                                  <Badge variant="outline" className="flex-shrink-0">
                                    {idx + 1}
                                  </Badge>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm break-words">{question.text}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Tipo: {question.type === "rating" ? "Avaliação (1-5 estrelas)" : question.type === "multiple-choice" ? "Múltipla Escolha" : question.type === "checkbox" ? "Caixas de Seleção" : question.type === "text" ? "Texto Livre" : question.type === "yes-no" ? "Sim/Não" : "NPS (0-10)"}
                                    </p>
                                    {/* Exibir todas as opções configuradas */}
                                    {question.options && question.options.length > 0 && (
                                      <div className="mt-3 space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground">Opções:</p>
                                        <div className="pl-3 space-y-1">
                                          {question.options.map((option, optIdx) => (
                                            <div key={optIdx} className="flex items-center gap-2">
                                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                              <p className="text-xs">{option}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                variant="outline"
                className="bg-transparent"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              {currentStepIndex === getVisibleSteps().length - 1 ? (
                <Button onClick={() => setShowPublishModal(true)} size="lg" className="clay-button">
                  <Save className="mr-2 h-5 w-5" />
                  Publicar Pesquisa
                </Button>
              ) : (
                <Button onClick={nextStep} className="clay-button">
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Preview Card */}
          <div className="lg:col-span-1">{PreviewCard()}</div>
        </div>
      </div>

      {/* Modal de Ajuda IA */}
      <Dialog open={showIaModal} onOpenChange={setShowIaModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Assistente IA
            </DialogTitle>
            <DialogDescription>Descreva o objetivo da pesquisa e a IA sugerirá título e descrição</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Objetivo da Pesquisa</Label>
              <Textarea
                value={iaPrompt}
                onChange={(e) => setIaPrompt(e.target.value)}
                placeholder="Ex: Avaliar a satisfação dos colaboradores com o novo sistema de gestão..."
                rows={4}
                className="resize-none w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateWithIA} disabled={isGeneratingIA} className="clay-button">
              {isGeneratingIA ? (
                <>
                  <span className="animate-spin mr-2">⚙️</span>
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
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
            <DialogTitle>Publicar Pesquisa</DialogTitle>
            <DialogDescription>Confirme que deseja publicar esta pesquisa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              A pesquisa será enviada para{" "}
              {formData.vinculadaCampanha
                ? "todo o time (campanha)"
                : formData.publicoTipo === "todo_time"
                  ? "todo o time"
                  : `${formData.publicoIds.length} colaborador(es)`}
              {formData.dataFinal && ` e ficará disponível até ${new Date(formData.dataFinal).toLocaleDateString("pt-BR")}`}.
            </p>
            {questions.length === 0 && (
              <Card className="bg-destructive/10 border-destructive/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">
                    Atenção: Você precisa adicionar pelo menos uma pergunta antes de publicar.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePublish} disabled={questions.length === 0} className="clay-button">
              <Save className="mr-2 h-4 w-4" />
              Confirmar Publicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
