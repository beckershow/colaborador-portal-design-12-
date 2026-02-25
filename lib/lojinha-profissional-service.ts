"use client"

export type ItemStatus = "rascunho" | "em-aprovacao" | "criado" | "ativo" | "inativo"

export interface ItemLojinha {
  id: string
  // Dados do Item
  nome: string
  descricao: string
  categoria: string
  valorPontos: number
  valorFinanceiroEstimado: number
  imagem?: string
  quantidade: number | null // null = ilimitado
  validade?: string
  regrasEspecificas?: string

  // Configurações Estratégicas
  gestoresPermitidos: string[] // IDs dos gestores que podem ver
  timesPermitidos: string[] // IDs dos times que podem ver
  necessitaAprovacaoSuperior: boolean

  // Status e Ciclo de Vida
  status: ItemStatus

  // Auditoria
  criadoPor: string
  criadoEm: string
  atualizadoPor?: string
  atualizadoEm?: string
  aprovadoPor?: string
  aprovadoEm?: string
  ativadoPor?: string
  ativadoEm?: string

  // Controle
  resgatado: number
}

export interface AprovacaoSuperior {
  id: string
  itemId: string
  solicitadoPor: string
  solicitadoEm: string
  status: "pendente" | "aprovado" | "rejeitado"
  aprovadoPor?: string
  aprovadoEm?: string
  justificativa?: string
  impactoFinanceiro: number
}

export interface LogAuditoria {
  id: string
  itemId: string
  acao: string
  realizadoPor: string
  realizadoEm: string
  statusAnterior?: ItemStatus
  statusNovo?: ItemStatus
  detalhes?: string
}

export interface CupomResgate {
  id: string
  itemId: string
  itemNome: string
  categoria: string
  codigoCupom: string
  colaboradorId: string
  colaboradorNome: string
  dataResgate: string
  pontosUtilizados: number
  timeId: string
  status: "resgatado"
}

const STORAGE_KEY_ITENS = "engageai-lojinha-profissional"
const STORAGE_KEY_APROVACOES = "engageai-lojinha-aprovacoes"
const STORAGE_KEY_AUDITORIA = "engageai-lojinha-auditoria"
const STORAGE_KEY_CUPONS = "engageai-lojinha-cupons"

export class LojinhaProfissionalService {
  // ===== ITENS =====

  static getAllItens(): ItemLojinha[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY_ITENS)
    return stored ? JSON.parse(stored) : []
  }

  static getItensByStatus(status: ItemStatus): ItemLojinha[] {
    return this.getAllItens().filter((item) => item.status === status)
  }

  static getItensForGestor(gestorId: string): ItemLojinha[] {
    return this.getAllItens().filter(
      (item) =>
        item.status === "criado" &&
        (item.gestoresPermitidos.includes(gestorId) || item.gestoresPermitidos.length === 0),
    )
  }

  static getItensAtivosForGestor(gestorId: string): ItemLojinha[] {
    return this.getAllItens().filter(
      (item) =>
        item.status === "ativo" &&
        (item.gestoresPermitidos.includes(gestorId) || item.gestoresPermitidos.length === 0),
    )
  }

  static getItensAtivosForColaborador(gestorId: string): ItemLojinha[] {
    return this.getAllItens().filter(
      (item) =>
        item.status === "ativo" &&
        (item.gestoresPermitidos.includes(gestorId) || item.gestoresPermitidos.length === 0) &&
        (item.quantidade === null || item.quantidade > 0),
    )
  }

  static createItem(data: Omit<ItemLojinha, "id" | "resgatado" | "criadoEm">, userId: string): ItemLojinha {
    const itens = this.getAllItens()

    const newItem: ItemLojinha = {
      ...data,
      id: `item-${Date.now()}`,
      resgatado: 0,
      criadoPor: userId,
      criadoEm: new Date().toISOString(),
    }

    itens.push(newItem)
    localStorage.setItem(STORAGE_KEY_ITENS, JSON.stringify(itens))

    this.registrarAuditoria(newItem.id, "criar_item", userId, undefined, newItem.status, `Item criado: ${newItem.nome}`)

    return newItem
  }

  static updateItem(itemId: string, data: Partial<ItemLojinha>, userId: string): ItemLojinha | null {
    const itens = this.getAllItens()
    const index = itens.findIndex((i) => i.id === itemId)

    if (index === -1) return null

    const statusAnterior = itens[index].status

    itens[index] = {
      ...itens[index],
      ...data,
      atualizadoPor: userId,
      atualizadoEm: new Date().toISOString(),
    }

    localStorage.setItem(STORAGE_KEY_ITENS, JSON.stringify(itens))

    if (data.status && data.status !== statusAnterior) {
      this.registrarAuditoria(
        itemId,
        "alterar_status",
        userId,
        statusAnterior,
        data.status,
        `Status alterado de ${statusAnterior} para ${data.status}`,
      )
    } else {
      this.registrarAuditoria(itemId, "atualizar_item", userId, undefined, undefined, `Item atualizado`)
    }

    return itens[index]
  }

  static deleteItem(itemId: string, userId: string): boolean {
    const itens = this.getAllItens()
    const filtered = itens.filter((i) => i.id !== itemId)

    if (filtered.length === itens.length) return false

    localStorage.setItem(STORAGE_KEY_ITENS, JSON.stringify(filtered))
    this.registrarAuditoria(itemId, "deletar_item", userId, undefined, undefined, `Item deletado`)

    return true
  }

  static mudarStatus(itemId: string, novoStatus: ItemStatus, userId: string): ItemLojinha | null {
    return this.updateItem(itemId, { status: novoStatus }, userId)
  }

  static ativarItem(itemId: string, userId: string): ItemLojinha | null {
    return this.updateItem(
      itemId,
      {
        status: "ativo",
        ativadoPor: userId,
        ativadoEm: new Date().toISOString(),
      },
      userId,
    )
  }

  static desativarItem(itemId: string, userId: string): ItemLojinha | null {
    return this.updateItem(itemId, { status: "inativo" }, userId)
  }

  // ===== APROVAÇÕES SUPERIORES =====

  static solicitarAprovacaoSuperior(itemId: string, userId: string, impactoFinanceiro: number): AprovacaoSuperior {
    const aprovacoes = this.getTodasAprovacoes()

    const novaAprovacao: AprovacaoSuperior = {
      id: `aprov-${Date.now()}`,
      itemId,
      solicitadoPor: userId,
      solicitadoEm: new Date().toISOString(),
      status: "pendente",
      impactoFinanceiro,
    }

    aprovacoes.push(novaAprovacao)
    localStorage.setItem(STORAGE_KEY_APROVACOES, JSON.stringify(aprovacoes))

    // Atualizar status do item para "em-aprovacao"
    this.mudarStatus(itemId, "em-aprovacao", userId)

    this.registrarAuditoria(itemId, "solicitar_aprovacao", userId, undefined, undefined, `Aprovação solicitada`)

    return novaAprovacao
  }

  static aprovarItem(
    aprovacaoId: string,
    itemId: string,
    userId: string,
    justificativa?: string,
  ): AprovacaoSuperior | null {
    const aprovacoes = this.getTodasAprovacoes()
    const index = aprovacoes.findIndex((a) => a.id === aprovacaoId)

    if (index === -1) return null

    aprovacoes[index] = {
      ...aprovacoes[index],
      status: "aprovado",
      aprovadoPor: userId,
      aprovadoEm: new Date().toISOString(),
      justificativa,
    }

    localStorage.setItem(STORAGE_KEY_APROVACOES, JSON.stringify(aprovacoes))

    // Atualizar item para "criado"
    this.updateItem(
      itemId,
      {
        status: "criado",
        aprovadoPor: userId,
        aprovadoEm: new Date().toISOString(),
      },
      userId,
    )

    this.registrarAuditoria(itemId, "aprovar_item", userId, "em-aprovacao", "criado", justificativa || "Item aprovado")

    return aprovacoes[index]
  }

  static rejeitarItem(
    aprovacaoId: string,
    itemId: string,
    userId: string,
    justificativa: string,
  ): AprovacaoSuperior | null {
    const aprovacoes = this.getTodasAprovacoes()
    const index = aprovacoes.findIndex((a) => a.id === aprovacaoId)

    if (index === -1) return null

    aprovacoes[index] = {
      ...aprovacoes[index],
      status: "rejeitado",
      aprovadoPor: userId,
      aprovadoEm: new Date().toISOString(),
      justificativa,
    }

    localStorage.setItem(STORAGE_KEY_APROVACOES, JSON.stringify(aprovacoes))

    // Atualizar item para "rascunho"
    this.mudarStatus(itemId, "rascunho", userId)

    this.registrarAuditoria(itemId, "rejeitar_item", userId, "em-aprovacao", "rascunho", justificativa)

    return aprovacoes[index]
  }

  static getTodasAprovacoes(): AprovacaoSuperior[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY_APROVACOES)
    return stored ? JSON.parse(stored) : []
  }

  static getAprovacoesPendentes(): AprovacaoSuperior[] {
    return this.getTodasAprovacoes().filter((a) => a.status === "pendente")
  }

  // ===== AUDITORIA =====

  static registrarAuditoria(
    itemId: string,
    acao: string,
    userId: string,
    statusAnterior?: ItemStatus,
    statusNovo?: ItemStatus,
    detalhes?: string,
  ): void {
    const logs = this.getTodosLogs()

    const novoLog: LogAuditoria = {
      id: `log-${Date.now()}`,
      itemId,
      acao,
      realizadoPor: userId,
      realizadoEm: new Date().toISOString(),
      statusAnterior,
      statusNovo,
      detalhes,
    }

    logs.push(novoLog)
    localStorage.setItem(STORAGE_KEY_AUDITORIA, JSON.stringify(logs))
  }

  static getTodosLogs(): LogAuditoria[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY_AUDITORIA)
    return stored ? JSON.parse(stored) : []
  }

  static getLogsByItem(itemId: string): LogAuditoria[] {
    return this.getTodosLogs().filter((log) => log.itemId === itemId)
  }

  static exportarAuditoria(): string {
    const logs = this.getTodosLogs()
    const headers = ["ID", "Item ID", "Ação", "Realizado Por", "Data", "Status Anterior", "Status Novo", "Detalhes"]
    const rows = logs.map((log) => [
      log.id,
      log.itemId,
      log.acao,
      log.realizadoPor,
      new Date(log.realizadoEm).toLocaleString("pt-BR"),
      log.statusAnterior || "-",
      log.statusNovo || "-",
      log.detalhes || "-",
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    return csv
  }

  // ===== RESGATE =====

  static resgatar(
    itemId: string,
    userId: string,
    userName: string,
    userPoints: number,
    teamId: string,
  ): { success: boolean; message: string; cupom?: CupomResgate } {
    const item = this.getAllItens().find((i) => i.id === itemId)

    if (!item) {
      return { success: false, message: "Item não encontrado" }
    }

    if (item.status !== "ativo") {
      return { success: false, message: "Item não está ativo" }
    }

    if (item.quantidade !== null && item.quantidade <= 0) {
      return { success: false, message: "Item esgotado" }
    }

    if (userPoints < item.valorPontos) {
      return {
        success: false,
        message: `Pontos insuficientes. Você tem ${userPoints} e precisa de ${item.valorPontos}`,
      }
    }

    this.updateItem(
      itemId,
      {
        resgatado: item.resgatado + 1,
        quantidade: item.quantidade !== null ? item.quantidade - 1 : null,
      },
      userId,
    )

    const cupom: CupomResgate = {
      id: `cupom-${Date.now()}`,
      itemId,
      itemNome: item.nome,
      categoria: item.categoria,
      codigoCupom: `ENG-${Date.now().toString().slice(-8)}`,
      colaboradorId: userId,
      colaboradorNome: userName,
      dataResgate: new Date().toISOString(),
      pontosUtilizados: item.valorPontos,
      timeId: teamId,
      status: "resgatado",
    }

    // Salvar cupom
    const cupons = this.getTodosCupons()
    cupons.push(cupom)
    localStorage.setItem(STORAGE_KEY_CUPONS, JSON.stringify(cupons))

    this.registrarAuditoria(
      itemId,
      "resgatar_item",
      userId,
      undefined,
      undefined,
      `Item resgatado por ${userName} - Cupom: ${cupom.codigoCupom}`,
    )

    return { success: true, message: "Item resgatado com sucesso! Cupom gerado.", cupom }
  }

  static getTodosCupons(): CupomResgate[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY_CUPONS)
    return stored ? JSON.parse(stored) : []
  }

  static getCuponsByColaborador(colaboradorId: string): CupomResgate[] {
    return this.getTodosCupons().filter((c) => c.colaboradorId === colaboradorId)
  }

  static getCuponsByTeam(teamId: string): CupomResgate[] {
    return this.getTodosCupons().filter((c) => c.timeId === teamId)
  }

  static getCupomById(cupomId: string): CupomResgate | undefined {
    return this.getTodosCupons().find((c) => c.id === cupomId)
  }

  static exportarExtratoResgates(teamId?: string): string {
    const cupons = teamId ? this.getCuponsByTeam(teamId) : this.getTodosCupons()
    const headers = [
      "Código Cupom",
      "Colaborador",
      "Recompensa",
      "Categoria",
      "Data Resgate",
      "Pontos Utilizados",
      "Time",
    ]
    const rows = cupons.map((cupom) => [
      cupom.codigoCupom,
      cupom.colaboradorNome,
      cupom.itemNome,
      cupom.categoria,
      new Date(cupom.dataResgate).toLocaleString("pt-BR"),
      cupom.pontosUtilizados.toString(),
      cupom.timeId,
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    return csv
  }
}
