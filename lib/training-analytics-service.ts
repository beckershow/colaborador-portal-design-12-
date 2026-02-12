"use client"

import { TrainingService, type Course, type CourseProgress } from "./training-service"
import { mockUsers } from "./auth-context"

export interface TrainingUserAnalytics {
  userId: string
  nome: string
  avatar?: string
  time: string
  departamento: string
  treinamentosDisponiveis: number
  treinamentosIniciados: number
  treinamentosConcluidos: number
  treinamentosAbandonados: number
  obrigatoriosPendentes: number
  percentualProgresso: number // 0-100
  taxaConclusao: number // 0-100
  tempoDedicado: number // em horas
  engajamento: "alto" | "medio" | "baixo" | "inativo"
  ultimaInteracao: string
  certificadosObtidos: number
  treinamentosDetalhes: {
    disponiveis: Course[]
    iniciados: CourseProgress[]
    concluidos: CourseProgress[]
  }
}

export interface TrainingAnalytics {
  totalCriados: number
  totalAtivos: number
  totalObrigatorios: number
  taxaConclusaoMedia: number // 0-100
  tempoMedioConclusao: number // em horas
  usuariosAtivos: number
  usuariosInativos: number
  certificadosEmitidos: number
  evolucaoParticipacao: Array<{
    dia: string
    participacao: number
    conclusoes: number
  }>
  usoPorTreinamento: Array<{
    courseId: string
    titulo: string
    categoria: string
    nivel: string
    inscritos: number
    taxaInicio: number
    taxaConclusao: number
    taxaAbandono: number
    tempoMedioConclusao: number
  }>
  usuariosPorTime: Record<string, TrainingUserAnalytics[]>
}

export interface TrainingDetailedAnalytics {
  course: Course
  totalInscritos: number
  taxaInicio: number
  taxaConclusao: number
  taxaAbandono: number
  tempoConclusaoMedio: number
  evolucaoConsumo: Array<{
    dia: string
    inicios: number
    conclusoes: number
  }>
  comparacaoTimes?: Record<
    string,
    {
      inscritos: number
      conclusoes: number
      taxa: number
    }
  >
}

export class TrainingAnalyticsService {
  // Guard clause: Validar se o usuário existe
  private static isValidUser(userId: string): boolean {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return false
    }
    return true
  }

  // Guard clause: Validar array de courses
  private static validateCoursesArray(courses: any): courses is Course[] {
    return Array.isArray(courses)
  }

  // Guard clause: Validar array de progress
  private static validateProgressArray(progress: any): progress is CourseProgress[] {
    return Array.isArray(progress)
  }

  // Calcular tempo dedicado total em horas
  private static calculateTotalTime(progress: CourseProgress[], courses: Course[]): number {
    if (!this.validateProgressArray(progress) || progress.length === 0) {
      return 0
    }

    const totalMinutes = progress.reduce((sum, p) => {
      const course = courses.find((c) => c.id === p.courseId)
      if (!course) return sum

      // Se concluído, soma a duração total
      if (p.completedAt) {
        return sum + course.duration
      }

      // Se em andamento, estima baseado no progresso
      return sum + Math.round((course.duration * p.progress) / 100)
    }, 0)

    return Math.round((totalMinutes / 60) * 10) / 10 // Arredondar para 1 casa decimal
  }

  // Determinar nível de engajamento
  private static determineEngagement(
    concluidos: number,
    iniciados: number,
    taxaConclusao: number,
  ): "alto" | "medio" | "baixo" | "inativo" {
    const totalAtividades = iniciados

    if (totalAtividades === 0 && concluidos === 0) {
      return "inativo"
    }

    if (concluidos >= 3 && taxaConclusao >= 80) {
      return "alto"
    }

    if (concluidos >= 1 && taxaConclusao >= 50) {
      return "medio"
    }

    if (totalAtividades > 0) {
      return "baixo"
    }

    return "inativo"
  }

  // Obter última interação formatada
  private static getLastInteraction(progress: CourseProgress[]): string {
    if (!this.validateProgressArray(progress) || progress.length === 0) {
      return "Nunca"
    }

    // Pegar a data mais recente (completedAt ou startedAt)
    const dates = progress.map((p) => new Date(p.completedAt || p.startedAt).getTime()).filter((d) => !Number.isNaN(d))

    if (dates.length === 0) return "Nunca"

    const lastDate = Math.max(...dates)
    const diffMs = Date.now() - lastDate
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Hoje"
    if (diffDays === 1) return "Ontem"
    if (diffDays <= 7) return `${diffDays} dias atrás`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} semanas atrás`
    return `${Math.floor(diffDays / 30)} meses atrás`
  }

  // Obter analytics por usuário
  static getUserAnalytics(userId: string): TrainingUserAnalytics | null {
    // Guard clauses
    if (!this.isValidUser(userId)) {
      return null
    }

    const user = mockUsers.find((u) => u.id === userId)
    if (!user) {
      return null
    }

    const allCourses = TrainingService.getAllCourses()
    const userProgress = TrainingService.getUserProgress(userId)

    // Guard clauses para arrays
    const courses = this.validateCoursesArray(allCourses) ? allCourses : []
    const progress = this.validateProgressArray(userProgress) ? userProgress : []

    const treinamentosDisponiveis = courses.length
    const treinamentosIniciados = progress.length
    const treinamentosConcluidos = progress.filter((p) => p.completedAt).length
    const treinamentosAbandonados = progress.filter((p) => !p.completedAt && p.progress > 0 && p.progress < 100).length

    const obrigatoriosPendentes = courses.filter(
      (c) => c.isRequired && !progress.some((p) => p.courseId === c.id && p.completedAt),
    ).length

    // Percentual de progresso geral
    const percentualProgresso =
      progress.length > 0 ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length) : 0

    // Taxa de conclusão
    const taxaConclusao =
      treinamentosIniciados > 0 ? Math.round((treinamentosConcluidos / treinamentosIniciados) * 100) : 0

    const tempoDedicado = this.calculateTotalTime(progress, courses)

    const engajamento = this.determineEngagement(treinamentosConcluidos, treinamentosIniciados, taxaConclusao)

    const ultimaInteracao = this.getLastInteraction(progress)

    const certificadosObtidos = progress.filter((p) => p.certificateIssued).length

    const concluidos = progress.filter((p) => p.completedAt)
    const iniciados = progress.filter((p) => !p.completedAt)

    return {
      userId: user.id,
      nome: user.nome,
      avatar: user.avatar,
      time: user.departamento,
      departamento: user.departamento,
      treinamentosDisponiveis,
      treinamentosIniciados,
      treinamentosConcluidos,
      treinamentosAbandonados,
      obrigatoriosPendentes,
      percentualProgresso,
      taxaConclusao,
      tempoDedicado,
      engajamento,
      ultimaInteracao,
      certificadosObtidos,
      treinamentosDetalhes: {
        disponiveis: courses,
        iniciados: iniciados,
        concluidos: concluidos,
      },
    }
  }

  // Obter analytics gerais
  static getGeneralAnalytics(): TrainingAnalytics {
    const allCourses = TrainingService.getAllCourses()

    // Guard clauses
    const courses = this.validateCoursesArray(allCourses) ? allCourses : []

    // Coletar todos os progressos de todos os usuários
    const allProgress: CourseProgress[] = []
    mockUsers.forEach((user) => {
      const userProgress = TrainingService.getUserProgress(user.id)
      if (this.validateProgressArray(userProgress)) {
        allProgress.push(...userProgress)
      }
    })

    const totalCriados = courses.length
    const totalAtivos = courses.length // Assumir que todos estão ativos
    const totalObrigatorios = courses.filter((c) => c.isRequired).length

    // Taxa de conclusão média
    const concluidos = allProgress.filter((p) => p.completedAt).length
    const taxaConclusaoMedia = allProgress.length > 0 ? Math.round((concluidos / allProgress.length) * 100) : 0

    // Tempo médio de conclusão em horas
    const conclusoes = allProgress.filter((p) => p.completedAt)
    const tempoMedioConclusao = this.calculateTotalTime(conclusoes, courses) / (conclusoes.length || 1)

    // Contar usuários ativos (iniciaram pelo menos um treinamento)
    const usersWithActivity = new Set<string>()
    allProgress.forEach((p) => {
      usersWithActivity.add(p.userId)
    })

    const usuariosAtivos = usersWithActivity.size
    const usuariosInativos = Math.max(0, mockUsers.length - usuariosAtivos)

    const certificadosEmitidos = allProgress.filter((p) => p.certificateIssued).length

    // Evolução de participação (últimos 7 dias)
    const evolucaoParticipacao = this.getParticipationEvolution(allProgress)

    // Uso por treinamento
    const usoPorTreinamento = this.getCourseUsage(courses, allProgress)

    // Agrupar por time
    const usuariosPorTime: Record<string, TrainingUserAnalytics[]> = {}
    mockUsers.forEach((user) => {
      const analytics = this.getUserAnalytics(user.id)
      if (analytics) {
        if (!usuariosPorTime[user.departamento]) {
          usuariosPorTime[user.departamento] = []
        }
        usuariosPorTime[user.departamento].push(analytics)
      }
    })

    return {
      totalCriados,
      totalAtivos,
      totalObrigatorios,
      taxaConclusaoMedia,
      tempoMedioConclusao,
      usuariosAtivos,
      usuariosInativos,
      certificadosEmitidos,
      evolucaoParticipacao,
      usoPorTreinamento,
      usuariosPorTime,
    }
  }

  // Obter evolução de participação
  private static getParticipationEvolution(
    allProgress: CourseProgress[],
  ): Array<{ dia: string; participacao: number; conclusoes: number }> {
    if (!this.validateProgressArray(allProgress) || allProgress.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        dia: `Dia ${i + 1}`,
        participacao: 0,
        conclusoes: 0,
      }))
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date, index) => {
      const dayStarts = allProgress.filter((p) => p.startedAt.startsWith(date))
      const dayCompletions = allProgress.filter((p) => p.completedAt && p.completedAt.startsWith(date))

      return {
        dia: `Dia ${index + 1}`,
        participacao: dayStarts.length,
        conclusoes: dayCompletions.length,
      }
    })
  }

  // Obter uso por treinamento
  private static getCourseUsage(
    courses: Course[],
    allProgress: CourseProgress[],
  ): Array<{
    courseId: string
    titulo: string
    categoria: string
    nivel: string
    inscritos: number
    taxaInicio: number
    taxaConclusao: number
    taxaAbandono: number
    tempoMedioConclusao: number
  }> {
    if (!this.validateCoursesArray(courses) || courses.length === 0) {
      return []
    }

    return courses
      .map((course) => {
        const courseProgress = allProgress.filter((p) => p.courseId === course.id)

        const inscritos = courseProgress.length
        const inicios = courseProgress.filter((p) => p.progress > 0).length
        const conclusoes = courseProgress.filter((p) => p.completedAt).length
        const abandonos = courseProgress.filter((p) => !p.completedAt && p.progress > 0 && p.progress < 100).length

        // Taxa de início: quantos dos inscritos realmente começaram
        const taxaInicio = inscritos > 0 ? Math.round((inicios / inscritos) * 100) : 0

        // Taxa de conclusão: quantos concluíram do total de inscritos
        const taxaConclusao = inscritos > 0 ? Math.round((conclusoes / inscritos) * 100) : 0

        // Taxa de abandono
        const taxaAbandono = inicios > 0 ? Math.round((abandonos / inicios) * 100) : 0

        // Tempo médio de conclusão
        const concluidosProgress = courseProgress.filter((p) => p.completedAt)
        const tempoMedioConclusao =
          concluidosProgress.length > 0 ? Math.round((course.duration / 60) * 10) / 10 : course.duration / 60

        return {
          courseId: course.id,
          titulo: course.title,
          categoria: course.category,
          nivel: course.level,
          inscritos,
          taxaInicio,
          taxaConclusao,
          taxaAbandono,
          tempoMedioConclusao,
        }
      })
      .sort((a, b) => b.inscritos - a.inscritos) // Ordenar por inscritos
  }

  // Obter analytics detalhadas de um treinamento
  static getCourseDetailedAnalytics(courseId: string, isSuperAdmin = false): TrainingDetailedAnalytics | null {
    // Guard clauses
    if (!courseId || typeof courseId !== "string" || courseId.trim() === "") {
      return null
    }

    const course = TrainingService.getCourseById(courseId)
    if (!course) {
      return null
    }

    // Coletar progressos de todos os usuários para este curso
    const allProgress: CourseProgress[] = []
    mockUsers.forEach((user) => {
      const progress = TrainingService.getCourseProgress(user.id, courseId)
      if (progress) {
        allProgress.push(progress)
      }
    })

    const totalInscritos = allProgress.length
    const inicios = allProgress.filter((p) => p.progress > 0).length
    const conclusoes = allProgress.filter((p) => p.completedAt).length
    const abandonos = allProgress.filter((p) => !p.completedAt && p.progress > 0 && p.progress < 100).length

    const taxaInicio = totalInscritos > 0 ? Math.round((inicios / totalInscritos) * 100) : 0
    const taxaConclusao = totalInscritos > 0 ? Math.round((conclusoes / totalInscritos) * 100) : 0
    const taxaAbandono = inicios > 0 ? Math.round((abandonos / inicios) * 100) : 0

    const tempoConclusaoMedio = Math.round((course.duration / 60) * 10) / 10

    // Evolução de consumo (últimos 7 dias)
    const evolucaoConsumo = this.getCourseConsumptionEvolution(allProgress)

    // Comparação por times (apenas para Super Admin)
    let comparacaoTimes: Record<string, { inscritos: number; conclusoes: number; taxa: number }> | undefined

    if (isSuperAdmin) {
      comparacaoTimes = {}
      const teams = [...new Set(mockUsers.map((u) => u.departamento))]

      teams.forEach((team) => {
        const teamUsers = mockUsers.filter((u) => u.departamento === team)
        const teamProgress = allProgress.filter((p) => teamUsers.some((u) => u.id === p.userId))
        const teamConclusoes = teamProgress.filter((p) => p.completedAt).length

        comparacaoTimes![team] = {
          inscritos: teamProgress.length,
          conclusoes: teamConclusoes,
          taxa: teamProgress.length > 0 ? Math.round((teamConclusoes / teamProgress.length) * 100) : 0,
        }
      })
    }

    return {
      course,
      totalInscritos,
      taxaInicio,
      taxaConclusao,
      taxaAbandono,
      tempoConclusaoMedio,
      evolucaoConsumo,
      comparacaoTimes,
    }
  }

  // Obter evolução de consumo de um treinamento
  private static getCourseConsumptionEvolution(
    progress: CourseProgress[],
  ): Array<{ dia: string; inicios: number; conclusoes: number }> {
    if (!this.validateProgressArray(progress) || progress.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        dia: `Dia ${i + 1}`,
        inicios: 0,
        conclusoes: 0,
      }))
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split("T")[0]
    })

    return last7Days.map((date, index) => {
      const dayStarts = progress.filter((p) => p.startedAt.startsWith(date))
      const dayCompletions = progress.filter((p) => p.completedAt && p.completedAt.startsWith(date))

      return {
        dia: `Dia ${index + 1}`,
        inicios: dayStarts.length,
        conclusoes: dayCompletions.length,
      }
    })
  }

  // Filtrar analytics por time
  static filterByTeam(team: string): TrainingUserAnalytics[] {
    if (!team || typeof team !== "string" || team.trim() === "") {
      return []
    }

    const allAnalytics = this.getGeneralAnalytics()

    if (!allAnalytics.usuariosPorTime[team]) {
      return []
    }

    return allAnalytics.usuariosPorTime[team]
  }

  // Filtrar analytics por período
  static filterByPeriod(days: number): TrainingAnalytics {
    if (typeof days !== "number" || days <= 0) {
      return this.getGeneralAnalytics()
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Coletar progressos de todos os usuários no período
    const allProgress: CourseProgress[] = []
    mockUsers.forEach((user) => {
      const userProgress = TrainingService.getUserProgress(user.id)
      if (this.validateProgressArray(userProgress)) {
        const filtered = userProgress.filter((p) => new Date(p.startedAt) >= cutoffDate)
        allProgress.push(...filtered)
      }
    })

    const allCourses = TrainingService.getAllCourses()
    const courses = this.validateCoursesArray(allCourses) ? allCourses : []

    const totalCriados = courses.length
    const totalAtivos = courses.length
    const totalObrigatorios = courses.filter((c) => c.isRequired).length

    const concluidos = allProgress.filter((p) => p.completedAt).length
    const taxaConclusaoMedia = allProgress.length > 0 ? Math.round((concluidos / allProgress.length) * 100) : 0

    const conclusoes = allProgress.filter((p) => p.completedAt)
    const tempoMedioConclusao = this.calculateTotalTime(conclusoes, courses) / (conclusoes.length || 1)

    const usersWithActivity = new Set<string>()
    allProgress.forEach((p) => {
      usersWithActivity.add(p.userId)
    })

    const usuariosAtivos = usersWithActivity.size
    const usuariosInativos = Math.max(0, mockUsers.length - usuariosAtivos)

    const certificadosEmitidos = allProgress.filter((p) => p.certificateIssued).length

    const evolucaoParticipacao = this.getParticipationEvolution(allProgress)
    const usoPorTreinamento = this.getCourseUsage(courses, allProgress)

    const usuariosPorTime: Record<string, TrainingUserAnalytics[]> = {}
    mockUsers.forEach((user) => {
      const analytics = this.getUserAnalytics(user.id)
      if (analytics) {
        if (!usuariosPorTime[user.departamento]) {
          usuariosPorTime[user.departamento] = []
        }
        usuariosPorTime[user.departamento].push(analytics)
      }
    })

    return {
      totalCriados,
      totalAtivos,
      totalObrigatorios,
      taxaConclusaoMedia,
      tempoMedioConclusao,
      usuariosAtivos,
      usuariosInativos,
      certificadosEmitidos,
      evolucaoParticipacao,
      usoPorTreinamento,
      usuariosPorTime,
    }
  }
}
