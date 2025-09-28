import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

function getClientIP(request: NextRequest): string {
  // Try different headers to get the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (real) {
    return real.trim()
  }
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }
  
  return request.ip || '127.0.0.1'
}

function isIPWhitelisted(clientIP: string): boolean {
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || []
  
  // Always allow localhost for development
  const localhostIPs = ['127.0.0.1', '::1', 'localhost']
  if (process.env.NODE_ENV === 'development' && localhostIPs.includes(clientIP)) {
    return true
  }
  
  return allowedIPs.includes(clientIP)
}

export async function middleware(request: NextRequest) {
  const clientIP = getClientIP(request)
  
  // Protect admin routes with IP whitelisting and authentication
  if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/login')) {
    // Check if admin access is enabled (useful for production)
    if (process.env.NODE_ENV === 'production' && process.env.ADMIN_ACCESS_ENABLED !== 'true') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // IP Whitelist check
    if (!isIPWhitelisted(clientIP)) {
      console.log(`Admin access denied for IP: ${clientIP}`)
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    console.log(`Admin access allowed for whitelisted IP: ${clientIP}`)
    
    // Only check authentication for admin routes, not login
    if (request.nextUrl.pathname.startsWith('/admin')) {
      try {
      const supabase = await createClient()
      
      // Check for valid admin session
      const { data: sessions, error } = await supabase
        .from('admin_sessions')
        .select(`
          *,
          admin_users (
            email,
            role,
            is_active
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .eq('admin_users.is_active', true)
        .eq('admin_users.role', 'admin')
      
      if (error || !sessions || sessions.length === 0) {
        // No valid session found, redirect to login
        return NextResponse.redirect(new URL('/login', request.url))
      }
      
      // Valid admin session found, allow access
      return NextResponse.next()
      
    } catch (error) {
      console.error('Admin middleware error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}
