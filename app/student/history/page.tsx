"use client"

import { useAuth } from "@/contexts/auth-context"
import { getApplicationHistoryByStudentId } from "@/lib/storage"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, DollarSign, GraduationCap, MapPin, History, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ApplicationHistoryPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading application history...</p>
        </div>
      </div>
    )
  }

  const applicationHistory = getApplicationHistoryByStudentId(user.id)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-xl bg-pattern p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400 rounded-full filter blur-3xl opacity-10 -mr-20 -mt-20"></div>
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600">
            <History className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Application History</h1>
            <p className="text-gray-600 mt-1">View your completed scholarship applications and their outcomes.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Link href="/student/dashboard">
          <Button
            variant="outline"
            className="flex items-center gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {applicationHistory.length === 0 ? (
        <div className="card-hover">
          <Card className="overflow-hidden border border-green-100 shadow-md">
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600"></div>
            <CardContent className="flex flex-col items-center justify-center py-12 bg-gradient-to-r from-green-50 to-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <GraduationCap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">No Application History</h3>
              <p className="text-gray-600 text-center max-w-md">
                You haven't completed any scholarship applications yet. Once you complete an application and receive
                financial aid, it will appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6">
          {applicationHistory.map((historyItem, index) => (
            <div
              key={historyItem.id}
              className="card-hover animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Card className="overflow-hidden border border-green-100 shadow-md">
                <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600"></div>
                <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          historyItem.outcome === "approved" ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        <GraduationCap
                          className={`h-6 w-6 ${
                            historyItem.outcome === "approved" ? "text-green-600" : "text-red-600"
                          }`}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900">
                          {historyItem.applicationData.course} - {historyItem.applicationData.yearLevel}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {historyItem.applicationData.schoolName}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={historyItem.outcome === "approved" ? "custom" : "destructive"}
                      className={
                        historyItem.outcome === "approved"
                          ? "bg-green-100 text-green-800 hover:bg-green-200 shadow-sm"
                          : "shadow-sm"
                      }
                    >
                      {historyItem.outcome === "approved" ? "Approved" : "Rejected"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm border border-gray-100">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Completed</p>
                        <p className="text-sm text-gray-600">
                          {new Date(historyItem.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {historyItem.financialAidAmount && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm border border-gray-100">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                          <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Financial Aid</p>
                          <p className="text-sm font-semibold text-green-600">
                            ₱{historyItem.financialAidAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm border border-gray-100">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Academic Year</p>
                        <p className="text-sm text-gray-600">
                          {historyItem.applicationData.academicYear || "2024-2025"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {historyItem.notes && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                        <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-slate-500"></div>
                          </div>
                          Notes
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{historyItem.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
