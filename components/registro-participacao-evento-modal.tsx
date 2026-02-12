"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, FileText } from "lucide-react"

interface RegistroParticipacaoEventoModalProps {
  isOpen: boolean
  onClose: () => void
  eventoTitle: string
  onSubmit: (evidencia?: { type: "text" | "image"; content: string }) => void
}

export function RegistroParticipacaoEventoModal({
  isOpen,
  onClose,
  eventoTitle,
  onSubmit,
}: RegistroParticipacaoEventoModalProps) {
  const [evidenciaType, setEvidenciaType] = useState<"text" | "image" | null>(null)
  const [textContent, setTextContent] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
      setEvidenciaType("image")
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (evidenciaType === "text" && textContent.trim()) {
      onSubmit({ type: "text", content: textContent })
    } else if (evidenciaType === "image" && imagePreview) {
      onSubmit({ type: "image", content: imagePreview })
    } else {
      onSubmit()
    }

    // Reset
    setEvidenciaType(null)
    setTextContent("")
    setImagePreview(null)
    onClose()
  }

  const handleSkip = () => {
    onSubmit()
    setEvidenciaType(null)
    setTextContent("")
    setImagePreview(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Participação</DialogTitle>
          <DialogDescription>Confirme sua participação no evento: {eventoTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Enviar Evidência (opcional)</Label>
            <p className="text-sm text-muted-foreground">
              Compartilhe uma foto ou descrição da sua experiência no evento
            </p>
          </div>

          {!evidenciaType && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 bg-transparent"
                onClick={() => setEvidenciaType("text")}
              >
                <FileText className="h-6 w-6" />
                <span>Texto</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 bg-transparent"
                onClick={() => setEvidenciaType("image")}
              >
                <ImageIcon className="h-6 w-6" />
                <span>Foto</span>
              </Button>
            </div>
          )}

          {evidenciaType === "text" && (
            <div className="space-y-2">
              <Label htmlFor="evidencia-text">Descreva sua experiência</Label>
              <Textarea
                id="evidencia-text"
                placeholder="O que você aprendeu? Como foi o evento para você?"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={5}
              />
              <Button size="sm" variant="ghost" onClick={() => setEvidenciaType(null)}>
                Trocar para Foto
              </Button>
            </div>
          )}

          {evidenciaType === "image" && (
            <div className="space-y-2">
              {!imagePreview ? (
                <div className="flex flex-col items-center gap-4">
                  <Label
                    htmlFor="evidencia-image"
                    className="flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
                    </div>
                  </Label>
                  <input
                    id="evidencia-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button size="sm" variant="ghost" onClick={() => setEvidenciaType(null)}>
                    Trocar para Texto
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <img src={imagePreview || "/placeholder.svg"} alt="Preview" className="w-full rounded-lg" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setImagePreview(null)
                      setEvidenciaType(null)
                    }}
                  >
                    Remover Imagem
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleSkip} className="flex-1 bg-transparent">
              Pular
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 clay-button"
              disabled={
                evidenciaType === "text" ? !textContent.trim() : evidenciaType === "image" ? !imagePreview : false
              }
            >
              Confirmar Participação
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
