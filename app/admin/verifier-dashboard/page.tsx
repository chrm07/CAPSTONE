"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { FileText, CheckCircle, Clock, ArrowRight, Shield, Loader2 } from "lucide-react"

import { getDashboardStatsDb } from "@/lib/storage"

export default function VerifierDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [stats, setStats] = useState({ pendingApplications: 0, approvedApplications: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Security Check: Only allow verifier_staff
    if (user.role !== "admin" || user.adminRole !== "verifier_staff") {
      router.replace("/login")
      return
    }

    const fetchSpecificData = async () => {
      try {
        const fetchedStats = await getDashboardStatsDb()
        setStats(fetchedStats)
      } catch (error) {
        console.error("Failed to fetch staff data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSpecificData()
  }, [user, router])

  if (isLoading || !user) {
    return (
      <AdminLayout>
        <div className="flex h-[50vh] items-center justify-center text-blue-600">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, {user.name}</h1>
            <p className="text-slate-600">Verification Staff Workspace</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Needs Review</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.pendingApplications}</div>
            <p className="text-xs text-slate-600 mt-1">Applications waiting for document verification</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Verified Scholars</CardTitle>
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.approvedApplications}</div>
            <p className="text-xs text-slate-600 mt-1">Successfully approved applications</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100 shadow-md">
        <CardHeader className="bg-blue-50/50 border-b border-blue-100">
          <CardTitle>Your Responsibilities</CardTitle>
          <CardDescription>As a Verifier, your job is to ensure all student submissions are accurate.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-blue-500 shrink-0" /> Review submitted Enrollment Forms and Grades.</li>
            <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-blue-500 shrink-0" /> Cross-check Barangay Clearances with student addresses.</li>
            <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-blue-500 shrink-0" /> Approve valid applications or reject incomplete ones with feedback.</li>
          </ul>
          <Button asChild className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-12 text-lg">
            <Link href="/admin/applications">
              <FileText className="mr-2 h-5 w-5" /> Start Reviewing Applications <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}