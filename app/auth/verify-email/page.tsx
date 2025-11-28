"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Verifica tu Email</h1>
        <p className="text-gray-600 mb-6">
          Hemos enviado un link de verificación a tu email. Por favor, haz clic en el link para confirmar tu cuenta.
        </p>

        <Link href="/auth/login">
          <Button className="w-full">Volver al Login</Button>
        </Link>
      </div>
    </div>
  )
}
