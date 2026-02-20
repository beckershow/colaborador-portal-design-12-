"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Zap, Users, Trophy } from "lucide-react"

export default function LoginPage() {
  const { login, user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/")
    }
  }, [authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await login(email.trim(), password)
      router.replace("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciais inválidas. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">

      {/* ── LEFT PANEL — brand ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 xl:w-3/5">

        {/* Background */}
        <div className="absolute inset-0 bg-[#1a1208]" />

        {/* Glow blobs */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-orange-500/25 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-yellow-400/15 blur-[100px]" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-orange-400/10 blur-[80px]" />

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex w-full flex-col justify-between p-14">

          {/* Logo */}
          <div>
            <EngageAILogo size="lg" />
            <p className="mt-2 text-sm text-white/40 tracking-wide">Portal do Colaborador</p>
          </div>

          {/* Hero text + features */}
          <div className="space-y-10">
            <div>
              <h2 className="text-5xl font-black leading-tight text-white">
                Potencialize o{" "}
                <span className="bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-transparent">
                  engajamento
                </span>
                <br />
                da sua equipe.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/50">
                Gamificação, treinamentos e análises inteligentes reunidos em uma única plataforma.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  label: "Gamificação inteligente",
                  desc: "XP, estrelas e rankings que motivam de verdade",
                },
                {
                  icon: Users,
                  label: "Feed social corporativo",
                  desc: "Conecte e engaje toda a sua equipe",
                },
                {
                  icon: Trophy,
                  label: "Recompensas reais",
                  desc: "Troque pontos por prêmios incríveis",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/15">
                    <Icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-white/45">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} EngageAI. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 sm:px-12">

        {/* Mobile logo */}
        <div className="mb-10 flex flex-col items-center gap-1 lg:hidden">
          <EngageAILogo size="md" dark />
          <p className="text-sm text-muted-foreground">Portal do Colaborador</p>
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Bem-vindo de volta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="h-11 rounded-xl pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-xl text-sm font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">credenciais de demo</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Demo credentials */}
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <div className="space-y-2.5">
              {[
                { role: "Super Admin", email: "carlos.eduardo@engageai.com" },
                { role: "Gestor", email: "marina.oliveira@engageai.com" },
                { role: "Colaborador", email: "ana.carolina@engageai.com" },
              ].map(({ role, email: demoEmail }) => (
                <div key={role} className="flex items-center justify-between gap-2">
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">{role}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(demoEmail)
                      setPassword("engageai123")
                    }}
                    className="truncate text-right text-xs text-primary hover:underline"
                  >
                    {demoEmail}
                  </button>
                </div>
              ))}
              <p className="mt-1 text-[11px] text-muted-foreground/60">
                Senha: <span className="font-mono">engageai123</span> · clique no e-mail para preencher
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── EngageAI Logo component ── */
function EngageAILogo({ size, dark }: { size: "md" | "lg"; dark?: boolean }) {
  const textSize = size === "lg" ? "text-4xl" : "text-2xl"
  return (
    <div className={`flex items-baseline gap-0.5 ${textSize} font-black tracking-tight select-none`}>
      <span className={dark ? "text-foreground" : "text-white"}>Engage</span>
      <span
        style={{
          background: "linear-gradient(90deg, #f97316 0%, #f59e0b 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        AI
      </span>
    </div>
  )
}
