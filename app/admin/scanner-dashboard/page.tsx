"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle, QrCode, Wallet, ArrowRight, AlertCircle, Loader2 } from "lucide-react"

import { getFinancialDistributionSchedulesDb } from "@/lib/storage"

export default function ScannerDashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [activeSchedule, setActiveSchedule] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Security Check: Only allow scanner_staff
    if (user.role !== "admin" || user.adminRole !== "scanner_staff") {
      router.replace("/login")
      return
    }

    const fetchSpecificData = async () => {
      try {
        const schedules = await getFinancialDistributionSchedulesDb()
        const now = new Date()
        const active = schedules.find((s) => {
          const end = new Date(s.endDate)
          end.setHours(23, 59, 59, 999)
          return new Date(s.startDate) <= now && now <= end
        })
        setActiveSchedule(active)
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
        <div className="flex h-[50vh] items-center justify-center text-green-600">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 shadow-sm">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome, {user.name}</h1>
            <p className="text-slate-600">QR Verification Staff Workspace</p>
          </div>
        </div>
      </div>

      {activeSchedule ? (
        <Card className="border-green-200 shadow-md bg-green-50/30 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-800">Active Distribution Event</CardTitle>
                <CardDescription className="text-green-600 mt-1">Financial aid distribution is currently ongoing.</CardDescription>
              </div>
              <Badge className="bg-green-500 animate-pulse">LIVE</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Barangays:</span> <span className="font-medium">{activeSchedule.barangays.join(", ")}</span></div>
              <div><span className="text-slate-500">Amount:</span> <span className="font-medium text-green-700">₱{activeSchedule.distributionAmount}</span></div>
              <div><span className="text-slate-500">End Date:</span> <span className="font-medium">{new Date(activeSchedule.endDate).toLocaleDateString()}</span></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 shadow-md bg-amber-50/30 mb-6">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800 font-medium">There are no financial distribution events scheduled for today.</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-emerald-100 shadow-md">
        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
          <CardTitle>Your Responsibilities</CardTitle>
          <CardDescription>As a Scanner, your job is to securely check-in scholars during distribution events.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3"><Wallet className="h-5 w-5 text-emerald-500 shrink-0" /> Verify student identities at the Municipal Hall.</li>
            <li className="flex items-start gap-3"><QrCode className="h-5 w-5 text-emerald-500 shrink-0" /> Scan their unique QR Codes to pull up their approved applications.</li>
            <li className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /> Mark their financial aid as "Claimed" in the database.</li>
          </ul>
          <Button asChild className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-12 text-lg">
            <Link href="/admin/verification">
              <QrCode className="mr-2 h-5 w-5" /> Open QR Scanner <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}