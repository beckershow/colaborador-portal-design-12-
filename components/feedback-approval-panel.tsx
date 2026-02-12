"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, XCircle, Clock, Globe, Lock, User, Calendar } from "lucide-react"
import { FeedbackService } from "@/lib/feedback-service"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export function FeedbackApprovalPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pendingFeedbacks, setPendingFeedbacks] = useState<any[]>([])
  const [approvedFeedbacks, setApprovedFeedbacks] = useState<any[]>([])

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = () => {
    const allFeedbacks = FeedbackService.getAllFeedbacks()
    const allUsers = JSON.parse(localStorage.getItem("engageai_users") || "[]")

    // Feedbacks pendentes
    const pending = allFeedbacks
      .filter((f) => f.status === "pending")
      .map((f) => ({
        ...f,
        fromUser: allUsers.find((u: any) => u.id === f.fromUserId),
        toUser: allUsers.find((u: any) => u.id === f.toUserId),
      }))

    // Feedbacks aprovados
    const approved = allFeedbacks
      .filter((f) => f.status === "approved")
      .map((f) => ({
        ...f,
        fromUser: allUsers.find((u: any) => u.id === f.fromUserId),
        toUser: allUsers.find((u: any) => u.id === f.toUserId),
      }))

    setPendingFeedbacks(pending)
    setApprovedFeedbacks(approved)
  }

  const handleApprove = (feedbackId: string) => {
    FeedbackService.approveFeedback(feedbackId)
    toast({
      title: "Feedback aprovado",
      description: "O feedback foi entregue ao destinatário.",
    })
    loadFeedbacks()
  }

  const handleReject = (feedbackId: string) => {
    FeedbackService.rejectFeedback(feedbackId)
    toast({
      title: "Feedback reprovado",
      description: "O feedback não foi entregue e foi arquivado.",
      variant: "destructive",
    })
    loadFeedbacks()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      reconhecimento: "bg-green-500/10 text-green-600 border-green-500/20",
      melhoria: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      construtivo: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    }
    return colors[category] || "bg-gray-500/10 text-gray-600 border-gray-500/20"
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-6">
        <h2 className="text-2xl font-bold text-foreground">Aprovação de Feedbacks</h2>
        <p className="mt-2 text-muted-foreground">
          Gerencie feedbacks pendentes e visualize o histórico de aprovações
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes ({pendingFeedbacks.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Aprovados ({approvedFeedbacks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingFeedbacks.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-muted-foreground opacity-50" />
                <p className="mt-4 text-center text-muted-foreground">
                  Nenhum feedback pendente de aprovação
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="clay-card border-0">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={feedback.fromUser?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {feedback.fromUser?.nome.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{feedback.fromUser?.nome}</p>
                          <span className="text-muted-foreground">→</span>
                          <p className="font-semibold text-foreground">{feedback.toUser?.nome}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{formatDate(feedback.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(feedback.category)}>
                        {feedback.category}
                      </Badge>
                      {feedback.isPublic ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                          <Globe className="h-3 w-3" />
                          Público
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20 gap-1">
                          <Lock className="h-3 w-3" />
                          Privado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm text-foreground">{feedback.message}</p>
                  </div>

                  {feedback.isPublic && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                      <p className="text-xs text-blue-600">
                        <Globe className="inline h-3 w-3 mr-1" />
                        Este feedback será compartilhado no feed social após aprovação
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleApprove(feedback.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => handleReject(feedback.id)}
                      variant="outline"
                      className="flex-1 bg-transparent border-red-500/20 text-red-600 hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reprovar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedFeedbacks.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-16 w-16 text-muted-foreground opacity-50" />
                <p className="mt-4 text-center text-muted-foreground">
                  Nenhum feedback aprovado ainda
                </p>
              </CardContent>
            </Card>
          ) : (
            approvedFeedbacks.map((feedback) => (
              <Card key={feedback.id} className="clay-card border-0 opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={feedback.fromUser?.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {feedback.fromUser?.nome.split(" ").map((n: string) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{feedback.fromUser?.nome}</p>
                          <span className="text-muted-foreground">→</span>
                          <p className="font-semibold text-foreground">{feedback.toUser?.nome}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{formatDate(feedback.createdAt)}</p>
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aprovado
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(feedback.category)}>
                        {feedback.category}
                      </Badge>
                      {feedback.isPublic ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
                          <Globe className="h-3 w-3" />
                          Público
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20 gap-1">
                          <Lock className="h-3 w-3" />
                          Privado
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <p className="text-sm text-foreground">{feedback.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
