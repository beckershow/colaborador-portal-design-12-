"use client"

import { useEffect } from "react"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { GestoresManagementService } from "@/lib/gestores-management-service"
import {
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Download,
  Search,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Target,
  Award,
} from "lucide-react"
import { redirect } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ExportUtils, type ExportColumn } from "@/lib/export-utils"

export const dynamic = "force-dynamic"

export default function GestoresManagementPage() {
  const { user, hasPermission } = useAuth()
  const { toast } = useToast()
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<"excel" | "csv">("excel")
  const [exportando, setExportando] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativo" | "inativo">("todos")
  const [selectedGestorId, setSelectedGestorId] = useState<string | null>(null)
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false)

  const [overview, setOverview] = useState<any>(null)
  const [allGestores, setAllGestores] = useState<any[]>([])
  const [gestoresMaisAtivos, setGestoresMaisAtivos] = useState<any[]>([])
  const [gestoresComBaixoUso, setGestoresComBaixoUso] = useState<any[]>([])

  const filteredGestores = useMemo(() => {
    return allGestores.filter((gestor) => {
      const matchesSearch =
        searchQuery === "" ||
        gestor.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gestor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gestor.departamento.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "ativo" && gestor.status === "ativo") ||
        (statusFilter === "inativo" && gestor.status === "inativo")

      return matchesSearch && matchesStatus
    })
  }, [allGestores, searchQuery, statusFilter])

  const selectedGestor = useMemo(
    () => (selectedGestorId ? allGestores.find((g) => g.gestorId === selectedGestorId) : null),
    [selectedGestorId, allGestores],
  )

  const selectedGestorPermissions = useMemo(
    () => (selectedGestorId ? GestoresManagementService.getGestorPermissions(selectedGestorId) : null),
    [selectedGestorId],
  )

  const selectedGestorTeam = useMemo(
    () => (selectedGestorId ? GestoresManagementService.getGestorTeamMembers(selectedGestorId) : []),
    [selectedGestorId],
  )

  const selectedGestorTeamOverview = useMemo(
    () => (selectedGestorId ? GestoresManagementService.getGestorTeamOverview(selectedGestorId) : null),
    [selectedGestorId],
  )

  const selectedGestorHistory = useMemo(
    () => (selectedGestorId ? GestoresManagementService.getGestorActivityHistory(selectedGestorId, 30) : []),
    [selectedGestorId],
  )

  // Carregar dados apenas no cliente
  useEffect(() => {
    setOverview(GestoresManagementService.getGestoresMetricsOverview())
    setAllGestores(GestoresManagementService.getAllGestores())
    setGestoresMaisAtivos(GestoresManagementService.getGestoresMaisAtivos(5))
    setGestoresComBaixoUso(GestoresManagementService.getGestoresComBaixoUso(50))
  }, [])

  // Loading state
  if (!overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados dos gestores...</p>
        </div>
      </div>
    )
  }

  const handleExportAllData = async () => {
    try {
      setExportando(true)
      toast({
        title: "Iniciando exportação...",
        description: "Preparando dados completos de todos os gestores",
      })

      // Preparar dados completos
      const dadosCompletos = allGestores.flatMap((gestor) => {
        const team = GestoresManagementService.getGestorTeamMembers(gestor.gestorId)
        const overview = GestoresManagementService.getGestorTeamOverview(gestor.gestorId)

        return [
          // Dados do gestor
          {
            tipo: "Gestor",
            gestorNome: gestor.nome,
            gestorEmail: gestor.email,
            departamento: gestor.departamento,
            status: gestor.status,
            scoreGestao: gestor.scoreGestao,
            totalColaboradores: gestor.totalColaboradores,
            engajamentoMedioTime: gestor.engajamentoMedioTime,
            frequenciaUso: gestor.frequenciaUso,
            frequenciaLogin: gestor.frequenciaLogin,
            colaboradorNome: "-",
            colaboradorEmail: "-",
            colaboradorNivel: "-",
            colaboradorXP: "-",
            colaboradorEstrelas: "-",
          },
          // Dados de cada colaborador do time
          ...team.map((colab) => ({
            tipo: "Colaborador",
            gestorNome: gestor.nome,
            gestorEmail: gestor.email,
            departamento: gestor.departamento,
            status: gestor.status,
            scoreGestao: gestor.scoreGestao,
            totalColaboradores: gestor.totalColaboradores,
            engajamentoMedioTime: gestor.engajamentoMedioTime,
            frequenciaUso: gestor.frequenciaUso,
            frequenciaLogin: gestor.frequenciaLogin,
            colaboradorNome: colab.nome,
            colaboradorEmail: colab.email || "-",
            colaboradorNivel: colab.nivel || "-",
            colaboradorXP: colab.xp?.toString() || "-",
            colaboradorEstrelas: colab.estrelas?.toString() || "-",
          })),
        ]
      })

      const columns: ExportColumn[] = [
        { header: "Tipo", key: "tipo" },
        { header: "Gestor Nome", key: "gestorNome" },
        { header: "Gestor Email", key: "gestorEmail" },
        { header: "Departamento", key: "departamento" },
        { header: "Status", key: "status" },
        { header: "Score Gestão", key: "scoreGestao" },
        { header: "Total Colaboradores", key: "totalColaboradores" },
        { header: "Engajamento Médio Time (%)", key: "engajamentoMedioTime" },
        { header: "Frequência Uso (%)", key: "frequenciaUso" },
        { header: "Frequência Login (por semana)", key: "frequenciaLogin" },
        { header: "Colaborador Nome", key: "colaboradorNome" },
        { header: "Colaborador Email", key: "colaboradorEmail" },
        { header: "Colaborador Nível", key: "colaboradorNivel" },
        { header: "Colaborador XP", key: "colaboradorXP" },
        { header: "Colaborador Estrelas", key: "colaboradorEstrelas" },
      ]

      if (exportFormat === "excel") {
        await ExportUtils.exportToExcel(dadosCompletos, columns, "gestao-gestores-completo", "Gestores e Times")
        toast({
          title: "Exportação concluída!",
          description: "Arquivo Excel gerado com sucesso",
        })
      } else {
        ExportUtils.exportToCSV(dadosCompletos, columns, "gestao-gestores-completo")
        toast({
          title: "Exportação concluída!",
          description: "Arquivo CSV gerado com sucesso",
        })
      }

      setShowExportDialog(false)
    } catch (error) {
      console.error("Erro ao exportar:", error)
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Tente novamente ou use formato CSV",
        variant: "destructive",
      })
    } finally {
      setExportando(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission("super-admin")) {
    redirect("/")
  }

  const handleUpdatePermissions = (permissionKey: string, value: boolean) => {
    if (!selectedGestorPermissions) return

    const updatedPermissions = {
      ...selectedGestorPermissions,
      [permissionKey]: value,
    }

    GestoresManagementService.updateGestorPermissions(updatedPermissions)
  }

  const handleExportAudit = (gestorId: string) => {
    const csv = GestoresManagementService.exportGestorAudit(gestorId)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `auditoria-gestor-${gestorId}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <>
      <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                
                <h1 className="text-4xl font-bold text-foreground">Gestão de Gestores</h1>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  Super Admin
                </Badge>
              </div>
              <Button onClick={() => setShowExportDialog(true)} className="gap-2">
                <Download className="h-4 w-4" />
                Extrair Dados
              </Button>
            </div>
            <p className="mt-2 text-lg text-muted-foreground">
              Painel estratégico de governança, análise e controle de gestores da plataforma
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overview.totalGestores}</p>
                    <p className="text-sm text-muted-foreground">Total de Gestores</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-1/20">
                    <CheckCircle2 className="h-6 w-6 text-chart-1" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overview.gestoresAtivos}</p>
                    <p className="text-sm text-muted-foreground">Gestores Ativos</p>
                    <p className="text-xs text-muted-foreground">{overview.gestoresInativos} inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
                    <Activity className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overview.mediaUsoPlataforma}%</p>
                    <p className="text-sm text-muted-foreground">Média de Uso</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chart-3/20">
                    <Target className="h-6 w-6 text-chart-3" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{overview.mediaEngajamentoTimes}%</p>
                    <p className="text-sm text-muted-foreground">Engajamento Médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                  Top 5 Gestores Mais Ativos
                </CardTitle>
                <CardDescription>Gestores com maior frequência de uso da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gestoresMaisAtivos.map((gestor, index) => (
                    <div key={gestor.gestorId} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={gestor.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {gestor.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{gestor.nome}</p>
                        <p className="text-sm text-muted-foreground">{gestor.departamento}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{gestor.frequenciaUso}%</p>
                        <p className="text-xs text-muted-foreground">Uso</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-chart-3" />
                  Gestores com Baixo Uso
                </CardTitle>
                <CardDescription>Gestores que precisam de atenção (uso abaixo de 50%)</CardDescription>
              </CardHeader>
              <CardContent>
                {gestoresComBaixoUso.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-chart-1 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Excelente! Todos os gestores estão com uso adequado da plataforma.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gestoresComBaixoUso.map((gestor) => (
                      <div key={gestor.gestorId} className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={gestor.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {gestor.nome
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{gestor.nome}</p>
                          <p className="text-sm text-muted-foreground">{gestor.departamento}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-chart-3">{gestor.frequenciaUso}%</p>
                          <p className="text-xs text-muted-foreground">Uso</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Todos os Gestores</CardTitle>
                  <CardDescription>Visualize e gerencie todos os gestores da empresa</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar gestor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativo">Ativos</SelectItem>
                      <SelectItem value="inativo">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredGestores.map((gestor) => (
                  <div
                    key={gestor.gestorId}
                    className="rounded-lg border border-border bg-card p-6 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                      <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage src={gestor.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                          {gestor.nome
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-foreground">{gestor.nome}</h3>
                            <Badge variant={gestor.status === "ativo" ? "default" : "secondary"}>
                              {gestor.status === "ativo" ? "Ativo" : "Inativo"}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Award className="h-3 w-3" />
                              Score: {gestor.scoreGestao}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{gestor.departamento}</p>
                          <p className="text-xs text-muted-foreground">{gestor.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-lg font-bold text-primary">{gestor.totalColaboradores}</p>
                            <p className="text-xs text-muted-foreground">Colaboradores</p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-lg font-bold text-accent">{gestor.engajamentoMedioTime}%</p>
                            <p className="text-xs text-muted-foreground">Engajamento Time</p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-lg font-bold text-chart-1">{gestor.frequenciaUso}%</p>
                            <p className="text-xs text-muted-foreground">Frequência Uso</p>
                          </div>
                          <div className="rounded-lg bg-muted/30 p-3">
                            <p className="text-lg font-bold text-foreground">{gestor.frequenciaLogin}x/sem</p>
                            <p className="text-xs text-muted-foreground">Logins</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="clay-button bg-transparent"
                        onClick={() => {
                          setSelectedGestorId(gestor.gestorId)
                          setShowPermissionsDialog(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredGestores.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-lg font-medium text-foreground">Nenhum gestor encontrado</p>
                    <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou a busca</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedGestor && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedGestor.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {selectedGestor.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedGestor.nome}
                  <Badge variant={selectedGestor.status === "ativo" ? "default" : "secondary"}>
                    {selectedGestor.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </>
              )}
            </DialogTitle>
            <DialogDescription>Informações completas, permissões, métricas de uso e análise do time</DialogDescription>
          </DialogHeader>

          {selectedGestor && selectedGestorPermissions && (
            <Tabs defaultValue="perfil" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="perfil">Perfil</TabsTrigger>
                <TabsTrigger value="permissoes">Permissões</TabsTrigger>
                <TabsTrigger value="uso">Uso</TabsTrigger>
                <TabsTrigger value="time">Time</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-3xl font-bold text-foreground">{selectedGestor.scoreGestao}</p>
                        <p className="text-sm text-muted-foreground">Score de Gestão</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Users className="h-8 w-8 text-accent mx-auto mb-2" />
                        <p className="text-3xl font-bold text-foreground">{selectedGestor.totalColaboradores}</p>
                        <p className="text-sm text-muted-foreground">Colaboradores</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Target className="h-8 w-8 text-chart-1 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-foreground">{selectedGestor.engajamentoMedioTime}%</p>
                        <p className="text-sm text-muted-foreground">Engajamento Time</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium text-foreground">{selectedGestor.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Departamento</p>
                        <p className="font-medium text-foreground">{selectedGestor.departamento}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Última Atividade</p>
                        <p className="font-medium text-foreground">{selectedGestor.ultimaAtividade}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Frequência de Uso</p>
                        <p className="font-medium text-foreground">{selectedGestor.frequenciaUso}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Funcionalidades Mais Usadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedGestor.funcionalidadesMaisUsadas.map((func) => (
                        <div key={func.nome} className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{func.nome}</span>
                          <Badge variant="secondary">{func.usos} usos</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="permissoes" className="space-y-6">
                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Gerenciar Permissões</CardTitle>
                    <CardDescription>
                      Configure permissões específicas para este gestor. Alterações entram em vigor imediatamente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(selectedGestorPermissions)
                      .filter(([key]) => key !== "gestorId")
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <Label className="text-base font-medium">
                              {key === "criarTreinamentos" && "Criar Treinamentos"}
                              {key === "criarPesquisas" && "Criar Pesquisas"}
                              {key === "criarTrilhas" && "Criar Trilhas"}
                              {key === "configurarRecompensas" && "Configurar Recompensas"}
                              {key === "acessarAnalyticsAvancado" && "Acessar Analytics Avançado"}
                              {key === "gerenciarFeedbacks" && "Gerenciar Feedbacks"}
                              {key === "criarEventos" && "Criar Eventos"}
                              {key === "moderarConteudo" && "Moderar Conteúdo"}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {key === "criarTreinamentos" && "Permite criar e editar treinamentos"}
                              {key === "criarPesquisas" && "Permite criar e gerenciar pesquisas"}
                              {key === "criarTrilhas" && "Permite criar trilhas de desenvolvimento"}
                              {key === "configurarRecompensas" && "Permite gerenciar lojinha e recompensas"}
                              {key === "acessarAnalyticsAvancado" && "Acesso completo a métricas avançadas"}
                              {key === "gerenciarFeedbacks" && "Permite responder e moderar feedbacks"}
                              {key === "criarEventos" && "Permite criar eventos para o time"}
                              {key === "moderarConteudo" && "Permite moderar postagens do feed"}
                            </p>
                          </div>
                          <Switch
                            checked={value as boolean}
                            onCheckedChange={(checked) => handleUpdatePermissions(key, checked)}
                          />
                        </div>
                      ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="uso" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-3xl font-bold text-foreground">{selectedGestor.frequenciaLogin}</p>
                        <p className="text-sm text-muted-foreground">Logins por Semana</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
                        <p className="text-3xl font-bold text-foreground">{selectedGestor.tempoMedioUso}</p>
                        <p className="text-sm text-muted-foreground">Minutos por Dia</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="clay-card border-0">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <BarChart3 className="h-8 w-8 text-chart-1 mx-auto mb-2" />
                        <p className="text-3xl font-bold text-foreground">{selectedGestor.frequenciaAnaliseMetricas}</p>
                        <p className="text-sm text-muted-foreground">Análises por Semana</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Frequência de Uso Detalhada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">Frequência Geral de Uso</span>
                          <span className="font-bold text-primary">{selectedGestor.frequenciaUso}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${selectedGestor.frequenciaUso}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">Análise de Métricas</span>
                          <span className="font-bold text-accent">
                            {selectedGestor.frequenciaAnaliseMetricas}x/semana
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{ width: `${(selectedGestor.frequenciaAnaliseMetricas / 7) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-foreground">Criação de Conteúdos</span>
                          <span className="font-bold text-chart-1">
                            {selectedGestor.frequenciaCriacaoConteudos}x/semana
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-chart-1 rounded-full transition-all"
                            style={{ width: `${(selectedGestor.frequenciaCriacaoConteudos / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="time" className="space-y-6">
                {selectedGestorTeamOverview && (
                  <div className="grid gap-6 md:grid-cols-4">
                    <Card className="clay-card border-0">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="text-3xl font-bold text-foreground">
                            {selectedGestorTeamOverview.totalColaboradores}
                          </p>
                          <p className="text-sm text-muted-foreground">Colaboradores</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="clay-card border-0">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Target className="h-8 w-8 text-accent mx-auto mb-2" />
                          <p className="text-3xl font-bold text-foreground">
                            {selectedGestorTeamOverview.engajamentoMedio}%
                          </p>
                          <p className="text-sm text-muted-foreground">Engajamento Médio</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="clay-card border-0">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 text-chart-1 mx-auto mb-2" />
                          <p className="text-3xl font-bold text-foreground">
                            {selectedGestorTeamOverview.colaboradoresAltoEngajamento}
                          </p>
                          <p className="text-sm text-muted-foreground">Alto Engajamento</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="clay-card border-0">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <AlertCircle className="h-8 w-8 text-chart-3 mx-auto mb-2" />
                          <p className="text-3xl font-bold text-foreground">
                            {selectedGestorTeamOverview.colaboradoresBaixoEngajamento}
                          </p>
                          <p className="text-sm text-muted-foreground">Baixo Engajamento</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card className="clay-card border-0">
                  <CardHeader>
                    <CardTitle>Colaboradores do Time</CardTitle>
                    <CardDescription>Análise individual de cada membro do time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedGestorTeam.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Este gestor ainda não possui colaboradores vinculados
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedGestorTeam.map((member) => (
                          <div key={member.userId} className="flex items-center gap-4 rounded-lg border p-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} />
                              <AvatarFallback>
                                {member.nome
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{member.nome}</p>
                              <p className="text-sm text-muted-foreground">{member.cargo}</p>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-sm font-bold text-primary">{member.engajamento}%</p>
                                <p className="text-xs text-muted-foreground">Engajamento</p>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-accent">{member.participacaoPesquisas}%</p>
                                <p className="text-xs text-muted-foreground">Pesquisas</p>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-chart-1">{member.participacaoTreinamentos}%</p>
                                <p className="text-xs text-muted-foreground">Treinamentos</p>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-chart-3">{member.participacaoFeedbacks}%</p>
                                <p className="text-xs text-muted-foreground">Feedbacks</p>
                              </div>
                            </div>
                            {member.tendencia === "alta" && <TrendingUp className="h-5 w-5 text-chart-1" />}
                            {member.tendencia === "queda" && <TrendingDown className="h-5 w-5 text-chart-3" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="historico" className="space-y-6">
                <Card className="clay-card border-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Histórico de Atividades</CardTitle>
                        <CardDescription>Últimos 30 dias de atividade do gestor</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExportAudit(selectedGestor.gestorId)}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedGestorHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Activity className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma atividade registrada nos últimos 30 dias
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedGestorHistory.map((activity) => (
                          <div key={activity.id} className="flex items-start gap-4 rounded-lg border p-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/20">
                              {activity.tipo === "login" && <Activity className="h-5 w-5 text-primary" />}
                              {activity.tipo === "analise" && <BarChart3 className="h-5 w-5 text-accent" />}
                              {activity.tipo === "criacao" && <Target className="h-5 w-5 text-chart-1" />}
                              {activity.tipo === "alteracao" && <Shield className="h-5 w-5 text-chart-3" />}
                              {activity.tipo === "interacao" && <Users className="h-5 w-5 text-foreground" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{activity.descricao}</p>
                              {activity.impacto && <p className="text-sm text-muted-foreground">{activity.impacto}</p>}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleString("pt-BR")}
                              </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {activity.tipo}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extrair Dados de Gestores</DialogTitle>
            <DialogDescription>
              Exportar dados completos de todos os gestores, times, usuários e interações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Formato de Exportação</Label>
              <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Dados que serão exportados:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Lista completa de gestores</li>
                <li>Dados de cada gestor</li>
                <li>Todos os times de cada gestor</li>
                <li>Todos os usuários de cada time</li>
                <li>Métricas de engajamento e uso</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowExportDialog(false)} disabled={exportando}>
              Cancelar
            </Button>
            <Button onClick={handleExportAllData} disabled={exportando}>
              {exportando ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
