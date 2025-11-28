import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import * as bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const supabase = await createAdminClient()

    const { data: user, error } = await supabase
      .from("users")
      .select("id, password_hash, role")
      .eq("email", email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 })
    }

    return NextResponse.json({ success: true, userId: user.id, role: user.role })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
