import { type NextRequest, NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Demo users - in production, use a proper database
const DEMO_USERS = [
  {
    id: "1",
    email: "admin@demo.com",
    password: "password123", // In production, use hashed passwords
    name: "Admin User",
    role: "admin" as const,
  },
  {
    id: "2",
    email: "admin@atrady.com", // Added correct admin email for Atrady business
    password: "atrady123",
    name: "Atrady Admin",
    role: "admin" as const,
  },
]

function createToken(payload: any): string {
  const header = { alg: "HS256", typ: "JWT" }
  const now = Math.floor(Date.now() / 1000)
  const tokenPayload = { ...payload, exp: now + 24 * 60 * 60 } // 24 hours

  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(tokenPayload))
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // Find user (in production, query database with hashed password comparison)
    const user = DEMO_USERS.find((u) => u.email === email && u.password === password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Return user data (excluding password) and token
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
