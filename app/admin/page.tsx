"use client"

import { Input } from "@/components/ui/input"

import { useMemo } from "react"

import Link from "next/link"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Heart,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  X,
  BookOpen,
  MessageSquare,
  FileText,
  Calendar,
  Gift,
  Target,
  Zap,
  BarChart3,
  GraduationCap,
  CalendarIcon,
  Trash2,
  Settings,
  Check,
  XCircle,
  Clock,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  FileDown,
  Power,
  PowerOff,
  Package,
  Download,
  Sparkles,
  FolderOpen,
  Search,
  Filter,
  Edit,
  Trophy,
  CalendarDays,
  ClipboardList,
  ArrowRight,
} from "lucide-react"
import { CriacaoCentralizadaService } from "@/lib/criacao-centralizada-service"
import { AnalyticsService } from "@/lib/analytics-service"
import {
  getStoreItems,
  getStoreCategories,
  createStoreItem,
  updateStoreItem,
  deleteStoreItem,
  setStoreItemStatus,
  getTeamRedemptions,
  updateRedemptionStatus,
  getManagerInventory,
  setManagerInventoryStatus,
  createRewardRequest,
  getRewardRequests,
  reviewRewardRequest,
  getAuditLogs,
  type StoreItem,
  type StoreCategory,
  type StoreRedemption,
  type StoreManagerInventory,
  type StoreRewardRequest,
  type StoreAuditLog,
} from "@/lib/store-api"
import { uploadFileToBackend, getImageUrl } from "@/lib/uploads-api"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import React, { Suspense } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FeedbackConfigPanel } from "@/components/feedback-config-panel"
import { FeedSocialConfigPanel } from "@/components/feed-social-config-panel"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { FeedUserActivity } from "@/lib/feed-social-service"
import { HumorAnalyticsService, type HumorUserAnalytics } from "@/lib/humor-analytics-service"
import { SurveyAnalyticsService, type SurveyUserAnalytics } from "@/lib/survey-analytics-service"
import { SurveyService } from "@/lib/survey-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { HumorConfigService, type HumorConfig, type HumorOption, type HumorSchedule } from "@/lib/humor-config-service"
import { SuasCriacoesService, type Creation, type CreationType } from "@/lib/suas-criacoes-service"
import { listTrainings, getTraining, deleteTraining } from "@/lib/trainings-api"

// --- Mock Data for Engajamento Section (Simulating API/Service calls) ---
interface ColaboradorEngajamento {
  userId: string
  nome: string
  avatar?: string
  time: string
  departamento: string
  taxaEngajamento: number // 0-100
  frequenciaParticipacao: number // 0-100
  acessosSemana: number // 0-7
  ultimaInteracao: string
  tendencia: "alta" | "estavel" | "queda"
  treinamentosConcluidos: number
  interacoesFeed: number
  pesquisasRespondidas: number
  eventosParticipados: number
}

// --- Mock Data for Detailed Collaborator View ---
interface ColaboradorDetalhado extends ColaboradorEngajamento {
  humorMedio: number
  statusAtividade: "ativo" | "inativo" | "ausente"
}

const mockColaboradores: ColaboradorEngajamento[] = [
  {
    userId: "collab-001",
    nome: "Ana Clara Silva",
    avatar: "/avatars/ana.png",
    time: "Time Criativo",
    departamento: "Marketing",
    taxaEngajamento: 88,
    frequenciaParticipacao: 95,
    acessosSemana: 7,
    ultimaInteracao: "Hoje",
    tendencia: "alta",
    treinamentosConcluidos: 5,
    interacoesFeed: 12,
    pesquisasRespondidas: 3,
    eventosParticipados: 2,
  },
  {
    userId: "collab-002",
    nome: "Bruno Costa",
    avatar: "/avatars/bruno.png",
    time: "Time Tech",
    departamento: "Tecnologia",
    taxaEngajamento: 75,
    frequenciaParticipacao: 80,
    acessosSemana: 5,
    ultimaInteracao: "Ontem",
    tendencia: "estavel",
    treinamentosConcluidos: 3,
    interacoesFeed: 8,
    pesquisasRespondidas: 2,
    eventosParticipados: 1,
  },
  {
    userId: "collab-003",
    nome: "Carla Dias",
    avatar: "/avatars/carla.png",
    time: "Time Vendas",
    departamento: "Comercial",
    taxaEngajamento: 62,
    frequenciaParticipacao: 70,
    acessosSemana: 4,
    ultimaInteracao: "2 dias atrás",
    tendencia: "estavel",
    treinamentosConcluidos: 2,
    interacoesFeed: 5,
    pesquisasRespondidas: 1,
    eventosParticipados: 0,
  },
  {
    userId: "collab-004",
    nome: "Daniel Ferreira",
    avatar: "/avatars/daniel.png",
    time: "Time RH",
    departamento: "Recursos Humanos",
    taxaEngajamento: 92,
    frequenciaParticipacao: 100,
    acessosSemana: 7,
    ultimaInteracao: "Hoje",
    tendencia: "alta",
    treinamentosConcluidos: 6,
    interacoesFeed: 15,
    pesquisasRespondidas: 4,
    eventosParticipados: 3,
  },
  {
    userId: "collab-005",
    nome: "Elisa Gomes",
    avatar: "/avatars/elisa.png",
    time: "Time Criativo",
    departamento: "Marketing",
    taxaEngajamento: 45,
    frequenciaParticipacao: 50,
    acessosSemana: 2,
    ultimaInteracao: "3 dias atrás",
    tendencia: "queda",
    treinamentosConcluidos: 1,
    interacoesFeed: 3,
    pesquisasRespondidas: 0,
    eventosParticipados: 0,
  },
  {
    userId: "collab-006",
    nome: "Fábio Lima",
    avatar: "/avatars/fabio.png",
    time: "Time Tech",
    departamento: "Tecnologia",
    taxaEngajamento: 80,
    frequenciaParticipacao: 85,
    acessosSemana: 6,
    ultimaInteracao: "Ontem",
    tendencia: "alta",
    treinamentosConcluidos: 4,
    interacoesFeed: 10,
    pesquisasRespondidas: 3,
    eventosParticipados: 1,
  },
  {
    userId: "collab-007",
    nome: "Gabriela Martins",
    avatar: "/avatars/gabriela.png",
    time: "Time Vendas",
    departamento: "Comercial",
    taxaEngajamento: 55,
    frequenciaParticipacao: 65,
    acessosSemana: 3,
    ultimaInteracao: "2 dias atrás",
    tendencia: "queda",
    treinamentosConcluidos: 2,
    interacoesFeed: 4,
    pesquisasRespondidas: 1,
    eventosParticipados: 0,
  },
  {
    userId: "collab-008",
    nome: "Hugo Nogueira",
    avatar: "/avatars/hugo.png",
    time: "Time Criativo",
    departamento: "Marketing",
    taxaEngajamento: 90,
    frequenciaParticipacao: 90,
    acessosSemana: 7,
    ultimaInteracao: "Hoje",
    tendencia: "alta",
    treinamentosConcluidos: 5,
    interacoesFeed: 11,
    pesquisasRespondidas: 3,
    eventosParticipados: 2,
  },
  {
    userId: "collab-009",
    nome: "Isabela Oliveira",
    avatar: "/avatars/isabela.png",
    time: "Time Tech",
    departamento: "Tecnologia",
    taxaEngajamento: 78,
    frequenciaParticipacao: 82,
    acessosSemana: 6,
    ultimaInteracao: "Ontem",
    tendencia: "estavel",
    treinamentosConcluidos: 3,
    interacoesFeed: 7,
    pesquisasRespondidas: 2,
    eventosParticipados: 1,
  },
  {
    userId: "collab-010",
    nome: "João Pereira",
    avatar: "/avatars/joao.png",
    time: "Time Vendas",
    departamento: "Comercial",
    taxaEngajamento: 48,
    frequenciaParticipacao: 55,
    acessosSemana: 2,
    ultimaInteracao: "3 dias atrás",
    tendencia: "queda",
    treinamentosConcluidos: 1,
    interacoesFeed: 3,
    pesquisasRespondidas: 0,
    eventosParticipados: 0,
  },
  {
    userId: "collab-011",
    nome: "Larissa Queiroz",
    avatar: "/avatars/larissa.png",
    time: "Time RH",
    departamento: "Recursos Humanos",
    taxaEngajamento: 85,
    frequenciaParticipacao: 90,
    acessosSemana: 7,
    ultimaInteracao: "Hoje",
    tendencia: "alta",
    treinamentosConcluidos: 4,
    interacoesFeed: 10,
    pesquisasRespondidas: 3,
    eventosParticipados: 2,
  },
]

const mockEvolucaoEngajamentoPorTime = [
  { dia: "Dia 1", "Time Criativo": 85, "Time Tech": 78, "Time Vendas": 60, "Time RH": 90 },
  { dia: "Dia 2", "Time Criativo": 86, "Time Tech": 79, "Time Vendas": 61, "Time RH": 91 },
  { dia: "Dia 3", "Time Criativo": 87, "Time Tech": 80, "Time Vendas": 63, "Time RH": 92 },
  { dia: "Dia 4", "Time Criativo": 88, "Time Tech": 81, "Time Vendas": 64, "Time RH": 93 },
  { dia: "Dia 5", "Time Criativo": 89, "Time Tech": 82, "Time Vendas": 65, "Time RH": 94 },
  { dia: "Dia 6", "Time Criativo": 90, "Time Tech": 83, "Time Vendas": 66, "Time RH": 95 },
  { dia: "Dia 7", "Time Criativo": 91, "Time Tech": 84, "Time Vendas": 67, "Time RH": 96 },
  { dia: "Dia 8", "Time Criativo": 92, "Time Tech": 85, "Time Vendas": 68, "Time RH": 97 },
  { dia: "Dia 9", "Time Criativo": 93, "Time Tech": 86, "Time Vendas": 69, "Time RH": 98 },
  { dia: "Dia 10", "Time Criativo": 94, "Time Tech": 87, "Time Vendas": 70, "Time RH": 99 },
  { dia: "Dia 11", "Time Criativo": 95, "Time Tech": 88, "Time Vendas": 71, "Time RH": 100 },
  { dia: "Dia 12", "Time Criativo": 96, "Time Tech": 89, "Time Vendas": 72, "Time RH": 100 },
  { dia: "Dia 13", "Time Criativo": 97, "Time Tech": 90, "Time Vendas": 73, "Time RH": 100 },
  { dia: "Dia 14", "Time Criativo": 98, "Time Tech": 91, "Time Vendas": 74, "Time RH": 100 },
  { dia: "Dia 15", "Time Criativo": 99, "Time Tech": 92, "Time Vendas": 75, "Time RH": 100 },
  { dia: "Dia 16", "Time Criativo": 100, "Time Tech": 93, "Time Vendas": 76, "Time RH": 100 },
  { dia: "Dia 17", "Time Criativo": 100, "Time Tech": 94, "Time Vendas": 77, "Time RH": 100 },
  { dia: "Dia 18", "Time Criativo": 100, "Time Tech": 95, "Time Vendas": 78, "Time RH": 100 },
  { dia: "Dia 19", "Time Criativo": 100, "Time Tech": 96, "Time Vendas": 79, "Time RH": 100 },
  { dia: "Dia 20", "Time Criativo": 100, "Time Tech": 97, "Time Vendas": 80, "Time RH": 100 },
  { dia: "Dia 21", "Time Criativo": 99, "Time Tech": 98, "Time Vendas": 81, "Time RH": 100 },
  { dia: "Dia 22", "Time Criativo": 98, "Time Tech": 99, "Time Vendas": 82, "Time RH": 100 },
  { dia: "Dia 23", "Time Criativo": 97, "Time Tech": 100, "Time Vendas": 83, "Time RH": 100 },
  { dia: "Dia 24", "Time Criativo": 96, "Time Tech": 100, "Time Vendas": 84, "Time RH": 100 },
  { dia: "Dia 25", "Time Criativo": 95, "Time Tech": 100, "Time Vendas": 85, "Time RH": 100 },
  { dia: "Dia 26", "Time Criativo": 94, "Time Tech": 100, "Time Vendas": 86, "Time RH": 100 },
  { dia: "Dia 27", "Time Criativo": 93, "Time Tech": 100, "Time Vendas": 87, "Time RH": 100 },
  { dia: "Dia 28", "Time Criativo": 92, "Time Tech": 100, "Time Vendas": 88, "Time RH": 100 },
  { dia: "Dia 29", "Time Criativo": 91, "Time Tech": 100, "Time Vendas": 89, "Time RH": 100 },
  { dia: "Dia 30", "Time Criativo": 90, "Time Tech": 100, "Time Vendas": 90, "Time RH": 100 },
]

const mockEngajamentoPorTime = [
  { time: "Time Criativo", taxa: 90, colaboradores: 10 },
  { time: "Time Tech", taxa: 85, colaboradores: 15 },
  { time: "Time Vendas", taxa: 65, colaboradores: 20 },
  { time: "Time RH", taxa: 95, colaboradores: 5 },
]

const engagementData = [
  { month: "Jul", rate: 78 },
  { month: "Ago", rate: 82 },
  { month: "Set", rate: 85 },
  { month: "Out", rate: 88 },
  { month: "Nov", rate: 87 },
  { month: "Dez", rate: 90 },
]

const moodData = [
  { day: "Seg", mood: 4.2 },
  { day: "Ter", mood: 4.4 },
  { day: "Qua", mood: 4.1 },
  { day: "Qui", mood: 4.5 },
  { day: "Sex", mood: 4.7 },
  { day: "Sáb", mood: 4.3 },
  { day: "Dom", mood: 4.2 },
]

// Mock Data for Humor do Dia
const mockHumorDoDiaData = [
  { time: "Time Criativo", mediaHumor: 4.1, tendencia: "alta" },
  { time: "Time Tech", mediaHumor: 3.9, tendencia: "estavel" },
  { time: "Time Vendas", mediaHumor: 3.5, tendencia: "queda" },
  { time: "Time RH", mediaHumor: 4.5, tendencia: "alta" },
]

function LojinhaProfissionalPanel() {
  const { user, hasPermission } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  const previewRole = user?.role ?? "super-admin"
  const isSuperAdmin = hasPermission("super-admin") || previewRole === "super-admin"
  const isGestor = hasPermission("gestor") || previewRole === "gestor"

  // Pega o subtab da URL
  const initialSubtab = searchParams.get("subtab") as any

  // ── Estados Super Admin ──────────────────────────────────────────────────────
  const [itens, setItens] = useState<StoreItem[]>([])
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [gestoresLista, setGestoresLista] = useState<{ id: string; nome: string; cargo: string }[]>([])
  const [loadingItens, setLoadingItens] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"criar" | "rascunhos" | "aprovacao" | "criados" | "ativos" | "auditoria" | "solicitacoes">(
    initialSubtab && ["criar", "rascunhos", "aprovacao", "criados", "ativos", "auditoria", "solicitacoes"].includes(initialSubtab) ? initialSubtab : "criar",
  )
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    categoriaId: "",
    descricao: "",
    custoEstrelas: 0,
    quantidade: null as number | null,
    allowMultipleRedemptions: false,
    maxRedemptionsPerUser: null as number | null,
    gestoresDisponiveis: [] as string[],
    observacoesInternas: "",
  })
  const [fromRequestId, setFromRequestId] = useState<string | null>(null)
  const [reviewingRequestId, setReviewingRequestId] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({
    name: "", description: "", category: "", estimatedStarCost: 0, reviewNote: ""
  })

  // ── Estados Gestor ──────────────────────────────────────────────────────────
  const [gestorInventory, setGestorInventory] = useState<StoreManagerInventory[]>([])
  const [resgatesTime, setResgatesTime] = useState<StoreRedemption[]>([])
  const [showSolicitarDialog, setShowSolicitarDialog] = useState(false)
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)
  const [updatingRedemptionId, setUpdatingRedemptionId] = useState<string | null>(null)
  const [filtroHistorico, setFiltroHistorico] = useState("todos")
  const [auditLogs, setAuditLogs] = useState<StoreAuditLog[]>([])
  const [rewardRequests, setRewardRequests] = useState<StoreRewardRequest[]>([])
  const [solicitacaoForm, setSolicitacaoForm] = useState({
    nome: "", descricao: "", categoria: "Vales", custoEstimado: 0, justificativa: "",
  })

  // Novos estados do Gestor para Bug 2 e Bug 3
  const [gestorTeam, setGestorTeam] = useState<{ id: string; nome: string; cargo: string }[]>([])
  const [showAtivarDialog, setShowAtivarDialog] = useState(false)
  const [itemParaAtivar, setItemParaAtivar] = useState<string | null>(null)
  const [ativarScope, setAtivarScope] = useState<"all" | "specific">("all")
  const [ativarUserIds, setAtivarUserIds] = useState<string[]>([])
  const [ativarSearchTerm, setAtivarSearchTerm] = useState("")
  const [gestorActiveTab, setGestorActiveTab] = useState<"estoque" | "extrato" | "solicitacoes">(
    initialSubtab && ["estoque", "extrato", "solicitacoes"].includes(initialSubtab) ? initialSubtab : "estoque"
  )
  const [showEditSolicitacaoDialog, setShowEditSolicitacaoDialog] = useState(false)
  const [editingSolicitacaoId, setEditingSolicitacaoId] = useState<string | null>(null)
  // Estados para upload de imagem das dialogs de solicitação
  const [solicitacaoImageFile, setSolicitacaoImageFile] = useState<File | null>(null)
  const [solicitacaoImagePreview, setSolicitacaoImagePreview] = useState<string | null>(null)
  const [editSolicitacaoImageFile, setEditSolicitacaoImageFile] = useState<File | null>(null)
  const [editSolicitacaoImagePreview, setEditSolicitacaoImagePreview] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [isSuperAdmin, isGestor, user])

  // Pré-preencher formulário de criar item quando superadmin clica em "Prosseguir" em uma solicitação
  useEffect(() => {
    if (!isSuperAdmin || categories.length === 0) return
    const prefillJson = sessionStorage.getItem("engageai-prefill-store-item")
    if (!prefillJson) return
    sessionStorage.removeItem("engageai-prefill-store-item")
    try {
      const prefill = JSON.parse(prefillJson)
      const cat = categories.find(c =>
        c.name.toLowerCase() === (prefill.categoria ?? "").toLowerCase()
      ) ?? categories[0]
      setFormData(prev => ({
        ...prev,
        nome: prefill.nome ?? "",
        descricao: prefill.descricao ?? "",
        categoriaId: cat?.id ?? prev.categoriaId,
        custoEstrelas: prefill.custoEstrelas ?? 0,
        gestoresDisponiveis: prefill.gestorId ? [prefill.gestorId] : [],
        allowMultipleRedemptions: false,
        maxRedemptionsPerUser: null,
      }))
      if (prefill.imageUrl) setImagePreview(getImageUrl(prefill.imageUrl))
      if (prefill.fromRequestId) setFromRequestId(prefill.fromRequestId)
      setActiveTab("criar")
    } catch {
      // JSON parse error — ignorar
    }
  }, [categories])

  const loadData = async () => {
    setLoadingItens(true)
    try {
      if (isSuperAdmin) {
        const [itensRes, catsRes, gestoresRes, auditRes, reqRes] = await Promise.all([
          getStoreItems(),
          getStoreCategories(),
          apiFetch<{ data: any[] }>("/users?role=gestor&limit=200"),
          getAuditLogs(),
          getRewardRequests(),
        ])
        setItens(itensRes.data)
        setCategories(catsRes.data)
        setGestoresLista(gestoresRes.data || [])
        setAuditLogs(auditRes.data)
        setRewardRequests(reqRes.data)
        // Setar categoriaId padrão se não tiver
        if (!formData.categoriaId && catsRes.data.length > 0) {
          setFormData(prev => ({ ...prev, categoriaId: catsRes.data[0].id }))
        }
      } else if (isGestor) {
        const [invRes, resgRes, reqRes, teamRes] = await Promise.all([
          getManagerInventory(),
          getTeamRedemptions(),
          getRewardRequests(),
          user ? apiFetch<{ data: any[] }>(`/users?managerId=${user.id}&limit=200`) : Promise.resolve({ data: [] }),
        ])
        setGestorInventory(invRes.data)
        setResgatesTime(resgRes.data)
        setRewardRequests(reqRes.data)
        setGestorTeam(teamRes.data || [])
      }
    } catch (err) {
      toast({ title: "Erro ao carregar dados", description: (err as Error).message, variant: "destructive" })
    } finally {
      setLoadingItens(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setSelectedFile(null)
  }

  const handleSubmitSuperAdmin = async (salvarComoRascunho: boolean) => {
    if (!user) return
    if (!formData.nome.trim() || !formData.descricao.trim() || !formData.categoriaId) {
      toast({ title: "Erro de Validação", description: "Preencha nome, descrição e categoria.", variant: "destructive" })
      return
    }
    if (formData.allowMultipleRedemptions && (formData.maxRedemptionsPerUser === null || formData.maxRedemptionsPerUser < 2)) {
      toast({ title: "Erro de Validação", description: "Informe a quantidade máxima de resgates por colaborador (mínimo 2).", variant: "destructive" })
      return
    }
    const gestoresValidos = formData.gestoresDisponiveis.filter(id => id !== "placeholder")
    if (formData.gestoresDisponiveis.length > 0 && gestoresValidos.length === 0) {
      toast({ title: "Erro de Validação", description: "Selecione ao menos 1 gestor ou 'Disponível para todos'.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      // Upload de imagem se houver arquivo selecionado
      let imageUrl: string | null = editingItem
        ? (itens.find(i => i.id === editingItem)?.imageUrl ?? null)
        : null

      if (selectedFile) {
        const uploadRes = await uploadFileToBackend(selectedFile, "store")
        imageUrl = uploadRes.data.key
      }

      const payload = {
        name: formData.nome,
        categoryId: formData.categoriaId,
        description: formData.descricao,
        costStars: formData.custoEstrelas,
        quantity: formData.quantidade,
        imageUrl,
        internalNotes: formData.observacoesInternas || null,
        allowMultipleRedemptions: formData.allowMultipleRedemptions,
        maxRedemptionsPerUser: formData.allowMultipleRedemptions ? formData.maxRedemptionsPerUser : null,
        managerIds: gestoresValidos,
      }

      if (editingItem) {
        await updateStoreItem(editingItem, payload)
        toast({ title: "Item Atualizado", description: `${formData.nome} foi atualizado com sucesso.` })
      } else {
        await createStoreItem({
          ...payload,
          status: salvarComoRascunho ? "draft" : "created",
          ...(fromRequestId ? { fromRequestId } : {}),
        })
        setFromRequestId(null)
        toast({
          title: salvarComoRascunho ? "Rascunho Salvo" : "Item Criado",
          description: salvarComoRascunho
            ? "Rascunho salvo. Você pode continuar editando depois."
            : "Item criado. Ative-o para disponibilizá-lo aos gestores.",
        })
        if (!salvarComoRascunho) setActiveTab("criados")
      }

      await loadData()
      resetForm()
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData(prev => ({
      nome: "",
      categoriaId: categories[0]?.id ?? prev.categoriaId,
      descricao: "",
      custoEstrelas: 0,
      quantidade: null,
      allowMultipleRedemptions: false,
      maxRedemptionsPerUser: null,
      gestoresDisponiveis: [],
      observacoesInternas: "",
    }))
    setImagePreview(null)
    setSelectedFile(null)
    setEditingItem(null)
    setFromRequestId(null)
  }

  const handleAtivarItem = async (itemId: string) => {
    try {
      await setStoreItemStatus(itemId, "active")
      toast({ title: "Item Ativado", description: "Item ativado. Gestores foram notificados." })
      await loadData()
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
    }
  }

  const handleDesativarItem = async (itemId: string) => {
    try {
      await setStoreItemStatus(itemId, "inactive")
      toast({ title: "Item Desativado", description: "Item desativado." })
      await loadData()
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return
    try {
      await deleteStoreItem(itemId)
      toast({ title: "Item Removido", description: "O item foi removido com sucesso." })
      await loadData()
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
    }
  }

  const handleSolicitarRecompensa = async () => {
    setSaving(true)
    try {
      let imageUrl: string | null = null
      if (solicitacaoImageFile) {
        const uploadRes = await uploadFileToBackend(solicitacaoImageFile, "store")
        imageUrl = uploadRes.data.key
      }
      await createRewardRequest({
        name: solicitacaoForm.nome,
        description: solicitacaoForm.descricao,
        category: solicitacaoForm.categoria,
        estimatedStarCost: solicitacaoForm.custoEstimado,
        justification: solicitacaoForm.justificativa,
        imageUrl,
      })
      toast({ title: "Solicitação Enviada!", description: "O Super Admin foi notificado." })
      setSolicitacaoForm({ nome: "", descricao: "", categoria: "Vales", custoEstimado: 0, justificativa: "" })
      setSolicitacaoImageFile(null)
      setSolicitacaoImagePreview(null)
      setShowSolicitarDialog(false)
      await loadData()
      setGestorActiveTab("solicitacoes")
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const exportarHistorico = () => {
    const rows = resgatesTime.map(r =>
      `${r.id},${r.item?.name ?? ""},${r.user?.nome ?? ""},${r.status},${new Date(r.redeemedAt).toLocaleString("pt-BR")}`
    )
    const csv = ["ID,Item,Colaborador,Status,Data", ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resgates-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    toast({ title: "Extrato Exportado", description: "O arquivo CSV foi baixado com sucesso." })
  }

  // Renderização condicional por perfil
  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Lojinha - Gestão Completa (Super Admin)</h2>
            <p className="mt-1 text-muted-foreground">Crie, aprove e gerencie recompensas com governança completa</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setActiveTab("criar")} className="clay-button">
              <Plus className="mr-2 h-4 w-4" />
              Criar Novo Item
            </Button>
            <Button onClick={() => setActiveTab("auditoria")} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Auditoria
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="clay-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold">{itens.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="clay-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{itens.filter((i) => i.status === "active").length}</p>
                </div>
                <Power className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="clay-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Criados</p>
                  <p className="text-2xl font-bold">{itens.filter((i) => i.status === "created").length}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="clay-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rascunhos</p>
                  <p className="text-2xl font-bold">{itens.filter((i) => i.status === "draft").length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="criar">Criar/Editar</TabsTrigger>
            <TabsTrigger value="rascunhos">Rascunhos</TabsTrigger>
            <TabsTrigger value="aprovacao">Em Aprovação</TabsTrigger>
            <TabsTrigger value="criados">Criados</TabsTrigger>
            <TabsTrigger value="ativos">Ativos/Inativos</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
            <TabsTrigger value="solicitacoes">
              Solicitações
              {rewardRequests.filter(r => r.status === "pending").length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                  {rewardRequests.filter(r => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Aba Criar/Editar */}
          <TabsContent value="criar" className="space-y-4">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Criar Novo Item de Recompensa</CardTitle>
                <CardDescription>Preencha os campos para criar um novo item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome do Item*</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: Vale Presente Amazon R$ 100"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria*</label>
                    <select
                      value={formData.categoriaId}
                      onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Descrição*</label>
                    <Textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Descreva o item de recompensa"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Custo em Estrelas ⭐</label>
                    <input
                      type="number"
                      value={formData.custoEstrelas || ""}
                      onChange={(e) => setFormData({ ...formData, custoEstrelas: Number.parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="50"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantidade Disponível</label>
                    <input
                      type="number"
                      value={formData.quantidade ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quantidade: e.target.value ? Number.parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Deixe vazio para ilimitado"
                      min="0"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Imagem (JPG, JPEG, PNG, WEBP — máx. 20MB)</label>
                    <div className="space-y-3">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview || "/placeholder.svg"}
                            alt="Preview"
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={removeImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Gift className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">Clique para fazer upload da imagem</p>
                              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP — até 20MB</p>
                            </div>
                            <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Observações Internas</label>
                    <Textarea
                      value={formData.observacoesInternas}
                      onChange={(e) => setFormData({ ...formData, observacoesInternas: e.target.value })}
                      placeholder="Notas internas sobre o item (não visível para colaboradores)"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Limite de Resgates por Colaborador */}
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Limite de Resgates por Colaborador</CardTitle>
                <CardDescription>Define quantas vezes cada colaborador pode resgatar este item</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Colaborador pode resgatar mais de uma vez?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.allowMultipleRedemptions
                        ? "Sim — com limite máximo configurável"
                        : "Não — apenas 1 resgate por colaborador"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowMultipleRedemptions}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, allowMultipleRedemptions: checked, maxRedemptionsPerUser: null })
                    }
                  />
                </div>
                {formData.allowMultipleRedemptions && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <label className="text-sm font-medium">Quantidade máxima de resgates por colaborador*</label>
                    <input
                      type="number"
                      min="2"
                      value={formData.maxRedemptionsPerUser ?? ""}
                      onChange={(e) =>
                        setFormData({ ...formData, maxRedemptionsPerUser: parseInt(e.target.value) || null })
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Ex: 3"
                    />
                    {formData.maxRedemptionsPerUser !== null && formData.maxRedemptionsPerUser < 2 && (
                      <p className="text-xs text-destructive">Valor mínimo: 2</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Disponibilidade do Item */}
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Disponibilidade do Item</CardTitle>
                <CardDescription>Defina para quais gestores (estoques) este item de recompensa estará disponível</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* Opção 1: Todos os Gestores (Padrão) */}
                  <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                    <input
                      type="radio"
                      id="todosGestores"
                      name="disponibilidade"
                      checked={formData.gestoresDisponiveis.length === 0}
                      onChange={() => setFormData({ ...formData, gestoresDisponiveis: [] })}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label htmlFor="todosGestores" className="text-sm font-medium cursor-pointer">
                        Disponível para todos os gestores
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Item ficará disponível em todos os estoques. Todos os gestores poderão utilizá-lo em suas lojinhas.
                      </p>
                    </div>
                  </div>

                  {/* Opção 2: Gestores Específicos */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                      <input
                        type="radio"
                        id="gestoresEspecificos"
                        name="disponibilidade"
                        checked={formData.gestoresDisponiveis.length > 0}
                        onChange={() => {
                          // Não limpa a lista ao selecionar, mantém os gestores já selecionados
                          if (formData.gestoresDisponiveis.length === 0) {
                            // Se está vazio, força a seleção para mostrar o seletor
                            setFormData({ ...formData, gestoresDisponiveis: ["placeholder"] })
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="gestoresEspecificos" className="text-sm font-medium cursor-pointer">
                          Disponível apenas para gestores selecionados
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione quais gestores terão acesso a este item em seus estoques.
                        </p>
                      </div>
                    </div>

                    {/* Seletor de Gestores - Aparece quando "Gestores Específicos" está selecionado */}
                    {formData.gestoresDisponiveis.length > 0 && (
                      <div className="ml-8 space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                        <label className="text-sm font-medium">Selecionar Gestores*</label>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {gestoresLista.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum gestor cadastrado no sistema
                            </p>
                          ) : gestoresLista.map((gestor) => (
                            <div
                              key={gestor.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                id={`gestor-${gestor.id}`}
                                checked={formData.gestoresDisponiveis.includes(gestor.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      gestoresDisponiveis: [...formData.gestoresDisponiveis.filter(id => id !== "placeholder"), gestor.id],
                                    })
                                  } else {
                                    const novosGestores = formData.gestoresDisponiveis.filter((id) => id !== gestor.id && id !== "placeholder")
                                    setFormData({
                                      ...formData,
                                      gestoresDisponiveis: novosGestores.length > 0 ? novosGestores : ["placeholder"],
                                    })
                                  }
                                }}
                                className="h-4 w-4 rounded"
                              />
                              <label htmlFor={`gestor-${gestor.id}`} className="flex-1 cursor-pointer">
                                <p className="text-sm font-medium">{gestor.nome}</p>
                                <p className="text-xs text-muted-foreground">{gestor.cargo || "Gestor de Time"}</p>
                              </label>
                            </div>
                          ))}
                        </div>

                        {formData.gestoresDisponiveis.filter(id => id !== "placeholder").length === 0 && (
                          <p className="text-xs text-destructive">
                            ⚠️ Selecione ao menos 1 gestor para continuar
                          </p>
                        )}

                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            <strong>{formData.gestoresDisponiveis.filter(id => id !== "placeholder").length}</strong> gestor(es) selecionado(s)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Button onClick={() => handleSubmitSuperAdmin(true)} variant="outline" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Salvando..." : "Salvar como Rascunho"}
                  </Button>
                  <Button onClick={() => handleSubmitSuperAdmin(false)} className="clay-button" disabled={saving}>
                    <Send className="mr-2 h-4 w-4" />
                    {saving ? "Criando..." : "Criar Item"}
                  </Button>
                  {editingItem && (
                    <Button onClick={resetForm} variant="ghost">
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Rascunhos */}
          <TabsContent value="rascunhos" className="space-y-4">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Rascunhos</CardTitle>
                <CardDescription>Itens salvos como rascunho</CardDescription>
              </CardHeader>
              <CardContent>
                {itens.filter((i) => i.status === "draft").length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum rascunho encontrado</p>
                ) : (
                  <div className="space-y-3">
                    {itens
                      .filter((i) => i.status === "draft")
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border border-border rounded-lg p-4"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <p className="text-sm text-muted-foreground mt-1">⭐ {item.costStars} estrelas</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingItem(item.id)
                                setFormData({
                                  nome: item.name,
                                  categoriaId: item.categoryId,
                                  descricao: item.description,
                                  custoEstrelas: item.costStars,
                                  quantidade: item.quantity,
                                  allowMultipleRedemptions: item.allowMultipleRedemptions ?? false,
                                  maxRedemptionsPerUser: item.maxRedemptionsPerUser ?? null,
                                  gestoresDisponiveis: item.managerVisibility?.map(m => m.managerId) || [],
                                  observacoesInternas: item.internalNotes || "",
                                })
                                setImagePreview(item.imageUrl ? getImageUrl(item.imageUrl) : null)
                                setActiveTab("criar")
                              }}
                            >
                              Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Em Aprovação */}
          <TabsContent value="aprovacao" className="space-y-4">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Itens Aguardando Aprovação Superior</CardTitle>
                <CardDescription>Itens que requerem aprovação do financeiro</CardDescription>
              </CardHeader>
              <CardContent>
                {itens.filter((i) => i.status === "created").length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum item aguardando aprovação</p>
                ) : (
                  <div className="space-y-3">
                    {itens
                      .filter((i) => i.status === "created")
                      .map((item) => (
                        <div key={item.id} className="border border-amber-500/30 rounded-lg p-4 bg-amber-50/50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{item.name}</h4>
                                <Badge variant="outline" className="bg-amber-100">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Aguardando Aprovação
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                              <p className="text-sm font-medium mt-2">⭐ {item.costStars} estrelas</p>
                              {item.internalNotes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  Obs: {item.internalNotes}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleAtivarItem(item.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Ativar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(item.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Criados */}
          <TabsContent value="criados" className="space-y-4">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Itens Criados e Prontos para Ativação</CardTitle>
                <CardDescription>Itens aprovados que podem ser ativados para gestores</CardDescription>
              </CardHeader>
              <CardContent>
                {itens.filter((i) => i.status === "created").length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum item criado encontrado</p>
                ) : (
                  <div className="space-y-3">
                    {itens
                      .filter((i) => i.status === "created")
                      .map((item) => (
                        <div key={item.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              {item.imageUrl ? (
                                <img
                                  src={getImageUrl(item.imageUrl) ?? ""}
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                                />
                              ) : (
                                <div className="w-20 h-20 flex items-center justify-center rounded-lg bg-muted flex-shrink-0">
                                  <Gift className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold">{item.name}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline">{item.category?.name}</Badge>
                                  <Badge variant="outline">⭐ {item.costStars}</Badge>
                                  {item.quantity !== null && (
                                    <Badge variant="outline">Qtd: {item.quantity}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(item.id)
                                  setFormData({
                                    nome: item.name,
                                    categoriaId: item.categoryId,
                                    descricao: item.description,
                                    custoEstrelas: item.costStars,
                                    quantidade: item.quantity,
                                    allowMultipleRedemptions: item.allowMultipleRedemptions ?? false,
                                    maxRedemptionsPerUser: item.maxRedemptionsPerUser ?? null,
                                    gestoresDisponiveis: item.managerVisibility?.map(m => m.managerId) || [],
                                    observacoesInternas: item.internalNotes || "",
                                  })
                                  setImagePreview(item.imageUrl ? getImageUrl(item.imageUrl) : null)
                                  setActiveTab("criar")
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleAtivarItem(item.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Power className="h-4 w-4 mr-1" />
                                Ativar Item
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Ativos/Inativos */}
          <TabsContent value="ativos" className="space-y-4">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Itens Ativos e Inativos</CardTitle>
                <CardDescription>Gerenciar status de ativação dos itens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-600">Itens Ativos</h3>
                    {itens.filter((i) => i.status === "active").length === 0 ? (
                      <p className="text-muted-foreground">Nenhum item ativo</p>
                    ) : (
                      <div className="space-y-3">
                        {itens
                          .filter((i) => i.status === "active")
                          .map((item) => (
                            <div key={item.id} className="border border-green-500/30 rounded-lg p-4 bg-green-50/50">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                  {item.imageUrl ? (
                                    <img src={getImageUrl(item.imageUrl) ?? ""} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                                  ) : (
                                    <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-muted flex-shrink-0">
                                      <Gift className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">{item.name}</h4>
                                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <Badge variant="outline">{item.category?.name}</Badge>
                                      <Badge variant="outline">⭐ {item.costStars}</Badge>
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleDesativarItem(item.id)} className="flex-shrink-0">
                                  <PowerOff className="h-4 w-4 mr-1" />
                                  Desativar
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-muted-foreground">Itens Inativos</h3>
                    {itens.filter((i) => i.status === "inactive").length === 0 ? (
                      <p className="text-muted-foreground">Nenhum item inativo</p>
                    ) : (
                      <div className="space-y-3">
                        {itens
                          .filter((i) => i.status === "inactive")
                          .map((item) => (
                            <div key={item.id} className="border border-border rounded-lg p-4 bg-muted/30">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                  {item.imageUrl ? (
                                    <img src={getImageUrl(item.imageUrl) ?? ""} alt={item.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0 opacity-60" />
                                  ) : (
                                    <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-muted flex-shrink-0">
                                      <Gift className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-muted-foreground">{item.name}</h4>
                                      <Badge variant="secondary">Inativo</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <Badge variant="outline">{item.category?.name}</Badge>
                                      <Badge variant="outline">⭐ {item.costStars}</Badge>
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" onClick={() => handleAtivarItem(item.id)} className="flex-shrink-0">
                                  <Power className="h-4 w-4 mr-1" />
                                  Reativar
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Solicitações de Recompensa */}
          <TabsContent value="solicitacoes" className="space-y-4">
            <Card className="clay-card">
              <CardHeader>
                <CardTitle>Solicitações de Recompensa dos Gestores</CardTitle>
                <CardDescription>Revise e aprove solicitações enviadas pelos gestores</CardDescription>
              </CardHeader>
              <CardContent>
                {rewardRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada</p>
                ) : (
                  <div className="space-y-4">
                    {rewardRequests.map((req) => (
                      <div key={req.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          {req.imageUrl && (
                            <img
                              src={getImageUrl(req.imageUrl) ?? ""}
                              alt={req.name}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{req.name}</h4>
                              {req.status === "pending" && <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>}
                              {req.status === "approved" && <Badge className="bg-green-100 text-green-800">Aprovada</Badge>}
                              {req.status === "rejected" && <Badge variant="destructive">Recusada</Badge>}
                              {req.status === "refused" && <Badge variant="destructive">Recusada</Badge>}
                              {req.status === "proceeded" && <Badge className="bg-blue-100 text-blue-800">Em Progresso</Badge>}
                              {req.status === "converted" && <Badge className="bg-blue-100 text-blue-800">Convertida</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{req.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm flex-wrap">
                              <span className="text-muted-foreground">Gestor: <strong>{req.manager?.nome}</strong></span>
                              <span className="text-muted-foreground">Categoria: <strong>{req.category}</strong></span>
                              <span className="text-muted-foreground">Custo estimado: <strong>⭐ {req.estimatedStarCost}</strong></span>
                            </div>
                            {req.justification && (
                              <p className="text-sm mt-2 italic text-muted-foreground">"{req.justification}"</p>
                            )}
                            {req.reviewNote && (
                              <p className="text-sm mt-1 text-primary">Nota de revisão: {req.reviewNote}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{new Date(req.createdAt).toLocaleString("pt-BR")}</p>
                          </div>
                          {req.status === "pending" && reviewingRequestId !== req.id && (
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setReviewingRequestId(req.id)
                                  setReviewForm({
                                    name: req.name,
                                    description: req.description,
                                    category: req.category,
                                    estimatedStarCost: req.estimatedStarCost,
                                    reviewNote: ""
                                  })
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Analisar Solicitação
                              </Button>
                            </div>
                          )}

                          {req.status === "pending" && reviewingRequestId === req.id && (
                            <div className="mt-4 border-t pt-4 space-y-4">
                              <h5 className="font-semibold text-sm">Editar Detalhes (Opcional)</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Nome</label>
                                  <input type="text" className="w-full px-2 py-1 text-sm border rounded" value={reviewForm.name} onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Categoria</label>
                                  <Select value={reviewForm.category} onValueChange={v => setReviewForm({ ...reviewForm, category: v })}>
                                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Vales">Vales</SelectItem>
                                      <SelectItem value="Produtos">Produtos</SelectItem>
                                      <SelectItem value="Experiências">Experiências</SelectItem>
                                      <SelectItem value="Benefícios">Benefícios</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <label className="text-xs font-medium">Descrição</label>
                                  <Textarea className="w-full min-h-[60px] text-sm" value={reviewForm.description} onChange={e => setReviewForm({ ...reviewForm, description: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium">Custo Sugerido</label>
                                  <input type="number" className="w-full px-2 py-1 text-sm border rounded" value={reviewForm.estimatedStarCost} onChange={e => setReviewForm({ ...reviewForm, estimatedStarCost: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="space-y-1 col-span-2">
                                  <label className="text-xs font-medium">Nota de Revisão (Para o Gestor)</label>
                                  <Textarea className="w-full min-h-[60px] text-sm" placeholder="Motivo da aprovação/rejeição, ou alterações feitas..." value={reviewForm.reviewNote} onChange={e => setReviewForm({ ...reviewForm, reviewNote: e.target.value })} />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-2">
                                <Button size="sm" variant="outline" onClick={() => setReviewingRequestId(null)}>Cancelar</Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    try {
                                      await reviewRewardRequest(req.id, {
                                        status: "refused",
                                        reviewNote: reviewForm.reviewNote,
                                        name: reviewForm.name !== req.name ? reviewForm.name : undefined,
                                        description: reviewForm.description !== req.description ? reviewForm.description : undefined,
                                        category: reviewForm.category !== req.category ? reviewForm.category : undefined,
                                        estimatedStarCost: reviewForm.estimatedStarCost !== req.estimatedStarCost ? reviewForm.estimatedStarCost : undefined,
                                      })
                                      toast({ title: "Solicitação Recusada", description: `"${req.name}" foi recusada. O gestor foi notificado.` })
                                      setReviewingRequestId(null)
                                      await loadData()
                                    } catch (err) {
                                      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
                                    }
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Recusar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={async () => {
                                    try {
                                      await reviewRewardRequest(req.id, {
                                        status: "proceeded",
                                        reviewNote: reviewForm.reviewNote || undefined,
                                        name: reviewForm.name !== req.name ? reviewForm.name : undefined,
                                        description: reviewForm.description !== req.description ? reviewForm.description : undefined,
                                        category: reviewForm.category !== req.category ? reviewForm.category : undefined,
                                        estimatedStarCost: reviewForm.estimatedStarCost !== req.estimatedStarCost ? reviewForm.estimatedStarCost : undefined,
                                      })
                                      // Guardar dados no sessionStorage para pré-preencher o formulário de criação
                                      sessionStorage.setItem("engageai-prefill-store-item", JSON.stringify({
                                        nome: reviewForm.name,
                                        descricao: reviewForm.description,
                                        categoria: reviewForm.category,
                                        custoEstrelas: reviewForm.estimatedStarCost,
                                        imageUrl: req.imageUrl,
                                        gestorId: req.managerId,
                                        fromRequestId: req.id,
                                      }))
                                      toast({ title: "Prosseguindo!", description: "Formulário de criação pré-preenchido com os dados da solicitação." })
                                      setReviewingRequestId(null)
                                      await loadData()
                                    } catch (err) {
                                      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
                                    }
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4 mr-1" />
                                  Prosseguir
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Auditoria */}
          <TabsContent value="auditoria" className="space-y-4">
            <Card className="clay-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Histórico e Auditoria</CardTitle>
                    <CardDescription>Todas as ações realizadas na lojinha</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filtroHistorico} onValueChange={(v: any) => setFiltroHistorico(v)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="criacao">Criação</SelectItem>
                        <SelectItem value="aprovacao">Aprovação</SelectItem>
                        <SelectItem value="ativacao">Ativação</SelectItem>
                        <SelectItem value="resgate">Resgate</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={exportarHistorico} variant="outline">
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => {
                        const actionLabels: Record<string, string> = {
                          item_created: "Criado",
                          item_updated: "Editado",
                          item_deleted: "Removido",
                          item_sent_to_manager: "Enviado a gestores",
                          item_deactivated: "Desativado",
                          manager_item_activated: "Ativado pelo gestor",
                          manager_item_deactivated: "Desativado pelo gestor",
                          item_redeemed: "Resgatado",
                          redemption_status_updated: "Status de resgate atualizado",
                          reward_requested: "Solicitação criada",
                          reward_request_created: "Solicitação criada",
                          reward_request_reviewed: "Solicitação revisada",
                          reward_request_refused: "Solicitação recusada",
                          reward_request_proceeded: "Solicitação em progresso",
                          reward_request_resubmitted: "Solicitação reenviada",
                          item_created_from_request: "Item criado de solicitação",
                        }
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">{new Date(log.createdAt).toLocaleString("pt-BR")}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{actionLabels[log.action] ?? log.action}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{log.item?.name ?? "—"}</TableCell>
                            <TableCell>{log.performedBy?.nome ?? "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "—"}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  if (isGestor) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Lojinha - Gestão de Estoque (Gestor)</h2>
            <p className="mt-1 text-muted-foreground">Gerencie o estoque disponível para seu time</p>
          </div>
          <Button onClick={() => setShowSolicitarDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Solicitar Nova Recompensa
          </Button>
        </div>

        <Tabs value={gestorActiveTab} onValueChange={(v: any) => setGestorActiveTab(v)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="estoque">
              <Package className="mr-2 h-4 w-4" />
              Meu Estoque
            </TabsTrigger>
            <TabsTrigger value="extrato">
              <FileText className="mr-2 h-4 w-4" />
              Extrato de Resgates do Time
            </TabsTrigger>
            <TabsTrigger value="solicitacoes">
              <FileText className="mr-2 h-4 w-4" />
              Minhas Solicitações
              {rewardRequests.filter((r) => r.status === "rejected" || r.status === "refused").length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                  {rewardRequests.filter((r) => r.status === "rejected" || r.status === "refused").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estoque" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Itens Disponíveis</CardTitle>
                <CardDescription>Gerencie a disponibilidade dos itens para seu time</CardDescription>
              </CardHeader>
              <CardContent>
                {gestorInventory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum item no estoque. Aguarde o Super Admin ativar itens para você.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gestorInventory.map((inv) => {
                      const item = inv.item
                      const isAtivoParaTime = inv.status === "active_for_team"
                      return (
                        <Card key={inv.id} className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              {item.imageUrl ? (
                                <img src={getImageUrl(item.imageUrl) ?? ""} alt={item.name} className="w-16 h-16 object-cover rounded flex-shrink-0" />
                              ) : (
                                <div className="w-16 h-16 flex items-center justify-center rounded bg-muted flex-shrink-0">
                                  <Gift className="h-7 w-7 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge>{item.category?.name}</Badge>
                                  <Badge variant="outline">⭐ {item.costStars}</Badge>
                                  {isAtivoParaTime ? (
                                    <Badge className="bg-green-100 text-green-800">Ativo para Time</Badge>
                                  ) : (
                                    <Badge variant="secondary">Em Estoque</Badge>
                                  )}
                                  {!item.allowMultipleRedemptions
                                    ? <Badge variant="outline" className="text-xs border-dashed">Resgate único</Badge>
                                    : item.maxRedemptionsPerUser
                                      ? <Badge variant="outline" className="text-xs border-dashed">Máx. {item.maxRedemptionsPerUser}x/colaborador</Badge>
                                      : null
                                  }
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isAtivoParaTime ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={togglingItemId === inv.itemId}
                                  onClick={async () => {
                                    setTogglingItemId(inv.itemId)
                                    try {
                                      await setManagerInventoryStatus(inv.itemId, "inactive_for_team")
                                      toast({ title: "Item Desativado", description: "Item removido da lojinha do time." })
                                      await loadData()
                                    } catch (err) {
                                      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
                                    } finally {
                                      setTogglingItemId(null)
                                    }
                                  }}
                                >
                                  <PowerOff className="h-4 w-4 mr-1" />
                                  Desativar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={togglingItemId === inv.itemId}
                                  onClick={() => {
                                    setItemParaAtivar(inv.itemId)
                                    setAtivarScope("all")
                                    setAtivarUserIds([])
                                    setAtivarSearchTerm("")
                                    setShowAtivarDialog(true)
                                  }}
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  Ativar para Time
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extrato" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extrato de Resgates do Time</CardTitle>
                    <CardDescription>
                      Visualize todos os resgates realizados pelos colaboradores do seu time
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const headers = ["Colaborador", "Item", "Estrelas", "Código", "Data"]
                      const rows = resgatesTime.map(r => [r.user?.nome || "", r.item?.name || "", r.item?.costStars || 0, r.id.slice(0, 8).toUpperCase(), new Date(r.redeemedAt).toLocaleString("pt-BR")].join(","))
                      const csv = [headers.join(","), ...rows].join("\n")
                      const blob = new Blob([csv], { type: "text/csv" })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `extrato-resgates-${new Date().toISOString().split("T")[0]}.csv`
                      a.click()
                      toast({
                        title: "Extrato Exportado",
                        description: "O arquivo CSV foi baixado com sucesso.",
                      })
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resgatesTime.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum resgate realizado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {resgatesTime
                      .slice()
                      .sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime())
                      .map((cupom) => (
                        <Card key={cupom.id} className="p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                <Gift className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{cupom.item?.name}</h4>
                                <p className="text-sm text-muted-foreground">Por: {cupom.user?.nome}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge variant="outline">{cupom.item?.category?.name}</Badge>
                                  <Badge variant="outline">⭐ {cupom.item?.costStars}</Badge>
                                  {cupom.status === "pending" && <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>}
                                  {cupom.status === "fulfilled" && <Badge className="bg-blue-100 text-blue-800">Entregue</Badge>}
                                  {cupom.status === "cancelled" && <Badge variant="destructive">Cancelado</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-mono text-muted-foreground">Código: {cupom.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(cupom.redeemedAt).toLocaleDateString("pt-BR")} às{" "}
                                {new Date(cupom.redeemedAt).toLocaleTimeString("pt-BR")}
                              </p>
                              {cupom.status === "pending" && (
                                <div className="flex gap-2 mt-2 justify-end">
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={updatingRedemptionId === cupom.id}
                                    onClick={async () => {
                                      setUpdatingRedemptionId(cupom.id)
                                      try {
                                        await updateRedemptionStatus(cupom.id, "fulfilled")
                                        setResgatesTime(prev => prev.map(r => r.id === cupom.id ? { ...r, status: "fulfilled" } : r))
                                        toast({ title: "Resgate Confirmado", description: "Resgate marcado como entregue." })
                                      } catch (err) {
                                        toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
                                      } finally {
                                        setUpdatingRedemptionId(null)
                                      }
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Entregue
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={updatingRedemptionId === cupom.id}
                                    onClick={async () => {
                                      setUpdatingRedemptionId(cupom.id)
                                      try {
                                        await updateRedemptionStatus(cupom.id, "cancelled")
                                        setResgatesTime(prev => prev.map(r => r.id === cupom.id ? { ...r, status: "cancelled" } : r))
                                        toast({ title: "Resgate Cancelado", description: "Resgate cancelado com sucesso." })
                                      } catch (err) {
                                        toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
                                      } finally {
                                        setUpdatingRedemptionId(null)
                                      }
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancelar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Minhas Solicitações</CardTitle>
                    <CardDescription>
                      Acompanhe o status das recompensas que você solicitou ao Super Admin
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rewardRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma solicitação enviada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewardRequests
                      .slice()
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((req) => (
                        <Card key={req.id} className="p-4 border">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {req.imageUrl && (
                                <img
                                  src={getImageUrl(req.imageUrl) ?? ""}
                                  alt={req.name}
                                  className="w-12 h-12 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{req.name}</h4>
                                  {req.status === "pending" && <Badge className="bg-amber-100 text-amber-800">Pendente</Badge>}
                                  {req.status === "approved" && <Badge className="bg-green-100 text-green-800">Aprovada</Badge>}
                                  {req.status === "rejected" && <Badge variant="destructive">Recusada</Badge>}
                                  {req.status === "refused" && <Badge variant="destructive">Recusada</Badge>}
                                  {req.status === "proceeded" && <Badge className="bg-blue-100 text-blue-800">Em Progresso</Badge>}
                                  {req.status === "converted" && <Badge className="bg-blue-100 text-blue-800">Convertida em Item</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{req.description}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span>⭐ Custo est.: {req.estimatedStarCost}</span>
                                  <span>•</span>
                                  <span>Categoria: {req.category}</span>
                                  <span>•</span>
                                  <span>Enviada em: {new Date(req.createdAt).toLocaleDateString("pt-BR")}</span>
                                </div>
                                {req.reviewNote && (
                                  <div className="mt-3 bg-muted/50 p-3 rounded-md border text-sm">
                                    <span className="font-medium">Feedback do Super Admin:</span> {req.reviewNote}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {(req.status === "rejected" || req.status === "refused") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSolicitacaoId(req.id)
                                    setSolicitacaoForm({
                                      nome: req.name,
                                      descricao: req.description,
                                      categoria: req.category,
                                      custoEstimado: req.estimatedStarCost,
                                      justificativa: req.justification,
                                    })
                                    setEditSolicitacaoImagePreview(req.imageUrl ? getImageUrl(req.imageUrl) : null)
                                    setEditSolicitacaoImageFile(null)
                                    setShowEditSolicitacaoDialog(true)
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Re-editar e Enviar
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para solicitar nova recompensa */}
        <Dialog open={showSolicitarDialog} onOpenChange={setShowSolicitarDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Nova Recompensa</DialogTitle>
              <DialogDescription>
                Envie uma solicitação ao Super Admin para adicionar uma nova recompensa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da Recompensa</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={solicitacaoForm.nome}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  className="w-full mt-1"
                  value={solicitacaoForm.descricao}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, descricao: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={solicitacaoForm.categoria}
                  onValueChange={(value) => setSolicitacaoForm({ ...solicitacaoForm, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vales">Vales</SelectItem>
                    <SelectItem value="Produtos">Produtos</SelectItem>
                    <SelectItem value="Experiências">Experiências</SelectItem>
                    <SelectItem value="Benefícios">Benefícios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Custo Estimado (Estrelas)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={solicitacaoForm.custoEstimado}
                  onChange={(e) =>
                    setSolicitacaoForm({ ...solicitacaoForm, custoEstimado: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Justificativa</label>
                <Textarea
                  className="w-full mt-1"
                  placeholder="Por que essa recompensa seria benéfica para o time?"
                  value={solicitacaoForm.justificativa}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, justificativa: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Imagem (opcional)</label>
                {solicitacaoImagePreview ? (
                  <div className="relative mt-1">
                    <img src={solicitacaoImagePreview} alt="Preview" className="h-24 w-full object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => { setSolicitacaoImageFile(null); setSolicitacaoImagePreview(null) }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded cursor-pointer mt-1 hover:bg-muted/50">
                    <p className="text-xs text-muted-foreground">Clique para enviar imagem</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSolicitacaoImageFile(file)
                          const reader = new FileReader()
                          reader.onloadend = () => setSolicitacaoImagePreview(reader.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowSolicitarDialog(false)
                setSolicitacaoImageFile(null)
                setSolicitacaoImagePreview(null)
              }}>
                Cancelar
              </Button>
              <Button onClick={handleSolicitarRecompensa} disabled={saving}>
                <Send className="mr-2 h-4 w-4" />
                {saving ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Ativar para Time (Gestor) */}
        <Dialog open={showAtivarDialog} onOpenChange={setShowAtivarDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ativar para Equipe</DialogTitle>
              <DialogDescription>
                Selecione quem poderá ver e resgatar este item.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="scope-all"
                  checked={ativarScope === "all"}
                  onChange={() => setAtivarScope("all")}
                />
                <label htmlFor="scope-all" className="text-sm">Toda a equipe</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="scope-specific"
                  checked={ativarScope === "specific"}
                  onChange={() => setAtivarScope("specific")}
                />
                <label htmlFor="scope-specific" className="text-sm">Pessoas específicas</label>
              </div>

              {ativarScope === "specific" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar por nome..."
                      className="pl-9"
                      value={ativarSearchTerm}
                      onChange={(e) => setAtivarSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                    {gestorTeam.filter(m =>
                      m.nome.toLowerCase().includes(ativarSearchTerm.toLowerCase()) ||
                      m.cargo.toLowerCase().includes(ativarSearchTerm.toLowerCase())
                    ).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center">Nenhum membro encontrado.</p>
                    ) : (
                      gestorTeam
                        .filter(m =>
                          m.nome.toLowerCase().includes(ativarSearchTerm.toLowerCase()) ||
                          m.cargo.toLowerCase().includes(ativarSearchTerm.toLowerCase())
                        )
                        .map((member) => (
                          <div key={member.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`member-${member.id}`}
                              checked={ativarUserIds.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) setAtivarUserIds([...ativarUserIds, member.id])
                                else setAtivarUserIds(ativarUserIds.filter(id => id !== member.id))
                              }}
                            />
                            <label htmlFor={`member-${member.id}`} className="text-sm flex-1 cursor-pointer">
                              {member.nome} <span className="text-xs text-muted-foreground">({member.cargo})</span>
                            </label>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAtivarDialog(false)}>Cancelar</Button>
              <Button
                disabled={togglingItemId !== null || (ativarScope === "specific" && ativarUserIds.length === 0)}
                onClick={async () => {
                  if (!itemParaAtivar) return
                  setTogglingItemId(itemParaAtivar)
                  try {
                    await setManagerInventoryStatus(itemParaAtivar, "active_for_team", ativarScope, ativarScope === "specific" ? ativarUserIds : [])
                    toast({ title: "Item Ativado", description: "Configuração de visibilidade salva com sucesso." })
                    setShowAtivarDialog(false)
                    await loadData()
                  } catch (err) {
                    toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
                  } finally {
                    setTogglingItemId(null)
                  }
                }}
              >
                Ativar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Editar Solicitação de Recompensa (Gestor) */}
        <Dialog open={showEditSolicitacaoDialog} onOpenChange={setShowEditSolicitacaoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Re-editar Solicitação de Recompensa</DialogTitle>
              <DialogDescription>Ajuste os dados e envie novamente para aprovação.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={solicitacaoForm.nome}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  className="w-full mt-1"
                  value={solicitacaoForm.descricao}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, descricao: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={solicitacaoForm.categoria}
                  onValueChange={(value) => setSolicitacaoForm({ ...solicitacaoForm, categoria: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vales">Vales</SelectItem>
                    <SelectItem value="Produtos">Produtos</SelectItem>
                    <SelectItem value="Experiências">Experiências</SelectItem>
                    <SelectItem value="Benefícios">Benefícios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Custo Estimado (Estrelas)</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  value={solicitacaoForm.custoEstimado}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, custoEstimado: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nova Justificativa</label>
                <Textarea
                  className="w-full mt-1"
                  value={solicitacaoForm.justificativa}
                  onChange={(e) => setSolicitacaoForm({ ...solicitacaoForm, justificativa: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Imagem (opcional)</label>
                {editSolicitacaoImagePreview ? (
                  <div className="relative mt-1">
                    <img src={editSolicitacaoImagePreview} alt="Preview" className="h-24 w-full object-cover rounded" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2 h-6 w-6"
                      onClick={() => { setEditSolicitacaoImageFile(null); setEditSolicitacaoImagePreview(null) }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded cursor-pointer mt-1 hover:bg-muted/50">
                    <p className="text-xs text-muted-foreground">Clique para enviar imagem</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setEditSolicitacaoImageFile(file)
                          const reader = new FileReader()
                          reader.onloadend = () => setEditSolicitacaoImagePreview(reader.result as string)
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditSolicitacaoDialog(false)
                setEditSolicitacaoImageFile(null)
                setEditSolicitacaoImagePreview(null)
              }}>Cancelar</Button>
              <Button
                disabled={saving || !editingSolicitacaoId}
                onClick={async () => {
                  if (!editingSolicitacaoId) return
                  setSaving(true)
                  try {
                    let imageUrl: string | null | undefined = undefined
                    if (editSolicitacaoImageFile) {
                      const uploadRes = await uploadFileToBackend(editSolicitacaoImageFile, "store")
                      imageUrl = uploadRes.data.key
                    } else if (editSolicitacaoImagePreview === null) {
                      imageUrl = null // imagem removida
                    }
                    const { updateRewardRequest } = await import('@/lib/store-api')
                    await updateRewardRequest(editingSolicitacaoId, {
                      name: solicitacaoForm.nome,
                      description: solicitacaoForm.descricao,
                      category: solicitacaoForm.categoria,
                      estimatedStarCost: solicitacaoForm.custoEstimado,
                      justification: solicitacaoForm.justificativa,
                      ...(imageUrl !== undefined ? { imageUrl } : {}),
                    })
                    toast({ title: "Solicitação Re-enviada", description: "O status voltou para pendente." })
                    setShowEditSolicitacaoDialog(false)
                    setEditSolicitacaoImageFile(null)
                    setEditSolicitacaoImagePreview(null)
                    await loadData()
                  } catch (err) {
                    toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? "Salvando..." : "Salvar e Re-solicitar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
        <p className="text-muted-foreground">Você não tem permissão para acessar a Lojinha.</p>
      </CardContent>
    </Card>
  )
}

// Humor Do Dia Panel
function HumorDoDiaPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [config, setConfig] = useState<HumorConfig>(HumorConfigService.getConfig())
  const [options, setOptions] = useState<HumorOption[]>(HumorConfigService.getOptions())
  const [schedule, setSchedule] = useState<HumorSchedule[]>(HumorConfigService.getSchedule())
  const [editingOption, setEditingOption] = useState<HumorOption | null>(null)
  const [showNewOptionDialog, setShowNewOptionDialog] = useState(false)
  const [specificDaysEnabled, setSpecificDaysEnabled] = useState(false)
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [newOptionForm, setNewOptionForm] = useState({
    nome: "",
    emoji: "",
    cor: "#3b82f6",
  })

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"
  const stats = HumorConfigService.getConfigStats()

  const loadData = () => {
    setConfig(HumorConfigService.getConfig())
    setOptions(HumorConfigService.getOptions())
    setSchedule(HumorConfigService.getSchedule())
  }

  const handleSaveConfig = () => {
    const validation = HumorConfigService.validateConfig(config)

    if (!validation.valid) {
      toast({
        title: "Erro de validação",
        description: validation.errors.join(", "),
        variant: "destructive",
      })
      return
    }

    HumorConfigService.saveConfig({
      ...config,
      updatedBy: user?.id || "unknown",
    })

    toast({
      title: "Configuração salva",
      description: "As configurações do Humor do Dia foram atualizadas com sucesso",
    })

    loadData()
  }

  const handleToggleOption = (optionId: string, ativo: boolean) => {
    HumorConfigService.updateOption(optionId, { ativo })
    loadData()

    toast({
      title: ativo ? "Humor ativado" : "Humor desativado",
      description: `A opção foi ${ativo ? "ativada" : "desativada"} com sucesso`,
    })
  }

  const handleCreateOption = () => {
    if (!newOptionForm.nome || !newOptionForm.emoji) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e emoji",
        variant: "destructive",
      })
      return
    }

    const maxOrdem = Math.max(...options.map((o) => o.ordem), 0)

    HumorConfigService.createOption({
      nome: newOptionForm.nome,
      emoji: newOptionForm.emoji,
      cor: newOptionForm.cor,
      ordem: maxOrdem + 1,
      ativo: true,
    })

    setShowNewOptionDialog(false)
    setNewOptionForm({ nome: "", emoji: "", cor: "#3b82f6" })
    loadData()

    toast({
      title: "Humor criado",
      description: "Nova opção de humor criada com sucesso",
    })
  }

  const handleUpdateOption = (optionId: string, updates: Partial<HumorOption>) => {
    HumorConfigService.updateOption(optionId, updates)
    loadData()

    toast({
      title: "Humor atualizado",
      description: "A opção foi atualizada com sucesso",
    })
  }

  const handleDeleteOption = (optionId: string) => {
    if (options.filter((o) => o.ativo).length <= 1) {
      toast({
        title: "Não é possível excluir",
        description: "Deve haver pelo menos uma opção de humor ativa",
        variant: "destructive",
      })
      return
    }

    HumorConfigService.deleteOption(optionId)
    loadData()

    toast({
      title: "Humor excluído",
      description: "A opção foi excluída com sucesso",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configurações de Humor do Dia</h2>
          <p className="mt-1 text-muted-foreground">Gerencie as configurações e opções do módulo de Humor do seu time</p>
        </div>
      </div>

      {/* Visão Geral */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>

          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={stats.ativo ? "default" : "secondary"}>{stats.ativo ? "Ativo" : "Inativo"}</Badge>
              {stats.obrigatorio && <Badge variant="outline">Obrigatório</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Exibição</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.proximaExibicao ? new Date(stats.proximaExibicao).toLocaleDateString("pt-BR") : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.proximaExibicao
                ? new Date(stats.proximaExibicao).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : "Sem próxima exibição"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frequência</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.frequencia}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.diasAtivosProximos30} dias ativos (próximos 30)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opções de Humor</CardTitle>

          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeOptions}/{stats.totalOptions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ativas / Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>Gerencie as regras de exibição do Humor do Dia para {isSuperAdmin ? "toda a plataforma" : "seu time"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* TASK 3 - Ativar/Desativar */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Humor do Dia Ativo</label>
              <p className="text-xs text-muted-foreground">{isSuperAdmin ? "Ativar/desativar globalmente" : "Ativar/desativar para seu time"}</p>
            </div>
            <Button
              variant={config.ativo ? "default" : "outline"}
              size="sm"
              onClick={() => setConfig({ ...config, ativo: !config.ativo })}
            >
              {config.ativo ? <Power className="h-4 w-4 mr-2" /> : <PowerOff className="h-4 w-4 mr-2" />}
              {config.ativo ? "Ativo" : "Inativo"}
            </Button>
          </div>

          {config.ativo && (
            <div className="border-t pt-4 space-y-4">
              {/* TASK 4 - Obrigatoriedade */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Obrigatoriedade</label>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="obrigatorio"
                    checked={config.obrigatorio}
                    onChange={(e) => {
                      const obrigatorio = e.target.checked
                      setConfig({
                        ...config,
                        obrigatorio,
                        bloquearAcesso: obrigatorio,
                        permitePular: !obrigatorio
                      })
                    }}
                    className="h-4 w-4"
                  />
                  <label htmlFor="obrigatorio" className="text-sm cursor-pointer flex-1">
                    <div className="font-medium">Ativar obrigatoriedade</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {config.obrigatorio
                        ? "O colaborador não poderá pular ou fechar. O acesso à plataforma fica bloqueado até o registro."
                        : "O colaborador pode pular ou fechar o modal normalmente."
                      }
                    </div>
                  </label>
                </div>
              </div>

              {/* TASK 5 - Frequência */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Frequência</label>

                {/* Card informativo fixo */}
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm text-blue-900">
                    Por padrão, o Humor do Dia é solicitado diariamente no primeiro login do usuário.
                  </p>
                </div>

                {/* Opção de dias específicos */}
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="specificDays"
                    checked={specificDaysEnabled}
                    onChange={(e) => setSpecificDaysEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="specificDays" className="text-sm cursor-pointer flex-1">
                    <div className="font-medium">Definir dias específicos</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ativar para selecionar datas específicas no calendário anual
                    </div>
                  </label>
                </div>

                {/* Calendário anual interativo - aparece quando ativado */}
                {specificDaysEnabled && (
                  <div className="ml-6 p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Selecione os dias no calendário</label>
                      <Badge>{selectedDates.length} dias selecionados</Badge>
                    </div>

                    <div className="rounded-lg border border-border bg-white p-4">
                      <p className="text-xs text-muted-foreground mb-3">Clique nos dias para selecionar/desselecionar</p>

                      {/* Calendário simplificado para próximos 90 dias */}
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 90 }, (_, i) => {
                          const date = new Date()
                          date.setDate(date.getDate() + i)
                          const dateStr = date.toISOString().split('T')[0]
                          const isSelected = selectedDates.includes(dateStr)

                          return (
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedDates(selectedDates.filter(d => d !== dateStr))
                                } else {
                                  setSelectedDates([...selectedDates, dateStr])
                                }
                              }}
                              className={`p-2 text-xs rounded border transition-colors ${isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-border"
                                }`}
                            >
                              <div className="font-medium">{date.getDate()}</div>
                              <div className="text-xs opacity-70">{date.toLocaleDateString('pt-BR', { month: 'short' })}</div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {selectedDates.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDates([])}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Limpar seleção
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button onClick={handleSaveConfig}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TASK 7 - Classificações de Humor (Apenas SuperAdmin) */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Classificações de Humor</CardTitle>
                <CardDescription>Criar, editar, ativar, inativar e excluir classificações de humor (exclusivo SuperAdmin)</CardDescription>
              </div>
              <Button onClick={() => setShowNewOptionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Classificação
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {options
                .sort((a, b) => a.ordem - b.ordem)
                .map((option) => (
                  <div key={option.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div>
                        <div className="font-medium">{option.nome}</div>
                        <div className="text-xs text-muted-foreground">Ordem: {option.ordem}</div>
                      </div>
                      <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: option.cor }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={option.ativo ? "default" : "secondary"}>{option.ativo ? "Ativo" : "Inativo"}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleOption(option.id, !option.ativo)}
                      >
                        {option.ativo ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TASK 8 - Ganhos do Humor do Dia */}
      {isSuperAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Ganhos do Humor do Dia</CardTitle>
            <CardDescription>Defina os valores de XP e Estrelas por registro de humor (exclusivo SuperAdmin)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
              <input
                type="checkbox"
                id="rewardsEnabled"
                checked={config.rewardsEnabled}
                onChange={(e) => setConfig({ ...config, rewardsEnabled: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="rewardsEnabled" className="text-sm font-medium cursor-pointer">
                Habilitar ganhos no Humor do Dia
              </label>
            </div>

            {config.rewardsEnabled && (
              <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">XP por registro</label>
                    <input
                      type="number"
                      min="0"
                      value={config.rewardsXp}
                      onChange={(e) => setConfig({ ...config, rewardsXp: Math.max(0, Number.parseInt(e.target.value) || 0) })}
                      placeholder="Ex: 5 XP"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estrelas por registro</label>
                    <input
                      type="number"
                      min="0"
                      value={config.rewardsStars}
                      onChange={(e) => setConfig({ ...config, rewardsStars: Math.max(0, Number.parseInt(e.target.value) || 0) })}
                      placeholder="Ex: 1 estrela"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                  <p className="text-sm text-amber-900">
                    Recomendação: Use valores baixos e consistentes (1-10 XP e 0-1 estrela) para reforçar o hábito sem tornar o ganho o principal motivador.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ganhos no Humor do Dia</CardTitle>
            <CardDescription>Visualize os ganhos configurados pelo SuperAdmin (somente leitura)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
              <input
                type="checkbox"
                id="gestorRewardsToggle"
                checked={config.rewardsEnabled}
                onChange={(e) => setConfig({ ...config, rewardsEnabled: e.target.checked })}
                className="h-4 w-4"
              />
              <label htmlFor="gestorRewardsToggle" className="text-sm font-medium cursor-pointer">
                Ativar ganhos no Humor do Dia para meu time
              </label>
            </div>

            {config.rewardsEnabled && (
              <div className="space-y-3 p-4 rounded-lg border border-muted bg-muted/30">
                <p className="text-sm text-muted-foreground mb-3">Valores definidos pelo SuperAdmin (não editável):</p>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 rounded-lg bg-white border border-border">
                    <div className="text-xs text-muted-foreground">XP por registro</div>
                    <div className="text-2xl font-bold text-primary mt-1">{config.rewardsXp} XP</div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-border">
                    <div className="text-xs text-muted-foreground">Estrelas por registro</div>
                    <div className="text-2xl font-bold text-primary mt-1">{config.rewardsStars} ⭐</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TASK 10 - Cronograma (Apenas para Gestor) */}
      {isGestor && (
        <Card>
          <CardHeader>
            <CardTitle>Cronograma (Próximos 30 dias)</CardTitle>
            <CardDescription>Visualize quando o Humor do Dia estará ativo para seu time{specificDaysEnabled && selectedDates.length > 0 ? " (baseado nos dias específicos selecionados)" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 grid-cols-7">
              {schedule.slice(0, 30).map((day) => {
                const date = new Date(day.data)
                const dateStr = date.toISOString().split('T')[0]
                const isActive = specificDaysEnabled ? selectedDates.includes(dateStr) : day.ativo

                return (
                  <div
                    key={day.id}
                    className={`p-2 border rounded text-center transition-colors ${isActive ? "bg-primary/10 border-primary" : "bg-muted border-muted"
                      }`}
                  >
                    <div className="text-xs font-medium">{date.toLocaleDateString("pt-BR", { weekday: "short" })}</div>
                    <div className="text-sm font-semibold">{date.getDate()}</div>
                    <div className="text-xs text-muted-foreground">{date.toLocaleDateString("pt-BR", { month: "short" })}</div>
                    {isActive && <Check className="h-3 w-3 mx-auto mt-1 text-primary" />}
                  </div>
                )
              })}
            </div>

            {specificDaysEnabled && selectedDates.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">
                  O Humor do Dia será exibido apenas nos <strong>{selectedDates.filter(d => {
                    const date = new Date(d)
                    return date >= new Date() && date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  }).length} dias selecionados</strong> visíveis acima.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Nova Opção */}
      <Dialog open={showNewOptionDialog} onOpenChange={setShowNewOptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Opção de Humor</DialogTitle>
            <DialogDescription>Crie uma nova opção de humor para os colaboradores</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Nome</label>
              <input
                type="text"
                value={newOptionForm.nome}
                onChange={(e) => setNewOptionForm({ ...newOptionForm, nome: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1"
                placeholder="Ex: Motivado"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Emoji</label>
              <input
                type="text"
                value={newOptionForm.emoji}
                onChange={(e) => setNewOptionForm({ ...newOptionForm, emoji: e.target.value })}
                className="w-full px-3 py-2 border rounded-md mt-1"
                placeholder="Ex: 😊"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cor</label>
              <input
                type="color"
                value={newOptionForm.cor}
                onChange={(e) => setNewOptionForm({ ...newOptionForm, cor: e.target.value })}
                className="w-full h-10 border rounded-md mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewOptionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOption}>
              <Plus className="h-4 w-4 mr-2" />
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SuasCriacoesPanel() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<CreationType | "todos">("todos")
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"ultimas" | CreationType>("ultimas")
  const [allCreations, setAllCreations] = useState<Creation[]>([])
  const [isLoadingCreations, setIsLoadingCreations] = useState(false)

  const loadCreations = async () => {
    if (!user) return
    try {
      setIsLoadingCreations(true)
      const base = SuasCriacoesService.getBaseCreations(user.id)
      const trainingsRes = await listTrainings({ creatorId: user.id, limit: 200 })
      const trainings = (trainingsRes.data || []).map((t) => ({
        id: t.id,
        tipo: "treinamento" as const,
        titulo: t.title,
        status: "Ativo",
        dataUltimaEdicao: t.createdAt || new Date().toISOString(),
        criadoPor: user.id,
        data: t,
      }))
      const merged = [...base, ...trainings].sort((a, b) => {
        return new Date(b.dataUltimaEdicao).getTime() - new Date(a.dataUltimaEdicao).getTime()
      })
      setAllCreations(merged)
    } catch (error: any) {
      toast({
        title: "Falha ao carregar criações",
        description: error?.message || "Não foi possível buscar as criações.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingCreations(false)
    }
  }

  useEffect(() => {
    if (!user) return
    loadCreations()
  }, [user, toast])

  // Filtrar criações baseado na aba ativa
  const filteredCreations = useMemo(() => {
    if (!allCreations) return []

    let creations = allCreations

    // Filtrar por aba
    if (activeTab !== "ultimas") {
      creations = creations.filter((c) => c.tipo === activeTab)
    }

    // Filtrar por tipo (para aba "Últimas Criações")
    if (activeTab === "ultimas" && filterType !== "todos") {
      creations = creations.filter((c) => c.tipo === filterType)
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      creations = creations.filter((c) =>
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return creations
  }, [allCreations, activeTab, filterType, searchTerm])

  const handleView = async (creation: Creation) => {
    if (creation.tipo !== "treinamento") {
      setSelectedCreation(creation)
      setIsViewDialogOpen(true)
      return
    }

    try {
      const res = await getTraining(creation.id)
      setSelectedCreation({ ...creation, data: res.data })
      setIsViewDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Falha ao carregar treinamento",
        description: error?.message || "Não foi possível carregar os detalhes do treinamento.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (creation: Creation) => {
    if (creation.tipo !== "treinamento") return
    try {
      await deleteTraining(creation.id)
      toast({
        title: "Treinamento excluído",
        description: "O treinamento foi removido com sucesso.",
      })
      setIsViewDialogOpen(false)
      setSelectedCreation(null)
      await loadCreations()
    } catch (error: any) {
      toast({
        title: "Falha ao excluir",
        description: error?.message || "Não foi possível excluir o treinamento.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (creation: Creation) => {
    const editUrl = SuasCriacoesService.getEditUrl(creation.tipo, creation.id)
    router.push(editUrl)
  }

  const getTypeIcon = (tipo: CreationType) => {
    const icons = {
      campanha: Target,
      pesquisa: ClipboardList,
      treinamento: GraduationCap,
      meta: Trophy,
      "missao-do-dia": Zap,
      evento: CalendarDays,
    }
    return icons[tipo] || FolderOpen
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("ativo") || statusLower === "publicada") return "default"
    if (statusLower === "rascunho") return "secondary"
    if (statusLower.includes("conclu") || statusLower === "finalizada") return "outline"
    return "secondary"
  }

  return (
    <>
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
        <h2 className="text-2xl font-bold text-foreground">Suas Criações</h2>
        <p className="mt-2 text-muted-foreground">
          Visualize, navegue e edite todas as suas criações em um só lugar
        </p>
      </div>

      {/* Filters */}
      <Card className="clay-card border-0">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {activeTab === "ultimas" && (
              <div className="w-full md:w-64">
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as CreationType | "todos")}
                >
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    <SelectItem value="campanha">Campanhas</SelectItem>
                    {/*
                    <SelectItem value="pesquisa">Pesquisas</SelectItem>
                    */}
                    <SelectItem value="treinamento">Treinamentos</SelectItem>
                    <SelectItem value="meta">Metas</SelectItem>
                    <SelectItem value="evento">Eventos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="clay-card border-0 grid grid-cols-7 w-full">
          <TabsTrigger value="ultimas" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Últimas
          </TabsTrigger>
          <TabsTrigger value="campanha" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="pesquisa" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Pesquisas
          </TabsTrigger>
          <TabsTrigger value="treinamento" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Treinamentos
          </TabsTrigger>
          <TabsTrigger value="meta" className="flex items-center gap-2 opacity-60 cursor-not-allowed pointer-events-none" disabled>
            <Trophy className="h-4 w-4" />
            Metas
            <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Em breve
            </span>
          </TabsTrigger>
          <TabsTrigger value="evento" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Eventos
          </TabsTrigger>
        </TabsList>

        {/* Content for all tabs */}
        {(["ultimas", "campanha", "pesquisa", "treinamento", "meta", "evento"] as const).map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {isLoadingCreations ? (
              <Card className="clay-card border-0">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Carregando criações...</p>
                </CardContent>
              </Card>
            ) : filteredCreations.length === 0 ? (
              <Card className="clay-card border-0">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "Nenhuma criação encontrada com esse termo de busca"
                      : "Nenhuma criação encontrada"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCreations.map((creation) => {
                  const Icon = getTypeIcon(creation.tipo)
                  return (
                    <Card key={creation.id} className="clay-card border-0 hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base line-clamp-1">
                                {creation.titulo}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                {SuasCriacoesService.translateType(creation.tipo)}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusColor(creation.status)}>
                            {creation.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(creation.dataUltimaEdicao).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleView(creation)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(creation)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedCreation && (
                <>
                  {(() => {
                    const Icon = getTypeIcon(selectedCreation.tipo)
                    return <Icon className="h-6 w-6 text-primary" />
                  })()}
                  {selectedCreation.titulo}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedCreation &&
                `${SuasCriacoesService.translateType(selectedCreation.tipo)} - Modo de visualização`}
            </DialogDescription>
          </DialogHeader>

          {selectedCreation && (
            <div className="space-y-6">
              {/* Status and Date */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(selectedCreation.status)} className="mt-1">
                    {selectedCreation.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Última edição</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedCreation.dataUltimaEdicao).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>

              {/* Data Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalhes</h3>
                <div className="rounded-lg border p-4 bg-card">
                  <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
                    {JSON.stringify(selectedCreation.data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Fechar
                </Button>
                {selectedCreation.tipo === "treinamento" && (
                  <Button variant="outline" onClick={() => handleDelete(selectedCreation)}>
                    Excluir
                  </Button>
                )}
                <Button onClick={() => handleEdit(selectedCreation)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function AdminPageContent() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("lojinha")

  const isSuperAdmin = user?.role === "super-admin"
  const isGestor = user?.role === "gestor"


  // Engagement & General Analytics State
  const [selectedCollaborator, setSelectedCollaborator] = useState<ColaboradorDetalhado | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showActiveCollaborators, setShowActiveCollaborators] = useState(false)
  const [selectedFeedUser, setSelectedFeedUser] = useState<FeedUserActivity | null>(null)
  const [showFeedDetailsModal, setShowFeedDetailsModal] = useState(false)
  const [showCollaboratorDetail, setShowCollaboratorDetail] = useState(false) // Added for collaborator detail modal

  // Humor Analytics State
  const [selectedHumorUser, setSelectedHumorUser] = useState<HumorUserAnalytics | null>(null)
  const [showHumorDetailsModal, setShowHumorDetailsModal] = useState(false)
  const [humorFilterTime, setHumorFilterTime] = useState<string>("todos")
  const [humorFilterPeriod, setHumorFilterPeriod] = useState<string>("30")

  // Survey Analytics State
  const [surveyMetrics, setSurveyMetrics] = useState<ReturnType<
    typeof SurveyAnalyticsService.getGeneralAnalytics
  > | null>(null)
  const [surveyUsuarios, setSurveyUsuarios] = useState<SurveyUserAnalytics[]>([])
  const [selectedSurveyUser, setSelectedSurveyUser] = useState<SurveyUserAnalytics | null>(null)
  const [surveyFilterTime, setSurveyFilterTime] = useState<string>("todos")
  const [surveyFilterPeriodo, setSurveyFilterPeriodo] = useState<string>("30")
  const [sortSurveyColumn, setSortSurveyColumn] = useState<keyof SurveyUserAnalytics>("taxaParticipacao")
  const [sortSurveyDirection, setSortSurveyDirection] = useState<"asc" | "desc">("desc")

  // Training Analytics State
  const [filtroTimeSuperAdmin, setFiltroTimeSuperAdmin] = useState<string>("todos")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [sortByEngajamento, setSortByEngajamento] = useState<"taxaEngajamento" | "frequenciaParticipacao">(
    "taxaEngajamento",
  )

  // Mock users for humor analytics
  const mockUsers = [
    { id: "1", nome: "Alice Smith", departamento: "Marketing", time: "Time Criativo" },
    { id: "2", nome: "Bob Johnson", departamento: "Tecnologia", time: "Time Tech" },
    { id: "3", nome: "Charlie Brown", departamento: "Vendas", time: "Time Vendas" },
    { id: "4", nome: "Diana Prince", departamento: "RH", time: "Time RH" },
    { id: "5", nome: "Ethan Hunt", departamento: "Marketing", time: "Time Criativo" },
    { id: "6", nome: "Fiona Glenanne", departamento: "Tecnologia", time: "Time Tech" },
    { id: "7", nome: "George Costanza", departamento: "Vendas", time: "Time Vendas" },
    { id: "8", nome: "Hannah Montana", departamento: "RH", time: "Time RH" },
    { id: "9", nome: "Ian Malcolm", departamento: "Tecnologia", time: "Time Tech" },
    { id: "10", nome: "Jane Doe", departamento: "Marketing", time: "Time Criativo" },
    { id: "11", nome: "Kyle Reese", departamento: "Vendas", time: "Time Vendas" },
    { id: "12", nome: "Lara Croft", departamento: "RH", time: "Time RH" },
  ]

  // useEffect for Survey Analytics
  useEffect(() => {
    if (!user) return
    try {
      const metrics = SurveyAnalyticsService.getGeneralAnalytics()
      setSurveyMetrics(metrics)

      let usuarios: SurveyUserAnalytics[] = []
      if (hasPermission("super-admin")) {
        usuarios = Object.values(metrics.usuariosPorTime).flat()
      } else if (hasPermission("gestor") && user.departamento) {
        usuarios = metrics.usuariosPorTime[user.departamento] || []
      }
      setSurveyUsuarios(usuarios)
    } catch (error) {
      console.error("[v0] Erro ao carregar dados de pesquisas:", error)
    }
  }, [user, hasPermission, surveyFilterTime, surveyFilterPeriodo])

  const sortedSurveyUsuarios = React.useMemo(() => {
    if (!surveyUsuarios || surveyUsuarios.length === 0) return []
    const sorted = [...surveyUsuarios].sort((a, b) => {
      const aVal = a[sortSurveyColumn]
      const bVal = b[sortSurveyColumn]
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortSurveyDirection === "asc" ? aVal - bVal : bVal - aVal
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortSurveyDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return 0
    })
    return sorted
  }, [surveyUsuarios, sortSurveyColumn, sortSurveyDirection])

  const toggleSurveySortColumn = (column: keyof SurveyUserAnalytics) => {
    if (sortSurveyColumn === column) {
      setSortSurveyDirection(sortSurveyDirection === "asc" ? "desc" : "asc")
    } else {
      setSortSurveyColumn(column)
      setSortSurveyDirection("desc")
    }
  }

  // Engagement & General Analytics Data
  const todosColaboradores = React.useMemo((): ColaboradorDetalhado[] => {
    try {
      const engagementData = AnalyticsService.getAllCollaboratorsEngagement()
      const humorData = HumorAnalyticsService.getUserAnalytics()
      return engagementData.map((collab) => {
        const humor = humorData.find((h) => h.userId === collab.userId)
        let statusAtividade: "ativo" | "inativo" | "ausente" = "ativo"
        if (collab.acessosSemana === 0) statusAtividade = "ausente"
        else if (collab.acessosSemana < 3) statusAtividade = "inativo"
        return {
          ...collab,
          humorMedio: humor?.humorMedio || 3.5,
          statusAtividade,
        }
      })
    } catch (error) {
      console.error("[v0] Erro ao carregar colaboradores:", error)
      return []
    }
  }, [])

  const colaboradoresFiltrados = React.useMemo(() => {
    let filtered = [...todosColaboradores]
    if (isGestor && user?.departamento) {
      filtered = filtered.filter((c) => c.time === user.departamento)
    }
    if (isSuperAdmin) {
      if (filtroTimeSuperAdmin !== "todos") {
        filtered = filtered.filter((c) => c.time === filtroTimeSuperAdmin)
      }
      if (filtroDepartamento !== "todos") {
        filtered = filtered.filter((c) => c.departamento === filtroDepartamento)
      }
    }
    return filtered
  }, [todosColaboradores, isSuperAdmin, isGestor, user, filtroTimeSuperAdmin, filtroDepartamento])

  const metricas = React.useMemo(() => {
    if (!colaboradoresFiltrados || colaboradoresFiltrados.length === 0) {
      return {
        colaboradoresAtivos: 0,
        taxaEngajamento: 0,
        taxaParticipacao: 0,
        humorMedio: 0,
        alertasAtivos: 0,
      }
    }
    const ativos = colaboradoresFiltrados.filter((c) => c.statusAtividade === "ativo").length
    const engajamentoMedio =
      colaboradoresFiltrados.reduce((acc, c) => acc + c.taxaEngajamento, 0) / colaboradoresFiltrados.length
    const participacaoMedia =
      colaboradoresFiltrados.reduce((acc, c) => acc + c.frequenciaParticipacao, 0) / colaboradoresFiltrados.length
    const humorMedio = colaboradoresFiltrados.reduce((acc, c) => acc + c.humorMedio, 0) / colaboradoresFiltrados.length
    const alertas = colaboradoresFiltrados.filter((c) => c.taxaEngajamento < 50 || c.humorMedio < 3.0).length
    return {
      colaboradoresAtivos: ativos,
      taxaEngajamento: Math.round(engajamentoMedio),
      taxaParticipacao: Math.round(participacaoMedia),
      humorMedio: Math.round(humorMedio * 10) / 10,
      alertasAtivos: alertas,
    }
  }, [colaboradoresFiltrados])

  const evolucaoEngajamento = React.useMemo(() => {
    try {
      return AnalyticsService.getEvolucaoEngajamentoTemporal(30)
    } catch (error) {
      console.error("[v0] Erro ao carregar evolução:", error)
      return []
    }
  }, [])

  const engajamentoPorDepartamento = React.useMemo(() => {
    try {
      return AnalyticsService.getEngajamentoPorDepartamento()
    } catch (error) {
      console.error("[v0] Erro ao carregar departamentos:", error)
      return []
    }
  }, [])

  const timesDisponiveis = React.useMemo(
    () => Array.from(new Set(todosColaboradores.map((c) => c.time))),
    [todosColaboradores],
  )
  const departamentosDisponiveis = React.useMemo(
    () => Array.from(new Set(todosColaboradores.map((c) => c.departamento))),
    [todosColaboradores],
  )

  // Humor Analytics Data
  const humorUserIds = React.useMemo(() => {
    if (!user) return []
    if (user.role === "super-admin") {
      return humorFilterTime === "todos"
        ? mockUsers.map((u) => u.id)
        : mockUsers.filter((u) => u.departamento === humorFilterTime).map((u) => u.id)
    }
    return mockUsers.filter((u) => u.departamento === user.departamento).map((u) => u.id)
  }, [user, humorFilterTime])

  const humorMetrics = React.useMemo(() => HumorAnalyticsService.getMetrics(humorUserIds), [humorUserIds])
  const humorEvolution = React.useMemo(
    () => HumorAnalyticsService.getEvolution(humorUserIds, Number.parseInt(humorFilterPeriod)),
    [humorUserIds, humorFilterPeriod],
  )
  const humorDistribution = React.useMemo(() => HumorAnalyticsService.getDistribution(humorUserIds), [humorUserIds])
  const humorByTeam = React.useMemo(() => HumorAnalyticsService.getHumorByTeam(humorUserIds), [humorUserIds])
  const humorUserAnalytics = React.useMemo(() => HumorAnalyticsService.getUserAnalytics(humorUserIds), [humorUserIds])

  // Helper functions for icons and badges
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <ArrowUp className="h-4 w-4 text-green-500" />
    if (trend === "down") return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }
  const getStatusBadge = (status: "ativo" | "inativo" | "ausente") => {
    const variants = {
      ativo: { label: "Ativo", className: "bg-green-100 text-green-800" },
      inativo: { label: "Inativo", className: "bg-yellow-100 text-yellow-800" },
      ausente: { label: "Ausente", className: "bg-red-100 text-red-800" },
    }
    const config = variants[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }
  const getTendenciaBadge = (tendencia: "alta" | "estavel" | "queda") => {
    const variants = {
      alta: { label: "↑ Alta", className: "bg-green-100 text-green-800" },
      estavel: { label: "→ Estável", className: "bg-blue-100 text-blue-800" },
      queda: { label: "↓ Queda", className: "bg-red-100 text-red-800" },
    }
    const config = variants[tendencia]
    return <Badge className={config.className}>{config.label}</Badge>
  }
  const handleOpenDetails = (collab: ColaboradorDetalhado) => {
    setSelectedCollaborator(collab)
    setShowDetailModal(true)
  }
  const handleSortEngajamento = (criteria: "taxaEngajamento" | "frequenciaParticipacao") => {
    setSortByEngajamento(criteria)
  }

  // Effect to set active tab from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has("tab")) {
      setActiveTab(searchParams.get("tab")!)
    }
  }, [])

  useEffect(() => {
    const tab = localStorage.getItem("open-admin-tab")
    if (tab) {
      localStorage.removeItem("open-admin-tab")
      setActiveTab(tab)
      const trigger = document.getElementById(`radix-_r_0_-trigger-${tab}`)
      if (trigger) {
        trigger.click()
      }
    }
  }, [])

  // Mock data for recent creations
  const criacoesRecentes = [
    {
      id: "1",
      type: "engajamento",
      title: "Campanha de Boas Vindas",
      status: "Ativo",
      creator: "Admin",
      createdAt: new Date("2023-10-26T10:00:00Z"),
    },
    {
      id: "2",
      type: "pesquisa",
      title: "Pesquisa de Clima Q3",
      status: "Ativo",
      creator: "RH",
      createdAt: new Date("2023-10-25T14:30:00Z"),
    },
    {
      id: "3",
      type: "treinamento",
      title: "Treinamento de Segurança",
      status: "Obrigatório",
      creator: "Segurança",
      createdAt: new Date("2023-10-24T09:00:00Z"),
    },
    {
      id: "4",
      type: "engajamento",
      title: "Desafio de Produtividade",
      status: "Pausado",
      creator: "Gestor",
      createdAt: new Date("2023-10-23T11:00:00Z"),
    },
  ]

  return (
    <>
      <div className="container mx-auto max-w-7xl space-y-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Painel Administrativo
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {isSuperAdmin && "Gestão completa das funcionalidades da plataforma"}
              {!isSuperAdmin && "Gerencie as configurações das funcionalidades do seu time"}
            </p>
          </div>
          {isSuperAdmin && (
            <Link href="/gestao-organizacional">
              <Button className="clay-button" size="lg">
                <Users className="mr-2 h-5 w-5" />
                Gestão Organizacional
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="criacao" className="space-y-6">
          <TabsList className="clay-card border-0">
            <TabsTrigger value="criacao">
              <Plus className="h-4 w-4" />
              Central de Criações
            </TabsTrigger>
            <TabsTrigger value="suas-criacoes">
              <FolderOpen className="h-4 w-4" />
              Suas Criações
            </TabsTrigger>
            <TabsTrigger value="lojinha">
              <Gift className="h-4 w-4" />
              Lojinha
            </TabsTrigger>
            <TabsTrigger value="humor-dia">
              <Heart className="h-4 w-4" />
              Humor do Dia
            </TabsTrigger>
            <TabsTrigger value="feedbacks">
              <MessageSquare className="h-4 w-4" />
              Feedbacks
            </TabsTrigger>
            <TabsTrigger value="feed-social">
              <Users className="h-4 w-4" />
              Feed Social
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criacao" className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
              <h2 className="text-2xl font-bold text-foreground">Central de Criações</h2>
              <p className="mt-2 text-muted-foreground">
                Crie e gerencie todos os tipos de engajamento, pesquisas, treinamentos e campanhas da plataforma
              </p>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-bold text-foreground">Criar Novo Conteúdo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: "Criar Engajamento",
                    description: "Campanhas personalizadas",
                    icon: Target,
                    color: "bg-primary/10 border-primary",
                    href: "/gestor/criar-engajamento",
                  },
                  {
                    title: "Missão do Dia",
                    description: "Missões diárias ou sequenciais",
                    icon: Zap,
                    color: "bg-accent/10 border-accent",
                    href: "/gestor/criar-missao-do-dia",
                  },
                  {
                    title: "Criar Pesquisa",
                    description: "Pulse surveys e questionários",
                    icon: BarChart3,
                    color: "bg-chart-1/10 border-chart-1",
                    href: "/pesquisas/criar",
                  },
                  {
                    title: "Criar Treinamento",
                    description: "Cursos e trilhas de aprendizado",
                    icon: GraduationCap,
                    color: "bg-chart-3/10 border-chart-3",
                    href: "/gestor/criar-treinamento",
                  },
                  {
                    title: "Criar Evento",
                    description: "Eventos corporativos e webinars",
                    icon: CalendarIcon,
                    color: "bg-chart-1/10 border-chart-1",
                    href: "/gestor/criar-evento",
                  },
                  {
                    title: "Criar Meta",
                    description: "Metas de engajamento, desenvolvimento e liderança",
                    icon: Target,
                    color: "bg-green-500/10 border-green-500",
                    href: "/admin/criar-meta",
                    comingSoon: true,
                  },
                ].map((item) => (
                  <Card
                    key={item.title}
                    className={`clay-card border-2 relative ${item.color} transition-all ${item.comingSoon ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:scale-105 hover:shadow-lg"
                      }`}
                    onClick={() => {
                      if (!item.comingSoon) {
                        router.push(item.href)
                      }
                    }}
                  >
                    {item.comingSoon && (
                      <Badge className="absolute right-3 top-3 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Em breve
                      </Badge>
                    )}
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/80">
                          <item.icon className="h-8 w-8" />
                        </div>
                        <h4 className="font-bold text-foreground">{item.title}</h4>
                        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                        <Button className="mt-4 w-full clay-button" disabled={item.comingSoon}>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>

              <div className="grid grid-cols-1 gap-6">
                {[
                  {
                    title: "Criar Recompensa",
                    description: "Itens para lojinha de benefícios",
                    icon: Gift,
                    color: "bg-accent/10 border-accent",
                    href: "/admin?tab=lojinha",
                  },
                ].map((item) => (
                  null
                ))}
              </div>
            </div>

            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Tipos de Engajamento Disponíveis</CardTitle>
                <CardDescription>Escolha o tipo de engajamento mais adequado para sua estratégia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      title: "Missão Personalizada",
                      description: "Crie desafios e tarefas com recompensas customizadas",
                      icon: Target,
                    },
                    {
                      title: "Campanha de Check-in",
                      description: "Promova registro de humor e bem-estar emocional",
                      icon: Heart,
                    },
                    { title: "Desafio no Feed", description: "Estimule publicações e interação social", icon: Users },
                    {
                      title: "Campanha de Feedback",
                      description: "Incentive reconhecimento entre colaboradores",
                      icon: MessageSquare,
                    },
                  ].map((type) => (
                    <div
                      key={type.title}
                      className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:bg-muted/50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        <type.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{type.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>


          </TabsContent>

          <TabsContent value="suas-criacoes" className="space-y-4">
            <SuasCriacoesPanel />
          </TabsContent>

          <TabsContent value="lojinha" className="space-y-4">
            <LojinhaProfissionalPanel />
          </TabsContent>

          <TabsContent value="humor-dia" className="space-y-4">
            <HumorDoDiaPanel />
          </TabsContent>

          <TabsContent value="feedbacks" className="space-y-6">
            <FeedbackConfigPanel />
          </TabsContent>

          <TabsContent value="feed-social" className="space-y-4">
            <FeedSocialConfigPanel />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedCollaborator && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={selectedCollaborator.avatar || "/placeholder.svg"}
                        alt={selectedCollaborator.nome}
                      />
                      <AvatarFallback>
                        {selectedCollaborator.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl">{selectedCollaborator.nome}</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedCollaborator.departamento} • {selectedCollaborator.time}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowDetailModal(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.taxaEngajamento}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Taxa de Engajamento</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.frequenciaParticipacao}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Frequência Semanal</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.acessosSemana}</p>
                    <p className="text-xs text-muted-foreground mt-1">Acessos esta Semana</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Atividades na Plataforma</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Treinamentos Concluídos</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.treinamentosConcluidos}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Interações no Feed</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.interacoesFeed}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Pesquisas Respondidas</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.pesquisasRespondidas}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Eventos Participados</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.eventosParticipados}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status de Atividade</p>
                    {getStatusBadge(selectedCollaborator.statusAtividade)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tendência de Engajamento</p>
                    {getTendenciaBadge(selectedCollaborator.tendencia)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Humor Médio</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedCollaborator.humorMedio >= 4
                          ? "bg-green-50 text-green-700"
                          : selectedCollaborator.humorMedio >= 3
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                      }
                    >
                      {selectedCollaborator.humorMedio.toFixed(1)}/5.0
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showActiveCollaborators} onOpenChange={setShowActiveCollaborators}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Colaboradores Ativos ({metricas.colaboradoresAtivos})</DialogTitle>
            <p className="text-sm text-muted-foreground">Colaboradores com 3 ou mais acessos esta semana</p>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-center">Acessos Semana</TableHead>
                <TableHead>Última Interação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradoresFiltrados
                .filter((c) => c.statusAtividade === "ativo")
                .map((collab) => (
                  <TableRow key={collab.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={collab.avatar || "/placeholder.svg"} alt={collab.nome} />
                          <AvatarFallback>
                            {collab.nome
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium">{collab.nome}</p>
                      </div>
                    </TableCell>
                    <TableCell>{collab.time}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{collab.acessosSemana}</Badge>
                    </TableCell>
                    <TableCell>{collab.ultimaInteracao}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowActiveCollaborators(false)
                          handleOpenDetails(collab)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={showCollaboratorDetail} onOpenChange={setShowCollaboratorDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedCollaborator && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={selectedCollaborator.avatar || "/placeholder.svg"}
                        alt={selectedCollaborator.nome}
                      />
                      <AvatarFallback>
                        {selectedCollaborator.nome
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-2xl">{selectedCollaborator.nome}</DialogTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedCollaborator.departamento} • {selectedCollaborator.time}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowCollaboratorDetail(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.taxaEngajamento}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Taxa de Engajamento</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.frequenciaParticipacao}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Frequência Semanal</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary/10">
                    <p className="text-3xl font-bold text-primary">{selectedCollaborator.acessosSemana}</p>
                    <p className="text-xs text-muted-foreground mt-1">Acessos esta Semana</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Atividades na Plataforma</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Treinamentos Concluídos</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.treinamentosConcluidos}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Interações no Feed</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.interacoesFeed}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Pesquisas Respondidas</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.pesquisasRespondidas}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Eventos Participados</span>
                      </div>
                      <span className="text-lg font-bold">{selectedCollaborator.eventosParticipados}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status de Atividade</p>
                    {getStatusBadge(selectedCollaborator.statusAtividade)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tendência de Engajamento</p>
                    {getTendenciaBadge(selectedCollaborator.tendencia)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Humor Médio</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedCollaborator.humorMedio >= 4
                          ? "bg-green-50 text-green-700"
                          : selectedCollaborator.humorMedio >= 3
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                      }
                    >
                      {selectedCollaborator.humorMedio.toFixed(1)}/5.0
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={selectedSurveyUser !== null} onOpenChange={() => setSelectedSurveyUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedSurveyUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedSurveyUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedSurveyUser.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold">{selectedSurveyUser.nome}</div>
                    <div className="text-sm font-normal text-muted-foreground">{selectedSurveyUser.time}</div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-2xl font-bold">{selectedSurveyUser.pesquisasConcluidas}</div>
                    <div className="text-sm text-muted-foreground">Concluídas</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-2xl font-bold">{selectedSurveyUser.pesquisasPendentes}</div>
                    <div className="text-sm text-muted-foreground">Pendentes</div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <div className="text-2xl font-bold">{selectedSurveyUser.taxaParticipacao}%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Participação</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Obrigatórias Pendentes:</span>
                    <Badge variant={selectedSurveyUser.obrigatoriasPendentes > 0 ? "destructive" : "secondary"}>
                      {selectedSurveyUser.obrigatoriasPendentes}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Taxa de Conclusão:</span>
                    <span className="text-sm font-bold">{selectedSurveyUser.taxaConclusao}%</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Tempo Médio de Resposta:</span>
                    <span className="text-sm">{selectedSurveyUser.tempoMedioResposta} min</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-sm font-medium">Nível de Engajamento:</span>
                    <Badge
                      variant={
                        selectedSurveyUser.engajamento === "alto"
                          ? "default"
                          : selectedSurveyUser.engajamento === "medio"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {selectedSurveyUser.engajamento === "alto"
                        ? "Alto"
                        : selectedSurveyUser.engajamento === "medio"
                          ? "Médio"
                          : selectedSurveyUser.engajamento === "baixo"
                            ? "Baixo"
                            : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Última Interação:</span>
                    <span className="text-sm">{selectedSurveyUser.ultimaInteracao}</span>
                  </div>
                </div>

                {selectedSurveyUser.pesquisasDetalhes.respondidas.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold">Histórico de Respostas</h4>
                    <div className="space-y-2 rounded-lg border p-4">
                      {selectedSurveyUser.pesquisasDetalhes.respondidas.slice(0, 5).map((response) => {
                        const survey = SurveyService.getSurveyById(response.surveyId)
                        return (
                          <div
                            key={response.id}
                            className="flex items-center justify-between border-b pb-2 last:border-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{survey?.title || "Pesquisa"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(response.completedAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <Badge variant="outline">
                              +{survey?.reward.xp || 0} XP · ⭐ {survey?.reward.stars || 0}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {selectedSurveyUser.pesquisasDetalhes.pendentes.length > 0 && (
                  <div>
                    <h4 className="mb-3 font-semibold">Pesquisas Pendentes</h4>
                    <div className="space-y-2 rounded-lg border p-4">
                      {selectedSurveyUser.pesquisasDetalhes.pendentes.slice(0, 5).map((survey) => (
                        <div key={survey.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div className="flex-1">
                            <p className="font-medium">{survey.title}</p>
                            <p className="text-xs text-muted-foreground">{survey.description}</p>
                          </div>
                          <Badge variant={survey.isRequired ? "destructive" : "secondary"}>
                            {survey.isRequired ? "Obrigatória" : "Opcional"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function AdminPage() {
  const { user } = useAuth()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-lg text-muted-foreground">Carregando painel administrativo...</p>
          </div>
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  )
}
