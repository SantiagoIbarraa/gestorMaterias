"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Usar API route que bypasea RLS con service role
        const response = await fetch("/api/auth/get-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user.id }),
        })

        const { role } = await response.json()

        if (role === "admin") {
          router.push("/admin")
        } else {
          router.push("/attendance")
        }
      } else {
        router.push("/auth/login")
      }
    }

    checkUser()
  }, [router])

  return null
}
