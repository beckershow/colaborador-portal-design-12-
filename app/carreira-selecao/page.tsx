"use client"

export const dynamic = "force-dynamic"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Construction } from "lucide-react"

export default function CarreiraSelecaoPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
          <TrendingUp className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carreira e Seleção</h1>
          <p className="text-muted-foreground">Evolução profissional e desenvolvimento de carreira</p>
        </div>
      </div>

      {/* Card informativo */}
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center space-y-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
            <Construction className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Módulo em Desenvolvimento</h2>
            <p className="mx-auto max-w-lg text-base leading-relaxed text-muted-foreground">
              Estamos desenvolvendo o módulo de Carreira e Seleção para evoluir ainda mais a jornada profissional dentro
              da plataforma.
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Em breve, este espaço contará com trilhas de carreira, critérios de evolução e processos de seleção.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
