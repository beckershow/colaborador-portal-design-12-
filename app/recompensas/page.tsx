"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { LojinhaProfissionalService, type ItemLojinha, type CupomResgate } from "@/lib/lojinha-profissional-service"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Printer, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Gift,
  Star,
  Trophy,
  Award,
  Coffee,
  BookOpen,
  Smartphone,
  ShoppingBag,
  GraduationCap,
  Calendar,
  Sparkles,
  Settings,
} from "lucide-react"

const badgesConquistadas = [
  { nome: "Badge 1", descricao: "Descrição do Badge 1", icone: Gift },
  { nome: "Badge 2", descricao: "Descrição do Badge 2", icone: Star },
]

const badgesPendentes = [
  { nome: "Badge 3", descricao: "Descrição do Badge 3", icone: Trophy, progresso: 50 },
  { nome: "Badge 4", descricao: "Descrição do Badge 4", icone: Award, progresso: 75 },
]

const categoryIcons: Record<string, any> = {
  "Vale-Presente": ShoppingBag,
  Vales: ShoppingBag,
  Educação: GraduationCap,
  Benefício: Calendar,
  Benefícios: Calendar,
  Eletrônico: Smartphone,
  Eletrônicos: Smartphone,
  Escritório: Coffee,
  Brindes: Gift,
  Acessórios: Gift,
}

export default function RecompensasPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const [saldoEstrelas, setSaldoEstrelas] = useState(150)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error">("success")

  const [recompensas, setRecompensas] = useState<ItemLojinha[]>([])
  const [showCupomDialog, setShowCupomDialog] = useState(false)
  const [cupomAtual, setCupomAtual] = useState<CupomResgate | null>(null)
  const [meusResgates, setMeusResgates] = useState<CupomResgate[]>([])

  useEffect(() => {
    loadRecompensas()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "engageai-recompensas") {
        loadRecompensas()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    const handleRewardsUpdate = () => {
      loadRecompensas()
    }

    window.addEventListener("rewards-updated", handleRewardsUpdate)

    if (user) {
      const resgates = LojinhaProfissionalService.getCuponsByColaborador(user.id)
      setMeusResgates(resgates)
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("rewards-updated", handleRewardsUpdate)
    }
  }, [user])

  const loadRecompensas = () => {
    if (!user) return
    const active = LojinhaProfissionalService.getItensAtivosForColaborador(user.gestorId || "")
    setRecompensas(active)
  }

  const handleResgatar = (item: ItemLojinha) => {
    if (!user) return

    if (saldoEstrelas >= item.valorPontos) {
      const result = LojinhaProfissionalService.resgatar(item.id, user.id, user.nome, saldoEstrelas, user.teamId || "")

      if (result.success && result.cupom) {
        setSaldoEstrelas(saldoEstrelas - item.valorPontos)
        setCupomAtual(result.cupom)
        setShowCupomDialog(true)
        setMeusResgates([...meusResgates, result.cupom])
        setToastMessage(result.message)
        setToastType("success")
        setShowToast(true)
        loadRecompensas()
        setTimeout(() => setShowToast(false), 3000)
      } else {
        setToastMessage(result.message)
        setToastType("error")
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
    } else {
      const faltam = item.valorPontos - saldoEstrelas
      setToastMessage(`Você não possui estrelas suficientes. Faltam ${faltam} estrelas para este resgate.`)
      setToastType("error")
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const handleImprimirCupom = () => {
    window.print()
  }

  const handleBaixarCupom = () => {
    if (!cupomAtual) return
    const content = `
CUPOM DE RESGATE - ENGAGE AI
================================

Nome da Recompensa: ${cupomAtual.itemNome}
Categoria: ${cupomAtual.categoria}
Código do Cupom: ${cupomAtual.codigoCupom}

Colaborador: ${cupomAtual.colaboradorNome}
Data e Hora: ${new Date(cupomAtual.dataResgate).toLocaleString("pt-BR")}
Pontos Utilizados: ${cupomAtual.pontosUtilizados} estrelas

Time: ${cupomAtual.timeId}
Status: Resgatado com Sucesso

================================
Este cupom serve como comprovante
do resgate realizado.
    `
    const blob = new Blob([content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cupom-${cupomAtual.codigoCupom}.txt`
    a.click()
  }

  const showEditButton = hasPermission(["gestor", "super-admin"])

  return (
    <>
      <Dialog open={showCupomDialog} onOpenChange={setShowCupomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              Resgate Realizado com Sucesso!
            </DialogTitle>
            <DialogDescription>Seu cupom foi gerado automaticamente</DialogDescription>
          </DialogHeader>

          {cupomAtual && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-green-600 bg-green-50 p-6 text-center">
                <Gift className="h-12 w-12 mx-auto mb-3 text-green-600" />
                <h3 className="text-xl font-bold text-foreground">{cupomAtual.itemNome}</h3>
                <p className="text-sm text-muted-foreground mt-1">{cupomAtual.categoria}</p>

                <div className="mt-4 rounded-md bg-white p-3">
                  <p className="text-xs text-muted-foreground">Código do Cupom</p>
                  <p className="text-2xl font-mono font-bold text-foreground">{cupomAtual.codigoCupom}</p>
                </div>

                <div className="mt-4 space-y-2 text-left text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Colaborador:</span>
                    <span className="font-medium">{cupomAtual.colaboradorNome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <span className="font-medium">
                      {new Date(cupomAtual.dataResgate).toLocaleDateString("pt-BR")} às{" "}
                      {new Date(cupomAtual.dataResgate).toLocaleTimeString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pontos:</span>
                    <span className="font-medium">⭐ {cupomAtual.pontosUtilizados}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="default" className="bg-green-600">
                      Resgatado
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Este cupom serve como comprovante interno, validação com RH e controle operacional.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleImprimirCupom}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleBaixarCupom}>
              <Download className="mr-2 h-4 w-4" />
              Baixar
            </Button>
            <Button onClick={() => setShowCupomDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <Card className={`clay-card border-0 shadow-lg ${toastType === "success" ? "bg-green-50" : "bg-red-50"}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                {toastType === "success" ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                )}
                <p className="text-sm font-medium">{toastMessage}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Recompensas</h1>
          <p className="mt-2 text-lg text-muted-foreground">Resgate suas estrelas por benefícios e conquistas</p>
        </div>

        {showEditButton && (
          <Button onClick={() => router.push("/admin?tab=lojinha")} className="clay-button gap-2" variant="outline">
            <Settings className="h-4 w-4" />
            Editar Recompensas
          </Button>
        )}
      </div>

      {user?.role === "colaborador" && (
        <Card className="clay-card mb-8 border-0">
          <div className="bg-gradient-to-br from-accent/20 via-accent/10 to-chart-3/10 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seu Saldo</p>
                <div className="mt-2 flex items-baseline gap-3">
                  <h2 className="text-5xl font-bold text-foreground">⭐ {saldoEstrelas}</h2>
                  <span className="text-xl text-muted-foreground">estrelas</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Continue engajado para ganhar mais estrelas e desbloquear recompensas exclusivas!
                </p>
              </div>

              
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Catálogo de Recompensas</CardTitle>
              <CardDescription>Escolha como usar suas estrelas</CardDescription>
            </CardHeader>
            <CardContent>
              {recompensas.length === 0 ? (
                <div className="py-12 text-center">
                  <Gift className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-muted-foreground">
                    Nenhuma recompensa disponível no momento
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Entre em contato com seu gestor para mais informações
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {recompensas.map((item) => {
                    const Icone = categoryIcons[item.categoria] || Gift
                    const podeResgatar = saldoEstrelas >= item.valorPontos
                    const disponivel = item.quantidade === null || item.quantidade > 0

                    return (
                      <div
                        key={item.id}
                        className="group overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg"
                      >
                        <div className="flex flex-col">
                          {item.imagem ? (
                            <img
                              src={item.imagem || "/placeholder.svg"}
                              alt={item.nome}
                              className="h-16 w-16 rounded-2xl object-cover border-2 border-border"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
                              <Icone className="h-8 w-8 text-primary" />
                            </div>
                          )}

                          <h3 className="mt-4 font-semibold text-foreground">{item.nome}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{item.descricao}</p>

                          {item.quantidade !== null && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {item.quantidade > 0 ? `${item.quantidade} disponíveis` : "Esgotado"}
                            </p>
                          )}

                          <div className="mt-4 flex items-center gap-2">
                            <Star className="h-5 w-5 text-accent" />
                            <span className="text-xl font-bold text-accent-foreground">{item.valorPontos}</span>
                            <span className="text-sm text-muted-foreground">estrelas</span>
                          </div>

                          <Button
                            className="mt-4 w-full clay-button"
                            disabled={!podeResgatar || !disponivel}
                            variant={podeResgatar && disponivel ? "default" : "outline"}
                            onClick={() => handleResgatar(item)}
                          >
                            {!disponivel
                              ? "Esgotado"
                              : podeResgatar
                                ? "Resgatar"
                                : `Precisa ${item.valorPontos - saldoEstrelas}⭐`}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">

          <Card className="clay-card border-0">
            <CardHeader>
              <CardTitle>Meus Resgates</CardTitle>
              <CardDescription>Histórico de cupons gerados</CardDescription>
            </CardHeader>
            <CardContent>
              {meusResgates.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum resgate ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meusResgates
                    .sort((a, b) => new Date(b.dataResgate).getTime() - new Date(a.dataResgate).getTime())
                    .slice(0, 5)
                    .map((cupom) => (
                      <div
                        key={cupom.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <Gift className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{cupom.itemNome}</p>
                            <p className="text-xs text-muted-foreground font-mono">{cupom.codigoCupom}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(cupom.dataResgate).toLocaleDateString("pt-BR")}
                          </p>
                          <Badge variant="default" className="mt-1 bg-green-600 text-xs">
                            Resgatado
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
