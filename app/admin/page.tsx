"use client"

import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { useAuthStore } from "@/lib/auth-store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminPage() {
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      if (!authChecked) {
        await checkAuth()
        setAuthChecked(true)
      }
    }
    
    initAuth()
  }, [checkAuth, authChecked])

  useEffect(() => {
    if (!authChecked || isLoading) return
    
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user?.role !== "admin") {
      router.push("/")
      return
    }
  }, [isAuthenticated, user, router, authChecked, isLoading])

  if (isLoading || !authChecked || (!isAuthenticated || user?.role !== "admin")) {
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
