"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StudentLayout } from "@/components/student-layout"
import { Calendar, Banknote, GraduationCap, MapPin, History as HistoryIcon, ArrowLeft, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

// IMPORT FIRESTORE LOGIC
import { getApplicationsDb, type Application } from "@/lib/storage"

export default function ApplicationHistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      if (user) {
        try {
          // Fetch all applications and filter only the ones belonging to this student
          const allApps = await getApplicationsDb()
          const myApps = allApps
            .filter(app => app.studentId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          
          setHistory(myApps)
        } catch (error) {
          console.error("Failed to fetch history:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchHistory()
  }, [user])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const getStatusIcon = (status: string, isClaimed?: boolean) => {
    if (isClaimed) return <CheckCircle className="h-6 w-6 text-emerald-600" />
    switch (status) {
      case "approved": return <CheckCircle className="h-6 w-6 text-green-600" />
      case "rejected": return <AlertCircle className="h-6 w-6 text-red-600" />
      case "pending": return <Clock className="h-6 w-6 text-amber-600" />
      default: return <GraduationCap className="h-6 w-6 text-slate-600" />
    }
  }

  const getStatusColor = (status: string, isClaimed?: boolean) => {
    if (isClaimed) return "bg-emerald-100"
    switch (status) {
      case "approved": return "bg-green-100"
      case "rejected": return "bg-red-100"
      case "pending": return "bg-amber-100"
      default: return "bg-slate-100"
    }
  }

  const getStatusBadge = (status: string, isClaimed?: boolean) => {
    if (isClaimed) return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 shadow-sm">CLAIMED</Badge>
    switch (status) {
      case "approved": return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 shadow-sm">APPROVED</Badge>
      case "rejected": return <Badge variant="destructive" className="shadow-sm">REJECTED</Badge>
      case "pending": return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 shadow-sm">PENDING</Badge>
      default: return <Badge variant="outline">{status.toUpperCase()}</Badge>
    }
  }

  return (
    <StudentLayout>
      <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full filter blur-[80px] opacity-10 -mr-20 -mt-20"></div>
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shrink-0">
                <HistoryIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Application History</h1>
                <p className="text-slate-500 mt-1">View your past scholarship applications and their outcomes.</p>
              </div>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline" className="flex items-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
            <p className="text-slate-500 font-medium">Loading your history...</p>
          </div>
        ) : history.length === 0 ? (
          <Card className="overflow-hidden border-none shadow-md">
            <div className="h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <CardContent className="flex flex-col items-center justify-center py-16 bg-white">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 mb-4 border-2 border-dashed border-slate-200">
                <GraduationCap className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-900">No Application History</h3>
              <p className="text-slate-500 text-center max-w-md">
                You haven't submitted any scholarship applications yet. Go to your Documents tab to start your first application.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {history.map((app, index) => (
              <Card 
                key={app.id} 
                className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`h-2 ${app.isClaimed ? 'bg-emerald-500' : app.status === 'approved' ? 'bg-green-500' : app.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                
                <CardHeader className="pb-4 bg-white border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-full shrink-0 ${getStatusColor(app.status, app.isClaimed)}`}>
                        {getStatusIcon(app.status, app.isClaimed)}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-900">
                          {app.course}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1.5 text-slate-600 font-medium">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {app.school}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(app.status, app.isClaimed)}
                      <span className="text-xs text-slate-400 font-mono">ID: {app.id}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 bg-slate-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white shadow-sm border border-slate-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date Applied</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDate(app.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* 🔥 THE PHILIPPINE PESO UPDATE IS HERE */}
                    {(app.status === "approved" || app.isClaimed) && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white shadow-sm border border-slate-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 shrink-0">
                          <Banknote className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {app.isClaimed ? "Claimed On" : "Financial Aid"}
                          </p>
                          <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
                            {app.isClaimed ? formatDate(app.claimedAt) : "₱5,000.00 Ready"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white shadow-sm border border-slate-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 shrink-0">
                        <GraduationCap className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year Level</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {app.yearLevel}
                        </p>
                      </div>
                    </div>
                  </div>

                  {app.status === "rejected" && app.feedback && (
                    <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700 leading-relaxed">{app.feedback}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  )
}