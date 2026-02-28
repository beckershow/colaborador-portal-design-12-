"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  Gauge,
  CalendarDays,
  Calendar,
  UserCheck,
  Pencil,
  X,
  Trash2,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  type GestorConfigGlobalDefaults,
  type TeamMemberLimit,
  type TeamLimitsData,
  getGestorFeedbackConfig,
  updateGestorFeedbackConfig,
  getFeedbackSettings,
  updateFeedbackSettings,
  getTeamFeedbackLimits,
  setUserFeedbackLimit,
  removeUserFeedbackLimit,
} from "@/lib/feedback-api"
import { getImageUrl } from "@/lib/uploads-api"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(nome: string) {
  return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

// ─── Sub-componente: linha de membro do time ──────────────────────────────────

function MemberRow({
  member,
  globalDefaults,
  onSave,
  onRemove,
}: {
  member: TeamMemberLimit
  globalDefaults: TeamLimitsData["globalDefaults"]
  onSave: (userId: string, day: number | null, week: number | null) => Promise<void>
  onRemove: (userId: string) => Promise<void>
}) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const effectiveDay  = member.customLimit?.maxFeedbacksPerDay  ?? globalDefaults.maxFeedbacksPerDay
  const effectiveWeek = member.customLimit?.maxFeedbacksPerWeek ?? globalDefaults.maxFeedbacksPerWeek

  const [dayVal,  setDayVal]  = useState(effectiveDay.toString())
  const [weekVal, setWeekVal] = useState(effectiveWeek.toString())

  const hasCustom = !!member.customLimit

  function openEdit() {
    setDayVal(effectiveDay.toString())
    setWeekVal(effectiveWeek.toString())
    setEditing(true)
  }

  async function handleSave() {
    const d = parseInt(dayVal, 10)
    const w = parseInt(weekVal, 10)
    if (isNaN(d) || d < 1 || d > 50) {
      toast({ title: "Valor inválido", description: "Limite diário deve ser entre 1 e 50.", variant: "destructive" })
      return
    }
    if (isNaN(w) || w < 1 || w > 200) {
      toast({ title: "Valor inválido", description: "Limite semanal deve ser entre 1 e 200.", variant: "destructive" })
      return
    }
    if (d > w) {
      toast({ title: "Valor inválido", description: "O limite diário não pode ser maior que o semanal.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await onSave(member.userId, d, w)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    setRemoving(true)
    try { await onRemove(member.userId) } finally { setRemoving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={member.avatar ? (getImageUrl(member.avatar) ?? undefined) : undefined} />
          <AvatarFallback className="text-xs">{initials(member.nome)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{member.nome}</p>
          <p className="text-xs text-muted-foreground truncate">{member.cargo}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {hasCustom ? (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              {effectiveDay}/dia · {effectiveWeek}/sem
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Padrão ({effectiveDay}/dia · {effectiveWeek}/sem)
            </Badge>
          )}
          {!editing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openEdit} title="Personalizar">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {hasCustom && (
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={handleRemove} disabled={removing}
                  title="Remover limite personalizado"
                >
                  {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="ml-12 rounded-lg border border-border bg-muted/30 p-4 space-y-4">
          <p className="text-xs font-medium">Limite personalizado para <strong>{member.nome}</strong></p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`day-${member.userId}`} className="text-xs">
                <CalendarDays className="h-3 w-3 inline mr-1" />Por dia (1–50)
              </Label>
              <Input id={`day-${member.userId}`} type="number" min={1} max={50} value={dayVal}
                onChange={e => setDayVal(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`week-${member.userId}`} className="text-xs">
                <Calendar className="h-3 w-3 inline mr-1" />Por semana (1–200)
              </Label>
              <Input id={`week-${member.userId}`} type="number" min={1} max={200} value={weekVal}
                onChange={e => setWeekVal(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          {parseInt(dayVal) > parseInt(weekVal) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />O limite diário não pode ser maior que o semanal.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              <X className="h-3.5 w-3.5 mr-1" />Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componente: card de limites (mesma estrutura para ambos os roles) ────

function LimitsCard({
  limitsEnabled,
  maxPerDay,
  maxPerWeek,
  individualEnabled,
  onLimitsToggle,
  onDayChange,
  onWeekChange,
  onIndividualToggle,
  children, // conteúdo quando individual habilitado
}: {
  limitsEnabled: boolean
  maxPerDay: number
  maxPerWeek: number
  individualEnabled: boolean
  onLimitsToggle: (v: boolean) => void
  onDayChange: (v: string) => void
  onWeekChange: (v: string) => void
  onIndividualToggle: (v: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <Card className="clay-card border-0">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle>Habilitar limite de feedbacks</CardTitle>
            <CardDescription className="mt-1.5">
              Define um limite máximo de feedbacks que cada colaborador pode enviar por dia e por semana.
            </CardDescription>
          </div>
          <Switch checked={limitsEnabled} onCheckedChange={onLimitsToggle} />
        </div>
      </CardHeader>

      {limitsEnabled && (
        <CardContent className="space-y-5 pt-0">
          {/* Limite por dia */}
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium">Limite por dia</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Feedbacks enviados em um único dia. (1–50)</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={1} max={50} value={maxPerDay}
                onChange={e => onDayChange(e.target.value)}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground w-14">/ dia</span>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Limite por semana */}
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium">Limite por semana</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Feedbacks enviados em uma semana. (1–200)</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={1} max={200} value={maxPerWeek}
                onChange={e => onWeekChange(e.target.value)}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground w-14">/ semana</span>
            </div>
          </div>

          {maxPerDay > maxPerWeek && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              O limite diário não pode ser maior que o semanal.
            </div>
          )}

          <div className="border-t border-border" />

          {/* Toggle: limite individual */}
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-chart-2/10">
              <UserCheck className="h-4 w-4 text-chart-2" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-none">Habilitar limite individual por colaborador</p>
              <p className="text-xs text-muted-foreground mt-1.5">
                Permite definir limites específicos para membros individuais, sobrescrevendo o limite padrão acima.
              </p>
            </div>
            <Switch checked={individualEnabled} onCheckedChange={onIndividualToggle} />
          </div>

          {/* Conteúdo injetado quando individual habilitado */}
          {individualEnabled && children && (
            <div className="mt-1">
              {children}
            </div>
          )}
        </CardContent>
      )}

      {!limitsEnabled && (
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <Info className="mb-1 inline h-4 w-4 mr-1" />
            Com os limites desabilitados, colaboradores podem enviar feedbacks sem restrição de quantidade.
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════════════════════════

export function FeedbackConfigPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isSuperAdmin = user?.role === "super-admin"

  // ── Estado gestor ────────────────────────────────────────────────────────

  type GestorState = {
    allowAnyUser: boolean
    allowPublicFeedback: boolean
    requireApproval: boolean
    limitsEnabled: boolean
    maxFeedbacksPerDay: number
    maxFeedbacksPerWeek: number
    individualLimitsEnabled: boolean
  }

  const GESTOR_INIT: GestorState = {
    allowAnyUser: true, allowPublicFeedback: true, requireApproval: false,
    limitsEnabled: true, maxFeedbacksPerDay: 5, maxFeedbacksPerWeek: 20, individualLimitsEnabled: false,
  }

  const [gestorState, setGestorState] = useState<GestorState>(GESTOR_INIT)
  const [savedGestor, setSavedGestor]  = useState<GestorState>(GESTOR_INIT)
  const [globalRef, setGlobalRef]      = useState<GestorConfigGlobalDefaults>({ limitsEnabled: true, maxFeedbacksPerDay: 5, maxFeedbacksPerWeek: 20 })
  const [loadingGestor, setLoadingGestor] = useState(false)
  const [savingGestor,  setSavingGestor]  = useState(false)

  // ── Estado super-admin ───────────────────────────────────────────────────

  type GlobalState = {
    limitsEnabled: boolean
    maxFeedbacksPerDay: number
    maxFeedbacksPerWeek: number
    individualLimitsEnabled: boolean
  }

  const GLOBAL_INIT: GlobalState = { limitsEnabled: true, maxFeedbacksPerDay: 5, maxFeedbacksPerWeek: 20, individualLimitsEnabled: false }

  const [globalState, setGlobalState]  = useState<GlobalState>(GLOBAL_INIT)
  const [savedGlobal, setSavedGlobal]  = useState<GlobalState>(GLOBAL_INIT)
  const [loadingGlobal, setLoadingGlobal] = useState(false)
  const [savingGlobal,  setSavingGlobal]  = useState(false)

  // ── Estado time (gestor) ─────────────────────────────────────────────────

  const [teamLimits, setTeamLimits]         = useState<TeamLimitsData | null>(null)
  const [loadingTeam, setLoadingTeam]        = useState(false)

  // ── Detecção de mudanças ─────────────────────────────────────────────────

  const hasGestorChanges = JSON.stringify(gestorState) !== JSON.stringify(savedGestor)
  const hasGlobalChanges = JSON.stringify(globalState) !== JSON.stringify(savedGlobal)

  // ── Carregamento ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isSuperAdmin) loadGlobal()
    else if (user?.role === "gestor") { loadGestorConfig(); loadTeam() }
  }, [user?.role])

  async function loadGestorConfig() {
    setLoadingGestor(true)
    try {
      const res = await getGestorFeedbackConfig()
      const s: GestorState = {
        allowAnyUser:            res.data.allowAnyUser,
        allowPublicFeedback:     res.data.allowPublicFeedback,
        requireApproval:         res.data.requireApproval,
        limitsEnabled:           res.data.limitsEnabled,
        maxFeedbacksPerDay:      res.data.maxFeedbacksPerDay,
        maxFeedbacksPerWeek:     res.data.maxFeedbacksPerWeek,
        individualLimitsEnabled: res.data.individualLimitsEnabled,
      }
      setGestorState(s)
      setSavedGestor(s)
      setGlobalRef(res.globalDefaults)
    } catch { /* mantém defaults */ } finally { setLoadingGestor(false) }
  }

  const loadTeam = useCallback(async () => {
    setLoadingTeam(true)
    try {
      const res = await getTeamFeedbackLimits()
      setTeamLimits(res.data)
    } catch { /* silencioso */ } finally { setLoadingTeam(false) }
  }, [])

  async function loadGlobal() {
    setLoadingGlobal(true)
    try {
      const res = await getFeedbackSettings()
      const s: GlobalState = {
        limitsEnabled:           res.data.limitsEnabled,
        maxFeedbacksPerDay:      res.data.maxFeedbacksPerDay,
        maxFeedbacksPerWeek:     res.data.maxFeedbacksPerWeek,
        individualLimitsEnabled: res.data.individualLimitsEnabled,
      }
      setGlobalState(s)
      setSavedGlobal(s)
    } catch { /* mantém defaults */ } finally { setLoadingGlobal(false) }
  }

  // ── Helpers de update ────────────────────────────────────────────────────

  function gSet<K extends keyof GestorState>(k: K, v: GestorState[K]) {
    setGestorState(p => ({ ...p, [k]: v }))
  }
  function gNum(k: "maxFeedbacksPerDay" | "maxFeedbacksPerWeek", raw: string) {
    const n = parseInt(raw, 10)
    if (!isNaN(n)) gSet(k, n)
  }
  function glSet<K extends keyof GlobalState>(k: K, v: GlobalState[K]) {
    setGlobalState(p => ({ ...p, [k]: v }))
  }
  function glNum(k: "maxFeedbacksPerDay" | "maxFeedbacksPerWeek", raw: string) {
    const n = parseInt(raw, 10)
    if (!isNaN(n)) glSet(k, n)
  }

  // ── Validação de limites ─────────────────────────────────────────────────

  function validateLimits(day: number, week: number): string | null {
    if (day < 1 || day > 50)   return "Limite diário deve ser entre 1 e 50."
    if (week < 1 || week > 200) return "Limite semanal deve ser entre 1 e 200."
    if (day > week)             return "O limite diário não pode ser maior que o semanal."
    return null
  }

  // ── Save gestor ──────────────────────────────────────────────────────────

  async function handleSaveGestor() {
    if (gestorState.limitsEnabled) {
      const err = validateLimits(gestorState.maxFeedbacksPerDay, gestorState.maxFeedbacksPerWeek)
      if (err) { toast({ title: "Valor inválido", description: err, variant: "destructive" }); return }
    }
    setSavingGestor(true)
    try {
      const res = await updateGestorFeedbackConfig(gestorState)
      const s: GestorState = {
        allowAnyUser:            res.data.allowAnyUser,
        allowPublicFeedback:     res.data.allowPublicFeedback,
        requireApproval:         res.data.requireApproval,
        limitsEnabled:           res.data.limitsEnabled,
        maxFeedbacksPerDay:      res.data.maxFeedbacksPerDay,
        maxFeedbacksPerWeek:     res.data.maxFeedbacksPerWeek,
        individualLimitsEnabled: res.data.individualLimitsEnabled,
      }
      setGestorState(s)
      setSavedGestor(s)
      toast({ title: "Configurações salvas", description: "As configurações de feedback foram atualizadas." })
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
    } finally { setSavingGestor(false) }
  }

  // ── Save global ──────────────────────────────────────────────────────────

  async function handleSaveGlobal() {
    if (globalState.limitsEnabled) {
      const err = validateLimits(globalState.maxFeedbacksPerDay, globalState.maxFeedbacksPerWeek)
      if (err) { toast({ title: "Valor inválido", description: err, variant: "destructive" }); return }
    }
    setSavingGlobal(true)
    try {
      const res = await updateFeedbackSettings(globalState)
      const s: GlobalState = {
        limitsEnabled:           res.data.limitsEnabled,
        maxFeedbacksPerDay:      res.data.maxFeedbacksPerDay,
        maxFeedbacksPerWeek:     res.data.maxFeedbacksPerWeek,
        individualLimitsEnabled: res.data.individualLimitsEnabled,
      }
      setGlobalState(s)
      setSavedGlobal(s)
      toast({ title: "Configurações salvas", description: "Os limites globais foram atualizados." })
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
    } finally { setSavingGlobal(false) }
  }

  // ── Handlers de limites individuais ─────────────────────────────────────

  const handleSetUserLimit = async (userId: string, day: number | null, week: number | null) => {
    try {
      await setUserFeedbackLimit(userId, { maxFeedbacksPerDay: day, maxFeedbacksPerWeek: week })
      toast({ title: "Limite salvo", description: "Limite personalizado aplicado ao colaborador." })
      await loadTeam()
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
      throw err
    }
  }

  const handleRemoveUserLimit = async (userId: string) => {
    try {
      await removeUserFeedbackLimit(userId)
      toast({ title: "Limite removido", description: "Colaborador voltará a usar o limite padrão." })
      await loadTeam()
    } catch (err) {
      toast({ title: "Erro ao remover", description: (err as Error).message, variant: "destructive" })
      throw err
    }
  }

  if (!user) return null

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER SUPER-ADMIN ───────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Configuração Global de Feedbacks</h2>
              <p className="mt-2 text-muted-foreground">
                Defina os limites padrão da plataforma. Gestores herdam essas configurações
                e podem personalizá-las para o seu time.
              </p>
            </div>
            {hasGlobalChanges && !loadingGlobal && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500">
                <AlertCircle className="h-3 w-3 mr-1" />Alterações não salvas
              </Badge>
            )}
          </div>
        </div>

        {loadingGlobal ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <LimitsCard
              limitsEnabled={globalState.limitsEnabled}
              maxPerDay={globalState.maxFeedbacksPerDay}
              maxPerWeek={globalState.maxFeedbacksPerWeek}
              individualEnabled={globalState.individualLimitsEnabled}
              onLimitsToggle={v => glSet("limitsEnabled", v)}
              onDayChange={v => glNum("maxFeedbacksPerDay", v)}
              onWeekChange={v => glNum("maxFeedbacksPerWeek", v)}
              onIndividualToggle={v => glSet("individualLimitsEnabled", v)}
            >
              {/* Conteúdo para super-admin quando individual habilitado */}
              <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 p-4">
                <div className="flex gap-3">
                  <UserCheck className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5 text-sm">
                    <p className="font-medium text-foreground">Limite individual habilitado na plataforma</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Cada gestor pode acessar seu painel e definir limites específicos por colaborador</li>
                      <li>• O limite individual tem prioridade sobre o limite padrão do time</li>
                      <li>• Sem limite individual configurado, o colaborador segue o padrão acima</li>
                    </ul>
                  </div>
                </div>
              </div>
            </LimitsCard>

            {/* Ações */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline" onClick={() => setGlobalState(savedGlobal)}
                disabled={!hasGlobalChanges || savingGlobal} className="bg-transparent"
              >
                <RotateCcw className="h-4 w-4 mr-2" />Descartar alterações
              </Button>
              <Button onClick={handleSaveGlobal} disabled={!hasGlobalChanges || savingGlobal} className="min-w-36">
                {savingGlobal
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                  : <><Save className="h-4 w-4 mr-2" />Salvar Configurações</>}
              </Button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER GESTOR ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configuração de Feedbacks</h2>
            <p className="mt-2 text-muted-foreground">
              Configure as regras e limites de feedback para seu time ({user.departamento ?? user.nome})
            </p>
          </div>
          {hasGestorChanges && !loadingGestor && (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500">
              <AlertCircle className="h-3 w-3 mr-1" />Alterações não salvas
            </Badge>
          )}
        </div>
      </div>

      {loadingGestor ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ─ Card: Comportamento ─ */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="text-base">Comportamento dos feedbacks</CardTitle>
              <CardDescription>Controle quem pode enviar feedbacks e como eles são processados no seu time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* allowAnyUser */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Permitir envio para qualquer colaborador</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quando desativado, feedbacks ficam restritos aos membros do próprio time.
                  </p>
                </div>
                <Checkbox
                  checked={gestorState.allowAnyUser}
                  onCheckedChange={v => gSet("allowAnyUser", !!v)}
                />
              </div>

              <div className="border-t border-border" />

              {/* allowPublicFeedback */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-chart-1/10">
                  <Globe className="h-4 w-4 text-chart-1" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Permitir feedbacks públicos</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Colaboradores poderão compartilhar feedbacks no feed da comunidade
                    {gestorState.requireApproval ? " após aprovação." : " automaticamente."}
                  </p>
                </div>
                <Checkbox
                  checked={gestorState.allowPublicFeedback}
                  onCheckedChange={v => gSet("allowPublicFeedback", !!v)}
                />
              </div>

              <div className="border-t border-border" />

              {/* requireApproval */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Feedbacks requerem aprovação do gestor</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quando ativado, feedbacks ficam pendentes até sua aprovação no Painel Analítico.
                  </p>
                </div>
                <Checkbox
                  checked={gestorState.requireApproval}
                  onCheckedChange={v => gSet("requireApproval", !!v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* ─ Card: Limites (mesma estrutura do super-admin) ─ */}
          <LimitsCard
            limitsEnabled={gestorState.limitsEnabled}
            maxPerDay={gestorState.maxFeedbacksPerDay}
            maxPerWeek={gestorState.maxFeedbacksPerWeek}
            individualEnabled={gestorState.individualLimitsEnabled}
            onLimitsToggle={v => gSet("limitsEnabled", v)}
            onDayChange={v => gNum("maxFeedbacksPerDay", v)}
            onWeekChange={v => gNum("maxFeedbacksPerWeek", v)}
            onIndividualToggle={v => {
              gSet("individualLimitsEnabled", v)
              if (v) loadTeam()
            }}
          >
            {/* Conteúdo para gestor quando individual habilitado */}
            <div className="space-y-3 pt-1">
              {/* Referência do limite do time */}
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                Padrão deste time: <strong className="text-foreground ml-1">
                  {gestorState.maxFeedbacksPerDay}/dia · {gestorState.maxFeedbacksPerWeek}/sem
                </strong>
                {!gestorState.limitsEnabled && <span className="ml-1">(limites desabilitados)</span>}
              </div>

              {/* Lista de membros */}
              {loadingTeam ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : !teamLimits || teamLimits.members.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <Users className="h-7 w-7 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhum colaborador no seu time ainda.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 divide-y divide-border">
                    {teamLimits.members.map((member, idx) => (
                      <div key={member.userId} className={idx > 0 ? "pt-3" : ""}>
                        <MemberRow
                          member={member}
                          globalDefaults={{
                            limitsEnabled:       gestorState.limitsEnabled,
                            maxFeedbacksPerDay:  gestorState.maxFeedbacksPerDay,
                            maxFeedbacksPerWeek: gestorState.maxFeedbacksPerWeek,
                          }}
                          onSave={handleSetUserLimit}
                          onRemove={handleRemoveUserLimit}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Legenda */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs py-0 px-1.5 text-muted-foreground">Padrão (X/dia · Y/sem)</Badge>
                      = limite do time
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="text-xs py-0 px-1.5 bg-primary/10 text-primary border-primary/20">X/dia · Y/sem</Badge>
                      = personalizado
                    </span>
                  </div>
                </>
              )}
            </div>
          </LimitsCard>

          {/* ─ Ações ─ */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <Button
              variant="outline" onClick={() => setGestorState(savedGestor)}
              disabled={!hasGestorChanges || savingGestor} className="bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />Restaurar Padrões
            </Button>
            <Button onClick={handleSaveGestor} disabled={!hasGestorChanges || savingGestor} className="min-w-36">
              {savingGestor
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>
                : <><Save className="h-4 w-4 mr-2" />Salvar Configurações</>}
            </Button>
          </div>
        </>
      )}

    </div>
  )
}
