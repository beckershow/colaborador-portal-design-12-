"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { SuasCriacoesService, type Creation, type CreationType } from "@/lib/suas-criacoes-service"
import { listTrainings, getTraining, deleteTraining } from "@/lib/trainings-api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  FolderOpen,
  Search,
  Filter,
  Eye,
  Edit,
  Calendar,
  Target,
  ClipboardList,
  GraduationCap,
  Trophy,
  Zap,
  CalendarDays,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function SuasCriacoesPage() {
  const router = useRouter()
  const { user, hasPermission } = useAuth()
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

  // Verificar permissões
  const canAccess = hasPermission(["gestor", "super-admin"])

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

  const handleEdit = (creation: Creation) => {
    const editUrl = SuasCriacoesService.getEditUrl(creation.tipo, creation.id)
    router.push(editUrl)
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

  if (!canAccess || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Suas Criações</h1>
              <p className="text-muted-foreground">
                Visualize, navegue e edite todas as suas criações
              </p>
            </div>
          </div>
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
                      <SelectItem value="missao-do-dia">Missões do Dia</SelectItem>
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
              Últimas Criações
            </TabsTrigger>
            <TabsTrigger value="campanha" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Campanhas
            </TabsTrigger>
            {/*
            <TabsTrigger value="pesquisa" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Pesquisas
            </TabsTrigger>
            */}
            <TabsTrigger value="treinamento" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Treinamentos
            </TabsTrigger>
            <TabsTrigger value="meta" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Metas
            </TabsTrigger>
            <TabsTrigger value="missao-do-dia" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Missões
            </TabsTrigger>
            <TabsTrigger value="evento" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Eventos
            </TabsTrigger>
          </TabsList>

          {/* Content for all tabs */}
          {(["ultimas", "campanha", /* "pesquisa", */ "treinamento", "meta", "missao-do-dia", "evento"] as const).map((tabValue) => (
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
                              {format(new Date(creation.dataUltimaEdicao), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
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
      </div>

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
                    {format(new Date(selectedCreation.dataUltimaEdicao), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {/* Data Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detalhes</h3>
                <div className="rounded-lg border p-4 bg-card">
                  <pre className="text-sm whitespace-pre-wrap overflow-auto">
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
    </div>
  )
}
