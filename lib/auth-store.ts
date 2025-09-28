import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  initialize: () => void
}

const supabase = createClient()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()

        // Store session in Supabase for persistence (fallback gracefully if table doesn't exist)
        try {
          const { error: sessionError } = await supabase
            .from('admin_sessions')
            .upsert({
              admin_id: data.user.id,
              token: data.token,
              user_data: data.user,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }, { onConflict: 'admin_id' })
          
          if (sessionError && sessionError.code !== 'PGRST205') {
            console.error('Error storing session:', sessionError)
          }
        } catch (error) {
          console.error('Error storing session:', error)
        }

        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        })
        
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  },

  logout: async () => {
    console.log("Logout")
    
    // Remove session from database
    const currentUser = get().user
    if (currentUser) {
      try {
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('admin_id', currentUser.id)
      } catch (error) {
        console.error('Error removing session:', error)
      }
    }

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true })
      
      // If we're already authenticated, don't reset the state due to missing table
      const currentState = get()
      
      // Check for valid session in database
      const { data: sessions, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST205') {
          // Table doesn't exist - keep current state if authenticated
          if (currentState.isAuthenticated) {
            set({ isLoading: false })
            return
          }
        } else {
          console.error("Database error checking auth:", error)
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      if (sessions && sessions.length > 0) {
        const session = sessions[0]
        set({
          user: session.user_data,
          token: session.token,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error("Error checking auth:", error)
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      get().checkAuth()
    }
  },
}))

if (typeof window !== "undefined") {
  useAuthStore.getState().initialize()
}
