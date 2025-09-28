"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Shield } from 'lucide-react'
import Link from 'next/link'

interface AdminAccessProps {
  className?: string
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
}

export function AdminAccessCheck({ className, variant = "outline" }: AdminAccessProps) {
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/admin/check-access')
        const data = await response.json()
        
        if (data.success) {
          setHasAdminAccess(data.hasAdminAccess)
        }
      } catch (error) {
        console.error('Failed to check admin access:', error)
        setHasAdminAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [])

  // Don't render anything while loading or if no admin access
  if (loading || !hasAdminAccess) {
    return null
  }

  return (
    <Link href="/login">
      <Button variant={variant} className={className}>
        <Shield className="h-4 w-4 mr-2" />
        Admin Login
      </Button>
    </Link>
  )
}

// Alternative compact version for headers/navbars
export function AdminAccessIcon({ className }: { className?: string }) {
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/admin/check-access')
        const data = await response.json()
        
        if (data.success) {
          setHasAdminAccess(data.hasAdminAccess)
        }
      } catch (error) {
        console.error('Failed to check admin access:', error)
        setHasAdminAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [])

  if (loading || !hasAdminAccess) {
    return null
  }

  return (
    <Link href="/login">
      <Button variant="ghost" size="sm" className={className}>
        <Settings className="h-4 w-4" />
      </Button>
    </Link>
  )
}