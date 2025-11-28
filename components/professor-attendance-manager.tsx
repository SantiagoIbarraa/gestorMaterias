"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Calendar as CalendarIcon, Check, X, Search, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Professor {
    id_profesor: number
    nombre: string
    email: string
}

interface Subject {
    id_materia: number
    nombre: string
    id_curso: number
    curso?: {
        nombre: string
    }
}

interface ProfessorSubject {
    id_profesor: number
    id_materia: number
    profesor: Professor
    materia: Subject
}

interface AttendanceRecord {
    id_profesor: number
    id_materia: number
    presente: boolean
    observacion: string
}

export function ProfessorAttendanceManager() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [professors, setProfessors] = useState<ProfessorSubject[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({})
    const [searchTerm, setSearchTerm] = useState("")

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [date])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch professor-subject relationships
            const { data: assignments, error: assignError } = await supabase
                .from("profesor_materia")
                .select(`
          id_profesor,
          id_materia,
          profesor (id_profesor, nombre, email),
          materia (id_materia, nombre, id_curso, curso(nombre))
        `)

            if (assignError) throw assignError

            // 2. Fetch existing attendance for the date
            const { data: existingAttendance, error: attError } = await supabase
                .from("asistencia_profesor")
                .select("*")
                .eq("fecha", date)

            if (attError) throw attError

            // Initialize attendance state
            const initialAttendance: Record<string, AttendanceRecord> = {}

            // Default to present for all assignments
            assignments?.forEach((assignment: any) => {
                const key = `${assignment.id_profesor}-${assignment.id_materia}`
                initialAttendance[key] = {
                    id_profesor: assignment.id_profesor,
                    id_materia: assignment.id_materia,
                    presente: true,
                    observacion: ""
                }
            })

            // Override with existing records
            existingAttendance?.forEach((record: any) => {
                const key = `${record.id_profesor}-${record.id_materia}`
                if (initialAttendance[key]) {
                    initialAttendance[key] = {
                        ...initialAttendance[key],
                        presente: record.presente,
                        observacion: record.observacion || ""
                    }
                }
            })

            setProfessors((assignments as unknown as ProfessorSubject[]) || [])
            setAttendance(initialAttendance)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleAttendanceChange = (key: string, present: boolean) => {
        setAttendance(prev => ({
            ...prev,
            [key]: { ...prev[key], presente: present }
        }))
    }

    const handleObservationChange = (key: string, observation: string) => {
        setAttendance(prev => ({
            ...prev,
            [key]: { ...prev[key], observacion: observation }
        }))
    }

    const saveAttendance = async () => {
        setSaving(true)
        try {
            // Delete existing records for this date to avoid duplicates/conflicts
            // (A more efficient way would be upsert, but delete+insert is simpler for batch updates here)
            await supabase
                .from("asistencia_profesor")
                .delete()
                .eq("fecha", date)

            // Prepare records to insert
            const recordsToInsert = Object.values(attendance).map(record => ({
                fecha: date,
                id_profesor: record.id_profesor,
                id_materia: record.id_materia,
                presente: record.presente,
                observacion: record.observacion
            }))

            const { error } = await supabase
                .from("asistencia_profesor")
                .insert(recordsToInsert)

            if (error) throw error

            alert("Asistencias guardadas correctamente")
        } catch (error) {
            console.error("Error saving attendance:", error)
            alert("Error al guardar asistencias")
        } finally {
            setSaving(false)
        }
    }

    const filteredProfessors = professors.filter(p =>
        (p.profesor?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.materia?.nombre || "").toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div>Cargando datos...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Label>Fecha:</Label>
                    <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-40"
                    />
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar profesor o materia..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <Button onClick={saveAttendance} disabled={saving} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>

            <div className="grid gap-4">
                {filteredProfessors.map((item) => {
                    if (!item.profesor || !item.materia) return null
                    const key = `${item.id_profesor}-${item.id_materia}`
                    const record = attendance[key]
                    if (!record) return null

                    return (
                        <Card key={key} className={`transition-colors ${!record.presente ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{item.profesor.nombre}</h3>
                                    <p className="text-gray-600">
                                        {item.materia.nombre} - {item.materia.curso?.nombre}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => handleAttendanceChange(key, true)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${record.presente
                                                ? 'bg-white text-green-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Presente
                                        </button>
                                        <button
                                            onClick={() => handleAttendanceChange(key, false)}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${!record.presente
                                                ? 'bg-white text-red-700 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Ausente
                                        </button>
                                    </div>

                                    <Input
                                        placeholder="Observación (opcional)"
                                        value={record.observacion}
                                        onChange={(e) => handleObservationChange(key, e.target.value)}
                                        className="w-full md:w-64"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
