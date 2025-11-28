import { createAdminClient, createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const supabase = await createServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Verify admin or professor role (professors might need to see this too?)
        // For assigning professors to subjects, usually admin does it.
        // Let's assume admin for now.

        const adminClient = await createAdminClient()

        // 1. Get all users with role 'profesor'
        const { data: roles } = await adminClient
            .from("user_roles")
            .select("id, role")
            .eq("role", "profesor")

        if (!roles || roles.length === 0) {
            return NextResponse.json([])
        }

        const userIds = roles.map(r => r.id)

        // 2. Fetch user details from auth.users (using admin client)
        // Note: listUsers() might not support filtering by ID list efficiently in one go if list is huge,
        // but for now it's fine. Or we can just list all and filter.
        // Better: Use adminClient to query a view if we had one, but we don't.
        // We will just list all users and filter in memory (limit 1000 is default).
        const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({
            perPage: 1000
        })

        if (usersError) throw usersError

        const professorUsers = users.filter(u => userIds.includes(u.id))

        // 3. Fetch existing 'profesor' records to link IDs
        const { data: existingProfessors } = await adminClient
            .from("profesor")
            .select("id_profesor, user_id")
            .in("user_id", userIds)

        // 4. Merge data
        const result = professorUsers.map(u => {
            const existing = existingProfessors?.find(p => p.user_id === u.id)
            return {
                user_id: u.id,
                email: u.email,
                nombre: u.user_metadata?.nombre || u.email, // Fallback to email if no name
                id_profesor: existing?.id_profesor || null
            }
        })

        return NextResponse.json(result)

    } catch (error: any) {
        console.error("Error fetching professor users:", error)
        return NextResponse.json(
            { error: error.message || "Error fetching professors" },
            { status: 500 }
        )
    }
}
