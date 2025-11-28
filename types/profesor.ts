export interface Profesor {
  id_profesor: number
  nombre: string
  genero: string | null
  email: string
  direccion: string | null
  telefono: number | null
  dni: string | null
  situacion_revista: "Titular" | "Provisional" | "Suplente"
  activo: boolean
  profesor_materia?: {
    id_materia: number
    materia: {
      id_materia: number
      nombre: string
      descripcion: string | null
    }
  }[]
}

export interface Materia {
  id_materia: number
  nombre: string
  descripcion: string | null
  carga_horaria: string | null
  curso?: {
    id_curso: number
    nombre: string
  }
}

export type SituacionRevista = "Titular" | "Provisional" | "Suplente"
