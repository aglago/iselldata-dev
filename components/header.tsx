"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, X, Wifi, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/auth-store"
import { AdminAccessCheck, AdminAccessIcon } from "@/components/admin-access-check"

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
          <Link href='/' className="flex items-center space-x-2">
            <Wifi className="h-8 w-8" />
            <span className="text-xl font-bold">iSellData</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#packages" className="hover:text-primary-foreground/80 transition-colors">
              Data Packages
            </a>
            <Link href="/track-order" className="hover:text-primary-foreground/80 transition-colors">
              Track Order
            </Link>
            <Link href="/join-as-agent" className="hover:text-primary-foreground/80 transition-colors">
             Join as an agent
            </Link>
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
              <AdminAccessCheck variant="secondary" />
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
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-primary-foreground/20"
            >
              <motion.nav
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex flex-col space-y-4 py-4"
              >
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  href="#packages"
                  className="hover:text-primary-foreground/80 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Data Packages
                </motion.a>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <Link 
                    href="/track-order" 
                    className="hover:text-primary-foreground/80 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Track Order
                  </Link>
                </motion.div>
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  href="/join-as-agent"
                  className="hover:text-primary-foreground/80 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Join as an Agent
                </motion.a>
                <motion.a
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  href="#contact"
                  className="hover:text-primary-foreground/80 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </motion.a>
                {isAuthenticated && user?.role === "admin" ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="flex flex-col space-y-2"
                  >
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="secondary" size="sm" className="w-fit">
                        Dashboard
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleLogout} 
                      className="w-fit bg-transparent"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <AdminAccessCheck variant="secondary" className="w-fit" />
                  </motion.div>
                )}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
