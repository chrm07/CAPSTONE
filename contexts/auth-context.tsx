"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession, signIn, signOut, SessionProvider } from "next-auth/react"
import { getUserByEmailDb, type User } from "@/lib/storage"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<User | null>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Map session user to our local User type
  const user = session?.user ? (session.user as any) : null
  const isLoading = status === "loading" || !mounted

  useEffect(() => {
    setMounted(true)
  }, [])

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        return null
      }

      // FETCH REAL USER DATA: This ensures we get the correct role from Firestore
      const dbUser = await getUserByEmailDb(email)
      return dbUser
    } catch (error) {
      console.error("Login error:", error)
      return null
    }
  }

  const logout = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }
  }

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}