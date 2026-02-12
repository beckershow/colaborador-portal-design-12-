"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, CalendarIcon, Users, Target, AlertCircle, X, MessageSquare, Heart, FileText, Sparkles, Eye } from "lucide-react"
import { MissaoDoDiaService } from "@/lib/missao-do-dia-service"

export default function CriarMissaoDoDiaPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    titulo: "",
    subtitulo: "",
    descricao: "",
  })

  // TASK 2: Estado para controlar se o botão de ação está ativo
  const [acaoAtiva, setAcaoAtiva] = useState(false)
  const [acaoSelecionada, setAcaoSelecionada] = useState<string>("")

  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [tempDate, setTempDate] = useState("")

  const [publicoAlvo, setPublicoAlvo] = useState<{
    type: "todo_time" | "colaboradores_especificos"
    targetIds: string[]
  }>({
    type: "todo_time",
    targetIds: [],
  })

  if (!user || !hasPermission(["gestor", "super-admin"])) {
    router.push("/")
    return null
  }

  const managedCollaborators = [
    { id: "3", nome: "Ana Carolina Silva", cargo: "Analista de Marketing" },
    { id: "4", nome: "Pedro Henrique Costa", cargo: "Designer Gráfico" },
    { id: "5", nome: "Julia Santos Lima", cargo: "Analista de Conteúdo" },
  ]

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

  const addDate = () => {
    if (tempDate && !selectedDates.includes(tempDate)) {
      setSelectedDates([...selectedDates, tempDate].sort())
      setTempDate("")
    }
  }

  const removeDate = (date: string) => {
    setSelectedDates(selectedDates.filter((d) => d !== date))
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  // Opções de ação
  const acoesDisponiveis = [
    { value: "feed-social", label: "Ir para Feed Social", icon: MessageSquare, href: "/feed-social" },
    { value: "registrar-humor", label: "Registrar Humor", icon: Heart, href: "/humor" },
    { value: "enviar-feedback", label: "Enviar Feedback", icon: MessageSquare, href: "/feedbacks" },
    { value: "responder-pesquisa", label: "Responder Pesquisa", icon: FileText, href: "/pesquisas" },
  ]

  const getAcaoInfo = () => {
    return acoesDisponiveis.find((a) => a.value === acaoSelecionada)
  }

  const handleSubmit = () => {
    if (!formData.titulo || !formData.descricao) {
      toast({
        title: "Erro de Validação",
        description: "Preencha título e descrição da missão",
        variant: "destructive",
      })
      return
    }

    if (selectedDates.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Selecione ao menos uma data para a missão",
        variant: "destructive",
      })
      return
    }

    if (publicoAlvo.type !== "todo_time" && publicoAlvo.targetIds.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Selecione ao menos um colaborador",
        variant: "destructive",
      })
      return
    }

    MissaoDoDiaService.createMissao({
      nome: formData.titulo,
      subtitulo: formData.subtitulo,
      descricao: formData.descricao,
      diasAtivos: selectedDates,
      publicoAlvo,
      acaoAtiva,
      acaoDestino: acaoSelecionada,
      createdBy: user.nome,
      createdByRole: user.role,
      isActive: true,
    })

    toast({
      title: "Missão do Dia Criada!",
      description: `${formData.titulo} foi criada para ${selectedDates.length} dia(s) específico(s).`,
    })

    router.push("/admin?tab=criacoes")
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8 px-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="clay-button bg-transparent" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-4xl font-bold text-foreground">Criar Missão do Dia</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Configure uma missão simples e recorrente para dias específicos
          </p>
        </div>
        <Button onClick={handleSubmit} size="lg" className="clay-button">
          <Save className="mr-2 h-5 w-5" />
          Publicar Missão
        </Button>
      </div>

      {/* TASK 1: Layout em duas colunas */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Coluna Esquerda: Formulário */}
        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Informações da Missão
              </CardTitle>
              <CardDescription>Defina o título, subtítulo e descrição da missão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Título <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: Compartilhe uma conquista da semana no Feed Social"
                />
                <p className="text-xs text-muted-foreground">Este será o título principal em destaque</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Subtítulo <span className="text-muted-foreground">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={formData.subtitulo}
                  onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: Desafio de hoje para fortalecer a cultura do time"
                />
                <p className="text-xs text-muted-foreground">Aparece logo abaixo do título principal</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Descrição Completa <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Inspire seus colegas compartilhando uma vitória, aprendizado ou momento especial desta semana no Feed Social."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Descrição detalhada que explica o que o colaborador deve fazer</p>
              </div>
            </CardContent>
          </Card>

          {/* TASK 2: Card de Configuração de Ação */}
          <Card className="clay-card border-0 border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Ação da Missão
              </CardTitle>
              <CardDescription>Configure um botão de ação para direcionar o colaborador</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex-1">
                  <Label htmlFor="acao-toggle" className="text-sm font-medium cursor-pointer">
                    Ativar botão de ação?
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {acaoAtiva ? "O card mostrará um botão para ação" : "O card mostrará apenas o texto descritivo"}
                  </p>
                </div>
                <Switch id="acao-toggle" checked={acaoAtiva} onCheckedChange={setAcaoAtiva} />
              </div>

              {acaoAtiva && (
                <div className="space-y-2 animate-in fade-in-50 duration-200">
                  <label className="text-sm font-medium text-foreground">
                    Selecione o destino <span className="text-destructive">*</span>
                  </label>
                  <Select value={acaoSelecionada} onValueChange={setAcaoSelecionada}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Escolha para onde direcionar o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {acoesDisponiveis.map((acao) => {
                        const Icon = acao.icon
                        return (
                          <SelectItem key={acao.value} value={acao.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{acao.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O botão será exibido no card da missão e direcionará para esta página
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-accent/10 border border-accent/30 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Regra de Negócio:</p>
                    <p>A Missão do Dia permite apenas uma ação vinculada por vez ou apenas texto descritivo. Não há validação automática de conclusão.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendário de Recorrência */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Calendário de Recorrência
              </CardTitle>
              <CardDescription>Selecione os dias específicos em que a missão aparecerá</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>A missão aparecerá SOMENTE nos dias selecionados e sumirá automaticamente após passar</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Adicionar datas <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <Button type="button" onClick={addDate} disabled={!tempDate} className="clay-button">
                    Adicionar
                  </Button>
                </div>

                {selectedDates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Dias selecionados ({selectedDates.length}):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDates.map((date) => (
                        <Badge key={date} variant="secondary" className="px-3 py-1.5 text-sm flex items-center gap-2">
                          {formatDate(date)}
                          <button type="button" onClick={() => removeDate(date)} className="ml-1 hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                <p className="text-sm text-foreground">
                  <strong>Exemplo de uso:</strong>
                </p>
                <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Missão 01: Segunda, Quarta e Sexta</li>
                  <li>Missão 02: Terça e Quinta</li>
                  <li>Múltiplas missões podem coexistir em dias diferentes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Público-Alvo */}
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Público-Alvo
              </CardTitle>
              <CardDescription>Quem participará desta missão (inscrição automática)</CardDescription>
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
                    Todo o meu time
                  </Button>
                  <Button
                    type="button"
                    variant={publicoAlvo.type === "colaboradores_especificos" ? "default" : "outline"}
                    className={`w-full justify-start ${publicoAlvo.type === "colaboradores_especificos" ? "clay-button" : ""}`}
                    onClick={() => setPublicoAlvo({ type: "colaboradores_especificos", targetIds: [] })}
                  >
                    Colaboradores específicos
                  </Button>
                </div>
              </div>

              {publicoAlvo.type === "colaboradores_especificos" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Selecione os colaboradores:</label>
                  <div className="space-y-2">
                    {managedCollaborators.map((collab) => (
                      <div
                        key={collab.id}
                        className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                          publicoAlvo.targetIds.includes(collab.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleCollaborator(collab.id)}
                      >
                        <div>
                          <div className="font-medium text-foreground">{collab.nome}</div>
                          <div className="text-sm text-muted-foreground">{collab.cargo}</div>
                        </div>
                        {publicoAlvo.targetIds.includes(collab.id) && <Badge className="bg-primary">Selecionado</Badge>}
                      </div>
                    ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

          {/* Comportamento Obrigatório */}
          <Card className="clay-card border-0 border-l-4 border-l-accent">
            <CardHeader>
              <CardTitle>Comportamento da Missão do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-accent/10 border border-accent/30 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Esta é uma missão simples e recorrente:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Aparece SOMENTE nos dias selecionados</li>
                      <li>Some automaticamente após o dia passar</li>
                      <li>Não gera fluxo longo - é apenas um lembrete + ação simples</li>
                      <li>Colaboradores são automaticamente inscritos</li>
                      <li>Múltiplas missões podem coexistir em dias diferentes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão Final */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button className="clay-button" onClick={handleSubmit}>
              <Save className="mr-2 h-4 w-4" />
              Criar Missão do Dia
            </Button>
          </div>
        </div>

        {/* TASK 1 & 3: Coluna Direita - Preview em Tempo Real (Sticky) */}
        <div className="space-y-6">
          <div className="sticky top-8">
            <Card className="clay-card border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <CardTitle>Preview em Tempo Real</CardTitle>
                </div>
                <CardDescription>Visualização de como o card aparecerá para o colaborador</CardDescription>
              </CardHeader>
              <CardContent>
                {/* TASK 3: Réplica exata do card da Home do Colaborador */}
                <div className="rounded-xl border-2 border-dashed border-primary/30 p-1">
                  <Card className="clay-card border-0 border-l-4 border-l-primary bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-primary/20 p-3">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">
                            {formData.titulo || "Título da Missão do Dia"}
                          </CardTitle>
                          <CardDescription>
                            {formData.subtitulo || "Desafio de hoje para fortalecer a cultura do time"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-muted-foreground whitespace-pre-wrap">
                            {formData.descricao || "Digite a descrição da missão no formulário ao lado para ver o preview em tempo real..."}
                          </p>
                        </div>

                        {acaoAtiva && acaoSelecionada && (
                          <div className="flex items-center gap-3 animate-in fade-in-50 duration-200">
                            {(() => {
                              const acaoInfo = getAcaoInfo()
                              if (!acaoInfo) return null
                              const Icon = acaoInfo.icon
                              return (
                                <Button size="lg" className="clay-button">
                                  <Icon className="mr-2 h-5 w-5" />
                                  {acaoInfo.label}
                                </Button>
                              )
                            })()}
                          </div>
                        )}

                        {!acaoAtiva && (
                          <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground italic">
                            Nenhuma ação configurada - apenas texto descritivo
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-4 rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">💡 Dica:</span> Este é exatamente como o card aparecerá na Home do Colaborador. Digite nos campos ao lado para ver as mudanças em tempo real.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
