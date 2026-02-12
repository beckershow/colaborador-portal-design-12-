"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth, mockUsers } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Target,
  Users,
  CheckSquare,
  Calendar,
  Award,
  Settings,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Star,
  Gift,
  AlertCircle,
  Zap,
  Eye,
} from "lucide-react"
import {
  EngajamentoService,
  type RequiredAction,
  type CompletionMethod,
  type SystemBehavior,
  type EngajamentoType,
  type PublicoAlvo,
} from "@/lib/engajamento-service"
import { listTrainings, type TrainingSummary } from "@/lib/trainings-api"
import { SurveyService } from "@/lib/survey-service"
import { EventoService } from "@/lib/evento-service"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

export default function CreateEngajamentoPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const editId = searchParams.get("edit")
  const isEditMode = !!editId

  // State for Form Data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "missao" as EngajamentoType,
    objective: "",
    rewardXP: 50,
    rewardStars: 15,
    startDate: "",
    endDate: "",
    isActive: true,
  })

  // State for Público-Alvo
  const [publicoAlvo, setPublicoAlvo] = useState<PublicoAlvo>({
    type: "todo_time",
    targetIds: [],
  })

  // State for Required Actions
  const [requiredActions, setRequiredActions] = useState<RequiredAction[]>([])
  const [showCustomActionDialog, setShowCustomActionDialog] = useState(false)
  const [customAction, setCustomAction] = useState({
    name: "",
    description: "",
    type: "acesso" as "acesso" | "conclusao" | "interacao" | "resposta" | "upload" | "outro",
    minQuantity: 1,
    frequency: "unica" as "unica" | "diaria" | "semanal" | "livre",
    requiresValidation: false,
    validationType: "sistema" as "sistema" | "gestor",
    blocksCompletion: true,
  })

  // State for Validation Rules
  const [validationRules, setValidationRules] = useState({
    minActions: 1,
    frequency: undefined as "diaria" | "semanal" | "mensal" | undefined,
    consecutive: false,
  })

  // State for Completion Method
  const [completionMethod, setCompletionMethod] = useState<CompletionMethod>("automatico")

  // State for System Behavior
  const [systemBehavior, setSystemBehavior] = useState<SystemBehavior>({
    autoEnrollment: true,
    mandatoryDirection: true,
    continuousMonitoring: true,
    cannotBeIgnored: true,
    automaticNotifications: true,
    escalateToManager: false,
  })

  // State for expanded actions and their configurations
  const [expandedActions, setExpandedActions] = useState<Record<string, boolean>>({})
  const [actionConfigs, setActionConfigs] = useState<Record<string, any>>({})

  // State for AI Assistant
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [aiObjective, setAiObjective] = useState("")
  const [isAIGenerating, setIsAIGenerating] = useState(false)

  // State for rewards enabled
  const [rewardsEnabled, setRewardsEnabled] = useState(false)

  // State for step ordering
  const [stepOrderingEnabled, setStepOrderingEnabled] = useState(false)
  const [orderedSteps, setOrderedSteps] = useState<string[]>([])

  // State for feedback target collaborator filters
  const [feedbackSearchName, setFeedbackSearchName] = useState("")
  const [feedbackFilterDept, setFeedbackFilterDept] = useState("Todos")

  // State for search filters in action submenus
  const [trainingSearchText, setTrainingSearchText] = useState("")
  const [surveySearchText, setSurveySearchText] = useState("")
  const [eventSearchText, setEventSearchText] = useState("")

  // State for public target collaborator search
  const [targetCollabSearchText, setTargetCollabSearchText] = useState("")
  const [availableTrainings, setAvailableTrainings] = useState<TrainingSummary[]>([])
  const [isLoadingTrainings, setIsLoadingTrainings] = useState(false)

  useEffect(() => {
    if (!isEditMode || !editId) return

    const existingEngajamento = EngajamentoService.getEngajamentoById(editId)
    if (!existingEngajamento) {
      toast({
        title: "Engajamento não encontrado",
        description: "O engajamento que você tentou editar não existe.",
        variant: "destructive",
      })
      router.push("/admin?tab=criacoes")
      return
    }

    // Preencher formulário com dados existentes
    setFormData({
      title: existingEngajamento.title,
      description: existingEngajamento.description,
      type: existingEngajamento.type,
      objective: existingEngajamento.objective || "",
      rewardXP: existingEngajamento.rewardXP,
      rewardStars: existingEngajamento.rewardStars,
      startDate: existingEngajamento.startDate || "",
      endDate: existingEngajamento.endDate || "",
      isActive: existingEngajamento.isActive,
    })

    if (existingEngajamento.publicoAlvo) {
      setPublicoAlvo(existingEngajamento.publicoAlvo)
    }

    if (existingEngajamento.validationRules?.requiredActions) {
      setRequiredActions(existingEngajamento.validationRules.requiredActions)
    }

    if (existingEngajamento.validationRules) {
      setValidationRules({
        minActions: existingEngajamento.validationRules.minActions || 1,
        frequency: existingEngajamento.validationRules.frequency,
        consecutive: existingEngajamento.validationRules.consecutive || false,
      })
    }

    if (existingEngajamento.completionMethod) {
      setCompletionMethod(existingEngajamento.completionMethod)
    }

    if (existingEngajamento.systemBehavior) {
      setSystemBehavior(existingEngajamento.systemBehavior)
    }
  }, [isEditMode, editId, router, toast])

  useEffect(() => {
    const loadTrainings = async () => {
      try {
        setIsLoadingTrainings(true)
        const res = await listTrainings({ limit: 200 })
        setAvailableTrainings(res.data || [])
      } catch (error: any) {
        toast({
          title: "Falha ao carregar treinamentos",
          description: error?.message || "Não foi possível buscar os treinamentos no momento.",
          variant: "destructive",
        })
        setAvailableTrainings([])
      } finally {
        setIsLoadingTrainings(false)
      }
    }

    loadTrainings()
  }, [toast])

  if (!user || !hasPermission(["gestor", "super-admin"])) {
    router.push("/")
    return null
  }

  // Lista de colaboradores gerenciados (apenas para gestores)
  const managedCollaborators = [
    { id: "3", nome: "Ana Carolina Silva", cargo: "Analista de Marketing" },
    { id: "4", nome: "Pedro Henrique Costa", cargo: "Designer Gráfico" },
    { id: "5", nome: "Julia Santos Lima", cargo: "Analista de Conteúdo" },
  ]

  const availableCourses = availableTrainings
  const availableSurveys = SurveyService.getAllSurveys()
  const availableEvents = EventoService.getAllEventos()
  const filteredCourses = availableCourses.filter((course) =>
    !trainingSearchText || course.title.toLowerCase().includes(trainingSearchText.toLowerCase()),
  )

  const availableActions = [
    { type: "acessos_plataforma", label: "Acessos à Plataforma", icon: Users },
    { type: "completar_treinamento", label: "Concluir treinamentos específicos", icon: Award },
    { type: "dar_feedback", label: "Dar feedbacks", icon: Users },
    { type: "responder_pesquisa", label: "Responder pesquisas", icon: CheckSquare },
  ]

  const getDefaultConfig = (actionType: string) => {
    switch (actionType) {
      case "acessos_plataforma":
        return { totalAccesses: 10, requireConsecutive: false, consecutiveDays: 5 }
      case "completar_treinamento":
        return { selectedCourses: [], requireAll: true }
      case "dar_feedback":
        return { feedbackType: "livre", minQuantity: 3, isRequired: true }
      case "responder_pesquisa":
        return { selectedSurveys: [], minQuantity: 1, requireOrder: false }
      default:
        return {}
    }
  }

  const toggleAction = (actionType: string) => {
    const exists = requiredActions.find((a) => a.type === actionType)

    if (exists) {
      setRequiredActions(requiredActions.filter((a) => a.type !== actionType))
      const newExpanded = { ...expandedActions }
      delete newExpanded[actionType]
      setExpandedActions(newExpanded)
      const newConfigs = { ...actionConfigs }
      delete newConfigs[actionType]
      setActionConfigs(newConfigs)
    } else {
      const actionLabel = availableActions.find((a) => a.type === actionType)?.label || actionType
      setRequiredActions([
        ...requiredActions,
        {
          id: `action${Date.now()}`,
          type: actionType as any,
          description: actionLabel,
          completed: false,
          progress: 0,
        },
      ])
      setExpandedActions({ ...expandedActions, [actionType]: true })
      // Initialize default configurations
      setActionConfigs({
        ...actionConfigs,
        [actionType]: getDefaultConfig(actionType),
      })
    }
  }

  const updateActionConfig = (actionType: string, config: any) => {
    setActionConfigs({
      ...actionConfigs,
      [actionType]: { ...actionConfigs[actionType], ...config },
    })
  }

  const toggleExpanded = (actionType: string) => {
    setExpandedActions({
      ...expandedActions,
      [actionType]: !expandedActions[actionType],
    })
  }

  const removeCustomAction = (actionId: string) => {
    setRequiredActions(requiredActions.filter((a) => a.id !== actionId))
  }

  const handleAIGenerate = () => {
    if (!aiObjective.trim()) {
      toast({
        title: "Erro de Validação",
        description: "Descreva o objetivo da campanha para a IA gerar sugestões",
        variant: "destructive",
      })
      return
    }

    setIsAIGenerating(true)

    // Simulação de geração de IA (substituir por chamada real quando disponível)
    setTimeout(() => {
      const generatedTitle = `Campanha: ${aiObjective.substring(0, 50)}${aiObjective.length > 50 ? "..." : ""}`
      const generatedDescription = `Esta campanha tem como objetivo ${aiObjective.toLowerCase()}. Através desta iniciativa, buscamos engajar o time e promover os comportamentos desejados alinhados aos objetivos estratégicos da organização.`

      setFormData({
        ...formData,
        title: generatedTitle,
        description: generatedDescription,
      })

      setIsAIGenerating(false)
      setShowAIDialog(false)
      setAiObjective("")

      toast({
        title: "Sugestões Geradas!",
        description: "Título e descrição foram preenchidos. Você pode editá-los livremente.",
      })
    }, 1500)
  }

  const handleCreateCustomAction = () => {
    if (!customAction.name || !customAction.description) {
      toast({
        title: "Erro de Validação",
        description: "Preencha nome e descrição da ação customizada",
        variant: "destructive",
      })
      return
    }

    const newAction: RequiredAction = {
      id: `custom_action${Date.now()}`,
      type: customAction.type as any,
      description: `${customAction.name}: ${customAction.description}`,
      completed: false,
      progress: 0,
      target: customAction.minQuantity,
    }

    setRequiredActions([...requiredActions, newAction])

    toast({
      title: "Ação Customizada Criada!",
      description: `"${customAction.name}" foi adicionada às ações obrigatórias.`,
    })

    setCustomAction({
      name: "",
      description: "",
      type: "acesso",
      minQuantity: 1,
      frequency: "unica",
      requiresValidation: false,
      validationType: "sistema",
      blocksCompletion: true,
    })
    setShowCustomActionDialog(false)
  }

  const toggleCollaborator = (collabId: string) => {
    if (publicoAlvo.targetIds.includes(collabId)) {
      setPublicoAlvo({
        ...publicoAlvo,
        targetIds: publicoAlvo.targetIds.filter((id) => id !== collabId),
      })
    } else {
      setPublicoAlvo({
        ...publicoAlvo,
        targetIds: [...publicoAlvo.targetIds, collabId],
      })
    }
  }

  const handleSubmit = () => {
    // Validations
    if (!formData.title || !formData.description) {
      toast({
        title: "Erro de Validação",
        description: "Preencha título e descrição do engajamento",
        variant: "destructive",
      })
      return
    }

    if (publicoAlvo.type !== "todo_time" && publicoAlvo.targetIds.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Selecione ao menos um colaborador no público-alvo",
        variant: "destructive",
      })
      return
    }

    if (requiredActions.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Configure ao menos uma ação obrigatória",
        variant: "destructive",
      })
      return
    }

    if (isEditMode && editId) {
      EngajamentoService.updateEngajamento(editId, {
        ...formData,
        objective: formData.objective,
        publicoAlvo,
        completionMethod,
        validationRules: {
          ...validationRules,
          requiredActions,
        },
        systemBehavior,
      })

      toast({
        title: "Engajamento Atualizado!",
        description: `${formData.title} foi atualizado com sucesso.`,
      })
    } else {
      EngajamentoService.createEngajamento({
        ...formData,
        objective: formData.objective,
        publicoAlvo,
        completionMethod,
        validationRules: {
          ...validationRules,
          requiredActions,
        },
        systemBehavior,
        createdBy: user.nome,
        createdByRole: user.role,
      })

      toast({
        title: "Engajamento Criado!",
        description: `${formData.title} foi criado e já está disponível para o público-alvo definido.`,
      })
    }

    router.push("/admin?tab=criacoes")
  }

  return (
    <>
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assistente de IA - Gerar Título e Descrição</DialogTitle>
            <DialogDescription>
              Descreva o objetivo da campanha e a IA irá gerar automaticamente um título e descrição para você.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Objetivo da campanha <span className="text-destructive">*</span>
              </label>
              <textarea
                value={aiObjective}
                onChange={(e) => setAiObjective(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground min-h-[120px]"
                placeholder="Ex: Aumentar o engajamento dos colaboradores no feed social da empresa através de interações frequentes, promovendo a cultura de reconhecimento e compartilhamento de conhecimento..."
                disabled={isAIGenerating}
              />
            </div>

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-foreground">
                <strong>Dica:</strong> Seja específico sobre o que deseja alcançar. Quanto mais detalhes você fornecer, melhores serão as sugestões geradas.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)} disabled={isAIGenerating}>
              Cancelar
            </Button>
            <Button onClick={handleAIGenerate} className="clay-button" disabled={isAIGenerating}>
              {isAIGenerating ? "Gerando..." : "Gerar com IA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCustomActionDialog} onOpenChange={setShowCustomActionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Ação Obrigatória</DialogTitle>
            <DialogDescription>
              Configure uma ação customizada específica para este engajamento. Esta ação será monitorada automaticamente
              pelo sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nome da ação <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={customAction.name}
                onChange={(e) => setCustomAction({ ...customAction, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                placeholder="Ex: Publicar no feed social"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Descrição da ação <span className="text-destructive">*</span>
              </label>
              <textarea
                value={customAction.description}
                onChange={(e) => setCustomAction({ ...customAction, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                placeholder="Descreva detalhadamente o que o colaborador deve fazer..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tipo da ação <span className="text-destructive">*</span>
                </label>
                <select
                  value={customAction.type}
                  onChange={(e) => setCustomAction({ ...customAction, type: e.target.value as any })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                >
                  <option value="acesso">Acesso</option>
                  <option value="conclusao">Conclusão</option>
                  <option value="interacao">Interação</option>
                  <option value="resposta">Resposta</option>
                  <option value="upload">Upload</option>
                  <option value="outro">Outro (custom)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quantidade mínima</label>
                <input
                  type="number"
                  value={customAction.minQuantity || ""}
                  onChange={(e) =>
                    setCustomAction({ ...customAction, minQuantity: Number.parseInt(e.target.value) || 1 })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Frequência</label>
              <select
                value={customAction.frequency}
                onChange={(e) => setCustomAction({ ...customAction, frequency: e.target.value as any })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="unica">Única (fazer uma vez)</option>
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="livre">Livre (sem frequência específica)</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="requiresValidation"
                  checked={customAction.requiresValidation}
                  onCheckedChange={(checked) =>
                    setCustomAction({ ...customAction, requiresValidation: checked as boolean })
                  }
                />
                <label htmlFor="requiresValidation" className="text-sm text-foreground cursor-pointer">
                  Requer validação
                </label>
              </div>

              {customAction.requiresValidation && (
                <div className="ml-6 space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo de validação</label>
                  <select
                    value={customAction.validationType}
                    onChange={(e) => setCustomAction({ ...customAction, validationType: e.target.value as any })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
                  >
                    <option value="sistema">Sistema (automático)</option>
                    <option value="gestor">Gestor (aprovação manual)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  id="blocksCompletion"
                  checked={customAction.blocksCompletion}
                  onCheckedChange={(checked) =>
                    setCustomAction({ ...customAction, blocksCompletion: checked as boolean })
                  }
                />
                <label htmlFor="blocksCompletion" className="text-sm text-foreground cursor-pointer">
                  Ação bloqueia conclusão do engajamento
                </label>
              </div>
            </div>

            <div className="rounded-lg bg-accent/10 border border-accent/30 p-3">
              <p className="text-sm text-muted-foreground">
                Esta ação será monitorada automaticamente pelo sistema. Ela é específica deste engajamento e não será
                global.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomActionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCustomAction} className="clay-button">
              <Plus className="mr-2 h-4 w-4" />
              Criar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto max-w-7xl space-y-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              {isEditMode ? "Editar Engajamento" : "Criar Campanha de Engajamento"}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {isEditMode
                ? "Atualize as configurações deste engajamento"
                : "Configure e calibre campanhas para engajar seu time"}
            </p>
          </div>
          <Button variant="outline" className="clay-button bg-transparent" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>
        </div>

        {/* BLOCO 1 - Tipo e Informações Básicas */}
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Bloco 1: Informações Básicas
            </CardTitle>
            <CardDescription>Defina o nome, descrição e período do engajamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Card Informativo */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                O que é um Novo Engajamento?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A criação de um novo engajamento permite estruturar campanhas internas com o objetivo de estimular a participação, o alinhamento e o desempenho do time.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Aqui você pode definir ações, desafios e iniciativas estratégicas que promovem engajamento contínuo, fortalecem a cultura organizacional e direcionam comportamentos desejados dentro da plataforma.
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAIDialog(true)}
                className="w-full mt-2"
              >
                <Zap className="h-4 w-4 mr-2" />
                Obter ajuda da IA
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Título <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ex: Rumo ao Próximo Nível (intenção de promoção ou desenvolvimento)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Descrição <span className="text-destructive">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Descreva os detalhes e objetivos deste engajamento..."
                rows={4}
              />
            </div>

            {/* Assistente de IA */}
            

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data de Início (opcional)</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data de Término (opcional)</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 2 - Público-Alvo (anteriormente Bloco 3) */}
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Bloco 2: Público-Alvo
            </CardTitle>
            <CardDescription>Defina quem participará desta campanha de engajamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Selecione o público <span className="text-destructive">*</span>
              </label>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={publicoAlvo.type === "todo_time" ? "default" : "outline"}
                  className={`w-full justify-start ${publicoAlvo.type === "todo_time" ? "clay-button" : ""}`}
                  onClick={() => setPublicoAlvo({ type: "todo_time", targetIds: [] })}
                >
                  Todo o time que eu gerencio
                </Button>
                <Button
                  type="button"
                  variant={publicoAlvo.type === "colaboradores_especificos" ? "default" : "outline"}
                  className={`w-full justify-start ${publicoAlvo.type === "colaboradores_especificos" ? "clay-button" : ""}`}
                  onClick={() => setPublicoAlvo({ type: "colaboradores_especificos", targetIds: [] })}
                >
                  Colaboradores específicos do meu time
                </Button>
              </div>
            </div>

            {publicoAlvo.type === "colaboradores_especificos" && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Selecione os colaboradores (seleção múltipla):</label>
                
                {/* Filtro de busca */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pesquisar colaborador por nome..."
                    value={targetCollabSearchText}
                    onChange={(e) => setTargetCollabSearchText(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {targetCollabSearchText && (
                    <button
                      onClick={() => setTargetCollabSearchText("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Lista de colaboradores em checklist */}
                <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                  {managedCollaborators
                    .filter((collab) =>
                      !targetCollabSearchText || collab.nome.toLowerCase().includes(targetCollabSearchText.toLowerCase())
                    )
                    .map((collab) => {
                      const isSelected = publicoAlvo.targetIds.includes(collab.id)
                      return (
                        <label
                          key={collab.id}
                          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 ${isSelected ? "bg-primary/5" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCollaborator(collab.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{collab.nome}</p>
                            <p className="text-xs text-muted-foreground">{collab.cargo}</p>
                          </div>
                          {isSelected && <Badge className="bg-primary text-xs">Selecionado</Badge>}
                        </label>
                      )
                    })}
                </div>

                {/* Contador de selecionados */}
                {publicoAlvo.targetIds.length > 0 && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
                    <p className="text-xs text-blue-900">
                      <strong>{publicoAlvo.targetIds.length} colaborador(es) selecionado(s)</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BLOCO 4 - Ações Obrigatórias com Configurações Avançadas */}
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              Bloco 3: Ações do Colaborador
            </CardTitle>
            <CardDescription>
              Configure as ações que o colaborador deve realizar. Clique em cada ação para configurar detalhes
              específicos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableActions.map((action) => {
              const isSelected = requiredActions.some((a) => a.type === action.type)
              const isExpanded = expandedActions[action.type]
              const config = actionConfigs[action.type] || getDefaultConfig(action.type)

              return (
                <div key={action.type} className="space-y-2">
                  <div
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleAction(action.type)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded border ${
                          isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                        }`}
                      />
                      <action.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{action.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && <Badge className="bg-primary">Ativo</Badge>}
                      {isSelected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpanded(action.type)
                          }}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Configurações Expandidas */}
                  {isSelected && isExpanded && (
                    <div className="ml-6 space-y-4 rounded-lg border border-primary/30 bg-muted/30 p-4">
                      {/* Acessos à Plataforma */}
                      {action.type === "acessos_plataforma" && (
                        <div className="space-y-4">
                          {/* Informação do Período da Campanha */}
                          {formData.startDate && formData.endDate && (
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                              <p className="text-sm font-semibold text-foreground mb-2">Período da Campanha:</p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div>
                                  <p className="text-muted-foreground">Início</p>
                                  <p className="font-medium">{new Date(formData.startDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Término</p>
                                  <p className="font-medium">{new Date(formData.endDate).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Total de dias</p>
                                  <p className="font-medium">
                                    {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium">Quantidade total de acessos exigidos</label>
                            <input
                              type="number"
                              value={config.totalAccesses || ""}
                              onChange={(e) =>
                                updateActionConfig(action.type, { totalAccesses: Number.parseInt(e.target.value) || 0 })
                              }
                              className="w-full rounded border border-border bg-background px-2 py-1 mt-1"
                              min="1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Total de acessos necessários durante toda a campanha
                            </p>
                          </div>

                          <div className="space-y-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={config.requireConsecutive}
                                onChange={(e) =>
                                  updateActionConfig(action.type, { requireConsecutive: e.target.checked })
                                }
                              />
                              <span className="text-sm font-medium">Exigir acessos em dias consecutivos</span>
                            </label>

                            {config.requireConsecutive && (
                              <div className="ml-6 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                <label className="text-sm font-medium">Quantidade de dias consecutivos</label>
                                <input
                                  type="number"
                                  value={config.consecutiveDays || ""}
                                  onChange={(e) =>
                                    updateActionConfig(action.type, { consecutiveDays: Number.parseInt(e.target.value) || 0 })
                                  }
                                  className="w-full rounded border border-border bg-background px-2 py-1"
                                  min="1"
                                  max={formData.startDate && formData.endDate ? Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)) : undefined}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Colaborador deve acessar a plataforma por {config.consecutiveDays} dias seguidos
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Completar Treinamento */}
                      {action.type === "completar_treinamento" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Selecionar treinamentos (seleção múltipla)</label>
                            
                            {/* Filtro de busca */}
                            <div className="relative mt-2">
                              <input
                                type="text"
                                placeholder="Pesquisar treinamentos..."
                                value={trainingSearchText}
                                onChange={(e) => setTrainingSearchText(e.target.value)}
                                className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              {trainingSearchText && (
                                <button
                                  onClick={() => setTrainingSearchText("")}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>

                            {/* Lista de treinamentos */}
                              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg">
                                {isLoadingTrainings && (
                                  <p className="p-3 text-xs text-muted-foreground">Carregando treinamentos...</p>
                                )}
                                {!isLoadingTrainings && filteredCourses.length === 0 && (
                                  <p className="p-3 text-xs text-muted-foreground">Nenhum treinamento encontrado.</p>
                                )}
                                {!isLoadingTrainings &&
                                  filteredCourses.map((course) => {
                                    const isSelected = config.selectedCourses?.includes(course.id)
                                    return (
                                      <label
                                        key={course.id}
                                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 ${isSelected ? "bg-primary/5" : ""}`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            const newCourses = e.target.checked
                                              ? [...(config.selectedCourses || []), course.id]
                                              : (config.selectedCourses || []).filter((id: string) => id !== course.id)
                                            updateActionConfig(action.type, { selectedCourses: newCourses })
                                          }}
                                          className="mt-1"
                                        />
                                        <span className="text-sm flex-1">{course.title}</span>
                                      </label>
                                    )
                                  })}
                              </div>
                          </div>

                          {/* Contador de selecionados */}
                          {(config.selectedCourses?.length || 0) > 0 && (
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
                              <p className="text-xs text-blue-900">
                                <strong>{config.selectedCourses.length} treinamento(s) selecionado(s)</strong>
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Dar Feedback */}
                      {action.type === "dar_feedback" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Para quem o feedback deve ser dado</label>
                            <select
                              value={config.feedbackTarget || "qualquer"}
                              onChange={(e) => updateActionConfig(action.type, { feedbackTarget: e.target.value })}
                              className="w-full rounded border border-border bg-background px-2 py-1 mt-1"
                            >
                              <option value="qualquer">Qualquer pessoa</option>
                              <option value="colaborador_especifico">Colaboradores específicos (escolher)</option>
                            </select>
                          </div>

                          {config.feedbackTarget === "colaborador_especifico" && (
                            <div className="ml-4 space-y-3 rounded-lg border border-primary bg-primary/10 p-4">
                              <div className="space-y-3">
                                <label className="text-sm font-medium">Selecionar colaboradores (múltipla seleção)</label>
                                  
                                  {/* Filtros */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <input
                                        type="text"
                                        placeholder="Pesquisar por nome..."
                                        value={feedbackSearchName}
                                        onChange={(e) => setFeedbackSearchName(e.target.value)}
                                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <select
                                        value={feedbackFilterDept}
                                        onChange={(e) => setFeedbackFilterDept(e.target.value)}
                                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                                      >
                                        <option value="Todos">Todos os setores</option>
                                        <option value="Time Criativo">Time Criativo</option>
                                        <option value="Time Tech">Time Tech</option>
                                        <option value="Recursos Humanos">Recursos Humanos</option>
                                        <option value="Vendas">Vendas</option>
                                        <option value="Comercial">Comercial</option>
                                        <option value="TI">TI</option>
                                        <option value="Operações">Operações</option>
                                      </select>
                                    </div>
                                  </div>

                                  {/* Lista de colaboradores */}
                                  <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                                    {mockUsers
                                      .filter((u) => {
                                        const matchName = !feedbackSearchName || u.nome.toLowerCase().includes(feedbackSearchName.toLowerCase())
                                        const matchDept = feedbackFilterDept === "Todos" || u.departamento === feedbackFilterDept
                                        return matchName && matchDept
                                      })
                                      .map((collab) => {
                                        const isSelected = (config.targetCollaboratorIds || []).includes(collab.id)
                                        return (
                                          <label
                                            key={collab.id}
                                            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 ${isSelected ? "bg-primary/5" : ""}`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={(e) => {
                                                const currentIds = config.targetCollaboratorIds || []
                                                const newIds = e.target.checked
                                                  ? [...currentIds, collab.id]
                                                  : currentIds.filter((id: string) => id !== collab.id)
                                                updateActionConfig(action.type, { targetCollaboratorIds: newIds })
                                              }}
                                              className="mt-1"
                                            />
                                            <div className="flex-1">
                                              <p className="text-sm font-medium text-foreground">{collab.nome}</p>
                                              <p className="text-xs text-muted-foreground">{collab.cargo} - {collab.departamento}</p>
                                            </div>
                                          </label>
                                        )
                                      })}
                                  </div>

                                  {/* Contador de selecionados */}
                                  {(config.targetCollaboratorIds?.length || 0) > 0 && (
                                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
                                      <p className="text-xs text-blue-900">
                                        <strong>{config.targetCollaboratorIds.length} colaborador(es) selecionado(s)</strong>
                                      </p>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium">
                              {config.feedbackTarget === "colaborador_especifico"
                                ? "Quantidade de feedbacks por colaborador"
                                : "Quantidade de feedbacks a serem enviados"}
                            </label>
                            <input
                              type="number"
                              value={config.minQuantity || 1}
                              onChange={(e) =>
                                updateActionConfig(action.type, { minQuantity: Number.parseInt(e.target.value) || 1 })
                              }
                              className="w-full rounded border border-border bg-background px-2 py-1 mt-1"
                              min="1"
                            />
                            {config.feedbackTarget === "colaborador_especifico" ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                Cada colaborador selecionado deverá receber exatamente esta quantidade de feedbacks
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">
                                Total de feedbacks que o colaborador deverá enviar para qualquer pessoa da organização
                              </p>
                            )}
                          </div>

                          <div className="rounded bg-blue-50 border border-blue-200 p-3">
                            <p className="text-xs text-blue-900">
                              <strong>Regra de conclusão:</strong>{" "}
                              {config.feedbackTarget === "colaborador_especifico"
                                ? `A ação será concluída apenas quando TODOS os ${(config.targetCollaboratorIds?.length || 0)} colaborador(es) selecionado(s) receberem ${config.minQuantity || 1} feedback(s) cada.`
                                : `A ação será concluída quando o colaborador enviar um total de ${config.minQuantity || 1} feedback(s) para qualquer pessoa.`}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Responder Pesquisa */}
                      {action.type === "responder_pesquisa" && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Selecionar pesquisas (seleção múltipla)</label>
                            
                            {availableSurveys.length === 0 ? (
                              <div className="mt-2 rounded-lg bg-muted p-4 text-center">
                                <p className="text-sm text-muted-foreground">Nenhuma pesquisa disponível no momento</p>
                              </div>
                            ) : (
                              <>
                                {/* Filtro de busca */}
                                <div className="relative mt-2">
                                  <input
                                    type="text"
                                    placeholder="Pesquisar pesquisas..."
                                    value={surveySearchText}
                                    onChange={(e) => setSurveySearchText(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-background px-10 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                  <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  {surveySearchText && (
                                    <button
                                      onClick={() => setSurveySearchText("")}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>

                                {/* Lista de pesquisas */}
                                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border border-border rounded-lg">
                                  {availableSurveys
                                    .filter((survey) =>
                                      !surveySearchText || survey.title.toLowerCase().includes(surveySearchText.toLowerCase())
                                    )
                                    .map((survey) => {
                                      const isSelected = config.selectedSurveys?.includes(survey.id)
                                      return (
                                        <label
                                          key={survey.id}
                                          className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 ${isSelected ? "bg-primary/5" : ""}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              const newSurveys = e.target.checked
                                                ? [...(config.selectedSurveys || []), survey.id]
                                                : (config.selectedSurveys || []).filter((id: string) => id !== survey.id)
                                              updateActionConfig(action.type, { selectedSurveys: newSurveys })
                                            }}
                                            className="mt-1"
                                          />
                                          <span className="text-sm flex-1">{survey.title}</span>
                                        </label>
                                      )
                                    })}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Contador de selecionados */}
                          {(config.selectedSurveys?.length || 0) > 0 && (
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                              <p className="text-xs text-blue-900">
                                <strong>{config.selectedSurveys.length} pesquisa(s) selecionada(s).</strong> O colaborador deve responder <strong>todas</strong> as pesquisas selecionadas para concluir esta etapa.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {requiredActions
              .filter((action) => action.id.startsWith("custom_action"))
              .map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between rounded-lg border border-accent bg-accent/10 p-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-accent text-accent">
                        Custom
                      </Badge>
                      <span className="font-medium text-foreground">{action.description.split(":")[0]}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description.split(":").slice(1).join(":")}
                    </p>
                    {action.target && (
                      <p className="text-xs text-muted-foreground mt-1">Quantidade mínima: {action.target}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeCustomAction(action.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

            {/* Card Informativo */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-900 font-medium">Dica sobre as ações dessa campanha</p>
                <p className="text-sm text-blue-800 mt-1">
                  Você poderá criar Treinamentos, pesquisas e eventos de forma avulsa e vinculá-los a essa campanha posteriormente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Novo Bloco - Ordem Obrigatória das Etapas */}
        {requiredActions.length > 0 && (
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Ordem Obrigatória das Etapas
              </CardTitle>
              <CardDescription>
                Defina se as ações obrigatórias devem ser concluídas em uma ordem específica ou se podem ser feitas em qualquer ordem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
                <input
                  type="checkbox"
                  id="stepOrderingEnabled"
                  checked={stepOrderingEnabled}
                  onChange={(e) => {
                    setStepOrderingEnabled(e.target.checked)
                    if (e.target.checked) {
                      // Inicializa ordem com as ações atuais
                      setOrderedSteps(requiredActions.map((a) => a.type))
                    }
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <label htmlFor="stepOrderingEnabled" className="text-sm font-medium cursor-pointer">
                    Ativar ordem sequencial obrigatória
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quando ativo, o colaborador só poderá avançar para a próxima etapa após concluir a anterior
                  </p>
                </div>
              </div>

              {stepOrderingEnabled && (
                <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Ordem das etapas:</p>
                  <div className="space-y-2">
                    {requiredActions.map((action, index) => {
                      const actionLabel = availableActions.find((a) => a.type === action.type)?.label || action.description
                      return (
                        <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{actionLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {index === 0 ? "Primeira etapa - o colaborador inicia por aqui" : `Só pode ser feita após concluir etapa ${index}`}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {index > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOrder = [...requiredActions]
                                  const temp = newOrder[index]
                                  newOrder[index] = newOrder[index - 1]
                                  newOrder[index - 1] = temp
                                  setRequiredActions(newOrder)
                                }}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            )}
                            {index < requiredActions.length - 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newOrder = [...requiredActions]
                                  const temp = newOrder[index]
                                  newOrder[index] = newOrder[index + 1]
                                  newOrder[index + 1] = temp
                                  setRequiredActions(newOrder)
                                }}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!stepOrderingEnabled && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">
                    Ordem livre: o colaborador pode concluir as etapas em qualquer sequência
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* BLOCO 4 - Método de Conclusão (anteriormente Bloco 6) */}
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-accent" />
              Bloco 4: Método de Conclusão
            </CardTitle>
            <CardDescription>Como o engajamento será validado e concluído</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-2">
              <Button
                type="button"
                variant={completionMethod === "automatico" ? "default" : "outline"}
                className={`w-full justify-start ${completionMethod === "automatico" ? "clay-button" : ""}`}
                onClick={() => setCompletionMethod("automatico")}
              >
                <div className="text-left">
                  <div className="font-semibold">Automática pelo sistema (Recomendado)</div>
                  <div className="text-xs text-muted-foreground">
                    O sistema valida automaticamente quando todas as ações forem cumpridas
                  </div>
                </div>
              </Button>

              <Button
                type="button"
                variant={completionMethod === "gestor" ? "default" : "outline"}
                className={`w-full justify-start ${completionMethod === "gestor" ? "clay-button" : ""}`}
                onClick={() => setCompletionMethod("gestor")}
              >
                <div className="text-left">
                  <div className="font-semibold">Aprovação do gestor</div>
                  <div className="text-xs text-muted-foreground">Você precisa aprovar manualmente cada conclusão</div>
                </div>
              </Button>

              <Button
                type="button"
                variant={completionMethod === "sistema_auditoria" ? "default" : "outline"}
                className={`w-full justify-start ${completionMethod === "sistema_auditoria" ? "clay-button" : ""}`}
                onClick={() => setCompletionMethod("sistema_auditoria")}
              >
                <div className="text-left">
                  <div className="font-semibold">Sistema + Auditoria</div>
                  <div className="text-xs text-muted-foreground">
                    Sistema valida automaticamente, mas você pode auditar depois
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Comportamento Automático do Sistema
            </CardTitle>
            <CardDescription>Regras fixas aplicadas automaticamente a todos os engajamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-white border border-blue-200 p-4">
                <CheckSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Inscrição automática do público-alvo na campanha</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Todos os colaboradores definidos no público-alvo são automaticamente inscritos ao publicar o engajamento
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-white border border-blue-200 p-4">
                <CheckSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Monitoramento contínuo do progresso dos participantes</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sistema acompanha em tempo real o cumprimento das ações obrigatórias e atualiza o status automaticamente
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-white border border-blue-200 p-4">
                <CheckSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Envio automático de notificações</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Colaboradores recebem notificações sobre progresso, prazos próximos e lembretes de ações pendentes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-white border border-blue-200 p-4">
                <CheckSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Alertas automáticos ao gestor</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Gestor é notificado em casos de atraso significativo ou falta de progresso dos participantes
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-100 border border-blue-300 p-3">
              <p className="text-sm text-blue-900">
                <strong>Nota:</strong> Estas configurações são padrão do sistema e não podem ser alteradas individualmente por campanha. Garantem governança consistente e experiência uniforme para todos os participantes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 5 - Recompensa Condicional (Opcional) */}
        <Card className="clay-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-accent" />
              Bloco 5: Ganhos Condicionais   
            </CardTitle>
            <CardDescription>Opcionalmente, configure ganhos para esta campanha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
              <input
                type="checkbox"
                id="rewardsEnabled"
                checked={rewardsEnabled}
                onChange={(e) => {
                  setRewardsEnabled(e.target.checked)
                  if (!e.target.checked) {
                    setFormData({ ...formData, rewardXP: 0, rewardStars: 0 })
                  } else {
                    setFormData({ ...formData, rewardXP: 50, rewardStars: 15 })
                  }
                }}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <label htmlFor="rewardsEnabled" className="text-sm font-medium cursor-pointer">
                  Habilitar ganhos para esta campanha
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Quando habilitado, colaboradores receberão XP e/ou estrelas ao concluir a campanha
                </p>
              </div>
            </div>

            {rewardsEnabled && (
              <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Star className="h-4 w-4 text-accent" />
                      XP ao Completar
                    </label>
                    <input
                      type="number"
                      value={formData.rewardXP || 0}
                      onChange={(e) => setFormData({ ...formData, rewardXP: Number.parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Award className="h-4 w-4 text-accent" />
                      Estrelas ao Completar
                    </label>
                    <input
                      type="number"
                      value={formData.rewardStars || 0}
                      onChange={(e) => setFormData({ ...formData, rewardStars: Number.parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      min="0"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-accent/10 border border-accent/20 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                    <div className="text-sm text-foreground">
                      <strong>Importante:</strong> A recompensa só será concedida quando o colaborador cumprir TODAS as
                      regras de validação configuradas. Engajamento parcial não gera recompensa.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!rewardsEnabled && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  Esta campanha funcionará normalmente sem ganhos associados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botão Final de Publicação */}
        <div className="flex justify-end gap-4 pb-8">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            {isEditMode ? "Salvar Alterações" : "Criar Engajamento"}
          </Button>
        </div>
      </div>
    </>
  )
}
