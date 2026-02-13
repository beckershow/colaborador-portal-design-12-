"use client"

import { EngageSidebar } from "@/components/engage-sidebar"
import { RoleSwitcherDev } from "@/components/role-switcher-dev"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { getTraining, startTraining, completeTraining, answerTrainingQuestion, type TrainingDetail } from "@/lib/trainings-api"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, FileText, Award, Download, AlertCircle, Repeat, Volume2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function CourseViewPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = String(params?.courseId || "")
  const { toast } = useToast()
  const [course, setCourse] = useState<TrainingDetail | null>(null)
  const [progress, setProgress] = useState<TrainingDetail["userProgress"]>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())
  const [answeredCount, setAnsweredCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string | string[]>>({})
  const [isAnswering, setIsAnswering] = useState<Record<string, boolean>>({})
  const [showCertificate, setShowCertificate] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [showRefazerModal, setShowRefazerModal] = useState(false)
  const isCompleted = !!progress?.completedAt
  const hasQuestions = (course?.questions || []).length > 0
  const allQuestionsAnswered = totalQuestions === 0 ? true : answeredCount >= totalQuestions

  useEffect(() => {
    if (!user) return

    const loadTraining = async () => {
      try {
        if (!courseId) return
        const res = await getTraining(courseId)
        setCourse(res.data)
        const userProg = res.data.userProgress ?? null
        setProgress(userProg)
        if (userProg?.completedAt) {
          setShowCertificate(true)
        }
        const answered = new Set((res.data.userQuestionProgress || []).map((q) => q.questionId))
        setAnsweredIds(answered)
        const total = res.data.questions?.length || 0
        setTotalQuestions(total)
        setAnsweredCount(answered.size)
      } catch (error: any) {
        toast({
          title: "Treinamento não encontrado",
          description: error?.message || "Não foi possível carregar o treinamento.",
          variant: "destructive",
        })
        router.push("/treinamentos")
      }
    }

    loadTraining()
  }, [user, courseId, router, toast])

  const handleCompleteLesson = () => {
    if (!user || !course) return
    if (progress?.completedAt) {
      toast({
        title: "Treinamento já concluído",
        description: "Este treinamento já está marcado como concluído.",
      })
      return
    }
    const run = async () => {
      try {
        setIsCompleting(true)
        const res = await completeTraining(course.id)
        setProgress(res.data)
        setShowCertificate(true)
      } catch (error: any) {
        toast({
          title: "Falha ao concluir",
          description: error?.message || "Não foi possível concluir o treinamento.",
          variant: "destructive",
        })
      } finally {
        setIsCompleting(false)
      }
    }

    run()
  }

  const handleRefazer = () => {
    if (!user || !course) return
    setShowCertificate(false)
    setShowRefazerModal(false)
  }

  const handleStartTraining = () => {
    if (!user || !course) return
    const run = async () => {
      try {
        setIsStarting(true)
        const res = await startTraining(course.id)
        setProgress(res.data)
      } catch (error: any) {
        toast({
          title: "Falha ao iniciar",
          description: error?.message || "Não foi possível iniciar o treinamento.",
          variant: "destructive",
        })
      } finally {
        setIsStarting(false)
      }
    }

    run()
  }

  const handleAnswerQuestion = async (questionId: string) => {
    if (!course) return
    const value = answerDrafts[questionId]
    if (!value || (Array.isArray(value) && value.length === 0)) {
      toast({
        title: "Resposta obrigatória",
        description: "Preencha a resposta antes de enviar.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAnswering((prev) => ({ ...prev, [questionId]: true }))
      const res = await answerTrainingQuestion(course.id, questionId, value as any)
      setProgress((prev) => ({
        ...(prev || {}),
        progress: res.data.progress.progress,
      }))
      setAnsweredIds((prev) => new Set(prev).add(questionId))
      if (typeof res.data.answered === "number") {
        setAnsweredCount(res.data.answered)
      } else {
        setAnsweredCount((prev) => prev + 1)
      }
      if (typeof res.data.total === "number") {
        setTotalQuestions(res.data.total)
      }
      toast({
        title: "Resposta registrada",
        description: "A resposta foi salva com sucesso.",
      })
    } catch (error: any) {
      toast({
        title: "Falha ao responder",
        description: error?.message || "Não foi possível registrar a resposta.",
        variant: "destructive",
      })
    } finally {
      setIsAnswering((prev) => ({ ...prev, [questionId]: false }))
    }
  }

  if (!user || !course) return null

  if (showCertificate) {
    return (
      <div className="flex min-h-screen bg-background">
        <EngageSidebar />
        <RoleSwitcherDev />

        <main className="ml-72 flex flex-1 items-center justify-center p-8">
          <Card className="clay-card w-full max-w-3xl border-0">
            <CardContent className="py-16 text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent/20 animate-bounce">
                  <Award className="h-12 w-12 text-accent" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground">Parabéns! Treinamento Concluído!</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Você completou com sucesso o curso:{" "}
                <span className="font-semibold text-foreground">{course.title}</span>
              </p>
              <div className="mt-8 flex items-center justify-center gap-8">
                <div className="rounded-xl bg-primary/10 px-8 py-4">
                  <p className="text-3xl font-bold text-primary">+{course.rewardXP || 0} XP</p>
                </div>
                <div className="rounded-xl bg-accent/10 px-8 py-4">
                  <p className="text-3xl font-bold text-accent">⭐ {course.rewardStars || 0}</p>
                </div>
              </div>

              {course.questionsRequired ? (
                <div className="mt-8">
                  <div className="mx-auto max-w-md rounded-xl border-2 border-accent bg-gradient-to-br from-accent/10 to-primary/10 p-8">
                    <Award className="mx-auto h-16 w-16 text-accent" />
                    <h3 className="mt-4 text-xl font-bold text-foreground">Certificado de Conclusão</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Este certificado comprova que {user.nome} concluiu com sucesso o treinamento {course.title}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Nota: {progress?.score ?? 0}%
                    </p>
                  </div>
                  <Button className="mt-6 clay-button">
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Certificado
                  </Button>
                </div>
              ) : null}
              {!course.questionsRequired ? (
                <div className="mt-8 rounded-lg border-2 border-destructive/30 bg-destructive/5 p-6 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                  <h3 className="mt-3 text-lg font-bold text-foreground">Certificado não emitido</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Você não atingiu o percentual mínimo necessário para receber o certificado.
                  </p>
                </div>
              ) : null}

              <div className="mt-8 flex gap-3">
                <Button
                  onClick={() => router.push("/treinamentos")}
                  variant="outline"
                  className="flex-1 clay-button bg-transparent"
                >
                  Voltar para Treinamentos
                </Button>
                <Button
                  onClick={() => setShowRefazerModal(true)}
                  className="flex-1 clay-button"
                >
                  <Repeat className="mr-2 h-4 w-4" />
                  Refazer Treinamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <EngageSidebar />
      <RoleSwitcherDev />

      <main className="ml-72 flex-1 pt-6 pb-6 px-0">
        <div className="w-full max-w-none">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.push("/treinamentos")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Treinamentos
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
            <p className="mt-2 text-muted-foreground">{course.description}</p>
          </div>

          {/* Progress */}
          <Card className="clay-card mb-6 border-0">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso do Treinamento</span>
                  <span className="font-semibold text-primary">{progress?.progress ?? 0}% concluído</span>
                </div>
                <Progress value={progress?.progress ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {progress?.completedAt ? "Treinamento concluído" : "Treinamento em andamento"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="clay-card border-0">
              <CardContent className="p-6 space-y-6">
                <div className="rounded-lg bg-muted/30 p-6">
                  <h2 className="text-2xl font-bold text-foreground">Conteúdo do Treinamento</h2>
                  <p className="mt-3 text-muted-foreground">
                    {course.contentText || "Nenhum conteúdo textual fornecido."}
                  </p>
                  {course.summaryAudioUrl && (
                    <div className="mt-4 flex items-center gap-3 rounded-md border bg-background p-3">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <audio controls src={course.summaryAudioUrl} className="w-full" />
                    </div>
                  )}
                </div>

                {(course.contentFileUrls && course.contentFileUrls.length > 0) ||
                (course.contentFiles && course.contentFiles.length > 0) ? (
                  <div>
                    <h3 className="mb-3 font-semibold text-foreground">Arquivos</h3>
                    <div className="space-y-2">
                      {(course.contentFileUrls && course.contentFileUrls.length > 0
                        ? course.contentFileUrls
                        : (course.contentFiles || []).map((key) => ({ key, url: key.startsWith("http") ? key : "" }))
                      ).map((file, idx) => {
                        const fileUrl = file.url || (file.key.startsWith("http") ? file.key : "")
                        return (
                          <div key={`${file.key}-${idx}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{file.key}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="ml-auto"
                              onClick={() => fileUrl && window.open(fileUrl, "_blank", "noopener,noreferrer")}
                              disabled={!fileUrl}
                              aria-label="Visualizar arquivo"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-2">
                  <Button
                    onClick={handleStartTraining}
                    className="flex-1 clay-button"
                    size="lg"
                    disabled={isStarting || !!progress}
                  >
                    {progress ? "Iniciado" : isStarting ? "Iniciando..." : "Iniciar"}
                  </Button>
                  <Button
                    onClick={() => setShowQuiz(true)}
                    className="flex-1 clay-button"
                    size="lg"
                    disabled={!progress || isCompleted || !hasQuestions}
                  >
                    Iniciar avaliação
                  </Button>
                </div>
              </CardContent>
            </Card>

            {(showQuiz || isCompleted) ? (
              <Card className="clay-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Questões do Treinamento</h3>
                    <span className="text-xs text-muted-foreground">
                      {answeredCount}/{totalQuestions} respondidas
                    </span>
                  </div>
                  <div className="space-y-4">
                    {(course.questions || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma questão cadastrada.</p>
                    ) : (
                      course.questions?.map((q, index) => {
                        const isAnswered = answeredIds.has(q.id)
                        const hasOptions = (q.options || []).length > 0
                        const isCheckbox = q.answerTypes?.includes("checkbox")
                        const draftValue = answerDrafts[q.id] ?? (isCheckbox ? [] : "")

                        return (
                          <div key={q.id} className="rounded-xl border bg-muted/10 p-6 space-y-4">
                            <p className="text-base font-semibold text-foreground">
                              {index + 1}. {q.question}
                            </p>

                            {hasOptions ? (
                              <div className="space-y-2">
                                {q.options.map((opt, optIdx) => {
                                  const checked = Array.isArray(draftValue)
                                    ? draftValue.includes(opt)
                                    : draftValue === opt
                                  return (
                                    <label key={`${q.id}-opt-${optIdx}`} className="flex items-center gap-2 text-sm">
                                      <input
                                        type={isCheckbox ? "checkbox" : "radio"}
                                        name={`q-${q.id}`}
                                        checked={checked}
                                        onChange={(e) => {
                                          if (isCheckbox) {
                                            const current = Array.isArray(draftValue) ? draftValue : []
                                            const next = e.target.checked
                                              ? [...current, opt]
                                              : current.filter((v) => v !== opt)
                                            setAnswerDrafts((prev) => ({ ...prev, [q.id]: next }))
                                          } else {
                                            setAnswerDrafts((prev) => ({ ...prev, [q.id]: opt }))
                                          }
                                        }}
                                        disabled={isCompleted}
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            ) : (
                              <Textarea
                                rows={4}
                                value={typeof draftValue === "string" ? draftValue : ""}
                                onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Digite sua resposta"
                                disabled={isCompleted}
                              />
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {isAnswered ? "Respondida" : "Pendente"}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleAnswerQuestion(q.id)}
                                disabled={isAnswering[q.id] || isAnswered || isCompleted}
                              >
                                {isAnswered ? "Respondida" : isAnswering[q.id] ? "Salvando..." : "Enviar resposta"}
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={handleCompleteLesson}
                      className="w-full clay-button"
                      size="lg"
                      disabled={
                        isCompleting ||
                        !progress ||
                        isCompleted ||
                        !allQuestionsAnswered
                      }
                    >
                      {isCompleting ? "Concluindo..." : "Concluir"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </main>

      {/* Modal de Refazer Treinamento */}
      <Dialog open={showRefazerModal} onOpenChange={setShowRefazerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refazer Treinamento?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja refazer este treinamento? Todo o seu progresso atual será perdido e você começará do zero.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg bg-accent/10 border border-accent/30 p-4">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Você poderá tentar novamente obter uma nota melhor e, se elegível, receber o certificado.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefazerModal(false)} className="bg-transparent">
              Cancelar
            </Button>
            <Button onClick={handleRefazer} className="clay-button">
              <Repeat className="mr-2 h-4 w-4" />
              Confirmar e Refazer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
