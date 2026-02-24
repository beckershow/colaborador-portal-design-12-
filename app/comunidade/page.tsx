"use client"

import { Input } from "@/components/ui/input"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ContentModerationService } from "@/lib/content-moderation-service"
import { EngagementTrackingService } from "@/lib/engagement-tracking-service"
import { useToast } from "@/hooks/use-toast"
import {
  Heart, Star, MessageCircle, Trophy, X, Users, Video,
  Play, Pause, CheckCircle, Clock, MoreVertical, Pencil,
  Trash2, ChevronDown, ChevronUp, Send, Eye,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {
  listFeedPosts,
  listPendingPosts,
  listMyPendingPosts,
  listMyRejectedPosts,
  createFeedPost,
  updateFeedPost,
  deleteFeedPost,
  setFeedPostStatus,
  reactToPost,
  addComment as apiAddComment,
  getFeedPost,
  registerPostView,
  type FeedApiPost,
} from "@/lib/feed-api"

// ─── Dados estáticos laterais ─────────────────────────────────────────────────

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
  { nome: "João Silva",    xp: 2850, avatar: "JS", posicao: 1 },
  { nome: "Maria Santos",  xp: 2650, avatar: "MS", posicao: 2 },
  { nome: "Julia Lima",    xp: 2400, avatar: "JL", posicao: 3 },
  { nome: "Pedro Costa",   xp: 2200, avatar: "PC", posicao: 4 },
  { nome: "Ana Carolina",  xp: 1950, avatar: "AC", posicao: 5, isYou: true },
]

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface Comentario {
  id?: string
  autor: string
  avatar: string
  avatarUrl?: string
  conteudo: string
  tempo: string
}

interface Postagem {
  id: string
  autor: string
  avatar: string
  avatarUrl?: string
  cargo: string
  departamento: string
  tempo: string
  conteudo: string
  imagem?: string
  video?: string
  reacoes: { likes: number; estrelas: number; comentarios: number }
  userLiked?: boolean
  userStarred?: boolean
  views?: number
  comentariosList?: Comentario[]
  comentariosCarregados?: boolean
  showComments?: boolean
  status?: "pending" | "approved" | "rejected"
  rejectedReason?: string | null
  userId?: string
  isEdit?: boolean
  editedAt?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (diffMins < 1)   return "Agora"
  if (diffMins < 60)  return `Há ${diffMins}min`
  const h = Math.floor(diffMins / 60)
  if (h < 24)         return `Há ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1)        return "Ontem"
  if (d < 7)          return `Há ${d} dias`
  return new Date(iso).toLocaleDateString("pt-BR")
}

function mapApiPost(p: FeedApiPost, _currentUserId?: string): Postagem {
  const likeCount    = p.reactions?.filter(r => r.type === "like").length ?? 0
  const starCount    = p.reactions?.filter(r => r.type === "celebrate").length ?? 0
  const commentsList: Comentario[] = (p.comments ?? []).map(c => ({
    id: c.id,
    autor: c.user.nome,
    avatar: c.user.nome.substring(0, 2).toUpperCase(),
    avatarUrl: c.user.avatar ?? undefined,
    conteudo: c.content,
    tempo: formatRelativeTime(c.createdAt),
  }))

  return {
    id: p.id,
    autor: p.user.nome,
    avatar: p.user.nome.substring(0, 2).toUpperCase(),
    avatarUrl: p.user.avatar ?? undefined,
    cargo: p.user.cargo,
    departamento: p.user.departamento,
    tempo: formatRelativeTime(p.createdAt),
    conteudo: p.content,
    imagem: p.imageUrl ?? undefined,
    video: p.videoUrl ?? undefined,
    reacoes: {
      likes: likeCount,
      estrelas: starCount,
      comentarios: p._count.comments,
    },
    userLiked: p.userReaction === "like",
    userStarred: p.userReaction === "celebrate",
    views: p.viewsCount,
    userId: p.user.id,
    status: p.status,
    rejectedReason: p.rejectedReason ?? null,
    showComments: false,
    comentariosList: commentsList,
    comentariosCarregados: commentsList.length > 0,
  }
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ComunidadePage() {
  const { user, hasPermission } = useAuth()
  const { toast } = useToast()

  // ─── Estado principal ──────────────────────────────────────────────────────

  const [postagens, setPostagens] = useState<Postagem[]>([])
  const [postsPendentesGestor, setPostsPendentesGestor] = useState<Postagem[]>([])
  const [meusPendentes, setMeusPendentes] = useState<Postagem[]>([])
  const [meusRejeitados, setMeusRejeitados] = useState<Postagem[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [publicando, setPublicando] = useState(false)

  // Formulário nova postagem
  const [novoPost, setNovoPost] = useState("")
  const [imagemPost, setImagemPost] = useState<string | null>(null)
  const [videoPost, setVideoPost] = useState<string | null>(null)
  const [playingVideos, setPlayingVideos] = useState<Record<string, boolean>>({})

  // Modais e estado de edição
  const [showEnviadoModal, setShowEnviadoModal] = useState(false)
  const [showAllPendentes, setShowAllPendentes] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editConteudo, setEditConteudo] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [editingPendingPostId, setEditingPendingPostId] = useState<string | null>(null)
  const [editPendingConteudo, setEditPendingConteudo] = useState("")
  const [deletePendingConfirmId, setDeletePendingConfirmId] = useState<string | null>(null)
  const [rejectingPostId, setRejectingPostId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [editingRejectedPostId, setEditingRejectedPostId] = useState<string | null>(null)
  const [editRejectedConteudo, setEditRejectedConteudo] = useState("")
  const [deleteRejectedConfirmId, setDeleteRejectedConfirmId] = useState<string | null>(null)
  const [novoComentario, setNovoComentario] = useState<Record<string, string>>({})

  // Destaque pós-notificação
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)

  // ─── Carregamento de dados ─────────────────────────────────────────────────

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true)
    try {
      const res = await listFeedPosts(1, 30)
      const mapped = res.data.map(p => mapApiPost(p, user?.id))
      setPostagens(mapped)

      // Registra visualização em background para cada post
      res.data.forEach(p => registerPostView(p.id).catch(() => {}))
    } catch (err) {
      toast({
        title: "Erro ao carregar feed",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setLoadingFeed(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadPendingGestor = useCallback(async () => {
    if (!hasPermission(["gestor", "super-admin"])) return
    try {
      const res = await listPendingPosts()
      setPostsPendentesGestor(res.data.map(p => mapApiPost(p)))
    } catch { /* silencioso */ }
  }, [hasPermission])

  const loadMyPending = useCallback(async () => {
    if (hasPermission(["gestor", "super-admin"]) || !user) return
    try {
      const res = await listMyPendingPosts()
      setMeusPendentes(res.data.map(p => mapApiPost(p, user.id)))
    } catch { /* silencioso */ }
  }, [hasPermission, user])

  const loadMyRejected = useCallback(async () => {
    if (hasPermission(["gestor", "super-admin"]) || !user) return
    try {
      const res = await listMyRejectedPosts()
      setMeusRejeitados(res.data.map(p => mapApiPost(p, user.id)))
    } catch { /* silencioso */ }
  }, [hasPermission, user])

  // Mount: carrega tudo
  useEffect(() => {
    loadFeed()
    loadPendingGestor()
    loadMyPending()
    loadMyRejected()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-carrega quando usuário muda (login/troca de papel)
  useEffect(() => {
    if (user) {
      loadFeed()
      loadPendingGestor()
      loadMyPending()
      loadMyRejected()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Escuta eventos de atualização do feed (disparados pelo notification-center ao aprovar/rejeitar)
  useEffect(() => {
    const handler = () => {
      loadFeed()
      loadPendingGestor()
      loadMyPending()
      loadMyRejected()
    }
    window.addEventListener("engageai:feed-updated", handler)
    return () => window.removeEventListener("engageai:feed-updated", handler)
  }, [loadFeed, loadPendingGestor, loadMyPending, loadMyRejected])

  // ─── Highlight / scroll de notificação ────────────────────────────────────

  // Chegou de outra página (sessionStorage)
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = sessionStorage.getItem("engageai-highlight-post")
    if (!stored) return
    sessionStorage.removeItem("engageai-highlight-post")
    try {
      const { postId, openComments } = JSON.parse(stored)
      if (!postId) return
      setHighlightedPostId(postId)
      if (openComments) {
        setPostagens(prev =>
          prev.map(p => p.id === postId ? { ...p, showComments: true } : p),
        )
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Já está na página (CustomEvent)
  useEffect(() => {
    const handler = (e: Event) => {
      const { postId, openComments } = (e as CustomEvent<{ postId: string; openComments: boolean }>).detail || {}
      if (!postId) return
      setHighlightedPostId(postId)
      if (openComments) {
        setPostagens(prev =>
          prev.map(p => p.id === postId ? { ...p, showComments: true } : p),
        )
      }
    }
    window.addEventListener("engageai:highlight-post", handler)
    return () => window.removeEventListener("engageai:highlight-post", handler)
  }, [])

  // Rola e remove destaque
  useEffect(() => {
    if (!highlightedPostId) return
    const scrollTimer = setTimeout(() => {
      document.getElementById(`post-${highlightedPostId}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 400)
    const clearTimer = setTimeout(() => setHighlightedPostId(null), 4700)
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer) }
  }, [highlightedPostId])

  // ─── Handlers de arquivo ──────────────────────────────────────────────────

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" })
      return
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Por favor, selecione uma imagem (JPG, PNG, GIF).", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagemPost(reader.result as string)
      setVideoPost(null)
      toast({ title: "Imagem carregada!", description: "Sua imagem está pronta para ser publicada." })
    }
    reader.readAsDataURL(file)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O vídeo deve ter no máximo 50MB.", variant: "destructive" })
      return
    }
    if (!file.type.startsWith("video/")) {
      toast({ title: "Formato inválido", description: "Por favor, selecione um vídeo (MP4, MOV, AVI, WEBM).", variant: "destructive" })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setVideoPost(reader.result as string)
      setImagemPost(null)
      toast({ title: "Vídeo carregado!", description: "Seu vídeo está pronto para ser publicado." })
    }
    reader.readAsDataURL(file)
  }

  const toggleVideoPlay = (postId: string) => {
    const el = document.getElementById(`video-${postId}`) as HTMLVideoElement
    if (!el) return
    if (playingVideos[postId]) { el.pause() } else { el.play() }
    setPlayingVideos(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  // ─── Publicar ─────────────────────────────────────────────────────────────

  const handlePublicar = async () => {
    if (!novoPost.trim() || !user) return
    setPublicando(true)
    try {
      EngagementTrackingService.trackFeedInteraction(user.id, "post")
      const result = await createFeedPost({
        content: novoPost,
        imageUrl: imagemPost ?? undefined,
        videoUrl: videoPost ?? undefined,
      })
      const mapped = mapApiPost(result.data, user.id)

      if (result.data.status === "approved") {
        setPostagens(prev => [mapped, ...prev])
        toast({ title: "Publicado com sucesso!", description: "Sua publicação está visível no feed." })
      } else {
        setMeusPendentes(prev => [mapped, ...prev])
        setShowEnviadoModal(true)
      }

      setNovoPost("")
      setImagemPost(null)
      setVideoPost(null)
    } catch (err) {
      toast({ title: "Erro ao publicar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setPublicando(false)
    }
  }

  // ─── Aprovar / Rejeitar (painel gestor na página) ─────────────────────────

  const handleApprovePost = async (postId: string) => {
    try {
      await setFeedPostStatus(postId, "approve")
      const approved = postsPendentesGestor.find(p => p.id === postId)
      if (approved) {
        setPostagens(prev => [{ ...approved, status: "approved", tempo: "Agora" }, ...prev])
        setPostsPendentesGestor(prev => prev.filter(p => p.id !== postId))
      }
      toast({ title: "Post aprovado!", description: "A publicação está agora visível no feed." })
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
    }
  }

  const handleRejectPost = (postId: string) => {
    setRejectingPostId(postId)
    setRejectReason("")
  }

  const handleConfirmReject = async () => {
    if (!rejectingPostId) return
    const postId = rejectingPostId
    setRejectingPostId(null)
    try {
      await setFeedPostStatus(postId, "reject", rejectReason.trim() || undefined)
      setPostsPendentesGestor(prev => prev.filter(p => p.id !== postId))
      toast({ title: "Publicação recusada", description: "O colaborador foi notificado." })
    } catch (err) {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" })
    } finally {
      setRejectReason("")
    }
  }

  const handleSaveEditRejected = async (postId: string) => {
    if (!editRejectedConteudo.trim()) return
    try {
      const result = await updateFeedPost(postId, { content: editRejectedConteudo })
      const mapped = mapApiPost(result.data, user?.id)
      setMeusRejeitados(prev => prev.filter(p => p.id !== postId))
      setMeusPendentes(prev => [mapped, ...prev])
      toast({ title: "Publicação reenviada!", description: "Sua edição foi enviada para aprovação do gestor." })
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setEditingRejectedPostId(null)
      setEditRejectedConteudo("")
    }
  }

  const handleDeleteRejectedPost = async (postId: string) => {
    try {
      await deleteFeedPost(postId)
      setMeusRejeitados(prev => prev.filter(p => p.id !== postId))
      setDeleteRejectedConfirmId(null)
      toast({ title: "Publicação excluída", description: "Sua publicação foi removida." })
    } catch (err) {
      toast({ title: "Erro ao excluir", description: (err as Error).message, variant: "destructive" })
    }
  }

  // ─── Editar / excluir post aprovado ──────────────────────────────────────

  const handleStartEdit = (post: Postagem) => {
    setEditingPostId(post.id)
    setEditConteudo(post.conteudo)
    setDeleteConfirmId(null)
  }

  const handleSaveEdit = async (postId: string) => {
    if (!editConteudo.trim() || !user) return
    try {
      const result = await updateFeedPost(postId, { content: editConteudo })
      const mapped = mapApiPost(result.data, user.id)

      if (result.data.status === "approved") {
        setPostagens(prev => prev.map(p => p.id === postId ? { ...mapped, showComments: p.showComments, comentariosList: p.comentariosList } : p))
        toast({ title: "Publicação editada!", description: "Suas alterações foram salvas." })
      } else {
        // Volta para pendente (era rejected → reenvio)
        setPostagens(prev => prev.filter(p => p.id !== postId))
        setMeusPendentes(prev => [mapped, ...prev])
        toast({ title: "Edição enviada para aprovação", description: "Seu gestor irá revisar a alteração." })
      }
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setEditingPostId(null)
      setEditConteudo("")
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteFeedPost(postId)
      setPostagens(prev => prev.filter(p => p.id !== postId))
      setDeleteConfirmId(null)
      toast({ title: "Publicação excluída", description: "Sua publicação foi removida do feed." })
    } catch (err) {
      toast({ title: "Erro ao excluir", description: (err as Error).message, variant: "destructive" })
    }
  }

  // ─── Editar / excluir post pendente (meusPendentes) ──────────────────────

  const handleStartEditPending = (post: Postagem) => {
    setEditingPendingPostId(post.id)
    setEditPendingConteudo(post.conteudo)
    setDeletePendingConfirmId(null)
  }

  const handleSaveEditPending = async (postId: string) => {
    if (!editPendingConteudo.trim()) return
    try {
      const result = await updateFeedPost(postId, { content: editPendingConteudo })
      const mapped = mapApiPost(result.data, user?.id)
      setMeusPendentes(prev => prev.map(p => p.id === postId ? mapped : p))
      toast({ title: "Publicação atualizada", description: "Suas alterações foram salvas e aguardam aprovação." })
    } catch (err) {
      toast({ title: "Erro ao salvar", description: (err as Error).message, variant: "destructive" })
    } finally {
      setEditingPendingPostId(null)
      setEditPendingConteudo("")
    }
  }

  const handleDeletePendingPost = async (postId: string) => {
    try {
      await deleteFeedPost(postId)
      setMeusPendentes(prev => prev.filter(p => p.id !== postId))
      setDeletePendingConfirmId(null)
      toast({ title: "Publicação cancelada", description: "Sua publicação foi removida da fila de aprovação." })
    } catch (err) {
      toast({ title: "Erro ao excluir", description: (err as Error).message, variant: "destructive" })
    }
  }

  // ─── Like (❤️ → tipo "like") ──────────────────────────────────────────────

  const handleLike = async (postId: string) => {
    if (!user) return
    // Optimistic update
    const prev = postagens.find(p => p.id === postId)
    if (!prev) return
    const wasLiked = prev.userLiked
    setPostagens(ps => ps.map(p => p.id !== postId ? p : {
      ...p,
      userLiked: !wasLiked,
      reacoes: { ...p.reacoes, likes: wasLiked ? p.reacoes.likes - 1 : p.reacoes.likes + 1 },
    }))
    try {
      EngagementTrackingService.trackFeedInteraction(user.id, "like")
      await reactToPost(postId, "like")
    } catch {
      // Reverter
      setPostagens(ps => ps.map(p => p.id !== postId ? p : {
        ...p,
        userLiked: wasLiked,
        reacoes: { ...p.reacoes, likes: wasLiked ? p.reacoes.likes + 1 : p.reacoes.likes - 1 },
      }))
    }
  }

  // ─── Star (⭐ → tipo "celebrate") ─────────────────────────────────────────

  const handleStar = async (postId: string) => {
    if (!user) return
    const prev = postagens.find(p => p.id === postId)
    if (!prev) return
    const wasStarred = prev.userStarred
    setPostagens(ps => ps.map(p => p.id !== postId ? p : {
      ...p,
      userStarred: !wasStarred,
      reacoes: { ...p.reacoes, estrelas: wasStarred ? p.reacoes.estrelas - 1 : p.reacoes.estrelas + 1 },
    }))
    try {
      await reactToPost(postId, "celebrate")
    } catch {
      setPostagens(ps => ps.map(p => p.id !== postId ? p : {
        ...p,
        userStarred: wasStarred,
        reacoes: { ...p.reacoes, estrelas: wasStarred ? p.reacoes.estrelas + 1 : p.reacoes.estrelas - 1 },
      }))
    }
  }

  // ─── Comentários ──────────────────────────────────────────────────────────

  const toggleComments = async (postId: string) => {
    const post = postagens.find(p => p.id === postId)
    if (!post) return

    // Se ainda não carregou os comentários, busca da API
    if (!post.showComments && !post.comentariosCarregados) {
      try {
        const full = await getFeedPost(postId)
        const comments: Comentario[] = (full.data.comments ?? []).map(c => ({
          id: c.id,
          autor: c.user.nome,
          avatar: c.user.nome.substring(0, 2).toUpperCase(),
          avatarUrl: c.user.avatar ?? undefined,
          conteudo: c.content,
          tempo: formatRelativeTime(c.createdAt),
        }))
        setPostagens(prev => prev.map(p =>
          p.id === postId
            ? { ...p, showComments: true, comentariosList: comments, comentariosCarregados: true }
            : p,
        ))
        return
      } catch { /* mostra mesmo assim */ }
    }

    setPostagens(prev => prev.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p))
  }

  const handleAddComment = async (postId: string) => {
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

    // Optimistic: adiciona imediatamente na UI
    const tempComment: Comentario = {
      autor: user.nome,
      avatar: user.avatar || user.nome.substring(0, 2).toUpperCase(),
      avatarUrl: user.avatar,
      conteudo: comentario,
      tempo: "Agora",
    }
    setPostagens(prev => prev.map(p =>
      p.id !== postId ? p : {
        ...p,
        comentariosList: [...(p.comentariosList ?? []), tempComment],
        reacoes: { ...p.reacoes, comentarios: p.reacoes.comentarios + 1 },
      },
    ))
    setNovoComentario(prev => ({ ...prev, [postId]: "" }))

    try {
      EngagementTrackingService.trackFeedInteraction(user.id, "comment")
      const result = await apiAddComment(postId, comentario)
      // Substitui o comentário temporário pelo real
      const realComment: Comentario = {
        id: result.data.id,
        autor: result.data.user.nome,
        avatar: result.data.user.nome.substring(0, 2).toUpperCase(),
        avatarUrl: result.data.user.avatar ?? undefined,
        conteudo: result.data.content,
        tempo: "Agora",
      }
      setPostagens(prev => prev.map(p => {
        if (p.id !== postId) return p
        const list = [...(p.comentariosList ?? [])]
        const idx = list.findLastIndex(c => !c.id && c.conteudo === comentario)
        if (idx !== -1) list[idx] = realComment
        return { ...p, comentariosList: list }
      }))
    } catch (err) {
      // Reverter optimistic em caso de erro
      setPostagens(prev => prev.map(p =>
        p.id !== postId ? p : {
          ...p,
          comentariosList: (p.comentariosList ?? []).filter(c => !(c.conteudo === comentario && !c.id)),
          reacoes: { ...p.reacoes, comentarios: p.reacoes.comentarios - 1 },
        },
      ))
      setNovoComentario(prev => ({ ...prev, [postId]: comentario }))
      toast({ title: "Erro ao comentar", description: (err as Error).message, variant: "destructive" })
    }
  }

  // ─── JSX ──────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Comunidade</h1>
        <p className="mt-2 text-lg text-muted-foreground">Celebre conquistas e conecte-se com seus colegas</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ── Coluna esquerda ── */}
        <div className="col-span-2 space-y-6">

          {/* Painel gestor: posts aguardando aprovação */}
          {postsPendentesGestor.length > 0 && (
            <Card className="clay-card border-0 border-l-4 border-l-accent">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  <CardTitle>Posts Aguardando Aprovação</CardTitle>
                  <Badge variant="secondary">{postsPendentesGestor.length}</Badge>
                </div>
                <CardDescription>Revise e aprove as publicações pendentes da sua equipe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {postsPendentesGestor.map(post => (
                  <div key={post.id} className="p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        {post.avatarUrl && <AvatarImage src={post.avatarUrl} />}
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
                        <p className="text-sm text-muted-foreground">{post.cargo} • {post.departamento}</p>
                        <p className="mt-2 text-foreground">{post.conteudo}</p>
                        {post.imagem && (
                          <img src={post.imagem} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover" />
                        )}
                        {post.video && (
                          <video src={post.video} className="mt-2 rounded-lg max-h-32 object-cover" controls />
                        )}
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="clay-button" onClick={() => handleApprovePost(post.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectPost(post.id)}>
                            <X className="mr-2 h-4 w-4" />Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Meus posts aguardando aprovação (colaborador) */}
          {meusPendentes.length > 0 && (
            <Card className="clay-card border-0 border-l-4 border-l-yellow-400">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-base">
                    {meusPendentes.length === 1
                      ? "Sua publicação aguarda aprovação"
                      : `${meusPendentes.length} publicações aguardam aprovação`}
                  </CardTitle>
                </div>
                <CardDescription>
                  Seu gestor será notificado e você receberá um aviso quando aprovada ou recusada.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(showAllPendentes ? meusPendentes : meusPendentes.slice(0, 1)).map(post => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4"
                  >
                    {editingPendingPostId === post.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editPendingConteudo}
                          onChange={e => setEditPendingConteudo(e.target.value)}
                          className="min-h-[80px] resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="clay-button" onClick={() => handleSaveEditPending(post.id)}>
                            <Send className="mr-1 h-3 w-3" />Salvar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingPendingPostId(null); setEditPendingConteudo("") }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="border-yellow-400 text-yellow-600 text-xs shrink-0">
                            <Clock className="mr-1 h-3 w-3" />Aguardando aprovação
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleStartEditPending(post)}>
                                <Pencil className="mr-2 h-4 w-4" />Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletePendingConfirmId(post.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3">{post.conteudo}</p>
                        {post.imagem && <p className="mt-1 text-xs text-muted-foreground">📎 Contém imagem</p>}
                        {post.video  && <p className="mt-1 text-xs text-muted-foreground">🎥 Contém vídeo</p>}
                        {deletePendingConfirmId === post.id && (
                          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            <span className="flex-1">Tem certeza que deseja excluir esta publicação?</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePendingPost(post.id)}>Excluir</Button>
                            <Button size="sm" variant="ghost" className="bg-transparent" onClick={() => setDeletePendingConfirmId(null)}>Cancelar</Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {meusPendentes.length >= 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                    onClick={() => setShowAllPendentes(v => !v)}
                  >
                    {showAllPendentes ? (
                      <><ChevronUp className="mr-1 h-4 w-4" />Recolher</>
                    ) : (
                      <><ChevronDown className="mr-1 h-4 w-4" />Ver mais {meusPendentes.length - 1} publicação{meusPendentes.length - 1 > 1 ? "ões" : ""}</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Publicações recusadas (colaborador) */}
          {meusRejeitados.length > 0 && !hasPermission(["gestor", "super-admin"]) && (
            <Card className="clay-card border-0 border-l-4 border-l-red-400">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-base">
                    {meusRejeitados.length === 1
                      ? "Sua publicação foi recusada"
                      : `${meusRejeitados.length} publicações foram recusadas`}
                  </CardTitle>
                </div>
                <CardDescription>
                  Você pode editar e reenviar para aprovação, ou excluir a publicação.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {meusRejeitados.map(post => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800 p-4"
                  >
                    {editingRejectedPostId === post.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editRejectedConteudo}
                          onChange={e => setEditRejectedConteudo(e.target.value)}
                          className="min-h-[80px] resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="clay-button" onClick={() => handleSaveEditRejected(post.id)}>
                            <Send className="mr-1 h-3 w-3" />Reenviar para aprovação
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingRejectedPostId(null); setEditRejectedConteudo("") }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="border-red-400 text-red-600 text-xs shrink-0">
                            <X className="mr-1 h-3 w-3" />Recusada
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingRejectedPostId(post.id); setEditRejectedConteudo(post.conteudo) }}>
                                <Pencil className="mr-2 h-4 w-4" />Editar e reenviar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteRejectedConfirmId(post.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-sm text-foreground line-clamp-3">{post.conteudo}</p>
                        {post.rejectedReason && (
                          <div className="mt-2 rounded-lg border border-red-200 bg-red-100/50 dark:bg-red-950/30 p-2">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400">Motivo da recusa:</p>
                            <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">{post.rejectedReason}</p>
                          </div>
                        )}
                        {deleteRejectedConfirmId === post.id && (
                          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            <span className="flex-1">Tem certeza que deseja excluir esta publicação?</span>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteRejectedPost(post.id)}>Excluir</Button>
                            <Button size="sm" variant="ghost" className="bg-transparent" onClick={() => setDeleteRejectedConfirmId(null)}>Cancelar</Button>
                          </div>
                        )}
                      </>
                    )}
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
                  {user?.avatar ? <AvatarImage src={user.avatar} /> : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.nome.substring(0, 2).toUpperCase() || "AC"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Compartilhe uma conquista ou experiência..."
                    className="min-h-[100px] resize-none"
                    value={novoPost}
                    onChange={e => setNovoPost(e.target.value)}
                  />
                  {imagemPost && (
                    <div className="mt-3 relative">
                      <img src={imagemPost} alt="Preview" className="rounded-lg max-h-48 object-cover" />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setImagemPost(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {videoPost && (
                    <div className="mt-3 relative">
                      <video src={videoPost} className="rounded-lg max-h-48 w-full object-cover" controls />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => setVideoPost(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm" className="clay-button bg-transparent cursor-pointer"
                        onClick={() => document.getElementById("foto-upload")?.click()} type="button"
                      >
                        📷 Foto
                      </Button>
                      <input id="foto-upload" type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
                      <Button
                        variant="outline" size="sm" className="clay-button bg-transparent cursor-pointer"
                        onClick={() => document.getElementById("video-upload")?.click()} type="button"
                      >
                        <Video className="mr-2 h-4 w-4" />Vídeo
                      </Button>
                      <input id="video-upload" type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                    </div>
                    <Button
                      className="clay-button"
                      onClick={handlePublicar}
                      disabled={!novoPost.trim() || publicando}
                    >
                      {publicando ? "Publicando…" : "Publicar"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feed de Postagens */}
          <div className="space-y-6">
            {loadingFeed && postagens.length === 0 && (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}

            {!loadingFeed && postagens.length === 0 && (
              <Card className="clay-card border-0">
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma publicação ainda. Seja o primeiro a compartilhar!
                </CardContent>
              </Card>
            )}

            {postagens.map(post => (
              <Card
                key={post.id}
                id={`post-${post.id}`}
                className={`clay-card border-0 transition-all duration-500 ${
                  highlightedPostId === post.id ? "ring-2 ring-primary ring-offset-2 shadow-lg" : ""
                }`}
              >
                <CardContent className="pt-6">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      {post.avatarUrl && <AvatarImage src={post.avatarUrl} />}
                      <AvatarFallback className="bg-primary text-primary-foreground">{post.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{post.autor}</p>
                        {post.editedAt && <span className="text-xs text-muted-foreground">(editado)</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{post.cargo} • {post.departamento}</p>
                      <p className="text-xs text-muted-foreground">{post.tempo}</p>
                    </div>

                    {/* Menu 3 pontos — apenas dono do post */}
                    {post.userId === user?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStartEdit(post)}>
                            <Pencil className="mr-2 h-4 w-4" />Editar publicação
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => { setDeleteConfirmId(post.id); setEditingPostId(null) }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />Excluir publicação
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Conteúdo / modo edição */}
                  {editingPostId === post.id ? (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        value={editConteudo}
                        onChange={e => setEditConteudo(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="clay-button" onClick={() => handleSaveEdit(post.id)} disabled={!editConteudo.trim()}>
                          Salvar alterações
                        </Button>
                        <Button size="sm" variant="outline" className="bg-transparent" onClick={() => setEditingPostId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-foreground">{post.conteudo}</p>
                  )}

                  {/* Imagem */}
                  {post.imagem && (
                    <div className="mt-4 overflow-hidden rounded-lg">
                      <img src={post.imagem} alt="Post" className="w-full object-cover" />
                    </div>
                  )}

                  {/* Vídeo */}
                  {post.video && (
                    <div className="mt-4 overflow-hidden rounded-lg relative">
                      <video
                        id={`video-${post.id}`}
                        src={post.video}
                        className="w-full object-cover rounded-lg"
                        onClick={() => toggleVideoPlay(post.id)}
                        onPlay={() => setPlayingVideos(prev => ({ ...prev, [post.id]: true }))}
                        onPause={() => setPlayingVideos(prev => ({ ...prev, [post.id]: false }))}
                      />
                      <Button
                        variant="secondary" size="icon"
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full opacity-80 hover:opacity-100"
                        onClick={() => toggleVideoPlay(post.id)}
                      >
                        {playingVideos[post.id] ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                      </Button>
                    </div>
                  )}

                  {/* Reações */}
                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
                    <Button
                      variant="ghost" size="sm"
                      className={`gap-2 ${post.userLiked ? "text-primary" : ""}`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className={`h-4 w-4 ${post.userLiked ? "fill-primary" : ""}`} />
                      <span>{post.reacoes.likes}</span>
                    </Button>
                    <Button
                      variant="ghost" size="sm"
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

                    {/* Visualizações — só para o dono */}
                    {post.userId === user?.id && (post.views ?? 0) > 0 && (
                      <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground select-none">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{post.views} visualização{post.views !== 1 ? "ões" : ""}</span>
                      </div>
                    )}
                  </div>

                  {/* Comentários */}
                  {post.showComments && (
                    <div className="mt-4 space-y-4 border-t border-border pt-4">
                      {post.comentariosList && post.comentariosList.length > 0 && (
                        <div className="space-y-3">
                          {post.comentariosList.map((comentario, idx) => (
                            <div key={comentario.id ?? idx} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                {comentario.avatarUrl && <AvatarImage src={comentario.avatarUrl} />}
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

                      {/* Input novo comentário */}
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          {user?.avatar ? <AvatarImage src={user.avatar} /> : null}
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {user?.nome.substring(0, 2).toUpperCase() || "AC"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-1 gap-2">
                          <Input
                            placeholder="Escreva um comentário..."
                            value={novoComentario[post.id] || ""}
                            onChange={e => setNovoComentario(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === "Enter") handleAddComment(post.id) }}
                          />
                          <Button
                            size="icon" className="clay-button"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!novoComentario[post.id]?.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confirmação exclusão inline */}
                  {deleteConfirmId === post.id && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <span className="flex-1">Tem certeza que deseja excluir esta publicação?</span>
                      <Button size="sm" variant="destructive" onClick={() => handleDeletePost(post.id)}>Excluir</Button>
                      <Button size="sm" variant="ghost" className="bg-transparent" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Coluna direita ── */}
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
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">{pessoa.avatar}</AvatarFallback>
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

      {/* Dialog: motivo de recusa (gestor) */}
      <Dialog open={rejectingPostId !== null} onOpenChange={open => { if (!open) { setRejectingPostId(null); setRejectReason("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recusar publicação</DialogTitle>
            <DialogDescription>
              Informe opcionalmente o motivo da recusa. O colaborador será notificado e poderá ver o motivo.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da recusa (opcional)..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="min-h-[80px] resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => { setRejectingPostId(null); setRejectReason("") }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              Confirmar recusa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: publicação enviada para aprovação */}
      <Dialog open={showEnviadoModal} onOpenChange={setShowEnviadoModal}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <DialogTitle className="text-center text-lg">Publicação enviada!</DialogTitle>
            <DialogDescription className="text-center">
              Sua publicação foi enviada ao seu gestor para aprovação. Ela será publicada no feed assim que aprovada.
              Você receberá uma notificação no sininho quando isso acontecer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-2">
            <Button className="clay-button" onClick={() => setShowEnviadoModal(false)}>Entendido</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
