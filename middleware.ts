import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Admin page handles its own authentication via database sessions
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
