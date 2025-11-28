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
