import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'
import bcrypt from "bcrypt"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"

// Using database authentication with hashed passwords

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

    // Get user from database
    const supabase = await createClient()
    console.log('🔍 Looking for user with email:', email)
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .single()

    console.log('🔍 Database query result:', { user: user ? 'found' : 'not found', error: error?.message })

    if (error || !user) {
      console.log('❌ User not found in database')
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check if password_hash exists
    if (!user.password_hash) {
      console.log('❌ User found but no password_hash')
      return NextResponse.json({ error: "User not properly configured" }, { status: 401 })
    }

    console.log('🔍 User found, verifying password...')
    console.log('🔍 Password hash exists:', user.password_hash ? 'yes' : 'no')
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    console.log('🔍 Password match result:', passwordMatch)
    
    if (!passwordMatch) {
      console.log('❌ Password does not match')
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Return user data (excluding password_hash) and token
    const { password_hash: _, ...userWithoutPassword } = user

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
