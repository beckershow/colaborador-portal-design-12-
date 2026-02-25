"use client"

// v3 — Surveys e eventos vinculados à Marina (id="2"); recompensas criadas pelo SuperAdmin
// com gestoresPermitidos=["2"], split em "criado" (estoque Marina) e "ativo" (ativo para o time)
const SEED_FLAG = "engageai-demo-seeded-v3"
const SURVEYS_KEY = "engageai-surveys"
const EVENTS_KEY = "engageai_eventos"
const REWARDS_KEY = "engageai-lojinha-profissional"

// IDs dos itens demo — usados para limpar versões anteriores
const SURVEY_DEMO_IDS = ["survey-demo-1", "survey-demo-2", "survey-demo-3", "survey-demo-4"]
const EVENT_DEMO_IDS = ["evt-demo-1", "evt-demo-2", "evt-demo-3", "evt-demo-4"]
const REWARD_DEMO_IDS = [
  "reward-demo-1",
  "reward-demo-2",
  "reward-demo-3",
  "reward-demo-4",
  "reward-demo-5",
  "reward-demo-6",
]

export class DemoSeed {
  static initialize() {
    if (typeof window === "undefined") return
    if (localStorage.getItem(SEED_FLAG)) return

    // Limpar dados de versões anteriores do seed antes de reinserir
    this.cleanupPreviousSeed()

    this.seedSurveys()
    this.seedEvents()
    this.seedRewards()

    localStorage.setItem(SEED_FLAG, "true")
  }

  /** Remove itens demo de versões anteriores para garantir dados limpos */
  private static cleanupPreviousSeed() {
    try {
      const surveys = JSON.parse(localStorage.getItem(SURVEYS_KEY) || "[]")
      localStorage.setItem(
        SURVEYS_KEY,
        JSON.stringify(surveys.filter((s: any) => !SURVEY_DEMO_IDS.includes(s.id))),
      )

      const events = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]")
      localStorage.setItem(
        EVENTS_KEY,
        JSON.stringify(events.filter((e: any) => !EVENT_DEMO_IDS.includes(e.id))),
      )

      const rewards = JSON.parse(localStorage.getItem(REWARDS_KEY) || "[]")
      localStorage.setItem(
        REWARDS_KEY,
        JSON.stringify(rewards.filter((r: any) => !REWARD_DEMO_IDS.includes(r.id))),
      )
    } catch {
      // ignore parse errors
    }
  }

  private static seedSurveys() {
    const existing = JSON.parse(localStorage.getItem(SURVEYS_KEY) || "[]")
    const now = new Date()
    const addDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString()

    const newSurveys = [
      {
        id: "survey-demo-1",
        title: "Pulse Check Semanal",
        description: "Acompanhe como está sua semana e ajude a melhorar nosso ambiente de trabalho.",
        type: "pulse",
        status: "active",
        targetAudience: "all",
        isRequired: false,
        deadline: addDays(14),
        createdBy: "2",
        createdByName: "Marina Oliveira",
        createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
        reward: { xp: 30, stars: 5 },
        questions: [
          { id: "q-demo-1-1", type: "rating", question: "Como você avalia sua semana?", required: true },
          { id: "q-demo-1-2", type: "text", question: "O que podemos melhorar no seu dia a dia?", required: false },
        ],
      },
      {
        id: "survey-demo-2",
        title: "Avaliação de Clima — Time Criativo",
        description: "Sua opinião sobre o clima e a comunicação do time é fundamental para nosso crescimento.",
        type: "satisfaction",
        status: "active",
        targetAudience: "all",
        isRequired: false,
        deadline: addDays(30),
        createdBy: "2",
        createdByName: "Marina Oliveira",
        createdAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
        reward: { xp: 50, stars: 10 },
        questions: [
          { id: "q-demo-2-1", type: "rating", question: "Você se sente reconhecido pelo seu trabalho?", required: true },
          { id: "q-demo-2-2", type: "rating", question: "Como avalia a comunicação com seu gestor?", required: true },
          { id: "q-demo-2-3", type: "text", question: "Sugestões para melhorar o ambiente de trabalho?", required: false },
        ],
      },
      {
        id: "survey-demo-3",
        title: "NPS da Plataforma EngageAI",
        description: "Avalie sua experiência com a plataforma e nos ajude a evoluir.",
        type: "long",
        status: "active",
        targetAudience: "all",
        isRequired: false,
        deadline: addDays(20),
        createdBy: "2",
        createdByName: "Marina Oliveira",
        createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
        reward: { xp: 40, stars: 8 },
        questions: [
          { id: "q-demo-3-1", type: "nps", question: "De 0 a 10, o quanto você recomendaria a plataforma EngageAI para um colega?", required: true },
          { id: "q-demo-3-2", type: "text", question: "O que mais te agrada ou desagrada na plataforma?", required: false },
        ],
      },
      {
        id: "survey-demo-4",
        title: "Pesquisa de Treinamentos Q1 2026",
        description: "Ajude-nos a planejar os melhores treinamentos para o próximo trimestre.",
        type: "event",
        status: "active",
        targetAudience: "all",
        isRequired: false,
        deadline: addDays(10),
        createdBy: "2",
        createdByName: "Marina Oliveira",
        createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
        reward: { xp: 45, stars: 10 },
        questions: [
          {
            id: "q-demo-4-1",
            type: "multiple-choice",
            question: "Qual área você prefere para os próximos treinamentos?",
            options: ["Liderança", "Comunicação", "Tecnologia", "Idiomas", "Bem-Estar"],
            required: true,
          },
          {
            id: "q-demo-4-2",
            type: "multiple-choice",
            question: "Qual formato de treinamento você prefere?",
            options: ["Vídeo", "Texto", "Ao vivo", "Podcast"],
            required: true,
          },
          { id: "q-demo-4-3", type: "text", question: "Comentários adicionais sobre os treinamentos que gostaria de ver?", required: false },
        ],
      },
    ]

    const existingIds = new Set(existing.map((s: any) => s.id))
    const toAdd = newSurveys.filter((s) => !existingIds.has(s.id))
    localStorage.setItem(SURVEYS_KEY, JSON.stringify([...existing, ...toAdd]))
  }

  private static seedEvents() {
    const existing = JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]")
    const now = new Date()
    const addDays = (d: number) => {
      const date = new Date(now)
      date.setDate(date.getDate() + d)
      return date.toISOString().split("T")[0]
    }

    const newEvents = [
      {
        id: "evt-demo-1",
        title: "Workshop Comunicação Não-Violenta",
        description:
          "Aprenda técnicas de comunicação não-violenta para melhorar seus relacionamentos profissionais e pessoais. Dinâmicas práticas e discussões em grupo.",
        date: addDays(0),
        time: "14:00",
        location: "Sala de Treinamentos — 3º andar",
        rewardXP: 80,
        rewardStars: 20,
        maxParticipants: 30,
        isActive: true,
        participants: [],
        createdBy: "2",
        createdAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
      },
      {
        id: "evt-demo-2",
        title: "Tech Talk: IA no Cotidiano",
        description:
          "Palestra sobre como a Inteligência Artificial está transformando o mercado de trabalho e como podemos nos preparar para as mudanças.",
        date: addDays(7),
        time: "16:00",
        location: "Online — Microsoft Teams",
        rewardXP: 60,
        rewardStars: 15,
        maxParticipants: 100,
        isActive: true,
        participants: [],
        createdBy: "2",
        createdAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
      },
      {
        id: "evt-demo-3",
        title: "Treinamento de Liderança Q1",
        description:
          "Workshop intensivo sobre liderança situacional, gestão de conflitos e desenvolvimento de equipes de alta performance.",
        date: addDays(14),
        time: "09:00",
        location: "Auditório Principal",
        rewardXP: 100,
        rewardStars: 25,
        maxParticipants: 50,
        isActive: true,
        participants: [],
        createdBy: "2",
        createdAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
      },
      {
        id: "evt-demo-4",
        title: "Happy Hour do Time",
        description:
          "Momento de descontração e integração da equipe. Bebidas e petiscos por conta da empresa. Venha fortalecer os laços com seus colegas!",
        date: addDays(21),
        time: "18:00",
        location: "Terraço — Cobertura",
        rewardXP: 50,
        rewardStars: 10,
        maxParticipants: 80,
        isActive: true,
        participants: [],
        createdBy: "2",
        createdAt: new Date().toISOString(),
      },
    ]

    const existingIds = new Set(existing.map((e: any) => e.id))
    const toAdd = newEvents.filter((e) => !existingIds.has(e.id))
    localStorage.setItem(EVENTS_KEY, JSON.stringify([...existing, ...toAdd]))
  }

  private static seedRewards() {
    const existing = JSON.parse(localStorage.getItem(REWARDS_KEY) || "[]")

    // Fluxo correto:
    // • criadoPor: "1" → Super Admin Carlos Eduardo cria as recompensas
    // • gestoresPermitidos: ["2"] → disponibilizado especificamente para Marina Oliveira
    // • status "criado" (3 itens) → no estoque de Marina, ela pode ativar
    // • status "ativo" (3 itens) → já ativados por Marina para o time (visível em /recompensas)
    const now = new Date()
    const nowStr = now.toISOString()
    const criadoEm = new Date(now.getTime() - 10 * 86400000).toISOString() // criados há 10 dias pelo SA

    const newRewards = [
      // ── Já ativados por Marina → visíveis para colaboradores ──
      {
        id: "reward-demo-4",
        nome: "Vale Compras R$ 200",
        descricao: "Vale compras no valor de R$ 200 para usar em lojas parceiras. Válido por 3 meses a partir do resgate.",
        categoria: "presente",
        valorPontos: 200,
        valorFinanceiroEstimado: 200,
        quantidade: 10,
        gestoresPermitidos: ["2"],
        timesPermitidos: [],
        necessitaAprovacaoSuperior: false,
        status: "ativo",
        criadoPor: "1",
        criadoEm,
        aprovadoPor: "1",
        aprovadoEm: new Date(now.getTime() - 8 * 86400000).toISOString(),
        ativadoPor: "2",
        ativadoEm: new Date(now.getTime() - 5 * 86400000).toISOString(),
        resgatado: 3,
      },
      {
        id: "reward-demo-5",
        nome: "Curso Online à Escolha",
        descricao: "Acesso a qualquer curso da plataforma parceira por até 12 meses. Mais de 500 cursos disponíveis em diversas áreas.",
        categoria: "desenvolvimento",
        valorPontos: 100,
        valorFinanceiroEstimado: 250,
        quantidade: null,
        gestoresPermitidos: ["2"],
        timesPermitidos: [],
        necessitaAprovacaoSuperior: false,
        status: "ativo",
        criadoPor: "1",
        criadoEm,
        aprovadoPor: "1",
        aprovadoEm: new Date(now.getTime() - 8 * 86400000).toISOString(),
        ativadoPor: "2",
        ativadoEm: new Date(now.getTime() - 6 * 86400000).toISOString(),
        resgatado: 8,
      },
      {
        id: "reward-demo-6",
        nome: "Assinatura Streaming 3 meses",
        descricao: "3 meses de assinatura em plataforma de streaming à sua escolha (Netflix, Spotify, Disney+, etc.).",
        categoria: "beneficio",
        valorPontos: 120,
        valorFinanceiroEstimado: 90,
        quantidade: 15,
        gestoresPermitidos: ["2"],
        timesPermitidos: [],
        necessitaAprovacaoSuperior: false,
        status: "ativo",
        criadoPor: "1",
        criadoEm,
        aprovadoPor: "1",
        aprovadoEm: new Date(now.getTime() - 8 * 86400000).toISOString(),
        ativadoPor: "2",
        ativadoEm: new Date(now.getTime() - 4 * 86400000).toISOString(),
        resgatado: 4,
      },

      // ── No estoque de Marina (criado) → ela pode ativar para o time ──
      {
        id: "reward-demo-1",
        nome: "Day Off Extra",
        descricao: "Um dia extra de folga remunerada para descansar e recarregar as energias. Agende com seu gestor com antecedência mínima de 7 dias.",
        categoria: "beneficio",
        valorPontos: 150,
        valorFinanceiroEstimado: 300,
        quantidade: 5,
        gestoresPermitidos: ["2"],
        timesPermitidos: [],
        necessitaAprovacaoSuperior: false,
        status: "criado",
        criadoPor: "1",
        criadoEm,
        aprovadoPor: "1",
        aprovadoEm: new Date(now.getTime() - 7 * 86400000).toISOString(),
        resgatado: 0,
      },
      {
        id: "reward-demo-2",
        nome: "Kit Café Gourmet",
        descricao: "Kit com seleção especial de cafés gourmet, caneca exclusiva EngageAI e biscoitos artesanais. Entregue na sua mesa.",
        categoria: "produto",
        valorPontos: 80,
        valorFinanceiroEstimado: 120,
        quantidade: 20,
        gestoresPermitidos: ["2"],
        timesPermitidos: [],
        necessitaAprovacaoSuperior: false,
        status: "criado",
        criadoPor: "1",
        criadoEm,
        aprovadoPor: "1",
        aprovadoEm: new Date(now.getTime() - 7 * 86400000).toISOString(),
        resgatado: 0,
      },
      {
        id: "reward-demo-3",
        nome: "Voucher Viagem Fins de Semana",
        descricao: "Voucher para pacote de viagem de fins de semana para destinos selecionados no Brasil. Válido por 6 meses.",
        categoria: "experiencia",
        valorPontos: 500,
        valorFinanceiroEstimado: 1500,
        quantidade: 3,
        gestoresPermitidos: ["2"],
        timesPermitidos: [],
        necessitaAprovacaoSuperior: true,
        status: "criado",
        criadoPor: "1",
        criadoEm,
        aprovadoPor: "1",
        aprovadoEm: new Date(now.getTime() - 7 * 86400000).toISOString(),
        resgatado: 0,
      },
    ]

    const existingIds = new Set(existing.map((r: any) => r.id))
    const toAdd = newRewards.filter((r) => !existingIds.has(r.id))
    localStorage.setItem(REWARDS_KEY, JSON.stringify([...existing, ...toAdd]))
  }
}
