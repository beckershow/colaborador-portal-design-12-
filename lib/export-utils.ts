export interface ExportColumn {
  header: string
  key: string
  format?: (value: any) => string
}

export class ExportUtils {
  // Exporta dados para CSV
  static exportToCSV(data: any[], columns: ExportColumn[], filename: string) {
    if (!data || data.length === 0) {
      throw new Error("Nenhum dado disponível para exportação")
    }

    // Cabeçalhos
    const headers = columns.map((col) => col.header).join(",")

    // Linhas de dados
    const rows = data.map((item) => {
      return columns
        .map((col) => {
          const value = item[col.key]
          const formattedValue = col.format ? col.format(value) : value
          // Escapa vírgulas e aspas duplas
          const escapedValue = String(formattedValue || "").replace(/"/g, '""')
          return `"${escapedValue}"`
        })
        .join(",")
    })

    const csv = [headers, ...rows].join("\n")

    // Download do arquivo
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Exporta dados para Excel (XLSX)
  static async exportToExcel(data: any[], columns: ExportColumn[], filename: string, sheetName = "Dados") {
    if (!data || data.length === 0) {
      throw new Error("Nenhum dado disponível para exportação")
    }

    try {
      // Verifica se está no browser
      if (typeof window === "undefined") {
        throw new Error("Exportação Excel só funciona no browser")
      }

      // @ts-ignore
      if (!window.XLSX) {
        // Carrega biblioteca XLSX do CDN
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"
          script.onload = () => resolve()
          script.onerror = () => reject(new Error("Falha ao carregar biblioteca XLSX"))
          document.head.appendChild(script)
        })
      }

      // @ts-ignore
      const XLSX = window.XLSX

      // Prepara dados para worksheet
      const worksheetData = [
        columns.map((col) => col.header),
        ...data.map((item) =>
          columns.map((col) => {
            const value = item[col.key]
            return col.format ? col.format(value) : (value ?? "")
          }),
        ),
      ]

      // Cria workbook e worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // Gera arquivo e faz download usando API do browser
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error)
      throw error
    }
  }
}
