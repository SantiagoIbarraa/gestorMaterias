import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const redirectCount = request.headers.get("x-redirect-count")
  if (redirectCount && Number.parseInt(redirectCount) > 3) {
    console.log("[v0] Too many redirects, stopping")
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
