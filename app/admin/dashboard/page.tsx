"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { FileText, Clock, LayoutDashboard, CheckCircle, XCircle, Calendar, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

// Import the Firestore functions
import { getDashboardStatsDb, getRecentApplicationsDb } from "@/lib/storage"

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ totalApplications: 0, pendingApplications: 0, approvedApplications: 0, rejectedApplications: 0 })
  const [recentApplications, setRecentApplications] = useState<any[]>([])

  // 🔥 THE BOUNCER: Security Check & Redirection
  useEffect(() => {
    // Wait until the user object is fully loaded
    if (user) {
      if (user.role === "admin") {
        if (user.adminRole === "scanner_staff") {
          router.replace("/admin/verification")
        } else if (user.adminRole === "verifier_staff") {
          router.replace("/admin/applications")
        } else if (user.adminRole === "head_admin") {
          // If they are a Head Admin, allow them to stay and fetch the data
          fetchDashboardData()
        }
      } else {
        // If a student somehow gets here, send them back
        router.replace("/student/dashboard")
      }
    }
  }, [user, router])

  // Only run this if the Bouncer approves them
  const fetchDashboardData = async () => {
    try {
      const [fetchedStats, fetchedApps] = await Promise.all([
        getDashboardStatsDb(),
        getRecentApplicationsDb(10)
      ])
      setStats(fetchedStats)
      setRecentApplications(fetchedApps)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to format dates safely
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  // 🔥 SECURITY WALL: Show a loading screen until we confirm they are a Head Admin
  if (isLoading || !user || user.adminRole !== "head_admin") {
    return (
      <AdminLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-emerald-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Verifying permissions...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-600">Manage scholarship applications and monitor program statistics</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Total Applications</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200/50">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.totalApplications}</div>
              <p className="text-xs text-slate-600 mt-1">Total scholarship applications</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Pending Applications</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200/50">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.pendingApplications}</div>
              <p className="text-xs text-slate-600 mt-1">
                {stats.totalApplications > 0
                  ? Math.round((stats.pendingApplications / stats.totalApplications) * 100)
                  : 0}
                % of total applications
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Approved Scholars</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-200/50">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.approvedApplications}</div>
              <p className="text-xs text-slate-600 mt-1">
                {stats.totalApplications > 0
                  ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
                  : 0}
                % approval rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm border border-slate-200">
                <Calendar className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Recent Applications</CardTitle>
                <CardDescription className="text-slate-600">
                  Latest scholarship applications with submission dates and times
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {application.status === "approved" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : application.status === "rejected" ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{application.fullName}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span>{application.course}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{application.school}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{application.yearLevel}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-900">
                          {formatDate(application.createdAt)}
                        </div>
                        <div className="text-xs text-slate-500">{application.barangay}</div>
                      </div>
                      
                      <Badge 
                        variant={application.status === "approved" ? "success" : application.status === "rejected" ? "destructive" : "outline"}
                        className={application.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                      >
                        {application.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No applications yet</h3>
                  <p>Applications will appear here once students submit them.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}