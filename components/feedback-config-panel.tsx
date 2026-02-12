"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/auth-context"
import { FeedbackService } from "@/lib/feedback-service"
import { useToast } from "@/hooks/use-toast"
import { 
  Users, 
  Globe, 
  CheckCircle2, 
  Save, 
  RotateCcw, 
  AlertCircle,
  Info
} from "lucide-react"

export function FeedbackConfigPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<any>(FeedbackService.getDefaultSettings())
  const [hasChanges, setHasChanges] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])

  useEffect(() => {
    loadSettings()
    loadUsers()
  }, [])

  const loadSettings = () => {
    const stored = localStorage.getItem("engageai_feedback_settings")
    
    // Se não houver configurações salvas, inicializar com defaults
    if (!stored) {
      const defaults = FeedbackService.getDefaultSettings()
      FeedbackService.updateSettings(defaults)
      setSettings(defaults)
      return
    }
    
    // Carregar configurações salvas
    const currentSettings = JSON.parse(stored)
    setSettings(currentSettings)
  }

  const loadUsers = () => {
    const users = JSON.parse(localStorage.getItem("engageai_users") || "[]")
    const colaboradores = users.filter((u: any) => u.role === "colaborador")
    setAllUsers(colaboradores)
  }

  const handleToggle = (field: string, value: boolean) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleToggleRecipient = (userId: string) => {
    setSettings((prev: any) => {
      const allowedRecipients = prev.allowedRecipients.includes(userId)
        ? prev.allowedRecipients.filter((id: string) => id !== userId)
        : [...prev.allowedRecipients, userId]
      
      return { ...prev, allowedRecipients }
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    FeedbackService.updateSettings(settings)
    setHasChanges(false)
    toast({
      title: "Configurações salvas",
      description: "As regras de feedback foram atualizadas com sucesso.",
    })
  }

  const handleReset = () => {
    const defaultSettings = FeedbackService.getDefaultSettings()
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  const isSuperAdmin = user?.role === "super-admin"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configuração de Feedbacks</h2>
            <p className="mt-2 text-muted-foreground">
              Defina regras globais de feedback para {isSuperAdmin ? "toda a empresa" : `seu time (${user?.departamento})`}
            </p>
          </div>
          {hasChanges && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
        </div>
      </div>

      {/* Configuração 1: Permitir envio para qualquer colaborador */}
      <Card className="clay-card border-0">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Permitir envio e solicitação de feedback para qualquer colaborador</CardTitle>
              <CardDescription className="mt-1.5">
                Quando ativado, seu time pode enviar e solicitar feedbacks para qualquer colaborador. Quando desativado, seu time envia feedbacks e solicitações de feedbacks apenas para pessoas autorizadas pelo gestor.                  </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={settings.allowAnyUser}
                onCheckedChange={(checked) => handleToggle("allowAnyUser", !!checked)}
              />
            </div>
          </div>
        </CardHeader>

        {!settings.allowAnyUser && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Selecione quem pode receber feedbacks e solicitação de feedbacks do seu time:</span>
                <Badge variant="secondary">
                  {settings.allowedRecipients.length} de {allUsers.length} selecionados
                </Badge>
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border border-border p-3">
                {allUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum colaborador encontrado
                  </p>
                ) : (
                  allUsers.map((colaborador) => (
                    <div
                      key={colaborador.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={settings.allowedRecipients.includes(colaborador.id)}
                        onCheckedChange={() => handleToggleRecipient(colaborador.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={colaborador.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">
                          {colaborador.nome.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{colaborador.nome}</p>
                        <p className="text-xs text-muted-foreground">{colaborador.cargo}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Configuração 2: Permitir feedbacks públicos */}
      <Card className="clay-card border-0">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
              <Globe className="h-5 w-5 text-chart-1" />
            </div>
            <div className="flex-1">
              <CardTitle>Permitir feedbacks públicos</CardTitle>
              <CardDescription className="mt-1.5">
                Colaboradores podem marcar feedbacks como públicos para serem compartilhados no feed social.
              </CardDescription>
            </div>
            <Checkbox
              checked={settings.allowPublic}
              onCheckedChange={(checked) => handleToggle("allowPublic", !!checked)}
            />
          </div>
        </CardHeader>

        {settings.allowPublic && (
          <CardContent className="pt-0">
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    Como funciona o feedback público:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Na tela de envio, colaborador verá checkbox "Tornar este feedback público"</li>
                    <li>• {settings.requireApproval ? "Feedback público só aparece no feed após aprovação do gestor" : "Feedback chegará ao remetende e se tornará público no feed social mediante aprovação do gestor"}</li>
                    <li>• Visível apenas para o remetente e a comunidade (feed social)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Configuração 3: Feedbacks requerem aprovação */}
      <Card className="clay-card border-0">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <CheckCircle2 className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <CardTitle>Feedbacks requerem aprovação</CardTitle>
              <CardDescription className="mt-1.5">
                Quando ativado, todos os feedbacks ficam pendentes até aprovação do gestor no Painel Analítico.
                Quando desativado, feedbacks são enviados imediatamente.
              </CardDescription>
            </div>
            <Checkbox
              checked={settings.requireApproval}
              onCheckedChange={(checked) => handleToggle("requireApproval", !!checked)}
            />
          </div>
        </CardHeader>

        {settings.requireApproval && (
          <CardContent className="pt-0">
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">
                    Fluxo de aprovação:
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Colaborador envia feedback → Status "Pendente"</li>
                    <li>• Remetente é notificado que feedback aguarda aprovação</li>
                    <li>• Gestor aprova/rejeita no Painel Analítico</li>
                    <li>• Após aprovação, feedback chega ao destinatário</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges}
          className="bg-transparent"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="min-w-32"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
