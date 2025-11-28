"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, RefreshCw } from "lucide-react"
import { ProfesorForm } from "./profesor-form"
import type { Profesor } from "@/types/profesor"

export function ProfesorList() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [formOpen, setFormOpen] = useState(false)
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [profesorToDelete, setProfesorToDelete] = useState<Profesor | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProfesores = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/profesores")
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setProfesores(data.profesores || [])
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Error al cargar profesores")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfesores()
  }, [])

  const handleEdit = (profesor: Profesor) => {
    setSelectedProfesor(profesor)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setSelectedProfesor(null)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!profesorToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/profesores/${profesorToDelete.id_profesor}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchProfesores()
      } else {
        const data = await response.json()
        setError(data.error || "Error al eliminar profesor")
      }
    } catch (err) {
      console.error("Error:", err)
      setError("Error de conexión")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setProfesorToDelete(null)
    }
  }

  const getSituacionBadgeVariant = (situacion: string) => {
    switch (situacion) {
      case "Titular":
        return "default"
      case "Provisional":
        return "secondary"
      case "Suplente":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gestión de Profesores</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProfesores} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Profesor
          </Button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Materias</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Cargando profesores...
                </TableCell>
              </TableRow>
            ) : profesores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No hay profesores registrados
                </TableCell>
              </TableRow>
            ) : (
              profesores.map((profesor) => (
                <TableRow key={profesor.id_profesor}>
                  <TableCell className="font-medium">{profesor.nombre}</TableCell>
                  <TableCell>{profesor.dni || "-"}</TableCell>
                  <TableCell>{profesor.email}</TableCell>
                  <TableCell>{profesor.telefono || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={getSituacionBadgeVariant(profesor.situacion_revista)}>
                      {profesor.situacion_revista}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profesor.profesor_materia && profesor.profesor_materia.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profesor.profesor_materia.slice(0, 2).map((pm) => (
                          <Badge key={pm.id_materia} variant="outline" className="text-xs">
                            {pm.materia?.nombre}
                          </Badge>
                        ))}
                        {profesor.profesor_materia.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{profesor.profesor_materia.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(profesor)} title="Editar profesor">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProfesorToDelete(profesor)
                          setDeleteDialogOpen(true)
                        }}
                        title="Eliminar profesor (solo para errores de carga)"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProfesorForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchProfesores}
        profesor={selectedProfesor}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Profesor</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción está reservada exclusivamente para corrección de errores de carga (ej: registro duplicado por
              error).
              <br />
              <br />
              ¿Está seguro que desea eliminar a <strong>{profesorToDelete?.nombre}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
