"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  User,
  Calendar,
  FileText,
  AlertCircle,
  ImageIcon,
} from "lucide-react"

interface PendingPost {
  id: string
  author: string
  authorId: string
  departamento: string
  date: string
  content: string
  image?: string
  type: "postagem"
  status: "pending"
}

interface ApprovedPost extends PendingPost {
  status: "approved" | "rejected"
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
}

export function FeedSocialApprovalPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([])
  const [approvedPosts, setApprovedPosts] = useState<ApprovedPost[]>([])
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({})
  const [showRejectForm, setShowRejectForm] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    loadPosts()
  }, [user])

  const loadPosts = () => {
    // Carregar publicações pendentes do localStorage
    const stored = localStorage.getItem("engageai_feed_pending_posts")
    if (stored) {
      const allPosts = JSON.parse(stored)
      
      // Filtrar por time se for gestor
      if (user?.role === "gestor") {
        const filteredPosts = allPosts.filter((post: PendingPost) => {
          // Aqui você deve implementar a lógica real de filtro por time
          // Por enquanto, vamos simular
          return post.departamento === user.departamento
        })
        setPendingPosts(filteredPosts)
      } else {
        setPendingPosts(allPosts)
      }
    }

    // Carregar publicações aprovadas/reprovadas
    const approvedStored = localStorage.getItem("engageai_feed_approved_posts")
    if (approvedStored) {
      const allApproved = JSON.parse(approvedStored)
      
      if (user?.role === "gestor") {
        const filteredApproved = allApproved.filter((post: ApprovedPost) => {
          return post.departamento === user.departamento
        })
        setApprovedPosts(filteredApproved)
      } else {
        setApprovedPosts(allApproved)
      }
    }
  }

  const handleApprove = (postId: string) => {
    const post = pendingPosts.find((p) => p.id === postId)
    if (!post) return

    // Remover de pendentes
    const updatedPending = pendingPosts.filter((p) => p.id !== postId)
    setPendingPosts(updatedPending)
    localStorage.setItem("engageai_feed_pending_posts", JSON.stringify(updatedPending))

    // Adicionar aos aprovados
    const approvedPost: ApprovedPost = {
      ...post,
      status: "approved",
      approvedBy: user?.nome || "Gestor",
      approvedAt: new Date().toISOString(),
    }

    const updatedApproved = [...approvedPosts, approvedPost]
    setApprovedPosts(updatedApproved)
    localStorage.setItem("engageai_feed_approved_posts", JSON.stringify(updatedApproved))

    // Publicar no feed social
    const feedPosts = JSON.parse(localStorage.getItem("engageai_feed_posts") || "[]")
    feedPosts.unshift({
      id: post.id,
      autor: post.author,
      userId: post.authorId,
      avatar: post.author.split(" ").map((n) => n[0]).join(""),
      cargo: "Colaborador",
      departamento: post.departamento,
      tempo: new Date().toISOString(),
      conteudo: post.content,
      imagem: post.image,
      reacoes: { likes: 0, estrelas: 0, comentarios: 0 },
      status: "approved",
    })
    localStorage.setItem("engageai_feed_posts", JSON.stringify(feedPosts))

    toast({
      title: "Publicação aprovada",
      description: "A publicação foi aprovada e está visível no Feed Social.",
    })
  }

  const handleReject = (postId: string) => {
    const post = pendingPosts.find((p) => p.id === postId)
    if (!post) return

    const reason = rejectionReason[postId] || ""

    // Remover de pendentes
    const updatedPending = pendingPosts.filter((p) => p.id !== postId)
    setPendingPosts(updatedPending)
    localStorage.setItem("engageai_feed_pending_posts", JSON.stringify(updatedPending))

    // Adicionar aos reprovados
    const rejectedPost: ApprovedPost = {
      ...post,
      status: "rejected",
      approvedBy: user?.nome || "Gestor",
      approvedAt: new Date().toISOString(),
      rejectionReason: reason,
    }

    const updatedApproved = [...approvedPosts, rejectedPost]
    setApprovedPosts(updatedApproved)
    localStorage.setItem("engageai_feed_approved_posts", JSON.stringify(updatedApproved))

    // Notificar o autor
    // Implementar notificação aqui

    setShowRejectForm({ ...showRejectForm, [postId]: false })
    setRejectionReason({ ...rejectionReason, [postId]: "" })

    toast({
      title: "Publicação reprovada",
      description: "O autor foi notificado sobre a reprovação.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-chart-1/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Aprovação de Publicações</h2>
            <p className="mt-2 text-muted-foreground">
              {user?.role === "super-admin"
                ? "Visualize o fluxo de aprovações de toda a plataforma"
                : "Gerencie as publicações do seu time que aguardam aprovação"}
            </p>
          </div>
          <Badge variant="outline" className="bg-background">
            <Clock className="h-3 w-3 mr-1" />
            {pendingPosts.length} pendentes
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pendentes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pendentes">
            Pendentes ({pendingPosts.length})
          </TabsTrigger>
          <TabsTrigger value="processados">
            Processados ({approvedPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-4">
          {pendingPosts.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Nenhuma publicação pendente</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Todas as publicações foram processadas ou não há itens aguardando aprovação
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingPosts.map((post) => (
              <Card key={post.id} className="clay-card border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-sm">
                          {post.author.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {post.author}
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.departamento}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.date).toLocaleString("pt-BR")}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      {post.type}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Conteúdo:</p>
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                    
                    {post.image && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          Imagem anexada:
                        </p>
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt="Conteúdo da publicação"
                          className="rounded-lg max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {showRejectForm[post.id] && (
                    <div className="space-y-3 border border-red-200 rounded-lg p-4 bg-red-50/50">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Motivo da reprovação (opcional)</p>
                      </div>
                      <Textarea
                        placeholder="Descreva o motivo da reprovação para informar o autor..."
                        value={rejectionReason[post.id] || ""}
                        onChange={(e) => setRejectionReason({ ...rejectionReason, [post.id]: e.target.value })}
                        className="min-h-20"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {!showRejectForm[post.id] ? (
                      <>
                        <Button
                          onClick={() => handleApprove(post.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => setShowRejectForm({ ...showRejectForm, [post.id]: true })}
                          variant="destructive"
                          className="flex-1 bg-transparent"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reprovar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => handleReject(post.id)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Confirmar Reprovação
                        </Button>
                        <Button
                          onClick={() => {
                            setShowRejectForm({ ...showRejectForm, [post.id]: false })
                            setRejectionReason({ ...rejectionReason, [post.id]: "" })
                          }}
                          variant="outline"
                          className="flex-1 bg-transparent"
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="processados" className="space-y-4">
          {approvedPosts.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">Nenhuma publicação processada</p>
                <p className="text-sm text-muted-foreground mt-2">
                  O histórico de aprovações e reprovações aparecerá aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            approvedPosts.map((post) => (
              <Card key={post.id} className="clay-card border-0">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-sm">
                          {post.author.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {post.author}
                          <Badge
                            variant="outline"
                            className={
                              post.status === "approved"
                                ? "bg-green-500/10 text-green-700 border-green-500"
                                : "bg-red-500/10 text-red-700 border-red-500"
                            }
                          >
                            {post.status === "approved" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Aprovado
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Reprovado
                              </>
                            )}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.departamento}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Publicado em {new Date(post.date).toLocaleString("pt-BR")}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                    
                    {post.image && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <ImageIcon className="h-4 w-4" />
                          Imagem anexada:
                        </p>
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt="Conteúdo da publicação"
                          className="rounded-lg max-h-64 object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
                    <span>
                      {post.status === "approved" ? "Aprovado" : "Reprovado"} por <strong>{post.approvedBy}</strong>
                    </span>
                    <span>{new Date(post.approvedAt || "").toLocaleString("pt-BR")}</span>
                  </div>

                  {post.status === "rejected" && post.rejectionReason && (
                    <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                      <p className="text-sm font-medium text-red-700 mb-1">Motivo da reprovação:</p>
                      <p className="text-sm text-red-600">{post.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
