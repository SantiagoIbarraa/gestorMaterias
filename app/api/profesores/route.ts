import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Obtener todos los profesores con sus materias
export async function GET() {
  try {
    const supabase = await createAdminClient()

    // Obtener profesores activos con sus materias asignadas
    const { data: profesores, error } = await supabase
      .from("profesor")
      .select(`
        *,
        profesor_materia (
          id_materia,
          materia (
            id_materia,
            nombre,
            descripcion
          )
        )
      `)
      .eq("activo", true)
      .order("nombre")

    if (error) {
      console.error("[API Profesores] Error fetching:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profesores })
  } catch (error) {
    console.error("[API Profesores] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// POST - Crear nuevo profesor (registrarProfesor)
export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const {
      nombre,
      genero,
      email,
      direccion,
      telefono,
      dni,
      situacion_revista,
      materias, // Array de id_materia
    } = body

    // Validar campos requeridos
    if (!nombre || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 })
    }

    // Verificar si el DNI ya existe (si se proporciona)
    if (dni) {
      const { data: existingDni } = await supabase
        .from("profesor")
        .select("id_profesor")
        .eq("dni", dni)
        .eq("activo", true)
        .maybeSingle()

      if (existingDni) {
        return NextResponse.json({ error: "Ya existe un profesor con ese DNI" }, { status: 400 })
      }
    }

    // Insertar profesor
    const { data: profesor, error: insertError } = await supabase
      .from("profesor")
      .insert({
        nombre,
        genero,
        email,
        direccion,
        telefono,
        dni,
        situacion_revista: situacion_revista || "Suplente",
        activo: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[API Profesores] Insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Asignar materias si se proporcionan
    if (materias && materias.length > 0) {
      const materiasToInsert = materias.map((id_materia: number) => ({
        id_profesor: profesor.id_profesor,
        id_materia,
      }))

      const { error: materiasError } = await supabase.from("profesor_materia").insert(materiasToInsert)

      if (materiasError) {
        console.error("[API Profesores] Materias insert error:", materiasError)
        // No retornamos error, el profesor ya fue creado
      }
    }

    return NextResponse.json(
      {
        message: "Profesor registrado exitosamente",
        profesor,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[API Profesores] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
