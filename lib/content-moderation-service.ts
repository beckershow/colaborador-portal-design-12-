const PALAVRAS_PROIBIDAS = [
  // Palavrões e ofensas em português
  "idiota",
  "burro",
  "estúpido",
  "imbecil",
  "otário",
  "babaca",
  "fdp",
  "porra",
  "merda",
  "caralho",
  "cacete",
  "desgraça",
  "pqp",
  "vsf",
  "vai se",
  "vai tomar",

  // Variações com caracteres especiais
  "!d!0t@",
  "burr0",
  "b@b@c@",
]

export class ContentModerationService {
  /**
   * Normaliza texto removendo acentos, caracteres especiais e convertendo para minúsculas
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais exceto espaços
      .trim()
  }

  /**
   * Verifica se o texto contém palavras inadequadas
   * @returns objeto com status e palavras encontradas (se houver)
   */
  static checkForInappropriateContent(text: string): {
    isClean: boolean
    foundWords?: string[]
  } {
    if (!text || text.trim().length === 0) {
      return { isClean: true }
    }

    const normalizedText = this.normalizeText(text)
    const foundWords: string[] = []

    // Verifica cada palavra proibida
    for (const palavra of PALAVRAS_PROIBIDAS) {
      const normalizedPalavra = this.normalizeText(palavra)

      // Verifica se a palavra aparece como palavra completa ou parte de uma palavra
      const regex = new RegExp(`\\b${normalizedPalavra}\\b|${normalizedPalavra}`, "gi")
      if (regex.test(normalizedText)) {
        foundWords.push(palavra)
      }
    }

    return {
      isClean: foundWords.length === 0,
      foundWords: foundWords.length > 0 ? foundWords : undefined,
    }
  }

  /**
   * Retorna mensagem de feedback para o usuário
   */
  static getModerationMessage(): string {
    return "Seu comentário contém palavras inadequadas. Ajuste o texto para continuar."
  }
}
