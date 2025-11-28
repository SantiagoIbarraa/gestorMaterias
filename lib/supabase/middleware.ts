import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const skipPaths = ["/_next", "/_vercel", "/api", "/favicon.ico", "/icon", "/apple-icon"]

  if (skipPaths.some((path) => pathname.startsWith(path)) || pathname.includes(".")) {
    return NextResponse.next()
  }

  const isAuthRoute = pathname.startsWith("/auth")
  const isHomePage = pathname === "/"
  const isAdminRoute = pathname.startsWith("/admin")
  const isPublicRoute = isAuthRoute || isHomePage

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // No user and trying to access protected route
    if (!user && !isPublicRoute) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    // User logged in and trying to access auth routes (except callback)
    if (user && isAuthRoute && pathname !== "/auth/callback") {
      return NextResponse.redirect(new URL("/attendance", request.url))
    }

    if (user && isAdminRoute) {
      // Import createClient from @supabase/supabase-js for service role
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")

      const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: userRole, error: roleError } = await adminSupabase
        .from("user_roles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()

      console.log("[Middleware] Admin route check:", {
        userId: user.id,
        role: userRole?.role,
        error: roleError
      })

      if (userRole?.role !== "admin" && userRole?.role !== "profesor") {
        console.log("[Middleware] Access denied, redirecting to /attendance")
        return NextResponse.redirect(new URL("/attendance", request.url))
      }

      console.log("[Middleware] Access granted to admin route")
    }
  } catch {
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return supabaseResponse
}
