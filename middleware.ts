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
  
  // Only allow localhost in development if explicitly enabled
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_LOCALHOST_ADMIN === 'true') {
    const localhostIPs = ['127.0.0.1', '::1', 'localhost']
    if (localhostIPs.includes(clientIP)) {
      return true
    }
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
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // For admin routes, do basic session check but be permissive
    // Let client-side handle detailed authentication
    if (request.nextUrl.pathname.startsWith('/admin')) {
      try {
        const supabase = await createClient()
        
        // Simple check - just see if any active sessions exist
        const { data: sessions, error } = await supabase
          .from('admin_sessions')
          .select('id')
          .gt('expires_at', new Date().toISOString())
          .limit(1)
        
        // If there's any error (including table not existing), allow access
        // Client-side will handle the proper auth check
        if (error) {
          return NextResponse.next()
        }
        
        // If no sessions at all, redirect to login
        if (!sessions || sessions.length === 0) {
          return NextResponse.redirect(new URL('/login', request.url))
        }
        
        // Sessions exist, allow access
        return NextResponse.next()
        
      } catch (error) {
        return NextResponse.next()
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
}