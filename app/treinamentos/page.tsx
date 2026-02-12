"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { listTrainings, type TrainingSummary } from "@/lib/trainings-api"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Star, Award, Play, CheckCircle2, BookOpen, Zap, Plus, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function TrainingPage() {
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [allCourses, setAllCourses] = useState<TrainingSummary[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)

  const canCreateTraining = hasPermission(["gestor", "super-admin"])

  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      try {
        setIsLoading(true)
        const res = await listTrainings({ limit: 200 })
        const items = res.data || []
        setAllCourses(items)

        const isCompleted = (p?: TrainingSummary["userProgress"]) =>
          !!p?.completedAt || (p?.progress ?? 0) >= 100

        const completed = items.filter((c) => isCompleted(c.userProgress)).length
        const inProgress = items.filter(
          (c) => c.userProgress && !isCompleted(c.userProgress),
        ).length
        const totalXP = items
          .filter((c) => isCompleted(c.userProgress))
          .reduce((sum, c) => sum + (c.rewardXP || 0), 0)

        setStats({
          completed,
          inProgress,
          certificates: 0,
          totalHours: 0,
          totalXP,
        })
      } catch (error: any) {
        toast({
          title: "Falha ao carregar treinamentos",
          description: error?.message || "Não foi possível buscar os treinamentos.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  const handleStartCourse = (courseId: string) => {
    router.push(`/treinamentos/${courseId}`)
  }

  const handleContinueCourse = (courseId: string) => {
    router.push(`/treinamentos/${courseId}`)
  }

  if (!user) return null

  const requiredCourses: TrainingSummary[] = []
  const isCompleted = (p?: TrainingSummary["userProgress"]) =>
    !!p?.completedAt || (p?.progress ?? 0) >= 100

  const inProgressCourses = allCourses.filter(
    (c) => c.userProgress && !isCompleted(c.userProgress),
  )
  const completedCourses = allCourses.filter((c) => isCompleted(c.userProgress))
  const availableCourses = allCourses.filter((c) => !c.userProgress)

  const CourseCard = ({ course, progress }: { course: TrainingSummary; progress?: any }) => (
    <Card className="clay-card border-0">
      <div
        className="h-40 rounded-t-xl bg-cover bg-center"
        style={{
          backgroundImage: course.coverUrl ? `url(${course.coverUrl})` : "none",
          backgroundColor: "hsl(var(--muted))",
        }}
      >
        <div className="flex h-full items-start justify-between bg-gradient-to-t from-black/60 to-transparent p-4">
          <Badge className="bg-primary text-white">Treinamento</Badge>
        </div>
      </div>
      <CardContent className="pt-6">
        <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{course.description}</p>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 text-accent" />
            <span>+{course.rewardXP || 0} XP</span>
          </div>
        </div>

        {progress && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-semibold text-primary">{progress.progress}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          {progress && !progress.completedAt ? (
            <Button onClick={() => handleContinueCourse(course.id)} className="flex-1 clay-button">
              <Play className="mr-2 h-4 w-4" />
              Continuar
            </Button>
          ) : progress?.completedAt ? (
            <>
              <Button
                onClick={() => handleContinueCourse(course.id)}
                variant="outline"
                className="flex-1 clay-button bg-transparent"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Revisar
              </Button>
              <Button size="icon" variant="outline" className="clay-button bg-transparent">
                <Award className="h-4 w-4 text-accent" />
              </Button>
            </>
          ) : (
            <Button onClick={() => handleStartCourse(course.id)} className="flex-1 clay-button">
              <Play className="mr-2 h-4 w-4" />
              Ver detalhes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Treinamentos & Capacitação</h1>
          <p className="mt-2 text-lg text-muted-foreground">Desenvolva suas habilidades e avance na carreira</p>
        </div>
        {canCreateTraining && (
          <Link href="/gestor">
            <Button className="clay-button" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Treinamento
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-4 gap-6">
        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cursos Concluídos</p>
                <p className="text-3xl font-bold text-primary">{stats?.completed || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificados</p>
                <p className="text-3xl font-bold text-accent">{stats?.certificates || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <Award className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Horas de Estudo</p>
                <p className="text-3xl font-bold text-chart-1">{stats?.totalHours || 0}h</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-1/20">
                <Clock className="h-6 w-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="clay-card border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">XP Ganhos</p>
                <p className="text-3xl font-bold text-chart-3">+{stats?.totalXP || 0}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/20">
                <Zap className="h-6 w-6 text-chart-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="todos" className="space-y-6">
        <TabsList className="clay-card border-0">
          <TabsTrigger value="todos">Todos os Cursos</TabsTrigger>
          <TabsTrigger value="em-progresso">
            Em Progresso
            {stats?.inProgress > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">{stats.inProgress}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos ({stats?.completed || 0})</TabsTrigger>
        </TabsList>

        {/* Todos os Cursos */}
        <TabsContent value="todos" className="space-y-6">
          {isLoading ? (
            <Card className="clay-card border-0">
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-xl font-semibold text-foreground">Carregando treinamentos...</p>
              </CardContent>
            </Card>
          ) : (
            <>
          {/* Obrigatórios */}
          {requiredCourses.length > 0 && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-2xl font-bold text-foreground">Cursos Obrigatórios</h2>
                <Badge className="bg-chart-3 text-white">Prioridade</Badge>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {requiredCourses.map((course) => (
                  <CourseCard key={course.id} course={course} progress={course.userProgress} />
                ))}
              </div>
            </div>
          )}

          {/* Em Progresso */}
          {inProgressCourses.length > 0 && (
            <div>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Continue de onde parou</h2>
              <div className="grid grid-cols-3 gap-6">
                {inProgressCourses.map((item) => (
                  <CourseCard key={item.id} course={item} progress={item.userProgress} />
                ))}
              </div>
            </div>
          )}

          {/* Disponíveis */}
          {availableCourses.length > 0 && (
            <div>
              <h2 className="mb-4 text-2xl font-bold text-foreground">Cursos Disponíveis</h2>
              <div className="grid grid-cols-3 gap-6">
                {availableCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}
            </>
          )}
        </TabsContent>

        {/* Em Progresso */}
        <TabsContent value="em-progresso" className="space-y-6">
          {inProgressCourses.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-xl font-semibold text-foreground">Nenhum curso em progresso</p>
                <p className="mt-2 text-muted-foreground">Comece um novo curso para expandir suas habilidades</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {inProgressCourses.map((item) => (
                <CourseCard key={item.id} course={item} progress={item.userProgress} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Concluídos */}
        <TabsContent value="concluidos" className="space-y-6">
          {completedCourses.length === 0 ? (
            <Card className="clay-card border-0">
              <CardContent className="py-12 text-center">
                <GraduationCap className="mx-auto h-16 w-16 text-muted-foreground" />
                <p className="mt-4 text-xl font-semibold text-foreground">Nenhum curso concluído ainda</p>
                <p className="mt-2 text-muted-foreground">Complete seus primeiros cursos para ganhar certificados</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="mb-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Parabéns pelo seu progresso!</h3>
                    <p className="text-muted-foreground">
                      Você concluiu {stats?.completed} curso(s) e ganhou {stats?.certificates} certificado(s)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {completedCourses.map((item) => (
                  <CourseCard key={item.id} course={item} progress={item.userProgress} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
