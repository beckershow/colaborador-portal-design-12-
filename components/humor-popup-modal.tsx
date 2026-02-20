"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { HumorService } from "@/lib/humor-service"
import { HumorConfigService } from "@/lib/humor-config-service"
import { Heart, Sparkles, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

const moods = [
  {
    value: 5,
    emoji: "😄",
    bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-300",
    selectedBg: "bg-emerald-100 border-emerald-500 ring-4 ring-emerald-200",
  },
  {
    value: 4,
    emoji: "😊",
    bg: "bg-orange-50 hover:bg-orange-100 border-orange-300",
    selectedBg: "bg-orange-100 border-orange-500 ring-4 ring-orange-200",
  },
  {
    value: 3,
    emoji: "😐",
    bg: "bg-slate-50 hover:bg-slate-100 border-slate-300",
    selectedBg: "bg-slate-100 border-slate-500 ring-4 ring-slate-200",
  },
  {
    value: 2,
    emoji: "😔",
    bg: "bg-blue-50 hover:bg-blue-100 border-blue-300",
    selectedBg: "bg-blue-100 border-blue-500 ring-4 ring-blue-200",
  },
  {
    value: 1,
    emoji: "😰",
    bg: "bg-red-50 hover:bg-red-100 border-red-300",
    selectedBg: "bg-red-100 border-red-500 ring-4 ring-red-200",
  },
]

export function HumorPopupModal() {
  const { user, hasRegisteredMood, setHasRegisteredMood } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [config, setConfig] = useState(HumorConfigService.getConfig())

  useEffect(() => {
    setConfig(HumorConfigService.getConfig())
  }, [])

  useEffect(() => {
    // Exibir apenas para colaboradores e somente uma vez por sessão
    if (user && user.role === "colaborador" && !hasRegisteredMood && !dismissed) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [user, hasRegisteredMood, dismissed])

  const handleSubmit = async () => {
    if (!selectedMood || !user) return

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    HumorService.registerMood(user.id, selectedMood)
    setHasRegisteredMood(true)
    setIsSubmitting(false)
    setDismissed(true)
    setIsOpen(false)

    if (config.rewardsEnabled) {
      toast({
        title: "Humor registrado! 🎉",
        description: (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              Você ganhou <strong>+{config.rewardsXp} XP</strong> e{" "}
              <strong>
                ⭐ {config.rewardsStars} {config.rewardsStars === 1 ? "estrela" : "estrelas"}
              </strong>
            </span>
          </div>
        ),
        duration: 3000,
      })
    } else {
      toast({
        title: "Humor registrado! 🎉",
        description: "Obrigado por compartilhar como você está se sentindo hoje.",
        duration: 3000,
      })
    }
  }

  const handleClose = () => {
    if (config.obrigatorio && config.bloquearAcesso) {
      toast({
        title: "Registro obrigatório",
        description: "Você precisa registrar seu humor para continuar usando a plataforma.",
        variant: "destructive",
      })
      return
    }
    setDismissed(true)
    setIsOpen(false)
  }

  if (!user || user.role !== "colaborador" || !config.ativo) return null

  const isObrigatorio = config.obrigatorio && config.bloquearAcesso
  const firstName = user.nome.split(" ")[0]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        style={{ maxWidth: "520px", width: "min(95vw, 520px)", padding: 0 }}
        onPointerDownOutside={(e) => {
          if (isObrigatorio) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isObrigatorio) e.preventDefault()
        }}
        className="overflow-hidden gap-0"
      >
        {/* ── Header gradiente ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 px-8 pb-8 pt-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-6 left-0 h-24 w-48 rounded-full bg-white/10 blur-xl" />

          {/* Botão de fechar — único */}
          {!isObrigatorio && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Fechar"
            >
              <span className="text-base leading-none">✕</span>
            </button>
          )}

          <div className="relative z-10">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/25">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Olá, {firstName}! 👋</h2>
            <p className="mt-1 text-base text-white/90">Como você está chegando hoje?</p>

            {config.rewardsEnabled && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-1.5 text-sm font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                Ganhe +{config.rewardsXp} XP e ⭐ {config.rewardsStars}{" "}
                {config.rewardsStars === 1 ? "estrela" : "estrelas"} ao responder!
              </div>
            )}
          </div>
        </div>

        {/* ── Corpo ── */}
        <div className="space-y-5 px-6 py-6">
          {isObrigatorio && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                Este registro é obrigatório para continuar usando a plataforma.
              </p>
            </div>
          )}

          {/* Botões de humor — apenas emojis */}
          <div className="grid grid-cols-5 gap-3">
            {moods.map((mood) => {
              const isSelected = selectedMood === mood.value
              return (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => setSelectedMood(mood.value)}
                  className={cn(
                    "flex items-center justify-center rounded-2xl border-2 py-5 transition-all duration-200",
                    isSelected
                      ? cn(mood.selectedBg, "scale-110 shadow-md")
                      : cn(mood.bg, "hover:scale-105"),
                  )}
                >
                  <span className="text-4xl leading-none">{mood.emoji}</span>
                </button>
              )
            })}
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleSubmit}
              disabled={!selectedMood || isSubmitting}
              className="clay-button h-12 w-full rounded-xl text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Registrando...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Registrar meu humor
                </>
              )}
            </Button>

            {!isObrigatorio && (
              <Button
                onClick={handleClose}
                variant="ghost"
                className="h-10 w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Pular por agora
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
