"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, BookOpen, Clock, Pencil, User, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Subject {
    id_materia: number
    nombre: string
    descripcion: string
    carga_horaria: string
    id_curso: number
    curso?: {
        nombre: string
        nivel: string
        año: number
    }
    profesor_materia?: {
        profesor?: {
            id_profesor: number
            nombre: string
            user_id?: string
        }
    }[]
}

interface Course {
    id_curso: number
    nombre: string
    nivel: string
    año: number
}

interface ProfessorUser {
    user_id: string
    email: string
    nombre: string
    id_profesor: number | null
}

interface Schedule {
    id_horario?: number // Optional for new temp schedules
    dia_semana: string
    hora_inicio: string
    hora_fin: string
    id_curso: number
    id_materia?: number
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export function SubjectManager() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [professorUsers, setProfessorUsers] = useState<ProfessorUser[]>([])
    const [allSchedules, setAllSchedules] = useState<Schedule[]>([]) // All schedules in DB
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        carga_horaria: "",
        id_curso: "",
        user_id_profesor: "",
    })

    // Schedules being managed in the form (existing + new)
    const [formSchedules, setFormSchedules] = useState<Schedule[]>([])
    // Temporary state for adding a new schedule slot
    const [tempSchedule, setTempSchedule] = useState({
        dia_semana: "",
        hora_inicio: "",
        hora_fin: ""
    })

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    // Auto-calculate Carga Horaria whenever formSchedules changes
    useEffect(() => {
        if (formSchedules.length > 0) {
            let totalMinutes = 0
            formSchedules.forEach(s => {
                if (!s.hora_inicio || !s.hora_fin) return
                const [startH, startM] = s.hora_inicio.split(':').map(Number)
                const [endH, endM] = s.hora_fin.split(':').map(Number)
                const start = startH * 60 + startM
                const end = endH * 60 + endM
                if (end > start) {
                    totalMinutes += (end - start)
                }
            })

            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            let durationStr = ""
            if (hours > 0) durationStr += `${hours} hs`
            if (minutes > 0) durationStr += ` ${minutes} min`

            setFormData(prev => ({ ...prev, carga_horaria: durationStr.trim() || "0 hs" }))
        } else {
            // If no schedules, keep manual input or reset? Let's reset if it was auto-calculated, 
            // but user might want to manually override. 
            // Requirement says "recurra a los horarios y realice el calculo".
            // So we prioritize calculation.
            if (isEditMode && formSchedules.length === 0) {
                // If editing and we removed all schedules, maybe 0.
            }
        }
    }, [formSchedules, isEditMode])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            let role = null
            if (user) {
                // Check if admin
                const { data: roleData } = await supabase
                    .from("user_roles")
                    .select("role")
                    .eq("id", user.id)
                    .maybeSingle()

                if (roleData?.role === 'admin') {
                    role = 'admin'
                } else {
                    // Check if professor
                    const { data: profData } = await supabase
                        .from("profesor")
                        .select("id_profesor")
                        .eq("user_id", user.id)
                        .maybeSingle()

                    if (profData) {
                        role = 'profesor'
                    }
                }

                setUserRole(role)
                setCurrentUserId(user.id)
            }

            const [subjectsRes, coursesRes, schedulesRes] = await Promise.all([
                supabase.from("materia").select("*, curso(*), profesor_materia(profesor(id_profesor, nombre, user_id))"),
                supabase.from("curso").select("*"),
                supabase.from("horario").select("*")
            ])

            const profRes = await fetch("/api/admin/professors-users")
            if (profRes.ok) {
                const profData = await profRes.json()
                setProfessorUsers(profData)
            }

            if (subjectsRes.data) {
                let filteredSubjects = subjectsRes.data
                if (role === 'profesor' && user) {
                    filteredSubjects = subjectsRes.data.filter((s: any) =>
                        s.profesor_materia?.some((pm: any) => pm.profesor?.user_id === user.id)
                    )
                }
                setSubjects(filteredSubjects)
            }
            if (coursesRes.data) setCourses(coursesRes.data)
            if (schedulesRes.data) setAllSchedules(schedulesRes.data)
        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Error al cargar datos")
        } finally {
            setLoading(false)
        }
    }

    const checkOverlap = (newSlot: Schedule, currentCourseId: number, excludeMateriaId?: number) => {
        // Filter schedules for this course
        const courseSchedules = allSchedules.filter(s => s.id_curso === currentCourseId)

        return courseSchedules.some(s => {
            // Exclude schedules of the subject we are currently editing
            if (excludeMateriaId && s.id_materia === excludeMateriaId) return false

            // Exclude the slot itself if we were checking against DB (but newSlot is not in DB yet usually)

            if (s.dia_semana !== newSlot.dia_semana) return false

            // Check time overlap
            // (StartA < EndB) and (EndA > StartB)
            return (newSlot.hora_inicio < s.hora_fin && newSlot.hora_fin > s.hora_inicio)
        })
    }

    const handleAddScheduleSlot = () => {
        if (!tempSchedule.dia_semana || !tempSchedule.hora_inicio || !tempSchedule.hora_fin) {
            toast.error("Completa día, inicio y fin")
            return
        }
        if (!formData.id_curso) {
            toast.error("Selecciona un curso primero")
            return
        }

        const newSlot: Schedule = {
            dia_semana: tempSchedule.dia_semana,
            hora_inicio: tempSchedule.hora_inicio,
            hora_fin: tempSchedule.hora_fin,
            id_curso: parseInt(formData.id_curso)
        }

        // 1. Check conflict with DB schedules
        if (checkOverlap(newSlot, parseInt(formData.id_curso), editingId || undefined)) {
            toast.error("¡Choque de horarios! Este horario ya está ocupado en el curso.")
            return
        }

        // 2. Check conflict with *this form's* other new slots
        const internalOverlap = formSchedules.some(s =>
            s.dia_semana === newSlot.dia_semana &&
            (newSlot.hora_inicio < s.hora_fin && newSlot.hora_fin > s.hora_inicio)
        )
        if (internalOverlap) {
            toast.error("Ya agregaste un horario que se superpone con este.")
            return
        }

        setFormSchedules([...formSchedules, newSlot])
        setTempSchedule({ dia_semana: "", hora_inicio: "", hora_fin: "" })
    }

    const handleRemoveScheduleSlot = (index: number) => {
        const newScheds = [...formSchedules]
        newScheds.splice(index, 1)
        setFormSchedules(newScheds)
    }

    const handleOpenCreate = () => {
        setIsEditMode(false)
        setEditingId(null)
        setFormData({
            nombre: "", descripcion: "", carga_horaria: "", id_curso: "", user_id_profesor: ""
        })
        setFormSchedules([])
        setTempSchedule({ dia_semana: "", hora_inicio: "", hora_fin: "" })
        setIsDialogOpen(true)
    }

    const handleOpenEdit = (subject: Subject) => {
        setIsEditMode(true)
        setEditingId(subject.id_materia)

        const assignedProf = subject.profesor_materia?.[0]?.profesor
        let assignedUserId = assignedProf?.user_id || ""
        if (!assignedUserId && assignedProf?.id_profesor) {
            const found = professorUsers.find(p => p.id_profesor === assignedProf.id_profesor)
            if (found) assignedUserId = found.user_id
        }

        setFormData({
            nombre: subject.nombre,
            descripcion: subject.descripcion || "",
            carga_horaria: subject.carga_horaria || "",
            id_curso: subject.id_curso.toString(),
            user_id_profesor: assignedUserId,
        })

        // Load existing schedules for this subject
        const subjectSchedules = allSchedules.filter(s => s.id_materia === subject.id_materia)
        setFormSchedules(subjectSchedules)

        setTempSchedule({ dia_semana: "", hora_inicio: "", hora_fin: "" })
        setIsDialogOpen(true)
    }

    const getOrCreateProfessorId = async (userId: string): Promise<number | null> => {
        const profUser = professorUsers.find(p => p.user_id === userId)
        if (!profUser) return null

        // 1. Check if professor already exists in DB for this user_id
        const { data: existingProf, error: fetchError } = await supabase
            .from("profesor")
            .select("id_profesor")
            .eq("user_id", userId)
            .maybeSingle()

        if (fetchError) throw fetchError
        if (existingProf) return existingProf.id_profesor

        // 2. If not exists, insert
        const { data, error } = await supabase
            .from("profesor")
            .insert([{
                nombre: profUser.nombre,
                email: profUser.email,
                user_id: userId,
                genero: "Otro", // Default value to satisfy not-null constraint
                direccion: "Sin especificar", // Default value to satisfy not-null constraint
                telefono: 0 // Default value to satisfy not-null constraint
            }])
            .select("id_profesor")
            .single()

        if (error) throw error
        return data.id_profesor
    }

    const handleSave = async () => {
        if (!formData.nombre || !formData.id_curso) {
            toast.error("Nombre y curso son obligatorios")
            return
        }

        // Check for pending schedule in inputs
        let schedulesToSave = [...formSchedules]
        if (tempSchedule.dia_semana && tempSchedule.hora_inicio && tempSchedule.hora_fin) {
            const newSlot: Schedule = {
                dia_semana: tempSchedule.dia_semana,
                hora_inicio: tempSchedule.hora_inicio,
                hora_fin: tempSchedule.hora_fin,
                id_curso: parseInt(formData.id_curso)
            }

            // Validate pending slot
            if (checkOverlap(newSlot, parseInt(formData.id_curso), editingId || undefined)) {
                toast.error("El horario que estás agregando choca con otro existente. Corrígelo antes de guardar.")
                return
            }

            const internalOverlap = formSchedules.some(s =>
                s.dia_semana === newSlot.dia_semana &&
                (newSlot.hora_inicio < s.hora_fin && newSlot.hora_fin > s.hora_inicio)
            )
            if (internalOverlap) {
                toast.error("El horario que estás agregando se superpone con otro de la lista.")
                return
            }

            schedulesToSave.push(newSlot)
        }

        try {
            let finalProfesorId: number | null = null
            if (formData.user_id_profesor) {
                finalProfesorId = await getOrCreateProfessorId(formData.user_id_profesor)
            }

            let subjectId = editingId

            if (isEditMode && editingId) {
                // UPDATE Subject
                const { error: updateError } = await supabase
                    .from("materia")
                    .update({
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        carga_horaria: formData.carga_horaria,
                        id_curso: parseInt(formData.id_curso)
                    })
                    .eq("id_materia", editingId)

                if (updateError) throw updateError
            } else {
                // CREATE Subject
                const { data: subjectData, error: subjectError } = await supabase
                    .from("materia")
                    .insert([{
                        nombre: formData.nombre,
                        descripcion: formData.descripcion,
                        carga_horaria: formData.carga_horaria,
                        id_curso: parseInt(formData.id_curso)
                    }])
                    .select()
                    .single()

                if (subjectError) throw subjectError
                subjectId = subjectData.id_materia
            }

            if (!subjectId) throw new Error("No subject ID")

            // Update Professor Assignment
            // Delete existing
            await supabase.from("profesor_materia").delete().eq("id_materia", subjectId)
            // Insert new
            if (finalProfesorId) {
                await supabase.from("profesor_materia").insert([{
                    id_profesor: finalProfesorId,
                    id_materia: subjectId
                }])
            }

            // Update Schedules
            // 1. Delete all existing schedules for this subject
            await supabase.from("horario").delete().eq("id_materia", subjectId)

            // 2. Insert all schedules from schedulesToSave
            if (schedulesToSave.length > 0) {
                const schedulesToInsert = schedulesToSave.map(s => ({
                    dia_semana: s.dia_semana,
                    hora_inicio: s.hora_inicio,
                    hora_fin: s.hora_fin,
                    id_curso: parseInt(formData.id_curso),
                    id_materia: subjectId
                }))
                const { error: schedError } = await supabase.from("horario").insert(schedulesToInsert)
                if (schedError) throw schedError
            }

            toast.success(isEditMode ? "Materia actualizada" : "Materia creada")
            setIsDialogOpen(false)
            fetchData()
        } catch (error: any) {
            console.error("Error saving subject:", error)
            toast.error(error.message || "Error al guardar materia")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta materia?")) return

        try {
            const { error } = await supabase.from("materia").delete().eq("id_materia", id)
            if (error) throw error
            fetchData()
            toast.success("Materia eliminada")
        } catch (error) {
            console.error("Error deleting subject:", error)
            toast.error("Error al eliminar materia")
        }
    }

    if (loading) return <div>Cargando materias...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Gestión de Materias</h2>
                {userRole !== 'profesor' && (
                    <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nueva Materia
                    </Button>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Editar Materia" : "Agregar Nueva Materia"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Matemática"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Carga Horaria (Auto/Manual)</Label>
                                    <Input
                                        value={formData.carga_horaria}
                                        onChange={(e) => setFormData({ ...formData, carga_horaria: e.target.value })}
                                        placeholder="Calculada o manual"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Input
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    placeholder="Descripción breve..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Curso</Label>
                                    <Select
                                        value={formData.id_curso}
                                        onValueChange={(val) => setFormData({ ...formData, id_curso: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar curso" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map((course) => (
                                                <SelectItem key={course.id_curso} value={course.id_curso.toString()}>
                                                    {course.nombre} - {course.nivel} ({course.año})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Profesor Asignado</Label>
                                    <Select
                                        value={formData.user_id_profesor}
                                        onValueChange={(val) => setFormData({ ...formData, user_id_profesor: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar profesor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {professorUsers.map((prof) => (
                                                <SelectItem key={prof.user_id} value={prof.user_id}>
                                                    {prof.nombre} ({prof.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-2">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Horarios de Cursada
                                </h4>

                                {/* List of added schedules */}
                                <div className="space-y-2 mb-4">
                                    {formSchedules.map((s, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                                            <span className="text-sm font-medium">
                                                {s.dia_semana}: {s.hora_inicio} - {s.hora_fin}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveScheduleSlot(idx)}
                                                className="h-6 w-6 p-0 text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {formSchedules.length === 0 && (
                                        <p className="text-sm text-gray-500 italic">No hay horarios asignados</p>
                                    )}
                                </div>

                                {/* Add new schedule form */}
                                <div className="grid grid-cols-4 gap-2 items-end bg-blue-50 p-3 rounded-md">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Día</Label>
                                        <Select
                                            value={tempSchedule.dia_semana}
                                            onValueChange={(val) => setTempSchedule({ ...tempSchedule, dia_semana: val })}
                                        >
                                            <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Día" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DAYS.map((day) => (
                                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Inicio</Label>
                                        <Input
                                            type="time"
                                            className="h-8"
                                            value={tempSchedule.hora_inicio}
                                            onChange={(e) => setTempSchedule({ ...tempSchedule, hora_inicio: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Fin</Label>
                                        <Input
                                            type="time"
                                            className="h-8"
                                            value={tempSchedule.hora_fin}
                                            onChange={(e) => setTempSchedule({ ...tempSchedule, hora_fin: e.target.value })}
                                        />
                                    </div>
                                    <Button size="sm" onClick={handleAddScheduleSlot} className="h-8">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button onClick={handleSave} className="w-full mt-4">
                                {isEditMode ? "Guardar Cambios" : "Crear Materia"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => {
                    const assignedProf = subject.profesor_materia?.[0]?.profesor?.nombre
                    return (
                        <Card key={subject.id_materia} className="bg-white hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold flex justify-between items-start">
                                    <span className="flex items-center gap-2 truncate pr-2">
                                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                        <span className="truncate" title={subject.nombre}>{subject.nombre}</span>
                                    </span>
                                    <div className="flex gap-1 flex-shrink-0">
                                        {userRole !== 'profesor' && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-500 hover:text-blue-600 h-6 w-6"
                                                    onClick={() => handleOpenEdit(subject)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-500 hover:text-red-600 h-6 w-6"
                                                    onClick={() => handleDelete(subject.id_materia)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p><span className="font-semibold">Curso:</span> {subject.curso?.nombre} ({subject.curso?.nivel})</p>
                                    <p><span className="font-semibold">Carga:</span> {subject.carga_horaria}</p>
                                    {assignedProf && (
                                        <div className="flex items-center gap-1 text-blue-700 font-medium overflow-hidden">
                                            <User className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate" title={assignedProf}>{assignedProf}</span>
                                        </div>
                                    )}
                                    {subject.descripcion && <p className="italic text-gray-500 mt-2 truncate">{subject.descripcion}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
