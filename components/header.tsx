"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Wifi, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth-store"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Wifi className="h-8 w-8" />
            <span className="text-xl font-bold">ATRADY</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#packages" className="hover:text-primary-foreground/80 transition-colors">
              Data Packages
            </a>
            <a href="#features" className="hover:text-primary-foreground/80 transition-colors">
              Features
            </a>
            <a href="#contact" className="hover:text-primary-foreground/80 transition-colors">
              Contact
            </a>
            {isAuthenticated && user?.role === "admin" ? (
              <div className="flex items-center space-x-4">
                <Link href="/admin">
                  <Button variant="secondary" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Admin Login
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-primary-foreground hover:text-primary-foreground/80"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-foreground/20">
            <nav className="flex flex-col space-y-4">
              <a href="#packages" className="hover:text-primary-foreground/80 transition-colors">
                Data Packages
              </a>
              <a href="#features" className="hover:text-primary-foreground/80 transition-colors">
                Features
              </a>
              <a href="#contact" className="hover:text-primary-foreground/80 transition-colors">
                Contact
              </a>
              {isAuthenticated && user?.role === "admin" ? (
                <div className="flex flex-col space-y-2">
                  <Link href="/admin">
                    <Button variant="secondary" size="sm" className="w-fit">
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-fit bg-transparent">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="secondary" size="sm" className="w-fit">
                    Admin Login
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
