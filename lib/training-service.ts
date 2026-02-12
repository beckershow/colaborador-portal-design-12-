"use client"

import { EngagementTrackingService } from "./engagement-tracking-service"

export type CourseCategory = "lideranca" | "tecnico" | "soft-skills" | "compliance" | "onboarding"
export type CourseLevel = "beginner" | "intermediate" | "advanced"
export type LessonType = "video" | "reading" | "quiz" | "practical"

export interface Lesson {
  id: string
  title: string
  type: LessonType
  duration: number // em minutos
  content?: string
  videoUrl?: string
  quizQuestions?: any[]
  completed?: boolean
}

export interface Course {
  id: string
  title: string
  description: string
  category: CourseCategory
  level: CourseLevel
  thumbnail: string
  instructor: string
  duration: number // total em minutos
  lessons: Lesson[]
  reward: {
    xp: number
    stars: number
    certificate: boolean
  }
  isRequired: boolean
  allowRetake: boolean
  tags: string[]
  createdAt: string
}

export interface CourseProgress {
  courseId: string
  userId: string
  startedAt: string
  completedLessons: string[]
  currentLesson: string
  progress: number // 0-100
  completedAt?: string
  score?: number // 0-100 - nota da avaliação
  certificateIssued?: boolean
}

const COURSES_KEY = "engageai-courses"
const PROGRESS_KEY = "engageai-course-progress"

export class TrainingService {
  static getDefaultCourses(): Course[] {
    return [
      {
        id: "course-1",
        title: "Fundamentos de Liderança",
        description: "Aprenda os princípios essenciais para se tornar um líder eficaz e inspirador",
        category: "lideranca",
        level: "beginner",
        thumbnail: "/course-leadership.jpg?query=leadership training",
        instructor: "Dr. Carlos Mendes",
        duration: 180,
        lessons: [
          {
            id: "l1",
            title: "Introdução à Liderança Moderna",
            type: "video",
            duration: 15,
            videoUrl: "https://example.com/video1",
          },
          {
            id: "l2",
            title: "Estilos de Liderança",
            type: "reading",
            duration: 20,
            content: "Conteúdo sobre estilos de liderança...",
          },
          {
            id: "l3",
            title: "Quiz: Avalie seu Estilo",
            type: "quiz",
            duration: 10,
            quizQuestions: [],
          },
          {
            id: "l4",
            title: "Comunicação Efetiva",
            type: "video",
            duration: 25,
            videoUrl: "https://example.com/video2",
          },
          {
            id: "l5",
            title: "Prática: Seu Plano de Liderança",
            type: "practical",
            duration: 30,
          },
        ],
        reward: {
          xp: 200,
          stars: 50,
          certificate: true,
        },
        isRequired: false,
        allowRetake: true,
        tags: ["liderança", "gestão", "comunicação"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "course-2",
        title: "Comunicação Não-Violenta",
        description: "Técnicas para melhorar a comunicação e resolver conflitos de forma construtiva",
        category: "soft-skills",
        level: "intermediate",
        thumbnail: "/course-communication.jpg?query=communication skills",
        instructor: "Ana Paula Silva",
        duration: 120,
        lessons: [
          {
            id: "l1",
            title: "O que é CNV?",
            type: "video",
            duration: 15,
            videoUrl: "https://example.com/video3",
          },
          {
            id: "l2",
            title: "Os 4 Componentes da CNV",
            type: "reading",
            duration: 25,
          },
          {
            id: "l3",
            title: "Prática de Escuta Ativa",
            type: "practical",
            duration: 30,
          },
          {
            id: "l4",
            title: "Quiz Final",
            type: "quiz",
            duration: 15,
          },
        ],
        reward: {
          xp: 150,
          stars: 40,
          certificate: true,
        },
        isRequired: false,
        allowRetake: true,
        tags: ["comunicação", "soft skills", "CNV"],
        createdAt: new Date().toISOString(),
      },
      {
        id: "course-3",
        title: "Onboarding: Bem-vindo à Empresa",
        description: "Conheça nossa cultura, valores e processos essenciais",
        category: "onboarding",
        level: "beginner",
        thumbnail: "/course-onboarding.jpg?query=welcome onboarding",
        instructor: "Equipe RH",
        duration: 90,
        lessons: [
          {
            id: "l1",
            title: "Nossa História e Missão",
            type: "video",
            duration: 10,
          },
          {
            id: "l2",
            title: "Cultura e Valores",
            type: "reading",
            duration: 15,
          },
          {
            id: "l3",
            title: "Estrutura Organizacional",
            type: "video",
            duration: 15,
          },
          {
            id: "l4",
            title: "Políticas e Procedimentos",
            type: "reading",
            duration: 20,
          },
          {
            id: "l5",
            title: "Quiz de Conhecimento",
            type: "quiz",
            duration: 10,
          },
        ],
        reward: {
          xp: 100,
          stars: 30,
          certificate: true,
        },
        isRequired: true,
        allowRetake: false,
        tags: ["onboarding", "cultura", "valores"],
        createdAt: new Date().toISOString(),
      },
    ]
  }

  static getAllCourses(): Course[] {
    if (typeof window === "undefined") {
      return this.getDefaultCourses()
    }
    const stored = localStorage.getItem(COURSES_KEY)
    return stored ? JSON.parse(stored) : this.getDefaultCourses()
  }

  static getCourseById(courseId: string): Course | null {
    const courses = this.getAllCourses()
    return courses.find((c) => c.id === courseId) || null
  }

  static getCoursesByCategory(category: CourseCategory): Course[] {
    return this.getAllCourses().filter((c) => c.category === category)
  }

  static getRequiredCourses(): Course[] {
    return this.getAllCourses().filter((c) => c.isRequired)
  }

  static getCourseProgress(userId: string, courseId: string): CourseProgress | null {
    if (typeof window === "undefined") {
      return null
    }
    const stored = localStorage.getItem(PROGRESS_KEY)
    const allProgress: CourseProgress[] = stored ? JSON.parse(stored) : []
    return allProgress.find((p) => p.userId === userId && p.courseId === courseId) || null
  }

  static getUserProgress(userId: string): CourseProgress[] {
    if (typeof window === "undefined") {
      return []
    }
    const stored = localStorage.getItem(PROGRESS_KEY)
    if (stored) {
      try {
        const progress: CourseProgress[] = JSON.parse(stored)
        if (progress.length > 20) return progress.filter((p) => p.userId === userId)
      } catch {}
    }

    // Gerar progresso mock para todos os usuários
    const allProgress: CourseProgress[] = []
    const courses = this.getAllCourses()
    const userIds = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]

    userIds.forEach((uid) => {
      // Cada usuário tem progresso em 1-3 cursos
      const coursesCount = Math.floor(Math.random() * 3) + 1
      const selectedCourses = courses.slice(0, coursesCount)

      selectedCourses.forEach((course, index) => {
        const progress = Math.floor(Math.random() * 101)
        const completedLessons = course.lessons.slice(0, Math.floor((course.lessons.length * progress) / 100))
        const isCompleted = progress === 100

        allProgress.push({
          courseId: course.id,
          userId: uid,
          startedAt: new Date(Date.now() - (20 - index * 5) * 24 * 60 * 60 * 1000).toISOString(),
          completedLessons: completedLessons.map((l) => l.id),
          currentLesson:
            completedLessons.length < course.lessons.length
              ? course.lessons[completedLessons.length].id
              : course.lessons[course.lessons.length - 1].id,
          progress,
          completedAt: isCompleted
            ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          certificateIssued: isCompleted && course.reward.certificate,
        })
      })
    })

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress))
    return allProgress.filter((p) => p.userId === userId)
  }

  static startCourse(userId: string, courseId: string): CourseProgress {
    const existing = this.getCourseProgress(userId, courseId)
    if (existing) return existing

    const course = this.getCourseById(courseId)
    if (!course) throw new Error("Course not found")

    const newProgress: CourseProgress = {
      courseId,
      userId,
      startedAt: new Date().toISOString(),
      completedLessons: [],
      currentLesson: course.lessons[0]?.id || "",
      progress: 0,
    }

    if (typeof window !== "undefined") {
      const allProgress = this.getUserProgress(userId).filter((p) => p.courseId !== courseId)
      allProgress.push(newProgress)
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress))
    }

    return newProgress
  }

  static completeLesson(userId: string, courseId: string, lessonId: string): void {
    const progress = this.getCourseProgress(userId, courseId)
    if (!progress) return

    const course = this.getCourseById(courseId)
    if (!course) return

    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId)
    }

    progress.progress = Math.round((progress.completedLessons.length / course.lessons.length) * 100)

    if (progress.progress === 100 && !progress.completedAt) {
      progress.completedAt = new Date().toISOString()
      if (course.reward.certificate) {
        progress.certificateIssued = true
      }

      if (typeof window !== "undefined") {
        EngagementTrackingService.trackTrainingCompletion(userId, courseId)
      }
    }

    const currentIndex = course.lessons.findIndex((l) => l.id === lessonId)
    if (currentIndex < course.lessons.length - 1) {
      progress.currentLesson = course.lessons[currentIndex + 1].id
    }

    if (typeof window !== "undefined") {
      const allProgress = this.getUserProgress(userId).filter((p) => p.courseId !== courseId)
      allProgress.push(progress)
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(allProgress))
    }
  }

  static getUserStats(userId: string) {
    const progress = this.getUserProgress(userId)
    const courses = this.getAllCourses()

    const completed = progress.filter((p) => p.completedAt).length
    const inProgress = progress.filter((p) => !p.completedAt).length
    const certificates = progress.filter((p) => p.certificateIssued).length

    const totalXP = progress
      .filter((p) => p.completedAt)
      .reduce((sum, p) => {
        const course = courses.find((c) => c.id === p.courseId)
        return sum + (course?.reward.xp || 0)
      }, 0)

    const totalMinutes = progress
      .filter((p) => p.completedAt)
      .reduce((sum, p) => {
        const course = courses.find((c) => c.id === p.courseId)
        return sum + (course?.duration || 0)
      }, 0)

    return {
      completed,
      inProgress,
      available: courses.length - completed - inProgress,
      certificates,
      totalXP,
      totalHours: Math.floor(totalMinutes / 60),
      averageProgress:
        progress.length > 0 ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length) : 0,
    }
  }

  static createCourse(courseData: Omit<Course, "id" | "createdAt">): Course {
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    if (typeof window !== "undefined") {
      const allCourses = this.getAllCourses()
      allCourses.push(newCourse)
      localStorage.setItem(COURSES_KEY, JSON.stringify(allCourses))
      window.dispatchEvent(new Event("courses-updated"))
    }

    return newCourse
  }

  static updateCourse(courseId: string, updates: Partial<Course>): Course | null {
    if (typeof window === "undefined") {
      return null
    }

    const allCourses = this.getAllCourses()
    const index = allCourses.findIndex((c) => c.id === courseId)

    if (index === -1) return null

    allCourses[index] = { ...allCourses[index], ...updates }
    localStorage.setItem(COURSES_KEY, JSON.stringify(allCourses))
    window.dispatchEvent(new Event("courses-updated"))

    return allCourses[index]
  }

  static deleteCourse(courseId: string): boolean {
    if (typeof window === "undefined") {
      return false
    }

    const allCourses = this.getAllCourses()
    const filtered = allCourses.filter((c) => c.id !== courseId)

    if (filtered.length === allCourses.length) return false

    localStorage.setItem(COURSES_KEY, JSON.stringify(filtered))

    const stored = localStorage.getItem(PROGRESS_KEY)
    if (stored) {
      const allProgress: CourseProgress[] = JSON.parse(stored)
      const filteredProgress = allProgress.filter((p) => p.courseId !== courseId)
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(filteredProgress))
    }

    window.dispatchEvent(new Event("courses-updated"))

    return true
  }
}
