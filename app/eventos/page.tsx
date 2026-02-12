"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { EventoService, type Evento } from "@/lib/evento-service"
import { Calendar, Clock, MapPin, Video, CalendarPlus, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function EventosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [eventos, setEventos] = useState<Evento[]>([])
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const loadEventos = () => {
      const allEventos = EventoService.getAllEventos()
      setEventos(allEventos)
    }

    loadEventos()

    const handleUpdate = () => loadEventos()
    window.addEventListener("eventosUpdated", handleUpdate)
    return () => window.removeEventListener("eventosUpdated", handleUpdate)
  }, [])

  // Categorizar eventos
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const eventosDeHoje = eventos.filter((e) => {
    const dataEvento = new Date(e.date)
    dataEvento.setHours(0, 0, 0, 0)
    return dataEvento.getTime() === hoje.getTime() && e.isActive
  })

  const proximosEventos = eventos.filter((e) => {
    const dataEvento = new Date(e.date)
    dataEvento.setHours(0, 0, 0, 0)
    return dataEvento.getTime() > hoje.getTime() && e.isActive
  })

  const openDetails = (evento: Evento) => {
    setSelectedEvento(evento)
    setShowDetails(true)
  }

  // Função para adicionar ao calendário (gera arquivo .ics)
  const adicionarAoCalendario = (evento: Evento) => {
    const startDate = new Date(`${evento.date}T${evento.time}`)
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hora de duração padrão

    // Formatar datas para .ics
    const formatIcsDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
    }

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Engage Platform//Event Calendar//PT",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `DTSTART:${formatIcsDate(startDate)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${evento.title}`,
      `DESCRIPTION:${evento.description.replace(/\n/g, "\\n")}`,
      `LOCATION:${evento.location}`,
      `UID:${evento.id}@engage-platform.app`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n")

    // Criar blob e fazer download
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${evento.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Evento adicionado!",
      description: "Abra o arquivo baixado para adicionar ao Outlook, Google Calendar ou Apple Calendar.",
    })
  }

  const acessarLink = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer")
    toast({
      title: "Acessando evento...",
      description: "Uma nova aba foi aberta com o link do evento.",
    })
  }

  // Determinar se evento é online ou presencial baseado na localização
  const isEventoOnline = (location: string) => {
    return location.toLowerCase().includes("http") || location.toLowerCase().includes("online")
  }

  // Componente de Card de Evento
  const EventoCard = ({ evento }: { evento: Evento }) => {
    const dataEvento = new Date(evento.date)
    const isOnline = isEventoOnline(evento.location)

    return (
      <Card
        onClick={() => openDetails(evento)}
        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border group"
      >
        <div className="flex flex-col md:flex-row">
          {/* Conteúdo */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {evento.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{evento.description}</p>
              </div>
            </div>

            {/* Informações do Evento */}
            <div className="flex flex-wrap items-center gap-4 text-sm mt-4 mb-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {dataEvento.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </span>

              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">{evento.time}</span>
              </span>

              <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
                {isOnline ? (
                  <>
                    <Video className="h-3 w-3" />
                    Online
                  </>
                ) : (
                  <>
                    <MapPin className="h-3 w-3" />
                    Presencial
                  </>
                )}
              </Badge>
            </div>

            {/* Local/Link */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              {isOnline ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span className="line-clamp-1">{evento.location}</span>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-4 border-t border-border/50">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={(e) => {
                  e.stopPropagation()
                  adicionarAoCalendario(evento)
                }}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                Adicionar ao calendário
              </Button>
              {isOnline && (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    acessarLink(evento.location)
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Acessar evento
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Eventos</h1>
          <p className="text-lg text-muted-foreground">
            Participe dos eventos e atividades programadas para o seu desenvolvimento
          </p>
        </div>

        {/* Eventos de Hoje */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-1 bg-primary rounded-full" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Eventos de Hoje</h2>
              
            </div>
          </div>

          {eventosDeHoje.length > 0 ? (
            <div className="space-y-4">
              {eventosDeHoje.map((evento) => (
                <EventoCard key={evento.id} evento={evento} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-40" />
                <p className="text-xl font-semibold text-foreground mb-2">Nenhum evento hoje</p>
                <p className="text-sm text-muted-foreground">Confira os próximos eventos programados abaixo</p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Próximos Eventos */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-1 bg-primary rounded-full" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Próximos Eventos</h2>
              <p className="text-sm text-muted-foreground">Programe-se para participar</p>
            </div>
          </div>

          {proximosEventos.length > 0 ? (
            <div className="space-y-4">
              {proximosEventos.map((evento) => (
                <EventoCard key={evento.id} evento={evento} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-40" />
                <p className="text-xl font-semibold text-foreground mb-2">Nenhum evento programado</p>
                <p className="text-sm text-muted-foreground">Novos eventos serão exibidos aqui</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Modal de Detalhes do Evento */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedEvento && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-3xl font-bold mb-2">{selectedEvento.title}</DialogTitle>
                    <DialogDescription className="text-base">
                      {new Date(selectedEvento.date).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      {" às "}
                      {selectedEvento.time}
                    </DialogDescription>
                  </div>
                  <Badge variant={isEventoOnline(selectedEvento.location) ? "default" : "secondary"}>
                    {isEventoOnline(selectedEvento.location) ? (
                      <>
                        <Video className="h-3 w-3 mr-1" />
                        Online
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3 w-3 mr-1" />
                        Presencial
                      </>
                    )}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Descrição */}
              <div className="space-y-3">
                <h3 className="font-bold text-lg text-foreground">Sobre o Evento</h3>
                <p className="text-muted-foreground leading-relaxed">{selectedEvento.description}</p>
              </div>

              {/* Informações do Evento */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Data</p>
                      <p className="text-foreground">
                        {new Date(selectedEvento.date).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-muted-foreground">Horário</p>
                      <p className="text-foreground">{selectedEvento.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {isEventoOnline(selectedEvento.location) ? (
                      <Video className="h-5 w-5 text-primary mt-0.5" />
                    ) : (
                      <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-muted-foreground">
                        {isEventoOnline(selectedEvento.location) ? "Link do evento" : "Local"}
                      </p>
                      <p className="text-foreground break-all">{selectedEvento.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1" onClick={() => adicionarAoCalendario(selectedEvento)}>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Adicionar ao calendário
                </Button>
                {isEventoOnline(selectedEvento.location) && (
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => acessarLink(selectedEvento.location)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar evento online
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
