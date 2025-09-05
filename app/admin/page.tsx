"use client"

import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { useAuthStore } from "@/lib/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function AdminPage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Admin page - checking auth:", { isAuthenticated, user })

    if (!isAuthenticated) {
      console.log("[v0] Not authenticated, redirecting to login")
      router.push("/login")
      return
    }

    if (user?.role !== "admin") {
      console.log("[v0] Not admin role, redirecting to home")
      router.push("/")
      return
    }

    console.log("[v0] Admin access granted")
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminDashboard />
    </div>
  )
}
