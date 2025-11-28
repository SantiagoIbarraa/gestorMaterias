"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Trash2, Clock, Calendar, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Schedule {
    id_horario: number
    dia_semana: string
    hora_inicio: string
    hora_fin: string
    id_curso: number
    id_materia?: number
    curso?: {
        nombre: string
        nivel: string
        año: number
    }
    materia?: {
        nombre: string
    }
}

interface Course {
    id_curso: number
    nombre: string
    nivel: string
    año: number
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

export function SchedulesManager() {
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all")
    const [userRole, setUserRole] = useState<string | null>(null)
    const [newSchedule, setNewSchedule] = useState({
        dia_semana: "",
        hora_inicio: "",
        hora_fin: "",
        id_curso: ""
    })

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            let role = 'user'
            let mySubjectIds: number[] = []

            if (user) {
                // Check Admin
                const { data: roleData } = await supabase.from("user_roles").select("role").eq("id", user.id).maybeSingle()
                if (roleData?.role === 'admin') {
                    role = 'admin'
                } else {
                    // Check Professor
                    const { data: profData } = await supabase.from("profesor").select("id_profesor").eq("user_id", user.id).maybeSingle()
                    if (profData) {
                        role = 'profesor'
                        // Fetch assigned subjects
                        const { data: assignments } = await supabase.from("profesor_materia").select("id_materia").eq("id_profesor", profData.id_profesor)
                        if (assignments) {
                            mySubjectIds = assignments.map(a => a.id_materia)
                        }
                    }
                }
                setUserRole(role)
            }

            const [schedulesRes, coursesRes] = await Promise.all([
                supabase.from("horario").select("*, curso(*), materia(nombre)"),
                supabase.from("curso").select("*")
            ])

            if (schedulesRes.data) {
                let data = schedulesRes.data
                if (role === 'profesor') {
                    data = data.filter(s => s.id_materia && mySubjectIds.includes(s.id_materia))
                }
                setSchedules(data)
            }
            if (coursesRes.data) setCourses(coursesRes.data)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        try {
            const { error } = await supabase.from("horario").insert([
                {
                    dia_semana: newSchedule.dia_semana,
                    hora_inicio: newSchedule.hora_inicio,
                    hora_fin: newSchedule.hora_fin,
                    id_curso: parseInt(newSchedule.id_curso)
                }
            ])

            if (error) throw error

            setIsDialogOpen(false)
            setNewSchedule({ dia_semana: "", hora_inicio: "", hora_fin: "", id_curso: "" })
            fetchData()
        } catch (error) {
            console.error("Error creating schedule:", error)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este horario?")) return

        try {
            const { error } = await supabase.from("horario").delete().eq("id_horario", id)
            if (error) throw error
            fetchData()
        } catch (error) {
            console.error("Error deleting schedule:", error)
        }
    }

    if (loading) return <div>Cargando horarios...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold">Gestión de Horarios</h2>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full md:w-[300px]">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filtrar por curso" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los cursos</SelectItem>
                                {courses.map((course) => (
                                    <SelectItem key={course.id_curso} value={course.id_curso.toString()}>
                                        {course.nombre} - {course.nivel} ({course.año})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        {userRole !== 'profesor' && (
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2 whitespace-nowrap">
                                    <Plus className="w-4 h-4" />
                                    Nuevo Horario
                                </Button>
                            </DialogTrigger>
                        )}
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Agregar Nuevo Horario</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Día</Label>
                                    <Select
                                        value={newSchedule.dia_semana}
                                        onValueChange={(val) => setNewSchedule({ ...newSchedule, dia_semana: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar día" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {DAYS.map((day) => (
                                                <SelectItem key={day} value={day}>{day}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Hora Inicio</Label>
                                        <Input
                                            type="time"
                                            value={newSchedule.hora_inicio}
                                            onChange={(e) => setNewSchedule({ ...newSchedule, hora_inicio: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hora Fin</Label>
                                        <Input
                                            type="time"
                                            value={newSchedule.hora_fin}
                                            onChange={(e) => setNewSchedule({ ...newSchedule, hora_fin: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Curso</Label>
                                    <Select
                                        value={newSchedule.id_curso}
                                        onValueChange={(val) => setNewSchedule({ ...newSchedule, id_curso: val })}
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

                                <Button onClick={handleCreate} className="w-full">Guardar</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DAYS.map((day) => {
                    const daySchedules = schedules.filter(s => {
                        const matchesDay = s.dia_semana === day
                        const matchesCourse = selectedCourseFilter === "all" || s.id_curso.toString() === selectedCourseFilter
                        return matchesDay && matchesCourse
                    })
                        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

                    if (daySchedules.length === 0) return null

                    return (
                        <Card key={day} className="bg-white">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    {day}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {daySchedules.map((schedule) => (
                                    <div key={schedule.id_horario} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg border">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                {schedule.hora_inicio.slice(0, 5)} - {schedule.hora_fin.slice(0, 5)}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {schedule.materia?.nombre ? (
                                                    <span className="font-semibold text-blue-700 block">{schedule.materia.nombre}</span>
                                                ) : null}
                                                {schedule.curso?.nombre} ({schedule.curso?.nivel})
                                            </p>
                                        </div>
                                        {userRole !== 'profesor' && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                onClick={() => handleDelete(schedule.id_horario)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
