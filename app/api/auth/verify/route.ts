import { type NextRequest, NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

function verifyToken(token: string): any {
  try {
    // Simple base64 decode for demo purposes
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1]))

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = verifyToken(token)

      if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }

      // In production, fetch fresh user data from database
      const user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.email === "admin@demo.com" ? "Admin User" : "Ghana Data Admin",
        role: decoded.role,
      }

      return NextResponse.json({
        success: true,
        user,
      })
    } catch (jwtError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
