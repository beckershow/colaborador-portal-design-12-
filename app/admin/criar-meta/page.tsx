"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  MetasService,
  type TipoMeta,
  type PublicoAlvo,
  type EscopoMeta,
  type PeriodoMeta,
  type CriterioMeta,
  type MetaStatus,
} from "@/lib/metas-service"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Target,
  Users,
  Zap,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Heart,
  ThumbsUp,
  Calendar,
  TrendingUp,
  Lightbulb,
  Shield,
  Info,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const acoesPossiveis = [
  { value: "registro-humor", label: "Registro de Humor", icon: Heart, categoria: "engajamento" },
  { value: "publicacao-feed", label: "Publicação no Feed", icon: MessageSquare, categoria: "engajamento" },
  { value: "curtida", label: "Curtida", icon: ThumbsUp, categoria: "engajamento" },
  { value: "comentario", label: "Comentário", icon: MessageSquare, categoria: "engajamento" },
  { value: "envio-feedback", label: "Envio de Feedback", icon: MessageSquare, categoria: "lideranca" },
  { value: "resposta-pesquisa", label: "Resposta de Pesquisa", icon: Target, categoria: "engajamento" },
  { value: "conclusao-treinamento", label: "Conclusão de Treinamento", icon: GraduationCap, categoria: "desenvolvimento" },
  { value: "participacao-trilha", label: "Participação em Trilha", icon: BookOpen, categoria: "desenvolvimento" },
  { value: "participacao-evento", label: "Participação em Evento", icon: Calendar, categoria: "desenvolvimento" },
  { value: "interacao-recorrente", label: "Interação Recorrente", icon: TrendingUp, categoria: "engajamento" },
]

export default function CriarMetaPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [tipo, setTipo] = useState<TipoMeta>("engajamento")
  const [publicoAlvo, setPublicoAlvo] = useState<PublicoAlvo>("colaboradores")
  const [escopo, setEscopo] = useState<EscopoMeta>("individual")
  const [periodo, setPeriodo] = useState<PeriodoMeta>("semanal")
  const [criterios, setCriterios] = useState<CriterioMeta[]>([])
  const [status, setStatus] = useState<MetaStatus>("rascunho")
  const [disponivelParaGestores, setDisponivelParaGestores] = useState(false)

  // Controle de novo critério
  const [novaAcao, setNovaAcao] = useState("")
  const [novaQuantidade, setNovaQuantidade] = useState(1)

  if (!user || user.role !== "super-admin") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Acesso restrito a Super Admin</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const adicionarCriterio = () => {
    if (!novaAcao) {
      toast({
        title: "Erro",
        description: "Selecione uma ação para o critério",
        variant: "destructive",
      })
      return
    }

    const acaoInfo = acoesPossiveis.find((a) => a.value === novaAcao)
    if (!acaoInfo) return

    const novoCriterio: CriterioMeta = {
      id: `criterio-${Date.now()}`,
      acao: novaAcao as CriterioMeta["acao"],
      quantidadeMinima: novaQuantidade,
      descricao: `${acaoInfo.label} - mínimo ${novaQuantidade}`,
    }

    setCriterios([...criterios, novoCriterio])
    setNovaAcao("")
    setNovaQuantidade(1)

    toast({
      title: "Critério adicionado",
      description: `${acaoInfo.label} adicionado com sucesso`,
    })
  }

  const removerCriterio = (id: string) => {
    setCriterios(criterios.filter((c) => c.id !== id))
    toast({
      title: "Critério removido",
      description: "Critério removido com sucesso",
    })
  }

  const salvarMeta = (novoStatus: MetaStatus) => {
    if (!nome || !descricao) {
      toast({
        title: "Erro",
        description: "Preencha nome e descrição da meta",
        variant: "destructive",
      })
      return
    }

    if (criterios.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um critério à meta",
        variant: "destructive",
      })
      return
    }

    try {
      MetasService.createMeta({
        nome,
        descricao,
        tipo,
        publicoAlvo,
        escopo,
        periodo,
        criterios,
        status: novoStatus,
        disponivelParaGestores,
        criadoPor: user.id,
      })

      toast({
        title: "Meta criada com sucesso",
        description: novoStatus === "ativa" ? "Meta ativada e disponível" : "Meta salva como rascunho",
      })

      router.push("/admin")
    } catch (error) {
      toast({
        title: "Erro ao criar meta",
        description: "Tente novamente",
        variant: "destructive",
      })
    }
  }

  const recomendacoes = MetasService.getRecomendacoesPorCategoria(
    tipo === "engajamento" ? "Engajamento" : tipo === "desenvolvimento" ? "Desenvolvimento" : "Liderança",
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Criar Nova Meta</h1>
            <p className="text-muted-foreground">Configure metas de engajamento, desenvolvimento ou liderança</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => salvarMeta("rascunho")}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button onClick={() => salvarMeta("ativa")}>
            <Send className="h-4 w-4 mr-2" />
            Criar e Ativar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Formulário */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Defina nome, descrição e classificação da meta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Meta *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Cultura de Feedback Contínuo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição da Meta *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o objetivo claro desta meta..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Meta</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMeta)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engajamento">Engajamento</SelectItem>
                      <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                      <SelectItem value="lideranca">Liderança (Gestores)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Público-Alvo</Label>
                  <Select value={publicoAlvo} onValueChange={(v) => setPublicoAlvo(v as PublicoAlvo)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colaboradores">Colaboradores</SelectItem>
                      <SelectItem value="gestores">Gestores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Escopo</Label>
                  <Select value={escopo} onValueChange={(v) => setEscopo(v as EscopoMeta)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoMeta)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Critérios */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Critérios</CardTitle>
              <CardDescription>Defina ações e quantidades mínimas para conclusão da meta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de Critérios Adicionados */}
              {criterios.length > 0 && (
                <div className="space-y-2">
                  <Label>Critérios Configurados ({criterios.length})</Label>
                  <div className="space-y-2">
                    {criterios.map((criterio) => {
                      const acaoInfo = acoesPossiveis.find((a) => a.value === criterio.acao)
                      const Icon = acaoInfo?.icon || Target
                      return (
                        <div key={criterio.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{acaoInfo?.label}</p>
                              <p className="text-sm text-muted-foreground">Mínimo: {criterio.quantidadeMinima}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removerCriterio(criterio.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Adicionar Novo Critério */}
              <div className="space-y-3 p-4 border-2 border-dashed rounded-lg">
                <Label>Adicionar Novo Critério</Label>
                <div className="flex gap-2">
                  <Select value={novaAcao} onValueChange={setNovaAcao}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma ação" />
                    </SelectTrigger>
                    <SelectContent>
                      {acoesPossiveis.map((acao) => (
                        <SelectItem key={acao.value} value={acao.value}>
                          <div className="flex items-center gap-2">
                            <acao.icon className="h-4 w-4" />
                            {acao.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={novaQuantidade}
                    onChange={(e) => setNovaQuantidade(Number.parseInt(e.target.value) || 1)}
                    className="w-24"
                    placeholder="Qtd"
                  />
                  <Button onClick={adicionarCriterio}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governança */}
          <Card>
            <CardHeader>
              <CardTitle>Governança da Meta</CardTitle>
              <CardDescription>Controle de status e disponibilização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label>Disponível para Gestores Ativarem</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que gestores ativem esta meta para seus times
                  </p>
                </div>
                <Switch checked={disponivelParaGestores} onCheckedChange={setDisponivelParaGestores} />
              </div>

              <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">Sobre Status da Meta</p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Rascunho: visível apenas para você. Ativa: disponível para colaboradores/gestores. Inativa: oculta
                    mas pode ser reativada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Recomendações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <CardTitle>Recomendações de {tipo === "engajamento" ? "Engajamento" : tipo === "desenvolvimento" ? "Desenvolvimento" : "Liderança"}</CardTitle>
              </div>
              <CardDescription>Ideias baseadas em boas práticas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recomendacoes.map((rec, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors">
                  <h4 className="font-semibold">{rec.titulo}</h4>
                  <p className="text-sm text-muted-foreground">{rec.objetivo}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">Ações Sugeridas:</p>
                    {rec.acoesSugeridas.map((acao, aidx) => (
                      <p key={aidx} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-primary">•</span>
                        {acao}
                      </p>
                    ))}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rec.beneficioEsperado}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
