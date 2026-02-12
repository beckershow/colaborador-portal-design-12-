"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Zap } from "lucide-react"

export default function LoginPage() {
  const { login, user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If already authenticated, go to home
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">EngageAI</h1>
          <p className="text-sm text-muted-foreground">Portal do Colaborador</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Entrar na sua conta</CardTitle>
            <CardDescription>Digite seu e-mail e senha para acessar o portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
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
                    className="pr-10"
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
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
          </CardContent>
        </Card>

        {/* Quick access hint */}
        <Card className="border-dashed bg-muted/30">
          <CardContent className="pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Credenciais de demonstração:</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="font-medium">Super Admin</span>
                <button
                  type="button"
                  onClick={() => { setEmail("carlos.eduardo@engageai.com"); setPassword("engageai123") }}
                  className="text-primary hover:underline"
                >
                  carlos.eduardo@engageai.com
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Gestor</span>
                <button
                  type="button"
                  onClick={() => { setEmail("marina.oliveira@engageai.com"); setPassword("engageai123") }}
                  className="text-primary hover:underline"
                >
                  marina.oliveira@engageai.com
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Colaborador</span>
                <button
                  type="button"
                  onClick={() => { setEmail("ana.carolina@engageai.com"); setPassword("engageai123") }}
                  className="text-primary hover:underline"
                >
                  ana.carolina@engageai.com
                </button>
              </div>
              <p className="mt-1 text-muted-foreground/70">Senha: engageai123 (clique no e-mail para preencher)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
