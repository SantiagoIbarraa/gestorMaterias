import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Obtener todas las materias (para el selector de asignación)
export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: materias, error } = await supabase
      .from("materia")
      .select(`
        id_materia,
        nombre,
        descripcion,
        carga_horaria,
        curso (
          id_curso,
          nombre
        )
      `)
      .order("nombre")

    if (error) {
      console.error("[API Materias] Error fetching:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ materias })
  } catch (error) {
    console.error("[API Materias] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
