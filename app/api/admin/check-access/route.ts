import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    const hasAdminAccess = isIPWhitelisted(clientIP)
    
    // Check if admin access is enabled
    const adminEnabled = process.env.NODE_ENV === 'development' || process.env.ADMIN_ACCESS_ENABLED === 'true'
    
    return NextResponse.json({
      success: true,
      hasAdminAccess: hasAdminAccess && adminEnabled,
      clientIP: clientIP,
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Admin access check error:', error)
    return NextResponse.json({
      success: false,
      hasAdminAccess: false,
      message: 'Failed to check admin access'
    }, { status: 500 })
  }
}