"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import type { Profesor, Materia, SituacionRevista } from "@/types/profesor"

interface ProfesorFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  profesor?: Profesor | null
}

export function ProfesorForm({ open, onClose, onSuccess, profesor }: ProfesorFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [materias, setMaterias] = useState<Materia[]>([])

  const [formData, setFormData] = useState({
    nombre: "",
    genero: "",
    email: "",
    direccion: "",
    telefono: "",
    dni: "",
    situacion_revista: "Suplente" as SituacionRevista,
    materiasSeleccionadas: [] as number[],
  })

  const isEditing = !!profesor

  // Cargar materias disponibles
  useEffect(() => {
    const fetchMaterias = async () => {
      try {
        const response = await fetch("/api/materias")
        const data = await response.json()
        if (data.materias) {
          setMaterias(data.materias)
        }
      } catch (err) {
        console.error("Error cargando materias:", err)
      }
    }
    fetchMaterias()
  }, [])

  // Cargar datos del profesor si estamos editando
  useEffect(() => {
    if (profesor) {
      setFormData({
        nombre: profesor.nombre || "",
        genero: profesor.genero || "",
        email: profesor.email || "",
        direccion: profesor.direccion || "",
        telefono: profesor.telefono?.toString() || "",
        dni: profesor.dni || "",
        situacion_revista: profesor.situacion_revista || "Suplente",
        materiasSeleccionadas: profesor.profesor_materia?.map((pm) => pm.id_materia) || [],
      })
    } else {
      setFormData({
        nombre: "",
        genero: "",
        email: "",
        direccion: "",
        telefono: "",
        dni: "",
        situacion_revista: "Suplente",
        materiasSeleccionadas: [],
      })
    }
    setError("")
  }, [profesor, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const payload = {
        nombre: formData.nombre,
        genero: formData.genero || null,
        email: formData.email,
        direccion: formData.direccion || null,
        telefono: formData.telefono ? Number.parseInt(formData.telefono) : null,
        dni: formData.dni || null,
        situacion_revista: formData.situacion_revista,
        materias: formData.materiasSeleccionadas,
      }

      const url = isEditing ? `/api/profesores/${profesor.id_profesor}` : "/api/profesores"

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al guardar profesor")
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error:", err)
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  const toggleMateria = (idMateria: number) => {
    setFormData((prev) => ({
      ...prev,
      materiasSeleccionadas: prev.materiasSeleccionadas.includes(idMateria)
        ? prev.materiasSeleccionadas.filter((id) => id !== idMateria)
        : [...prev.materiasSeleccionadas, idMateria],
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modificar Profesor" : "Alta de Docente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Prof. Juan García"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                placeholder="Ej: 12345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="profesor@eest1.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="1234567890"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genero">Género</Label>
              <Select value={formData.genero} onValueChange={(value) => setFormData({ ...formData, genero: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="O">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="situacion_revista">Estado Laboral *</Label>
              <Select
                value={formData.situacion_revista}
                onValueChange={(value) => setFormData({ ...formData, situacion_revista: value as SituacionRevista })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Titular">Titular</SelectItem>
                  <SelectItem value="Provisional">Provisional</SelectItem>
                  <SelectItem value="Suplente">Suplente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              placeholder="Calle 123, Ciudad"
            />
          </div>

          <div className="space-y-2">
            <Label>Materias a Cargo</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              {materias.length === 0 ? (
                <p className="text-sm text-gray-500">Cargando materias...</p>
              ) : (
                <div className="space-y-2">
                  {materias.map((materia) => (
                    <div key={materia.id_materia} className="flex items-center gap-2">
                      <Checkbox
                        id={`materia-${materia.id_materia}`}
                        checked={formData.materiasSeleccionadas.includes(materia.id_materia)}
                        onCheckedChange={() => toggleMateria(materia.id_materia)}
                      />
                      <label htmlFor={`materia-${materia.id_materia}`} className="text-sm cursor-pointer">
                        {materia.nombre}
                        {materia.curso && <span className="text-gray-500 ml-1">({materia.curso.nombre})</span>}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Guardar Cambios" : "Registrar Profesor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
