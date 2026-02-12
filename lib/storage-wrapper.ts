/**
 * Storage Wrapper - Isola completamente o acesso a localStorage
 * Deve ser usado APENAS em componentes client dentro de useEffect
 * NUNCA importar ou usar em services diretamente
 */

export class StorageWrapper {
  static getItem(key: string): string | null {
    if (typeof window === "undefined") return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  static setItem(key: string, value: string): void {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, value)
    } catch {
      // Silent fail
    }
  }

  static removeItem(key: string): void {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(key)
    } catch {
      // Silent fail
    }
  }

  static dispatchEvent(eventName: string, detail?: any): void {
    if (typeof window === "undefined") return
    try {
      window.dispatchEvent(detail ? new CustomEvent(eventName, { detail }) : new Event(eventName))
    } catch {
      // Silent fail
    }
  }
}
