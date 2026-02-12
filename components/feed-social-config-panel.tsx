"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Save, AlertCircle, CheckCircle2, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface FeedSocialSettings {
  requireApproval: boolean
}

class FeedSocialConfigService {
  private static readonly STORAGE_KEY = "engageai_feed_social_settings"

  static getDefaultSettings(): FeedSocialSettings {
    return {
      requireApproval: false, // Por padrão, feed liberado sem aprovação
    }
  }

  static getSettings(): FeedSocialSettings {
    if (typeof window === "undefined") return this.getDefaultSettings()

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) {
      return this.getDefaultSettings()
    }

    try {
      return JSON.parse(stored)
    } catch {
      return this.getDefaultSettings()
    }
  }

  static updateSettings(settings: Partial<FeedSocialSettings>): void {
    if (typeof window === "undefined") return

    const stored = localStorage.getItem(this.STORAGE_KEY)
    const current = stored ? JSON.parse(stored) : this.getDefaultSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated))
  }
}

export function FeedSocialConfigPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [settings, setSettings] = useState<FeedSocialSettings>(FeedSocialConfigService.getDefaultSettings())
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    const stored = localStorage.getItem("engageai_feed_social_settings")

    if (!stored) {
      const defaults = FeedSocialConfigService.getDefaultSettings()
      FeedSocialConfigService.updateSettings(defaults)
      setSettings(defaults)
      return
    }

    const currentSettings = JSON.parse(stored)
    setSettings(currentSettings)
  }

  const handleToggle = (value: boolean) => {
    setSettings((prev) => ({ ...prev, requireApproval: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    FeedSocialConfigService.updateSettings(settings)
    setHasChanges(false)
    toast({
      title: "Configurações salvas",
      description: "As regras do feed social foram atualizadas com sucesso.",
    })
  }

  const isSuperAdmin = user?.role === "super-admin"

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configurações do Feed Social</h2>
            <p className="mt-2 text-muted-foreground">
              {isSuperAdmin
                ? "Defina as regras de publicação e moderação do feed social da plataforma"
                : "Gerencie como seu time interage no feed social"}
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

      <Card className="clay-card border-0">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>Aprovação de publicações e interações no Feed Social</CardTitle>
              <CardDescription className="mt-1.5">
                Defina se publicações e comentários dos colaboradores precisam de aprovação antes de ficarem visíveis.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div
              onClick={() => handleToggle(false)}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                !settings.requireApproval
                  ? "border-green-500 bg-green-500/5"
                  : "border-border bg-card hover:border-green-500/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={!settings.requireApproval}
                  onChange={() => handleToggle(false)}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Feed liberado (sem aprovação)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Publicações, comentários e curtidas são feitas livremente e tornam-se visíveis imediatamente. Não
                    passam por fluxo de aprovação.
                  </p>
                  {!settings.requireApproval && (
                    <Badge variant="outline" className="mt-2 bg-green-500/10 text-green-600 border-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configuração atual
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div
              onClick={() => handleToggle(true)}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                settings.requireApproval
                  ? "border-blue-500 bg-blue-500/5"
                  : "border-border bg-card hover:border-blue-500/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={settings.requireApproval}
                  onChange={() => handleToggle(true)}
                  className="mt-1 h-4 w-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Aprovação obrigatória</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toda e qualquer publicação e comentário feitos pelos colaboradores do{" "}
                    {isSuperAdmin ? "time" : "seu time"} ficam pendentes e aguardam aprovação. Só após aprovação
                    tornam-se visíveis no feed social.
                  </p>
                  {settings.requireApproval && (
                    <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-600 border-blue-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Configuração atual
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isSuperAdmin ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700">Configuração Global (Superadmin)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Como superadmin, esta configuração define o padrão global da plataforma. Gestores de time podem ter
                    configurações específicas para seus times.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700">Escopo do Seu Time</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta configuração impacta apenas os colaboradores vinculados ao seu time. Outros gestores podem ter
                    regras diferentes para seus times.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end">
        <Button onClick={handleSave} disabled={!hasChanges} className="min-w-32">
          <Save className="h-4 w-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}

// Exportar também o serviço para ser usado em outras partes do app
export { FeedSocialConfigService }
