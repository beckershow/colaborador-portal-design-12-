"use client"

import { EngageSidebar } from "@/components/engage-sidebar"
import { RoleSwitcherDev } from "@/components/role-switcher-dev"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { SurveyService, type Survey, type SurveyQuestion } from "@/lib/survey-service"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"

export default function SurveyResponsePage({ params }: { params: { surveyId: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    if (!user) return

    const loadedSurvey = SurveyService.getSurveyById(params.surveyId)
    if (!loadedSurvey) {
      router.push("/pesquisas")
      return
    }

    // Verificar se já respondeu
    if (SurveyService.hasUserResponded(params.surveyId, user.id)) {
      router.push("/pesquisas")
      return
    }

    setSurvey(loadedSurvey)
  }, [user, params.surveyId, router])

  if (!user || !survey) return null

  const currentQuestion = survey.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1
  const canProceed = !currentQuestion.required || answers[currentQuestion.id] !== undefined

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    SurveyService.submitResponse({
      surveyId: survey.id,
      userId: user.id,
      userName: user.nome,
      answers,
    })

    setIsSubmitting(false)
    setIsCompleted(true)

    // Redirecionar após 3 segundos
    setTimeout(() => {
      router.push("/pesquisas")
    }, 3000)
  }

  const renderQuestion = (question: SurveyQuestion) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">{question.question}</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  onClick={() => setAnswers({ ...answers, [question.id]: rating })}
                  variant="outline"
                  className={`h-16 w-16 text-2xl clay-button ${
                    answers[question.id] === rating
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "bg-transparent"
                  }`}
                >
                  {rating}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Muito Insatisfeito</span>
              <span>Muito Satisfeito</span>
            </div>
          </div>
        )

      case "nps":
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">{question.question}</p>
            <div className="grid grid-cols-11 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <Button
                  key={score}
                  onClick={() => setAnswers({ ...answers, [question.id]: score })}
                  variant="outline"
                  className={`h-12 text-lg clay-button ${
                    answers[question.id] === score
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "bg-transparent"
                  }`}
                >
                  {score}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Nada provável</span>
              <span>Extremamente provável</span>
            </div>
          </div>
        )

      case "multiple-choice":
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">{question.question}</p>
            <div className="space-y-3">
              {question.options?.map((option) => (
                <Button
                  key={option}
                  onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  variant="outline"
                  className={`w-full justify-start p-4 text-left clay-button ${
                    answers[question.id] === option
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "bg-transparent"
                  }`}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        )

      case "yes-no":
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">{question.question}</p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setAnswers({ ...answers, [question.id]: "Sim" })}
                variant="outline"
                className={`h-20 text-lg clay-button ${
                  answers[question.id] === "Sim"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "bg-transparent"
                }`}
              >
                Sim
              </Button>
              <Button
                onClick={() => setAnswers({ ...answers, [question.id]: "Não" })}
                variant="outline"
                className={`h-20 text-lg clay-button ${
                  answers[question.id] === "Não"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "bg-transparent"
                }`}
              >
                Não
              </Button>
            </div>
          </div>
        )

      case "text":
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">{question.question}</p>
            <Textarea
              value={answers[question.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
              placeholder="Digite sua resposta..."
              rows={5}
              className="clay-button resize-none"
            />
          </div>
        )

      default:
        return null
    }
  }

  if (isCompleted) {
    return (
      <div className="flex min-h-screen bg-background">
        <EngageSidebar />
        <RoleSwitcherDev />

        <main className="ml-72 flex flex-1 items-center justify-center p-8">
          <Card className="clay-card w-full max-w-2xl border-0">
            <CardContent className="py-16 text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 animate-bounce">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground">Pesquisa Concluída!</h2>
              <p className="mt-3 text-lg text-muted-foreground">Obrigado por compartilhar sua opinião. Você ganhou:</p>
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="rounded-xl bg-primary/10 px-8 py-4">
                  <p className="text-3xl font-bold text-primary">+{survey.reward.xp} XP</p>
                </div>
                <div className="rounded-xl bg-accent/10 px-8 py-4">
                  <p className="text-3xl font-bold text-accent">⭐ {survey.reward.stars}</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">Redirecionando para a página de pesquisas...</p>
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

      <main className="ml-72 flex-1 p-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.push("/pesquisas")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Pesquisas
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{survey.title}</h1>
            <p className="mt-2 text-muted-foreground">{survey.description}</p>
          </div>

          {/* Progress */}
          <Card className="clay-card mb-6 border-0">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Pergunta {currentQuestionIndex + 1} de {survey.questions.length}
                  </span>
                  <span className="font-semibold text-primary">{Math.round(progress)}% concluído</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="clay-card border-0">
            <CardContent className="py-12">
              {renderQuestion(currentQuestion)}
              {currentQuestion.required && (
                <p className="mt-4 text-center text-sm text-muted-foreground">* Campo obrigatório</p>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={currentQuestionIndex === 0}
              className="clay-button bg-transparent"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <Button onClick={handleNext} disabled={!canProceed || isSubmitting} className="clay-button">
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Enviando...
                </>
              ) : isLastQuestion ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Finalizar
                </>
              ) : (
                <>
                  Próxima
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Reward Info */}
          <div className="mt-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              Ao concluir esta pesquisa você ganhará +{survey.reward.xp} XP e ⭐ {survey.reward.stars} estrelas
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
