"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { HumorService } from "@/lib/humor-service"
import { HumorConfigService } from "@/lib/humor-config-service"
import { Heart, Sparkles, X, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function HumorPopupModal() {
  const { user, hasRegisteredMood, setHasRegisteredMood } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [config, setConfig] = useState(HumorConfigService.getConfig())

  useEffect(() => {
    // Carregar config atualizada
    setConfig(HumorConfigService.getConfig())
  }, [])

  useEffect(() => {
    if (user && !hasRegisteredMood) {
      const hasInStorage = HumorService.hasRegisteredToday(user.id)

      if (hasInStorage) {
        // Se já tem no localStorage mas o contexto não sabe, sincronizar
        setHasRegisteredMood(true)
        return
      }

      // TASK 9: Garantir que seja o PRIMEIRO pop-up ao acessar a plataforma
      // Abrir imediatamente após o carregamento (300ms para garantir renderização)
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [user, hasRegisteredMood, setHasRegisteredMood])

  const moods = [
    { value: 5, emoji: "😄", label: "Ótimo", color: "bg-primary/10 hover:bg-primary/20 border-primary" },
    { value: 4, emoji: "😊", label: "Bem", color: "bg-chart-1/10 hover:bg-chart-1/20 border-chart-1" },
    { value: 3, emoji: "😐", label: "Neutro", color: "bg-muted hover:bg-muted/80 border-muted-foreground" },
    { value: 2, emoji: "😔", label: "Triste", color: "bg-chart-3/10 hover:bg-chart-3/20 border-chart-3" },
    {
      value: 1,
      emoji: "😰",
      label: "Estressado",
      color: "bg-destructive/10 hover:bg-destructive/20 border-destructive",
    },
  ]

  const handleSubmit = async () => {
    if (!selectedMood || !user) return

    setIsSubmitting(true)

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 800))

    HumorService.registerMood(user.id, selectedMood)

    setHasRegisteredMood(true)

    setIsSubmitting(false)
    setIsOpen(false)

    // TASK 9: Mostrar os ganhos após o registro
    if (config.rewardsEnabled) {
      toast({
        title: "Humor Registrado com Sucesso!",
        description: (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              Você ganhou <strong>+{config.rewardsXp} XP</strong> e <strong>⭐ {config.rewardsStars} {config.rewardsStars === 1 ? 'estrela' : 'estrelas'}</strong>
            </span>
          </div>
        ),
        duration: 3000,
      })
    } else {
      toast({
        title: "Humor Registrado com Sucesso!",
        description: "Obrigado por compartilhar como você está se sentindo hoje.",
        duration: 3000,
      })
    }
  }

  const handleClose = () => {
    // TASK 9: Respeitar a obrigatoriedade
    if (config.obrigatorio && config.bloquearAcesso) {
      // Não permite fechar se for obrigatório com bloqueio
      toast({
        title: "Registro obrigatório",
        description: "Você precisa registrar seu humor para continuar usando a plataforma.",
        variant: "destructive",
      })
      return
    }
    
    // Permite fechar normalmente
    setIsOpen(false)
  }

  if (!user || hasRegisteredMood || !config.ativo) return null

  const isObrigatorio = config.obrigatorio && config.bloquearAcesso

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => {
        // TASK 9: Impedir fechar clicando fora se obrigatório
        if (isObrigatorio) {
          e.preventDefault()
        }
      }} onEscapeKeyDown={(e) => {
        // TASK 9: Impedir fechar com ESC se obrigatório
        if (isObrigatorio) {
          e.preventDefault()
        }
      }}>
        {/* Botão de fechar - apenas se não for obrigatório */}
        {!isObrigatorio && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </button>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-chart-3" />
            Como você está se sentindo hoje?
          </DialogTitle>
          <DialogDescription className="text-base">
            {/* TASK 9: Mostrar os ganhos ANTES do registro */}
            {config.rewardsEnabled ? (
              <>
                <span className="block mb-2">Registre seu humor diário e ganhe recompensas!</span>
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    +{config.rewardsXp} XP e ⭐ {config.rewardsStars} {config.rewardsStars === 1 ? 'estrela' : 'estrelas'}
                  </span>
                </span>
              </>
            ) : (
              "Esse check-in nos ajuda a cuidar do seu bem-estar."
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Aviso de obrigatoriedade */}
        {isObrigatorio && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-900">
              Este registro é obrigatório. Você precisa registrar seu humor para continuar usando a plataforma.
            </p>
          </div>
        )}

        <div className="py-6">
          <div className="grid grid-cols-5 gap-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => setSelectedMood(mood.value)}
                className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all clay-button ${mood.color} ${
                  selectedMood === mood.value ? "ring-4 ring-primary/30 scale-105" : ""
                }`}
              >
                <span className="text-6xl transition-transform hover:scale-110">{mood.emoji}</span>
                <span className="text-sm font-semibold">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {/* Botão "Pular" - apenas se não for obrigatório */}
          {!isObrigatorio && (
            <Button onClick={handleClose} variant="outline" size="lg">
              Pular por enquanto
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!selectedMood || isSubmitting}
            className="clay-button min-w-32"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Registrando...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Confirmar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
