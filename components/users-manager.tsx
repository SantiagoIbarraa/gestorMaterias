"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Search, Shield, ShieldAlert, User } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface UserData {
    id: string
    email: string
    nombre: string
    role: string

    created_at: string
    last_sign_in_at: string | null
}

export function UsersManager() {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/admin/users")
            if (!response.ok) throw new Error("Failed to fetch users")
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error("Error fetching users:", error)
            toast.error("Error al cargar usuarios")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdatingId(userId)
        try {
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Failed to update role")
            }

            toast.success(`Rol actualizado a ${newRole.toUpperCase()}`)

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        } catch (error: any) {
            console.error("Error updating role:", error)
            toast.error(error.message || "Error al actualizar rol")
        } finally {
            setUpdatingId(null)
        }
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        if (roleFilter === "all") return true
        if (roleFilter === "admin") return user.role === "admin"

        if (roleFilter === "profesor") return user.role === "profesor"
        if (roleFilter === "preceptor") return user.role === "preceptor"
        if (roleFilter === "sin_rol") return user.role === "alumno" || !user.role


        return true
    })

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Gestión de Usuarios</h3>
                <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>

                            <SelectItem value="profesor">Profesor</SelectItem>
                            <SelectItem value="preceptor">Preceptor</SelectItem>
                            <SelectItem value="sin_rol">Sin Rol</SelectItem>

                        </SelectContent>
                    </Select>
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Rol Actual</TableHead>
                            <TableHead>Registro</TableHead>
                            <TableHead>Último Acceso</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    No se encontraron usuarios
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.nombre}</span>
                                            <span className="text-sm text-gray-500">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border
                                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :

                                                user.role === 'profesor' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    user.role === 'preceptor' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                        'bg-gray-100 text-gray-800 border-gray-200'
                                            }`}>
                                            {user.role === 'admin' && <ShieldAlert className="w-3 h-3" />}

                                            {user.role === 'profesor' && <User className="w-3 h-3" />}
                                            {user.role === 'preceptor' && <Shield className="w-3 h-3" />}
                                            {user.role === 'alumno' || !user.role ? 'SIN ROL' : user.role.toUpperCase()}
                                        </div>

                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        {user.last_sign_in_at
                                            ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: es })
                                            : "Nunca"
                                        }
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            <Select
                                                value={user.role}
                                                onValueChange={(value) => handleRoleChange(user.id, value)}
                                                disabled={updatingId === user.id}
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="profesor">Profesor</SelectItem>

                                                    <SelectItem value="preceptor">Preceptor</SelectItem>
                                                    <SelectItem value="admin" className="text-purple-600 font-medium">
                                                        Administrador
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
