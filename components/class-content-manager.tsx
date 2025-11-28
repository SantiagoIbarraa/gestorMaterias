"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Plus, Calendar, Link as LinkIcon, Trash2, Save, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Subject {
    id_materia: number
    nombre: string
    carga_horaria: string
    curso?: {
        nombre: string
        nivel: string
    }
}

interface ClassContent {
    id_contenido: number
    fecha: string
    descripcion: string
    archivo_url: string
    created_at: string
}

export function ClassContentManager() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [selectedSubject, setSelectedSubject] = useState<string>("")
    const [currentSubjectData, setCurrentSubjectData] = useState<Subject | null>(null)
    const [contents, setContents] = useState<ClassContent[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // Editable workload state
    const [editedWorkload, setEditedWorkload] = useState("")

    const [newContent, setNewContent] = useState({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: "",
        archivo_url: ""
    })

    const supabase = createClient()

    useEffect(() => {
        fetchMySubjects()
    }, [])

    useEffect(() => {
        if (selectedSubject) {
            const subj = subjects.find(s => s.id_materia.toString() === selectedSubject)
            if (subj) {
                setCurrentSubjectData(subj)
                setEditedWorkload(subj.carga_horaria || "")
            }
            fetchContents(selectedSubject)
        } else {
            setContents([])
            setCurrentSubjectData(null)
            setEditedWorkload("")
        }
    }, [selectedSubject, subjects])

    const fetchMySubjects = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Get professor ID using user_id link
            const { data: professorData } = await supabase
                .from("profesor")
                .select("id_profesor")
                .eq("user_id", user.id)
                .single()

            if (!professorData) {
                // Check if admin
                const { data: roleData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("id", user.id)
                    .maybeSingle()

                if (roleData?.role === 'admin') {
                    const { data: allSubjects } = await supabase
                        .from("materia")
                        .select("id_materia, nombre, carga_horaria, curso(nombre, nivel)")
                    if (allSubjects) setSubjects(allSubjects as any)
                }
                return
            }

            // 2. Get assigned subjects
            const { data: assignments } = await supabase
                .from("profesor_materia")
                .select("materia(id_materia, nombre, carga_horaria, curso(nombre, nivel))")
                .eq("id_profesor", professorData.id_profesor)

            const mySubjects = assignments?.map((a: any) => a.materia) || []
            setSubjects(mySubjects)
            if (mySubjects.length > 0) {
                setSelectedSubject(mySubjects[0].id_materia.toString())
            }
        } catch (error) {
            console.error("Error fetching subjects:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchContents = async (subjectId: string) => {
        try {
            const { data } = await supabase
                .from("contenido_clase")
                .select("*")
                .eq("id_materia", subjectId)
                .order("fecha", { ascending: false })

            if (data) setContents(data)
        } catch (error) {
            console.error("Error fetching contents:", error)
        }
    }

    const handleUpdateWorkload = async () => {
        if (!selectedSubject) return

        try {
            const { error } = await supabase
                .from("materia")
                .update({ carga_horaria: editedWorkload })
                .eq("id_materia", parseInt(selectedSubject))

            if (error) throw error

            toast.success("Carga horaria actualizada")
            // Update local state
            setSubjects(prev => prev.map(s =>
                s.id_materia.toString() === selectedSubject
                    ? { ...s, carga_horaria: editedWorkload }
                    : s
            ))
        } catch (error) {
            console.error("Error updating workload:", error)
            toast.error("Error al actualizar carga horaria")
        }
    }

    const handleFileUpload = async (file: File, materiaId: string): Promise<string | null> => {
        try {
            const timestamp = Date.now()
            const fileName = `${timestamp}_${file.name}`
            const filePath = `materia_${materiaId}/${fileName}`

            const { data, error } = await supabase.storage
                .from('class-materials')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (error) throw error

            // Get signed URL (valid for 1 year)
            const { data: signedData, error: signedError } = await supabase.storage
                .from('class-materials')
                .createSignedUrl(filePath, 31536000) // 1 year in seconds

            if (signedError) throw signedError

            return signedData.signedUrl
        } catch (error) {
            console.error("Error uploading file:", error)
            throw error
        }
    }

    const handleDeleteFile = async (fileUrl: string) => {
        try {
            // Extract file path from URL
            const urlParts = fileUrl.split('/class-materials/')
            if (urlParts.length < 2) return

            const filePath = urlParts[1]
            await supabase.storage
                .from('class-materials')
                .remove([filePath])
        } catch (error) {
            console.error("Error deleting file:", error)
        }
    }

    const handleOpenCreate = () => {
        setIsEditMode(false)
        setEditingId(null)
        setNewContent({
            fecha: new Date().toISOString().split('T')[0],
            descripcion: "",
            archivo_url: ""
        })
        setSelectedFile(null)
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (content: ClassContent) => {
        setIsEditMode(true)
        setEditingId(content.id_contenido)
        setNewContent({
            fecha: content.fecha,
            descripcion: content.descripcion,
            archivo_url: content.archivo_url || ""
        })
        setSelectedFile(null)
        setIsDialogOpen(true)
    }

    const handleSave = async () => {
        if (!selectedSubject || !newContent.descripcion || !newContent.fecha) {
            toast.error("Completa los campos obligatorios")
            return
        }

        try {
            setUploading(true)
            let fileUrl = newContent.archivo_url

            // Handle file upload if a new file was selected
            if (selectedFile) {
                // Delete old file if editing and had a previous file
                if (isEditMode && newContent.archivo_url) {
                    await handleDeleteFile(newContent.archivo_url)
                }

                // Upload new file
                const uploadedUrl = await handleFileUpload(selectedFile, selectedSubject)
                if (uploadedUrl) {
                    fileUrl = uploadedUrl
                }
            }

            if (isEditMode && editingId) {
                // UPDATE
                const { error } = await supabase
                    .from("contenido_clase")
                    .update({
                        fecha: newContent.fecha,
                        descripcion: newContent.descripcion,
                        archivo_url: fileUrl
                    })
                    .eq("id_contenido", editingId)

                if (error) throw error
                toast.success("Contenido actualizado")
            } else {
                // CREATE
                const { error } = await supabase
                    .from("contenido_clase")
                    .insert([{
                        id_materia: parseInt(selectedSubject),
                        fecha: newContent.fecha,
                        descripcion: newContent.descripcion,
                        archivo_url: fileUrl
                    }])

                if (error) throw error
                toast.success("Contenido agregado")
            }

            setIsDialogOpen(false)
            setNewContent({ fecha: new Date().toISOString().split('T')[0], descripcion: "", archivo_url: "" })
            setSelectedFile(null)
            fetchContents(selectedSubject)
        } catch (error) {
            console.error("Error saving content:", error)
            toast.error("Error al guardar contenido")
        } finally {
            setUploading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Â¿Eliminar este contenido?")) return

        try {
            const { error } = await supabase.from("contenido_clase").delete().eq("id_contenido", id)
            if (error) throw error
            fetchContents(selectedSubject)
            toast.success("Contenido eliminado")
        } catch (error) {
            console.error("Error deleting content:", error)
        }
    }
    if (loading) return <div>Cargando materias...</div>

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="w-full md:w-1/3">
                        <Label>Seleccionar Materia</Label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Elige una materia" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjects.map((s) => (
                                    <SelectItem key={s.id_materia} value={s.id_materia.toString()}>
                                        {s.nombre} - {s.curso?.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenCreate} className="flex items-center gap-2" disabled={!selectedSubject}>
                                <Plus className="w-4 h-4" />
                                Nuevo Contenido
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isEditMode ? "Editar Contenido de Clase" : "Cargar Contenido de Clase"}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Fecha de la Clase</Label>
                                    <Input
                                        type="date"
                                        value={newContent.fecha}
                                        onChange={(e) => setNewContent({ ...newContent, fecha: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>DescripciÃ³n / Resumen</Label>
                                    <Textarea
                                        placeholder="Â¿QuÃ© se vio en la clase?"
                                        value={newContent.descripcion}
                                        onChange={(e) => setNewContent({ ...newContent, descripcion: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Archivo PDF (opcional)</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                    {newContent.archivo_url && !selectedFile && (
                                        <p className="text-sm text-gray-500 truncate max-w-[400px]" title={newContent.archivo_url.split('/').pop()}>
                                            Archivo actual: {newContent.archivo_url.split('/').pop()}
                                        </p>
                                    )}
                                </div>
                                <Button onClick={handleSave} className="w-full" disabled={uploading}>
                                    {uploading ? "Subiendo..." : (isEditMode ? "Actualizar" : "Guardar")}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4">
                {contents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {selectedSubject
                            ? "No hay contenidos cargados para esta materia."
                            : "Selecciona una materia para ver su contenido."}
                    </div>
                ) : (
                    contents.map((content) => (
                        <Card key={content.id_contenido} className="bg-white">
                            <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 text-blue-600 font-medium">
                                        <Calendar className="w-4 h-4" />
                                        {format(new Date(content.fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                                    </div>
                                    <p className="text-gray-800 whitespace-pre-wrap">{content.descripcion}</p>
                                    {content.archivo_url && (
                                        <a
                                            href={content.archivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mt-2"
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                            Ver Material Adjunto
                                        </a>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-blue-500"
                                        onClick={() => handleOpenEdit(content)}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-red-500"
                                        onClick={() => handleDelete(content.id_contenido)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
