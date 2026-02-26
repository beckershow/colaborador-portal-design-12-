"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Globe,
  CheckCircle2,
  Save,
  RotateCcw,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  type GestorFeedbackConfig,
  getGestorFeedbackConfig,
  updateGestorFeedbackConfig,
} from "@/lib/feedback-api"

// Defaults when no config exists yet (returned by backend upsert on first load)
const DEFAULTS: Pick<GestorFeedbackConfig, "allowAnyUser" | "allowPublicFeedback" | "requireApproval"> = {
  allowAnyUser: true,
  allowPublicFeedback: true,
  requireApproval: false,
}

export function FeedbackConfigPanel() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [config, setConfig] = useState(DEFAULTS)
  const [saved, setSaved] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const hasChanges =
    config.allowAnyUser !== saved.allowAnyUser ||
    config.allowPublicFeedback !== saved.allowPublicFeedback ||
    config.requireApproval !== saved.requireApproval

  // ─── Carregar config do servidor ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await getGestorFeedbackConfig()
        if (!cancelled) {
          const c = {
            allowAnyUser: res.data.allowAnyUser,
            allowPublicFeedback: res.data.allowPublicFeedback,
            requireApproval: res.data.requireApproval,
          }
          setConfig(c)
          setSaved(c)
        }
      } catch {
        // silencioso — mantém defaults
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = (field: keyof typeof config, value: boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await updateGestorFeedbackConfig(config)
      const c = {
        allowAnyUser: res.data.allowAnyUser,
        allowPublicFeedback: res.data.allowPublicFeedback,
        requireApproval: res.data.requireApproval,
      }
      setConfig(c)
      setSaved(c)
      toast({ title: "Configurações salvas", description: "As regras de feedback foram atualizadas." })
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setConfig(DEFAULTS)
  }

  if (!user) return null

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configuração de Feedbacks</h2>
            <p className="mt-2 text-muted-foreground">
              Defina regras de feedback para seu time ({user.departamento ?? user.nome})
            </p>
          </div>
          {hasChanges && !loading && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500">
              <AlertCircle className="h-3 w-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Configuração 1: allowAnyUser */}
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle>Permitir envio para qualquer colaborador</CardTitle>
                  <CardDescription className="mt-1.5">
                    Quando ativado, seu time pode enviar e solicitar feedbacks para qualquer
                    colaborador da plataforma. Quando desativado, apenas entre membros do mesmo time.
                  </CardDescription>
                </div>
                <Checkbox
                  checked={config.allowAnyUser}
                  onCheckedChange={(checked) => handleToggle("allowAnyUser", !!checked)}
                />
              </div>
            </CardHeader>

            {!config.allowAnyUser && (
              <CardContent className="pt-0">
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  <Info className="mb-1 inline h-4 w-4 mr-1" />
                  Colaboradores do seu time só poderão enviar e solicitar feedbacks entre si e para você.
                </div>
              </CardContent>
            )}
          </Card>

          {/* Configuração 2: allowPublicFeedback */}
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-chart-1/10">
                  <Globe className="h-5 w-5 text-chart-1" />
                </div>
                <div className="flex-1">
                  <CardTitle>Permitir feedbacks públicos</CardTitle>
                  <CardDescription className="mt-1.5">
                    Colaboradores poderão marcar feedbacks como públicos para serem compartilhados
                    no feed social da comunidade, após aprovação.
                  </CardDescription>
                </div>
                <Checkbox
                  checked={config.allowPublicFeedback}
                  onCheckedChange={(checked) => handleToggle("allowPublicFeedback", !!checked)}
                />
              </div>
            </CardHeader>

            {config.allowPublicFeedback && (
              <CardContent className="pt-0">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium text-foreground">Como funciona o feedback público:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Na tela de envio, o colaborador verá a opção "Tornar este feedback público"</li>
                        <li>
                          •{" "}
                          {config.requireApproval
                            ? "O feedback público só aparece no feed após aprovação do gestor"
                            : "O feedback é compartilhado automaticamente no feed social ao ser enviado"}
                        </li>
                        <li>• Visível para o remetente, destinatário e toda a comunidade</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Configuração 3: requireApproval */}
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <CardTitle>Feedbacks requerem aprovação</CardTitle>
                  <CardDescription className="mt-1.5">
                    Quando ativado, todos os feedbacks do seu time ficam pendentes até aprovação
                    no Painel Analítico. Quando desativado, feedbacks são entregues imediatamente.
                  </CardDescription>
                </div>
                <Checkbox
                  checked={config.requireApproval}
                  onCheckedChange={(checked) => handleToggle("requireApproval", !!checked)}
                />
              </div>
            </CardHeader>

            {config.requireApproval && (
              <CardContent className="pt-0">
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1.5 text-sm">
                      <p className="font-medium text-foreground">Fluxo de aprovação:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Colaborador envia feedback → status "Pendente"</li>
                        <li>• Remetente é notificado que o feedback aguarda aprovação</li>
                        <li>• Você aprova ou rejeita no Painel Analítico</li>
                        <li>• Após aprovação, o feedback chega ao destinatário com XP e estrelas</li>
                        {config.allowPublicFeedback && (
                          <li>• Feedbacks marcados como públicos vão para o feed social após aprovação</li>
                        )}
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
              disabled={!hasChanges || saving}
              className="bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrões
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="min-w-36"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Salvar Configurações</>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
