"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Eye, EyeOff, GraduationCap, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

// 🔥 NEW: Exact routing logic to their specific dashboards
const getRedirectPath = (userData: any) => {
  if (userData.role === "student") return "/student/dashboard"
  
  // Specific Admin Role Routing
  switch (userData.adminRole) {
    case "scanner_staff":
      return "/admin/scanner-dashboard" 
    case "verifier_staff":
      return "/admin/verifier-dashboard" 
    case "head_admin":
    default:
      return "/admin/dashboard" 
  }
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState({ email: "", password: "" })

  // Redirect if already logged in via session
  useEffect(() => {
    if (user) {
      const path = getRedirectPath(user)
      router.push(path)
    }
  }, [user, router])

  const validateForm = () => {
    const newErrors = { email: "", password: "" }
    if (!email) newErrors.email = "Email is required"
    if (!password) newErrors.password = "Password is required"
    setErrors(newErrors)
    return !newErrors.email && !newErrors.password
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setLoginError("")

    try {
      const loggedInUser = await login(email, password)

      if (!loggedInUser) {
        setLoginError("Invalid email or password. Please try again.")
        setIsLoading(false)
        return
      }

      toast({
        title: "Login successful",
        description: `Welcome back, ${loggedInUser.name}!`,
      })

      // Redirect based on specific admin role
      const dashboardPath = getRedirectPath(loggedInUser)
      router.push(dashboardPath)
      
    } catch (error) {
      setLoginError("An error occurred during login. Please try again.")
      setIsLoading(false)
    }
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Branding Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">BTS Scholarship</h1>
                <p className="text-white/80 text-sm">Municipality of Carmona</p>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">Empowering Students Through Education</h2>
            <p className="text-white/90 text-lg leading-relaxed max-w-md">Access your scholarship portal to manage applications and track your status.</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Shield className="w-6 h-6" /></div>
              <div><h3 className="font-semibold text-lg">Secure Access</h3><p className="text-white/80 text-sm">Industry-standard data protection</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
              <p className="text-slate-600">Sign in to your account</p>
            </div>

            {loginError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{loginError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" disabled={isLoading} />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-12 rounded-xl" disabled={isLoading} />
                  <Button type="button" variant="ghost" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-slate-600">Don&apos;t have an account? <Link href="/register" className="text-green-600 font-semibold">Create account</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}