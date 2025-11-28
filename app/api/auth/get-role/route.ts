import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ role: "usuario" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: userRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()

    // Debug: List all roles to verify table access
    const { data: allRoles, error: allRolesError } = await supabase
      .from("user_roles")
      .select("*")
      .limit(5)
    console.log("[API] All roles sample:", allRoles)
    if (allRolesError) console.error("[API] Error listing roles:", allRolesError)

    if (roleError) {
      console.error("[API] Error fetching role:", roleError)
      return NextResponse.json({ role: "usuario" })
    }

    console.log("[API] Raw Supabase response:", userRole)
    console.log("[API] Role fetched for user:", userId, "Role:", userRole?.role)
    return NextResponse.json({ role: userRole?.role || "usuario" })
  } catch (error) {
    console.error("[API] Internal error:", error)
    return NextResponse.json({ role: "usuario" })
  }
}
