import { create } from "zustand"

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
  logout: () => void
  checkAuth: () => void
  initialize: () => void
}

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document !== "undefined") {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }
}

const removeCookie = (name: string) => {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      console.log("Login attempt:", { email, password })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      console.log("Login response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Login successful:", data)

        localStorage.setItem("auth-token", data.token)
        localStorage.setItem("auth-user", JSON.stringify(data.user))
        setCookie("auth-token", data.token)

        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
        })

        console.log("Auth state updated successfully")
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  },

  logout: () => {
    console.log("Logout")
    localStorage.removeItem("auth-token")
    localStorage.removeItem("auth-user")
    removeCookie("auth-token")

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  checkAuth: () => {
    const token = localStorage.getItem("auth-token")
    const userStr = localStorage.getItem("auth-user")

    console.log("Checking auth - token exists:", !!token)

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        console.log("Restoring auth from localStorage:", { user, hasToken: !!token })

        setCookie("auth-token", token)

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("auth-token")
        localStorage.removeItem("auth-user")
        removeCookie("auth-token")
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } else {
      console.log("No stored auth found")
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  initialize: () => {
    console.log("Initializing auth store")
    get().checkAuth()
  },
}))

if (typeof window !== "undefined") {
  useAuthStore.getState().initialize()
}
