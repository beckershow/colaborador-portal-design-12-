"use client"

import { Input } from "@/components/ui/input"
import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { NotificationService } from "@/lib/notification-service"
import { ContentModerationService } from "@/lib/content-moderation-service"
import { EngagementTrackingService } from "@/lib/engagement-tracking-service"
import { useToast } from "@/hooks/use-toast"
import { Heart, Star, MessageCircle, Trophy, X, Users, Video, Play, Pause, CheckCircle, Clock } from "lucide-react"

const Mình_colaboradorMes = {
  nome: "Julia Lima",
  avatar: "JL",
  cargo: "Coordenadora de RH",
  departamento: "Recursos Humanos",
  xp: 2400,
  mensagem:
    "Julia se destacou pela dedicação em mentorar novos colaboradores e por sua contribuição extraordinária nos projetos de engajamento.",
}

const Mình_ranking = [
  { nome: "João Silva", xp: 2850, avatar: "JS", posicao: 1 },
  { nome: "Maria Santos", xp: 2650, avatar: "MS", posicao: 2 },
  { nome: "Julia Lima", xp: 2400, avatar: "JL", posicao: 3 },
  { nome: "Pedro Costa", xp: 2200, avatar: "PC", posicao: 4 },
  { nome: "Ana Carolina", xp: 1950, avatar: "AC", posicao: 5, isYou: true },
]

interface Comentario {
  autor: string
  avatar: string
  conteudo: string
  tempo: string
}

interface Postagem {
  id: string
  autor: string
  avatar: string
  cargo: string
  departamento: string
  tempo: string
  conteudo: string
  imagem?: string
  video?: string
  reacoes: {
    likes: number
    estrelas: number
    comentarios: number
  }
  userLiked?: boolean
  userStarred?: boolean
  comentariosList?: Comentario[]
  showComments?: boolean
  status?: "pending" | "approved" | "rejected"
  userId?: string
}



export default function ComunidadePage() {
  const { user, hasPermission } = useAuth()
  const { toast } = useToast()
  const [postagens, setPostagens] = useState<Postagem[]>([
    {
      id: "post-1",
      autor: "João Silva",
      avatar: "JS",
      cargo: "Desenvolvedor Sênior",
      departamento: "Tecnologia",
      tempo: "Há 2 horas",
      conteudo:
        "Muito feliz em compartilhar que completei a trilha de Liderança Criativa! Aprendi muito sobre gestão de equipes e comunicação efetiva. Recomendo para todos! 🚀",
      imagem: "/certificate-completion-celebration.jpg",
      reacoes: { likes: 24, estrelas: 8, comentarios: 5 },
      userLiked: false,
      userStarred: false,
      comentariosList: [
        {
          autor: "Maria Santos",
          avatar: "MS",
          conteudo: "Parabéns João! Vou fazer essa trilha também!",
          tempo: "Há 1h",
        },
        { autor: "Pedro Costa", avatar: "PC", conteudo: "Excelente conquista! 🎉", tempo: "Há 1h" },
      ],
      showComments: false,
      status: "approved",
      userId: "user-1",
    },
    {
      id: "post-2",
      autor: "Maria Santos",
      avatar: "MS",
      cargo: "Analista de Marketing",
      departamento: "Marketing",
      tempo: "Há 5 horas",
      conteudo: "Acabei de concluir 3 treinamentos esta semana! Muito aprendizado! 📚⭐",
      reacoes: { likes: 18, estrelas: 12, comentarios: 3 },
      userLiked: false,
      userStarred: false,
      comentariosList: [],
      showComments: false,
      status: "approved",
      userId: "user-2",
    },
    {
      id: "post-3",
      autor: "Pedro Costa",
      avatar: "PC",
      cargo: "Designer UX",
      departamento: "Design",
      tempo: "Ontem",
      conteudo:
        "Workshop de Design Thinking foi incrível! Conseguimos criar protótipos realmente inovadores em apenas 2 horas. Obrigado ao time de RH por organizar! 🎨",
      imagem: "/design-thinking-workshop-sticky-notes.jpg",
      reacoes: { likes: 31, estrelas: 6, comentarios: 8 },
      userLiked: false,
      userStarred: false,
      comentariosList: [],
      showComments: false,
      status: "approved",
      userId: "user-3",
    },
    {
      id: "post-4",
      autor: "Ana Carolina",
      avatar: "AC",
      cargo: "Analista de Marketing",
      departamento: "Time Criativo",
      tempo: "Há 2 dias",
      conteudo: "Atingi o Nível 4 - Explorador! Próximo objetivo: Nível 5. Quem mais está nessa jornada? 🎯",
      conquista: "Alcançou Nível 4",
      reacoes: { likes: 45, estrelas: 15, comentarios: 12 },
      userLiked: false,
      userStarred: false,
      comentariosList: [],
      showComments: false,
      status: "approved",
      userId: "user-4",
    },
  ])

  const [novoPost, setNovoPost] = useState("")
  const [novoComentario, setNovoComentario] = useState<Record<string, string>>({})
  const [imagemPost, setImagemPost] = useState<string | null>(null)
  const [videoPost, setVideoPost] = useState<string | null>(null)
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({})
  const [conquistaSelecionada, setConquistaSelecionada] = useState<string | null>(null)
  const [showConquistasModal, setShowConquistasModal] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const postsData = localStorage.getItem("engageai-posts")
      if (postsData) {
        try {
          const savedPosts = JSON.parse(postsData)
          const approvedSavedPosts = savedPosts.filter((p: Postagem) => p.status === "approved")
          if (approvedSavedPosts.length > 0) {
            setPostagens((prev) => {
              const existingIds = new Set(prev.map((p) => p.id))
              const newPosts = approvedSavedPosts.filter((p: Postagem) => !existingIds.has(p.id))
              return [...newPosts, ...prev]
            })
          }
        } catch (error) {
          console.error("[v0] Erro ao carregar posts do localStorage:", error)
        }
      }
    }
  }, [])

  const handleSelecionarConquista = (conquista: any) => {
    setConquistaSelecionada(conquista.id)
    setShowConquistasModal(false)
  }

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione uma imagem (JPG, PNG, GIF).",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagemPost(reader.result as string)
        setVideoPost(null)
        toast({
          title: "Imagem carregada!",
          description: "Sua imagem está pronta para ser publicada.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O vídeo deve ter no máximo 50MB.",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("video/")) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um vídeo (MP4, MOV, AVI, WEBM).",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setVideoPost(reader.result as string)
        setImagemPost(null)
        toast({
          title: "Vídeo carregado!",
          description: "Seu vídeo está pronto para ser publicado.",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleVideoPlay = (postId: string) => {
    const videoElement = document.getElementById(`video-${postId}`) as HTMLVideoElement
    if (videoElement) {
      if (playingVideos[postId]) {
        videoElement.pause()
      } else {
        videoElement.play()
      }
      setPlayingVideos((prev) => ({ ...prev, [postId]: !prev[postId] }))
    }
  }

  const handlePublicar = () => {
    if (novoPost.trim() && user) {
      EngagementTrackingService.trackFeedInteraction(user.id, "post")

      const canPublishDirectly = hasPermission(["gestor", "super-admin"])

      const novaPostagem: Postagem = {
        id: `post-${Date.now()}`,
        autor: user.nome,
        avatar: user.avatar || user.nome.substring(0, 2).toUpperCase(),
        cargo: user.cargo,
        departamento: user.departamento,
        tempo: "Agora",
        conteudo: novoPost,
        imagem: imagemPost || undefined,
        video: videoPost || undefined,
        reacoes: { likes: 0, estrelas: 0, comentarios: 0 },
        userLiked: false,
        userStarred: false,
        comentariosList: [],
        showComments: false,
        status: canPublishDirectly ? "approved" : "pending",
        userId: user.id,
      }

      if (typeof window !== "undefined") {
        const postsData = localStorage.getItem("engageai-posts") || "[]"
        const posts = JSON.parse(postsData)
        posts.unshift(novaPostagem)
        localStorage.setItem("engageai-posts", JSON.stringify(posts))
      }

      if (canPublishDirectly) {
        setPostagens([novaPostagem, ...postagens])

        toast({
          title: "Publicado com sucesso!",
          description: "Sua publicação está visível no feed.",
        })
      } else {
        NotificationService.notifyPostPendingApproval(user.id, user.nome, {
          content: novoPost,
          hasImage: !!imagemPost,
          hasVideo: !!videoPost,
          id: novaPostagem.id,
        })

        toast({
          title: "Publicação enviada para aprovação",
          description: "Seu gestor receberá uma notificação. Você será avisado quando for aprovada.",
        })
      }

      setNovoPost("")
      setImagemPost(null)
      setVideoPost(null)
    }
  }

  const handleApprovePost = (postId: string) => {
    if (typeof window !== "undefined") {
      const postsData = localStorage.getItem("engageai-posts") || "[]"
      const posts = JSON.parse(postsData)

      const postIndex = posts.findIndex((p: Postagem) => p.id === postId)
      if (postIndex !== -1) {
        posts[postIndex].status = "approved"
        posts[postIndex].tempo = "Agora"
        localStorage.setItem("engageai-posts", JSON.stringify(posts))

        // Adicionar ao feed visível
        setPostagens([posts[postIndex], ...postagens])

        // Notificar o autor
        NotificationService.notifyPostApproved(posts[postIndex].userId, user?.nome || "Gestor")

        toast({
          title: "Post aprovado!",
          description: "A publicação está agora visível no feed da comunidade.",
        })
      }
    }
  }

  const handleRejectPost = (postId: string) => {
    if (typeof window !== "undefined") {
      const postsData = localStorage.getItem("engageai-posts") || "[]"
      const posts = JSON.parse(postsData)

      const postIndex = posts.findIndex((p: Postagem) => p.id === postId)
      if (postIndex !== -1) {
        posts[postIndex].status = "rejected"
        localStorage.setItem("engageai-posts", JSON.stringify(posts))

        toast({
          title: "Post rejeitado",
          description: "A publicação foi removida da fila de aprovação.",
          variant: "destructive",
        })
      }
    }
  }

  const handleLike = (postId: string) => {
    if (user) {
      EngagementTrackingService.trackFeedInteraction(user.id, "like")
    }

    setPostagens((prevPostagens) =>
      prevPostagens.map((post) =>
        post.id === postId
          ? {
              ...post,
              userLiked: !post.userLiked,
              reacoes: {
                ...post.reacoes,
                likes: post.userLiked ? post.reacoes.likes - 1 : post.reacoes.likes + 1,
              },
            }
          : post,
      ),
    )
  }

  const handleStar = (postId: string) => {
    setPostagens((prevPostagens) =>
      prevPostagens.map((post) =>
        post.id === postId
          ? {
              ...post,
              userStarred: !post.userStarred,
              reacoes: {
                ...post.reacoes,
                estrelas: post.userStarred ? post.reacoes.estrelas - 1 : post.reacoes.estrelas + 1,
              },
            }
          : post,
      ),
    )
  }

  const toggleComments = (postId: string) => {
    setPostagens((prevPostagens) =>
      prevPostagens.map((post) => (post.id === postId ? { ...post, showComments: !post.showComments } : post)),
    )
  }

  const handleAddComment = (postId: string) => {
    const comentario = novoComentario[postId]
    if (!comentario?.trim() || !user) return

    const moderationResult = ContentModerationService.checkForInappropriateContent(comentario)

    if (!moderationResult.isClean) {
      toast({
        title: "Comentário bloqueado",
        description: ContentModerationService.getModerationMessage(),
        variant: "destructive",
      })
      return
    }

    EngagementTrackingService.trackFeedInteraction(user.id, "comment")

    setPostagens((prevPostagens) =>
      prevPostagens.map((post) =>
        post.id === postId
          ? {
              ...post,
              comentariosList: [
                ...(post.comentariosList || []),
                {
                  autor: user.nome,
                  avatar: user.avatar || user.nome.substring(0, 2).toUpperCase(),
                  conteudo: comentario,
                  tempo: "Agora",
                },
              ],
              reacoes: {
                ...post.reacoes,
                comentarios: post.reacoes.comentarios + 1,
              },
            }
          : post,
      ),
    )

    setNovoComentario((prev) => ({ ...prev, [postId]: "" }))
  }

  const postsDataLocalStorage = typeof window !== "undefined" ? localStorage.getItem("engageai-posts") : null
  const allStoredPosts: Postagem[] = postsDataLocalStorage ? JSON.parse(postsDataLocalStorage) : []
  const postsPendentes = hasPermission(["gestor", "super-admin"])
    ? allStoredPosts.filter((p: Postagem) => p.status === "pending")
    : []

  const postagensAprovadas = postagens.filter((post) => post.status === "approved" || !post.status)

  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Comunidade</h1>
        <p className="mt-2 text-lg text-muted-foreground">Celebre conquistas e conecte-se com seus colegas</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Feed */}
        <div className="col-span-2 space-y-6">
          {postsPendentes.length > 0 && (
            <Card className="clay-card border-0 border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <CardTitle>Posts Aguardando Aprovação</CardTitle>
                  <Badge variant="secondary">{postsPendentes.length}</Badge>
                </div>
                <CardDescription>Revise e aprove as publicações pendentes da sua equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {postsPendentes.map((post) => (
                  <div key={post.id} className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">{post.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{post.autor}</p>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="mr-1 h-3 w-3" />
                            Pendente
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {post.cargo} • {post.departamento}
                        </p>
                        <p className="mt-2 text-foreground">{post.conteudo}</p>

                        {post.imagem && (
                          <img
                            src={post.imagem || "/placeholder.svg"}
                            alt="Preview"
                            className="mt-2 rounded-lg max-h-32 object-cover"
                          />
                        )}

                        {post.video && (
                          <video src={post.video} className="mt-2 rounded-lg max-h-32 object-cover" controls />
                        )}

                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="clay-button" onClick={() => handleApprovePost(post.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectPost(post.id)}>
                            <X className="mr-2 h-4 w-4" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Nova Postagem */}
          <Card className="clay-card border-0">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/professional-avatar-woman.jpg" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.nome.substring(0, 2).toUpperCase() || "AC"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Compartilhe uma conquista ou experiência..."
                    className="min-h-[100px] resize-none"
                    value={novoPost}
                    onChange={(e) => setNovoPost(e.target.value)}
                  />

                  {imagemPost && (
                    <div className="mt-3 relative">
                      <img
                        src={imagemPost || "/placeholder.svg"}
                        alt="Preview"
                        className="rounded-lg max-h-48 object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setImagemPost(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {videoPost && (
                    <div className="mt-3 relative">
                      <video src={videoPost} className="rounded-lg max-h-48 w-full object-cover" controls />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setVideoPost(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <label htmlFor="foto-upload">
                        <Button
                          variant="outline"
                          size="sm"
                          className="clay-button bg-transparent cursor-pointer"
                          onClick={() => document.getElementById("foto-upload")?.click()}
                          type="button"
                        >
                          📷 Foto
                        </Button>
                      </label>
                      <input
                        id="foto-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFotoUpload}
                      />

                      <label htmlFor="video-upload">
                        <Button
                          variant="outline"
                          size="sm"
                          className="clay-button bg-transparent cursor-pointer"
                          onClick={() => document.getElementById("video-upload")?.click()}
                          type="button"
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Vídeo
                        </Button>
                      </label>
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoUpload}
                      />


                    </div>
                    <Button className="clay-button" onClick={handlePublicar} disabled={!novoPost.trim()}>
                      Publicar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feed de Postagens */}
          <div className="space-y-6">
            {postagensAprovadas.map((post) => (
              <Card key={post.id} className="clay-card border-0">
                <CardContent className="pt-6">
                  {/* Header do Post */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`/diverse-group-avatars.png?height=48&width=48&query=avatar ${post.autor}`} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{post.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{post.autor}</p>
                        {post.conquista && (
                          <Badge className="bg-accent text-accent-foreground">
                            <Trophy className="mr-1 h-3 w-3" />
                            Nova Conquista
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {post.cargo} • {post.departamento}
                      </p>
                      <p className="text-xs text-muted-foreground">{post.tempo}</p>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <p className="mt-4 text-foreground">{post.conteudo}</p>

                  {/* Imagem */}
                  {post.imagem && (
                    <div className="mt-4 overflow-hidden rounded-lg">
                      <img src={post.imagem || "/placeholder.svg"} alt="Post" className="w-full object-cover" />
                    </div>
                  )}

                  {post.video && (
                    <div className="mt-4 overflow-hidden rounded-lg relative">
                      <video
                        id={`video-${post.id}`}
                        src={post.video}
                        className="w-full object-cover rounded-lg"
                        onClick={() => toggleVideoPlay(post.id)}
                        onPlay={() => setPlayingVideos((prev) => ({ ...prev, [post.id]: true }))}
                        onPause={() => setPlayingVideos((prev) => ({ ...prev, [post.id]: false }))}
                      />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full opacity-80 hover:opacity-100"
                        onClick={() => toggleVideoPlay(post.id)}
                      >
                        {playingVideos[post.id] ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                      </Button>
                    </div>
                  )}

                  {/* Reações */}
                  <div className="mt-4 flex items-center gap-6 border-t border-border pt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 ${post.userLiked ? "text-primary" : ""}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className={`h-4 w-4 ${post.userLiked ? "fill-primary" : ""}`} />
                      <span>{post.reacoes.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 ${post.userStarred ? "text-accent" : ""}`}
                      onClick={() => handleStar(post.id)}
                    >
                      <Star className={`h-4 w-4 ${post.userStarred ? "fill-accent" : ""}`} />
                      <span>{post.reacoes.estrelas}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => toggleComments(post.id)}>
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.reacoes.comentarios}</span>
                    </Button>
                  </div>

                  {/* Seção de Comentários */}
                  {post.showComments && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {/* Lista de Comentários Existentes */}
                      {post.comentariosList && post.comentariosList.length > 0 && (
                        <div className="space-y-3">
                          {post.comentariosList.map((comentario, idx) => (
                            <div key={idx} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-muted text-xs">{comentario.avatar}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{comentario.autor}</p>
                                <p className="text-sm text-muted-foreground">{comentario.conteudo}</p>
                                <p className="text-xs text-muted-foreground mt-1">{comentario.tempo}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Novo Comentário - ÚNICA caixa de input */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {user?.nome.substring(0, 2).toUpperCase() || "AC"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-1 gap-2">
                          <Input
                            placeholder="Escreva um comentário..."
                            value={novoComentario[post.id] || ""}
                            onChange={(e) => setNovoComentario((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(post.id)
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            className="clay-button"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!novoComentario[post.id]?.trim()}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Colaborador do Mês */}
          <Card className="clay-card border-0 bg-gradient-to-br from-accent/20 to-accent/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                <CardTitle>Colaborador do Mês</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 border-4 border-accent">
                  <AvatarImage src="/professional-avatar-woman.jpg" />
                  <AvatarFallback className="bg-accent text-accent-foreground text-xl">
                    {Mình_colaboradorMes.avatar}
                  </AvatarFallback>
                </Avatar>
                <h3 className="mt-4 text-xl font-bold text-foreground">{Mình_colaboradorMes.nome}</h3>
                <p className="text-sm text-muted-foreground">{Mình_colaboradorMes.cargo}</p>
                <p className="text-xs text-muted-foreground">{Mình_colaboradorMes.departamento}</p>

                <div className="mt-4 flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{Mình_colaboradorMes.xp}</p>
                    <p className="text-xs text-muted-foreground">XP Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">{Mình_colaboradorMes.xp}</p>
                    <p className="text-xs text-muted-foreground">Conquistas</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">{Mình_colaboradorMes.mensagem}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ranking Semanal */}
          <Card className="clay-card border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle>Ranking Semanal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Mình_ranking.map((pessoa, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 rounded-lg p-3 transition-all ${
                      pessoa.isYou
                        ? "border-2 border-primary bg-primary/10"
                        : "border border-border bg-card hover:bg-accent/5"
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-sm">
                      {pessoa.posicao === 1 && <Users className="h-5 w-5 text-accent" />}
                      {pessoa.posicao === 2 && <Trophy className="h-5 w-5 text-chart-2" />}
                      {pessoa.posicao === 3 && <Trophy className="h-5 w-5 text-chart-3" />}
                      {pessoa.posicao > 3 && <span className="text-muted-foreground">{pessoa.posicao}</span>}
                    </div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`/diverse-group-avatars.png?height=40&width=40&query=avatar ${pessoa.nome}`} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {pessoa.avatar}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">
                        {pessoa.nome}
                        {pessoa.isYou && <span className="ml-2 text-xs text-primary">(Você)</span>}
                      </p>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-accent" />
                        <span className="text-xs font-medium text-accent">{pessoa.xp} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="mt-4 w-full clay-button bg-transparent"
                variant="outline"
                onClick={() => (window.location.href = "/ranking")}
              >
                Ver Ranking Completo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>


    </div>
  )
}
