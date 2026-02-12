"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { EventoService } from "@/lib/evento-service"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import {
  Calendar,
  ArrowLeft,
  Save,
  Star,
  Award,
  MapPin,
  Clock,
  Upload,
  Link as LinkIcon,
  MapPinOff,
  Users,
  CheckCircle2,
  Zap,
  ImageIcon,
  Eye,
} from "lucide-react"

interface EventFormData {
  // Campos obrigatórios
  titulo: string
  descricao: string
  capa: {
    tipo: "upload" | "url"
    valor: string
  }
  tipoEvento: "presencial" | "online"
  local: string // Local físico ou link
  habilitarLinkAssistir: boolean // Para eventos presenciais
  linkAssistir: string // Link para assistir evento presencial
  dataEvento: string
  dataTermino: string // Nova: data de término opcional
  horaInicio: string
  horaTermino: string

  // TASK 6 - Público-alvo
  publicoTipo: "todo-time" | "colaboradores-especificos"
  colaboradoresSelecionados: string[]

  // TASK 8 - Ganhos
  habilitarGanhos: boolean
  xp: number
  estrelas: number
}

export default function CreateEventoPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [colaboradoresDoTime, setColaboradoresDoTime] = useState<any[]>([])

  const [formData, setFormData] = useState<EventFormData>({
    titulo: "",
    descricao: "",
    capa: { tipo: "url", valor: "" },
    tipoEvento: "presencial",
    local: "",
    habilitarLinkAssistir: false,
    linkAssistir: "",
    dataEvento: new Date().toISOString().split("T")[0],
    dataTermino: "",
    horaInicio: "",
    horaTermino: "",
    publicoTipo: "todo-time",
    colaboradoresSelecionados: [],
    habilitarGanhos: false,
    xp: 50,
    estrelas: 5,
  })

  useEffect(() => {
    // Carregar colaboradores mock
    if (typeof window !== "undefined" && user) {
      const colaboradoresMock = [
        { id: "1", nome: "Ana Silva", email: "ana@empresa.com", cargo: "Desenvolvedor" },
        { id: "2", nome: "Bruno Costa", email: "bruno@empresa.com", cargo: "Designer" },
        { id: "3", nome: "Carla Mendes", email: "carla@empresa.com", cargo: "Product Manager" },
        { id: "4", nome: "Daniel Souza", email: "daniel@empresa.com", cargo: "QA" },
        { id: "5", nome: "Elaine Rocha", email: "elaine@empresa.com", cargo: "Desenvolvedor" },
      ]
      setColaboradoresDoTime(colaboradoresMock)
    }
  }, [user])

  const toggleDiaSemana = (diaId: string) => {
    setFormData((prevData) => {
      const newDiasDaSemana = prevData.diasDaSemana.includes(diaId)
        ? prevData.diasDaSemana.filter((id) => id !== diaId)
        : [...prevData.diasDaSemana, diaId]
      return { ...prevData, diasDaSemana: newDiasDaSemana }
    })
  }

  if (!user || !hasPermission(["gestor", "super-admin"])) {
    router.push("/")
    return null
  }

  const handleSubmit = () => {
    // Validações obrigatórias
    if (!formData.titulo.trim()) {
      toast({
        title: "Erro de Validação",
        description: "O título é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!formData.descricao.trim()) {
      toast({
        title: "Erro de Validação",
        description: "A descrição é obrigatória",
        variant: "destructive",
      })
      return
    }

    // Imagem de capa agora é OPCIONAL - removida validação

    if (!formData.local.trim()) {
      toast({
        title: "Erro de Validação",
        description: formData.tipoEvento === "presencial" ? "O local é obrigatório" : "O link é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!formData.dataEvento) {
      toast({
        title: "Erro de Validação",
        description: "A data do evento é obrigatória",
        variant: "destructive",
      })
      return
    }

    // Hora de início e término agora são opcionais - validação removida

    if (formData.publicoTipo === "colaboradores-especificos" && formData.colaboradoresSelecionados.length === 0) {
      toast({
        title: "Erro de Validação",
        description: "Selecione pelo menos um colaborador",
        variant: "destructive",
      })
      return
    }

    // Criar evento com EventoService (adaptando ao formato existente)
    EventoService.createEvento({
      title: formData.titulo,
      description: formData.descricao,
      date: formData.dataEvento,
      time: formData.horaInicio,
      location: formData.local,
      rewardXP: formData.exigirRegistroPresenca && formData.habilitarGanhos ? formData.xp : 0,
      rewardStars: formData.exigirRegistroPresenca && formData.habilitarGanhos ? formData.estrelas : 0,
      isActive: true,
      createdBy: user.name,
    })

    toast({
      title: "Evento Criado!",
      description: `${formData.titulo} foi criado com sucesso.`,
    })

    router.push("/admin?tab=criacoes")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl py-6 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            className="clay-button bg-transparent"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">Criar Evento</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Configure um evento corporativo com todos os detalhes
            </p>
          </div>
          <Button onClick={handleSubmit} size="lg" className="clay-button">
            <Save className="mr-2 h-5 w-5" />
            Publicar Evento
          </Button>
        </div>

        {/* Layout: Formulário + Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna esquerda: Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* CARD 1: Informações Básicas */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Título, descrição e imagem de capa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Título */}
                <div className="space-y-2">
                  <Label>
                    Título do Evento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ex: Workshop de Liderança 2025"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label>
                    Descrição <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o evento, os temas abordados e o que os participantes podem esperar..."
                    rows={4}
                  />
                </div>

                {/* Imagem de capa */}
                <div className="space-y-3">
                  <Label>
                    Imagem de Capa (opcional)
                  </Label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="capa-upload-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Simular upload
                          const fakeUrl = `https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop`
                          setFormData({ ...formData, capa: { tipo: "upload", valor: fakeUrl } })
                          toast({
                            title: "Imagem carregada",
                            description: `${file.name} foi carregado com sucesso`,
                          })
                        }
                        e.target.value = ""
                      }}
                    />
                    <Button
                      type="button"
                      variant={formData.capa.tipo === "url" ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, capa: { ...formData.capa, tipo: "url" } })}
                      className="flex-1"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      URL da Imagem
                    </Button>
                    <Button
                      type="button"
                      variant={formData.capa.tipo === "upload" ? "default" : "outline"}
                      onClick={() => {
                        setFormData({ ...formData, capa: { ...formData.capa, tipo: "upload" } })
                        setTimeout(() => {
                          document.getElementById("capa-upload-input")?.click()
                        }, 100)
                      }}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Fazer Upload
                    </Button>
                  </div>

                  {formData.capa.tipo === "url" && (
                    <Input
                      value={formData.capa.valor}
                      onChange={(e) => setFormData({ ...formData, capa: { tipo: "url", valor: e.target.value } })}
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  )}

                  {formData.capa.valor && (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img
                        src={formData.capa.valor || "/placeholder.svg"}
                        alt="Preview da capa"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: Tipo e Localização */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Tipo e Localização</CardTitle>
                <CardDescription>Defina se é presencial ou online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo do Evento */}
                <div className="space-y-3">
                  <Label>
                    Tipo do Evento <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Card
                      className={`cursor-pointer transition-all ${
                        formData.tipoEvento === "presencial"
                          ? "border-primary bg-primary/5 border-2"
                          : "border hover:border-primary/50"
                      }`}
                      onClick={() => setFormData({ ...formData, tipoEvento: "presencial", local: "" })}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={formData.tipoEvento === "presencial"}
                            onChange={() => setFormData({ ...formData, tipoEvento: "presencial", local: "" })}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-sm">Presencial</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">Evento em local físico</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={`cursor-pointer transition-all ${
                        formData.tipoEvento === "online"
                          ? "border-primary bg-primary/5 border-2"
                          : "border hover:border-primary/50"
                      }`}
                      onClick={() => setFormData({ ...formData, tipoEvento: "online", local: "" })}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={formData.tipoEvento === "online"}
                            onChange={() => setFormData({ ...formData, tipoEvento: "online", local: "" })}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPinOff className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-sm">Online</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">Evento virtual</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Local ou Link */}
                <div className="space-y-2">
                  <Label>
                    {formData.tipoEvento === "presencial" ? "Local" : "Link da Reunião"}{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    placeholder={
                      formData.tipoEvento === "presencial"
                        ? "Ex: Sala de Conferência A, 3º andar"
                        : "Ex: https://meet.google.com/xyz-abcd-efg"
                    }
                  />
                </div>

                {/* Nova feature: Link para assistir (apenas para eventos presenciais) */}
                {formData.tipoEvento === "presencial" && (
                  <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-primary" />
                          <p className="font-medium text-sm">Disponibilizar link para assistir</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Permite que colaboradores assistam o evento remotamente
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.habilitarLinkAssistir}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            habilitarLinkAssistir: e.target.checked,
                            linkAssistir: e.target.checked ? formData.linkAssistir : ""
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    
                    {formData.habilitarLinkAssistir && (
                      <div className="space-y-2">
                        <Label>Link da transmissão</Label>
                        <Input
                          value={formData.linkAssistir}
                          onChange={(e) => setFormData({ ...formData, linkAssistir: e.target.value })}
                          placeholder="Ex: https://meet.google.com/abc-defg-hij"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CARD 3: Data e Hora */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle>Data e Horário</CardTitle>
                <CardDescription>Defina quando o evento acontecerá</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Linha 1: Data de início e Data de término */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Data do Evento <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.dataEvento}
                      onChange={(e) => setFormData({ ...formData, dataEvento: e.target.value })}
                    />
                  </div>

                  {/* Data de término */}
                  <div className="space-y-2">
                    <Label>Data de Término (opcional)</Label>
                    <Input
                      type="date"
                      value={formData.dataTermino}
                      onChange={(e) => setFormData({ ...formData, dataTermino: e.target.value })}
                      min={formData.dataEvento}
                    />
                  </div>
                </div>

                {/* Linha 2: Hora de início e Hora de término - ambas opcionais */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora de Início (opcional)</Label>
                    <Input
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                    />
                  </div>

                  {/* Hora de término */}
                  <div className="space-y-2">
                    <Label>Hora de Término (opcional)</Label>
                    <Input
                      type="time"
                      value={formData.horaTermino}
                      onChange={(e) => setFormData({ ...formData, horaTermino: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TASK 6: CARD 4 - Público-alvo */}
            <Card className="clay-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Público-alvo
                </CardTitle>
                <CardDescription>Quem poderá ver e participar deste evento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Opção: Todo o time */}
                <Card
                  className={`cursor-pointer transition-all ${
                    formData.publicoTipo === "todo-time"
                      ? "border-primary bg-primary/5 border-2"
                      : "border hover:border-primary/50"
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, publicoTipo: "todo-time", colaboradoresSelecionados: [] })
                  }
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={formData.publicoTipo === "todo-time"}
                        onChange={() =>
                          setFormData({ ...formData, publicoTipo: "todo-time", colaboradoresSelecionados: [] })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">Todo o time</h4>
                        <p className="text-xs text-muted-foreground">
                          Todos os colaboradores poderão ver e participar deste evento
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Opção: Colaboradores específicos */}
                <Card
                  className={`cursor-pointer transition-all ${
                    formData.publicoTipo === "colaboradores-especificos"
                      ? "border-primary bg-primary/5 border-2"
                      : "border hover:border-primary/50"
                  }`}
                  onClick={() => setFormData({ ...formData, publicoTipo: "colaboradores-especificos" })}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={formData.publicoTipo === "colaboradores-especificos"}
                        onChange={() => setFormData({ ...formData, publicoTipo: "colaboradores-especificos" })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">Colaboradores específicos</h4>
                        <p className="text-xs text-muted-foreground">
                          Selecione manualmente quem poderá ver e participar
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de colaboradores */}
                {formData.publicoTipo === "colaboradores-especificos" && (
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base">Selecionar Colaboradores</CardTitle>
                      <CardDescription>Escolha os colaboradores que terão acesso ao evento</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {colaboradoresDoTime.length > 0 ? (
                        <>
                          <div className="space-y-2">
                            {colaboradoresDoTime.map((colaborador) => (
                              <div
                                key={colaborador.id}
                                className="flex items-center gap-3 p-3 border rounded hover:bg-accent/5 cursor-pointer"
                                onClick={() => {
                                  const isSelected = formData.colaboradoresSelecionados.includes(colaborador.id)
                                  const newSelected = isSelected
                                    ? formData.colaboradoresSelecionados.filter((id) => id !== colaborador.id)
                                    : [...formData.colaboradoresSelecionados, colaborador.id]
                                  setFormData({ ...formData, colaboradoresSelecionados: newSelected })
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.colaboradoresSelecionados.includes(colaborador.id)}
                                  onChange={() => {}}
                                  className="w-4 h-4"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{colaborador.nome}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {colaborador.cargo} • {colaborador.email}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {formData.colaboradoresSelecionados.length > 0 && (
                            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                              <CardContent className="pt-3">
                                <p className="text-sm">
                                  <strong>{formData.colaboradoresSelecionados.length}</strong> colaborador(es)
                                  selecionado(s)
                                </p>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum colaborador encontrado no seu time
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* CARD 5 - Registro de Presença (EM BREVE) */}
            <Card className="clay-card border-0 opacity-60 pointer-events-none relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  Em breve
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  Registro de Presença
                </CardTitle>
                <CardDescription>
                  Funcionalidade de registro de presença e comprovantes estará disponível em breve
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 rounded-lg bg-muted/30 border-2 border-dashed border-muted-foreground/20">
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="font-semibold text-sm text-muted-foreground">
                      Registro de Presença em Desenvolvimento
                    </p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Em breve você poderá exigir que colaboradores registrem presença no evento e façam upload de 
                      comprovantes. Ganhos de XP e estrelas também estarão disponíveis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 6 - Ganhos */}
            
          </div>

          {/* Coluna direita: Preview */}
          <div className="lg:col-span-1">
            <Card className="clay-card border-0">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  <CardTitle>Preview</CardTitle>
                </div>
                <CardDescription>Como o colaborador verá o evento</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Preview Card */}
                <div className="rounded-lg border overflow-hidden bg-card">
                  {/* Imagem */}
                  <div className="relative h-40 bg-muted">
                    {formData.capa.valor ? (
                      <img src={formData.capa.valor || "/placeholder.svg"} alt="Capa" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-base line-clamp-2">
                      {formData.titulo || "Título do evento"}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {formData.descricao || "Descrição do evento"}
                    </p>

                    {/* Data e hora */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formData.dataEvento
                            ? new Date(formData.dataEvento).toLocaleDateString("pt-BR")
                            : "Data não definida"}
                        </span>
                        {/* Mostrar data de término se preenchida */}
                        {formData.dataTermino && (
                          <>
                            <span>até</span>
                            <span>{new Date(formData.dataTermino).toLocaleDateString("pt-BR")}</span>
                          </>
                        )}
                      </div>
                      
                      {/* Hora de início e término */}
                      {(formData.horaInicio || formData.horaTermino) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formData.horaInicio && <span>{formData.horaInicio}</span>}
                          {formData.horaInicio && formData.horaTermino && <span>-</span>}
                          {formData.horaTermino && <span>{formData.horaTermino}</span>}
                        </div>
                      )}
                    </div>

                    {/* Local/Tipo */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {formData.tipoEvento === "presencial" ? (
                          <>
                            <MapPin className="h-3 w-3" />
                            <span className="text-muted-foreground">
                              {formData.local || "Local não definido"}
                            </span>
                          </>
                        ) : (
                          <>
                            <MapPinOff className="h-3 w-3 text-primary" />
                            <span className="text-muted-foreground">Online</span>
                          </>
                        )}
                      </div>
                      
                      {/* Mostrar link para assistir se habilitado (eventos presenciais) */}
                      {formData.tipoEvento === "presencial" && formData.habilitarLinkAssistir && formData.linkAssistir && (
                        <div className="flex items-center gap-2 text-xs">
                          <LinkIcon className="h-3 w-3 text-primary" />
                          <span className="text-primary font-medium">Disponível para assistir online</span>
                        </div>
                      )}
                    </div>

                    {/* Ganhos */}
                    {formData.habilitarGanhos && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className="flex items-center gap-1 text-xs">
                          <Zap className="h-3 w-3 text-accent" />
                          <span className="font-semibold">+{formData.xp} XP</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="font-semibold">+{formData.estrelas} ★</span>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex gap-2">
                      {!formData.habilitarGanhos && (
                        <Badge variant="secondary" className="text-xs">
                          Informativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
