"use client"

import { TabsContent } from "@/components/ui/tabs"

import { Tabs } from "@/components/ui/tabs"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, TrendingUp, Save, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react"
import {
  GamificationConfigService_Instance,
  type GamificationConfig,
  type NivelConfig,
} from "@/lib/gamification-config-service"

export const dynamic = "force-dynamic"

export default function ConfiguracoesGanhosPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const [config, setConfig] = useState<GamificationConfig | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle")

  // Verificar permissão Super Admin
  useEffect(() => {
    if (!user) return
    if (!hasPermission("super-admin")) {
      router.push("/")
    }
  }, [user, hasPermission, router])

  // Carregar configuração
  useEffect(() => {
    const loadedConfig = GamificationConfigService_Instance.getConfig()
    setConfig(loadedConfig)
  }, [])

  if (!user || !hasPermission("super-admin") || !config) {
    return null
  }

  const handleSaveConfig = () => {
    if (!config) return

    setSaveStatus("saving")
    try {
      GamificationConfigService_Instance.saveConfig(config)
      setHasChanges(false)
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const handleResetToDefault = () => {
    if (confirm("Tem certeza que deseja restaurar as configurações padrão? Esta ação não pode ser desfeita.")) {
      GamificationConfigService_Instance.resetToDefault()
      const defaultConfig = GamificationConfigService_Instance.getConfig()
      setConfig(defaultConfig)
      setHasChanges(false)
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const updateNivel = (index: number, field: keyof NivelConfig, value: any) => {
    if (!config) return
    const novosNiveis = [...config.niveis]
    novosNiveis[index] = { ...novosNiveis[index], [field]: value }
    setConfig({ ...config, niveis: novosNiveis })
    setHasChanges(true)
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calibragem de Ganhos</h1>
          <p className="text-muted-foreground">Configure Níveis e XP da plataforma</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleResetToDefault} className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSaveConfig} disabled={!hasChanges || saveStatus === "saving"} className="gap-2">
            {saveStatus === "saving" ? (
              <>
                <Settings className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : saveStatus === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Alerts */}
      {hasChanges && saveStatus === "idle" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao salvar configurações. Tente novamente.</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="niveis">
        {/* Main Content - Apenas Níveis & XP */}
        <TabsContent value="niveis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Níveis e XP</CardTitle>
              <CardDescription>
                Defina a quantidade de XP necessária para cada nível e sua classificação semântica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.niveis.map((nivel, index) => (
                  <div key={nivel.nivel} className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg border">
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">Nível</Label>
                      <p className="text-2xl font-bold text-primary">{nivel.nivel}</p>
                    </div>
                    <div className="col-span-4">
                      <Label htmlFor={`xp-${index}`}>XP Necessário</Label>
                      <Input
                        id={`xp-${index}`}
                        type="number"
                        value={nivel.xpNecessario}
                        onChange={(e) => updateNivel(index, "xpNecessario", Number.parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-6">
                      <Label htmlFor={`class-${index}`}>Classificação</Label>
                      <Select
                        value={nivel.classificacao}
                        onValueChange={(value) => updateNivel(index, "classificacao", value)}
                      >
                        <SelectTrigger id={`class-${index}`} className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Iniciante">Iniciante</SelectItem>
                          <SelectItem value="Intermediário">Intermediário</SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                          <SelectItem value="Explorador">Explorador</SelectItem>
                          <SelectItem value="Mestre">Mestre</SelectItem>
                          <SelectItem value="Lenda">Lenda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
