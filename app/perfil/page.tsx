"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent as DialogContentComponent,
  DialogHeader as DialogHeaderComponent,
  DialogFooter as DialogFooterComponent,
  DialogTitle as DialogTitleComponent,
  DialogDescription as DialogDescriptionComponent,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import { NotificationService } from "@/lib/notification-service"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { Award, Trophy, Star, Calendar, Camera, Edit, Bell, CheckCircle } from "lucide-react"

interface ProfileStats {
  trilhasCompletadas: number
  modulosFinalizados: number
  diasEngajamento: number
}

interface XpHistoryEntry {
  mes: string
  xp: number
  label: string
}

interface NotifPrefs {
  email: boolean
  push: boolean
  humor: boolean
  pesquisas: boolean
  recompensas: boolean
  treinamentos: boolean
  feedbacks: boolean
}

const PerfilPage = () => {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [editMode, setEditMode] = useState(false)

  const [formData, setFormData] = useState<Record<string, string>>({
    nome: "",
    email: "",
    telefone: "",
    localizacao: "",
    cargo: "",
    departamento: "",
    dataAdmissao: "",
  })

  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [xpHistory, setXpHistory] = useState<XpHistoryEntry[]>([])
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false)

  const [notificationSettings, setNotificationSettings] = useState<NotifPrefs>({
    email: true,
    push: true,
    humor: true,
    pesquisas: true,
    recompensas: true,
    treinamentos: false,
    feedbacks: true,
  })

  const canEditDirectly = user?.role === "gestor" || user?.role === "super-admin"

  // Sync formData when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome || "",
        email: user.email || "",
        telefone: user.telefone || "",
        localizacao: user.localizacao || "",
        cargo: user.cargo || "",
        departamento: user.departamento || "",
        dataAdmissao: (() => {
          const date = user.hiredAt ?? user.createdAt
          return date ? new Date(date).toLocaleDateString("pt-BR") : ""
        })(),
      })
    }
  }, [user])

  // Fetch real stats, xp history and notification preferences
  useEffect(() => {
    if (!user) return
    setLoadingStats(true)
    Promise.all([
      apiFetch<{ data: ProfileStats }>(`/users/${user.id}/stats`),
      apiFetch<{ data: XpHistoryEntry[] }>(`/users/${user.id}/xp-history`),
      apiFetch<{ data: NotifPrefs }>(`/users/${user.id}/notification-preferences`),
    ])
      .then(([statsRes, xpRes, prefRes]) => {
        setStats(statsRes.data)
        setXpHistory(xpRes.data)
        setNotifPrefs(prefRes.data)
        setNotificationSettings(prefRes.data)
      })
      .catch(() => {
        // silently fail; show zeros
      })
      .finally(() => setLoadingStats(false))
  }, [user])

  const handleEditMode = () => {
    setEditMode(!editMode)
  }

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSendRequest = () => {
    const original: Record<string, string> = {
      nome: user?.nome || "",
      email: user?.email || "",
      telefone: user?.telefone || "",
      localizacao: user?.localizacao || "",
      cargo: user?.cargo || "",
      departamento: user?.departamento || "",
      dataAdmissao: (() => {
        const date = user?.hiredAt ?? user?.createdAt
        return date ? new Date(date).toLocaleDateString("pt-BR") : ""
      })(),
    }

    const changes: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== original[key]) {
        changes[key] = formData[key]
      }
    })

    if (Object.keys(changes).length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Não há alterações para enviar.",
        variant: "destructive",
      })
      return
    }

    NotificationService.notifyProfileChangeRequest(user!.id, user!.nome, changes)

    setShowConfirmationDialog(true)
    setEditMode(false)

    toast({
      title: "Solicitação enviada!",
      description: "Seu gestor receberá uma notificação e você será avisado quando for aprovada.",
    })
  }

  const handleSaveChanges = async () => {
    if (!user) return

    // Parse pt-BR date (dd/mm/yyyy) to ISO
    let hiredAt: string | undefined
    if (formData.dataAdmissao) {
      const parts = formData.dataAdmissao.split("/")
      if (parts.length === 3) {
        const iso = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00.000Z`)
        if (!isNaN(iso.getTime())) hiredAt = iso.toISOString()
      }
    }

    try {
      const res = await apiFetch<{ data: Record<string, unknown> }>(`/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: formData.nome || undefined,
          cargo: formData.cargo || undefined,
          departamento: formData.departamento || undefined,
          telefone: formData.telefone || undefined,
          localizacao: formData.localizacao || undefined,
          hiredAt,
        }),
      })
      setUser({
        ...user,
        nome: (res.data.nome as string) || user.nome,
        cargo: (res.data.cargo as string) || user.cargo,
        departamento: (res.data.departamento as string) || user.departamento,
        telefone: res.data.telefone as string | undefined,
        localizacao: res.data.localizacao as string | undefined,
        hiredAt: res.data.hiredAt as string | undefined,
      })
      setEditMode(false)
      toast({
        title: "Alterações salvas!",
        description: "Seus dados foram atualizados com sucesso.",
      })
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setAvatarPreview(base64)

      if (canEditDirectly) {
        if (user) setUser({ ...user, avatar: base64 })
        toast({
          title: "Foto atualizada!",
          description: "Sua foto de perfil foi alterada com sucesso.",
        })
      } else {
        NotificationService.notifyProfileChangeRequest(user!.id, user!.nome, { avatar: base64 })
        toast({
          title: "Solicitação enviada!",
          description: "Seu gestor receberá uma notificação para aprovar a nova foto.",
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveNotifications = async () => {
    if (!user) return
    try {
      await apiFetch(`/users/${user.id}/notification-preferences`, {
        method: "PUT",
        body: JSON.stringify(notificationSettings),
      })
      setNotifPrefs(notificationSettings)
      toast({
        title: "Preferências Salvas!",
        description: "Suas configurações de notificação foram atualizadas.",
      })
    } catch {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as preferências. Tente novamente.",
        variant: "destructive",
      })
    }
    setShowNotificationPrefs(false)
  }

  if (!user) return null

  const perfil = {
    nivel: user.nivel || 0,
    xp: user.xp || 0,
    xpProximo: user.xpProximo || 0,
  }

  const maxXp = xpHistory.length > 0 ? Math.max(...xpHistory.map((h) => h.xp), 1) : 1

  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Meu Perfil</h1>
        <p className="mt-2 text-lg text-muted-foreground">Gerencie suas informações e acompanhe seu progresso</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Informações Pessoais</CardTitle>
                  {!canEditDirectly && (
                    <CardDescription className="mt-2 text-accent">
                      💡 Para alterar seus dados, solicite aprovação do seu gestor
                    </CardDescription>
                  )}
                  {canEditDirectly && <CardDescription>Seus dados cadastrais</CardDescription>}
                </div>
                <div className="flex items-center gap-2">
                  <Badge role={user.role} size="md" />
                  <Button variant="outline" size="sm" className="clay-button bg-transparent" onClick={handleEditMode}>
                    <Edit className="mr-2 h-4 w-4" />
                    {canEditDirectly ? "Editar" : "Solicitar Alteração"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary">
                    <AvatarImage src={avatarPreview || user.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                      {user.nome
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={!canEditDirectly}
                  />
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full shadow-lg"
                    disabled={!canEditDirectly}
                    title={!canEditDirectly ? "Solicite aprovação do gestor para alterar" : "Alterar avatar"}
                    onClick={() => document.getElementById("avatar-upload")?.click()}
                  >
                    <Camera className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleFieldChange("nome", e.target.value)}
                        readOnly={!editMode}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleFieldChange("telefone", e.target.value)}
                        readOnly={!editMode}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="localizacao">Localização</Label>
                      <Input
                        id="localizacao"
                        value={formData.localizacao}
                        onChange={(e) => handleFieldChange("localizacao", e.target.value)}
                        readOnly={!editMode}
                        disabled={!editMode}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo</Label>
                      <Input
                        id="cargo"
                        value={formData.cargo}
                        onChange={(e) => handleFieldChange("cargo", e.target.value)}
                        readOnly={!editMode}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="departamento">Departamento</Label>
                      <Input
                        id="departamento"
                        value={formData.departamento}
                        onChange={(e) => handleFieldChange("departamento", e.target.value)}
                        readOnly={!editMode}
                        disabled={!editMode}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admissao">Data de Admissão</Label>
                    <Input
                      id="admissao"
                      value={formData.dataAdmissao}
                      onChange={(e) => handleFieldChange("dataAdmissao", e.target.value)}
                      readOnly={!editMode}
                      disabled={!editMode}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>

                  {editMode && (
                    <div className="flex gap-2 pt-4">
                      {canEditDirectly ? (
                        <>
                          <Button onClick={handleSaveChanges} className="clay-button">
                            Salvar Alterações
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditMode(false)
                            }}
                            className="clay-button bg-transparent"
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={handleSendRequest} className="clay-button">
                            Enviar Solicitação ao Gestor
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditMode(false)
                            }}
                            className="clay-button bg-transparent"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Estatísticas de Engajamento</CardTitle>
              <CardDescription>Seu desempenho na plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Trilhas Completadas", valor: loadingStats ? "—" : (stats?.trilhasCompletadas ?? 0), icone: Trophy },
                  { label: "Módulos Finalizados", valor: loadingStats ? "—" : (stats?.modulosFinalizados ?? 0), icone: Award },
                  { label: "Dias de Engajamento", valor: loadingStats ? "—" : (stats?.diasEngajamento ?? 0), icone: Calendar },
                  { label: "Estrelas Ganhas", valor: user.estrelas, icone: Star },
                ].map((stat, index) => {
                  const Icone = stat.icone
                  return (
                    <div key={index} className="rounded-xl border border-border bg-card p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        <Icone className="h-6 w-6 text-primary" />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-foreground">{stat.valor}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Histórico de XP</CardTitle>
              <CardDescription>Sua evolução nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : xpHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum XP registrado nos últimos 6 meses.</p>
              ) : (
                <div className="space-y-4">
                  {xpHistory.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="w-12 text-sm font-medium capitalize text-muted-foreground">{item.label}</span>
                      <div className="flex-1">
                        <Progress value={(item.xp / maxXp) * 100} className="h-3" />
                      </div>
                      <span className="w-16 text-right text-sm font-semibold text-primary">{item.xp} XP</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-lg bg-gradient-to-br from-primary/10 to-chart-1/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de XP Acumulado</p>
                    <p className="text-2xl font-bold text-foreground">{user.xp.toLocaleString("pt-BR")} XP</p>
                  </div>
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="clay-card border-0">
            <div className="bg-gradient-to-br from-primary/10 via-chart-1/10 to-chart-3/10 p-6">
              <div className="text-center">
                <Badge className="bg-primary text-primary-foreground">
                  <Trophy className="mr-1 h-3 w-3" />
                  Nível {perfil.nivel}
                </Badge>
                <h3 className="mt-4 text-2xl font-bold text-foreground">Explorador</h3>

                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-semibold text-primary">
                      {perfil.xp} / {perfil.xpProximo} XP
                    </span>
                  </div>
                  <Progress value={(perfil.xp / perfil.xpProximo) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Faltam {perfil.xpProximo - perfil.xp} XP para o Nível {perfil.nivel + 1}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Configure como deseja ser notificado</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  if (notifPrefs) setNotificationSettings(notifPrefs)
                  setShowNotificationPrefs(true)
                }}
                variant="outline"
                className="w-full justify-start clay-button bg-transparent"
              >
                <Bell className="mr-2 h-4 w-4" />
                Gerenciar Notificações
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showNotificationPrefs} onOpenChange={setShowNotificationPrefs}>
        <DialogContentComponent className="max-w-md">
          <DialogHeaderComponent>
            <DialogTitleComponent className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Preferências de Notificação
            </DialogTitleComponent>
            <DialogDescriptionComponent>Escolha como e quando deseja receber notificações</DialogDescriptionComponent>
          </DialogHeaderComponent>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notif">Notificações por E-mail</Label>
                  <p className="text-xs text-muted-foreground">Receba atualizações via e-mail</p>
                </div>
                <Switch
                  id="email-notif"
                  checked={notificationSettings.email}
                  onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notif">Notificações Push</Label>
                  <p className="text-xs text-muted-foreground">Alertas no navegador</p>
                </div>
                <Switch
                  id="push-notif"
                  checked={notificationSettings.push}
                  onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                />
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-semibold text-foreground">Tipos de Notificação</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="humor-notif" className="font-normal">
                      Lembretes de Humor do Dia
                    </Label>
                    <Switch
                      id="humor-notif"
                      checked={notificationSettings.humor}
                      onCheckedChange={(checked) => handleNotificationChange("humor", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="pesquisas-notif" className="font-normal">
                      Novas Pesquisas
                    </Label>
                    <Switch
                      id="pesquisas-notif"
                      checked={notificationSettings.pesquisas}
                      onCheckedChange={(checked) => handleNotificationChange("pesquisas", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="recompensas-notif" className="font-normal">
                      Novas Recompensas
                    </Label>
                    <Switch
                      id="recompensas-notif"
                      checked={notificationSettings.recompensas}
                      onCheckedChange={(checked) => handleNotificationChange("recompensas", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="treinamentos-notif" className="font-normal">
                      Novos Treinamentos
                    </Label>
                    <Switch
                      id="treinamentos-notif"
                      checked={notificationSettings.treinamentos}
                      onCheckedChange={(checked) => handleNotificationChange("treinamentos", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="feedbacks-notif" className="font-normal">
                      Feedbacks Recebidos
                    </Label>
                    <Switch
                      id="feedbacks-notif"
                      checked={notificationSettings.feedbacks}
                      onCheckedChange={(checked) => handleNotificationChange("feedbacks", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooterComponent>
            <Button
              variant="outline"
              onClick={() => setShowNotificationPrefs(false)}
              className="clay-button bg-transparent"
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveNotifications} className="clay-button">
              Salvar Preferências
            </Button>
          </DialogFooterComponent>
        </DialogContentComponent>
      </Dialog>

      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContentComponent className="max-w-md">
          <DialogHeaderComponent>
            <DialogTitleComponent className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-chart-1" />
              Solicitação Enviada!
            </DialogTitleComponent>
            <DialogDescriptionComponent className="text-base pt-2">
              Sua solicitação foi enviada ao gestor. Após a aprovação, seus dados serão atualizados.
            </DialogDescriptionComponent>
          </DialogHeaderComponent>
          <DialogFooterComponent>
            <Button onClick={() => setShowConfirmationDialog(false)} className="clay-button w-full">
              Entendi
            </Button>
          </DialogFooterComponent>
        </DialogContentComponent>
      </Dialog>

      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContentComponent className="max-w-md">
          <DialogHeaderComponent>
            <DialogTitleComponent>Solicitação Enviada</DialogTitleComponent>
            <DialogDescriptionComponent>
              Sua solicitação de alteração foi enviada para aprovação do seu gestor
            </DialogDescriptionComponent>
          </DialogHeaderComponent>
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-sm text-muted-foreground">
                O gestor receberá uma notificação e você será informado quando a solicitação for aprovada ou recusada.
              </p>
            </div>
            <Button
              onClick={() => {
                setShowRequestDialog(false)
                setEditMode(false)
              }}
              className="w-full clay-button"
            >
              Entendi
            </Button>
          </div>
        </DialogContentComponent>
      </Dialog>
    </div>
  )
}

export default PerfilPage
