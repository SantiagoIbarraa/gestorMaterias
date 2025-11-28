import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Obtener un profesor específico
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data: profesor, error } = await supabase
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
      .eq("id_profesor", id)
      .eq("activo", true)
      .single()

    if (error || !profesor) {
      return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ profesor })
  } catch (error) {
    console.error("[API Profesores] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// PUT - Modificar profesor (modificarProfesor)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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
      materias, // Array de id_materia (opcional)
    } = body

    // Verificar que el profesor existe
    const { data: existing } = await supabase
      .from("profesor")
      .select("id_profesor")
      .eq("id_profesor", id)
      .eq("activo", true)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
    }

    // Verificar DNI duplicado (si se cambia)
    if (dni) {
      const { data: existingDni } = await supabase
        .from("profesor")
        .select("id_profesor")
        .eq("dni", dni)
        .eq("activo", true)
        .neq("id_profesor", id)
        .maybeSingle()

      if (existingDni) {
        return NextResponse.json({ error: "Ya existe otro profesor con ese DNI" }, { status: 400 })
      }
    }

    // Actualizar datos del profesor
    const updateData: Record<string, unknown> = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (genero !== undefined) updateData.genero = genero
    if (email !== undefined) updateData.email = email
    if (direccion !== undefined) updateData.direccion = direccion
    if (telefono !== undefined) updateData.telefono = telefono
    if (dni !== undefined) updateData.dni = dni
    if (situacion_revista !== undefined) updateData.situacion_revista = situacion_revista

    const { data: profesor, error: updateError } = await supabase
      .from("profesor")
      .update(updateData)
      .eq("id_profesor", id)
      .select()
      .single()

    if (updateError) {
      console.error("[API Profesores] Update error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Si se proporcionan materias, actualizar la relación
    if (materias !== undefined) {
      // Eliminar materias anteriores
      await supabase.from("profesor_materia").delete().eq("id_profesor", id)

      // Insertar nuevas materias
      if (materias.length > 0) {
        const materiasToInsert = materias.map((id_materia: number) => ({
          id_profesor: Number(id),
          id_materia,
        }))

        await supabase.from("profesor_materia").insert(materiasToInsert)
      }
    }

    return NextResponse.json({
      message: "Profesor actualizado exitosamente",
      profesor,
    })
  } catch (error) {
    console.error("[API Profesores] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

// DELETE - Eliminar profesor (eliminarProfesor) - Soft Delete
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    // Verificar que el profesor existe y está activo
    const { data: existing } = await supabase
      .from("profesor")
      .select("id_profesor, nombre")
      .eq("id_profesor", id)
      .eq("activo", true)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
    }

    // Soft Delete: marcar como inactivo
    const { error: deleteError } = await supabase.from("profesor").update({ activo: false }).eq("id_profesor", id)

    if (deleteError) {
      console.error("[API Profesores] Delete error:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Opcional: eliminar asignaciones de materias (comentado para mantener historial)
    // await supabase.from("profesor_materia").delete().eq("id_profesor", id)

    return NextResponse.json({
      message: `Profesor "${existing.nombre}" eliminado exitosamente (corrección de error de carga)`,
    })
  } catch (error) {
    console.error("[API Profesores] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
