"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StudentLayout } from "@/components/student-layout"
import { ApplicationStatus, type DerivedAppStatus } from "@/components/application-status"
import { useAuth } from "@/contexts/auth-context"

// IMPORT FIRESTORE FUNCTIONS (Removed the old stubs!)
import {
  getStudentApplicationDb,
  getVerificationSchedulesDb,
  getFinancialDistributionSchedulesDb,
  getDocumentsByStudentIdDb,
  type StudentProfile,
  type VerificationSchedule,
  type FinancialDistributionSchedule,
  type Application,
  type Document
} from "@/lib/storage"

import {
  Calendar, School, ChevronRight, Clock, AlertCircle, CheckCircle, Info, DollarSign, Wallet, FileText
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// ==========================================
// CORE VALIDATION LOGIC
// ==========================================
const REQUIRED_DOC_TYPES = [
  "Enrollment Form", 
  "Grades", 
  "School ID", 
  "Barangay Clearance"
]

function checkDocumentCompletion(docs: Document[]) {
  const uploadedNames = new Set(docs.map(d => d.name))
  const uploadedRequiredCount = REQUIRED_DOC_TYPES.filter(req => uploadedNames.has(req)).length
  return {
    uploadedCount: uploadedRequiredCount,
    totalRequired: REQUIRED_DOC_TYPES.length,
    isComplete: uploadedRequiredCount === REQUIRED_DOC_TYPES.length
  }
}

function deriveApplicationStatus(
  application: Application | null, 
  docsComplete: boolean, 
  uploadedCount: number
): DerivedAppStatus {
  if (application) {
    if (application.status === "approved") return "approved"
    if (application.status === "rejected") return "rejected"
    if (application.status === "pending") return "submitted"
  }
  
  if (uploadedCount === 0) return "not_started"
  if (!docsComplete) return "incomplete"
  return "ready_to_submit"
}

// ------------------------------------------
// TIMELINE LOGIC 
// ------------------------------------------
function getTimelineSteps(status: DerivedAppStatus, application: Application | null) {
  const steps = [
    {
      id: "submitted",
      title: "Application Submitted",
      description: "Your application has been successfully submitted.",
      state: "pending" as "completed" | "current" | "pending" | "action_needed",
      date: "",
    },
    {
      id: "verification",
      title: "Document Verification",
      description: "Your documents are being reviewed by our staff.",
      state: "pending" as "completed" | "current" | "pending" | "action_needed",
      date: "",
    },
    {
      id: "approval",
      title: "Application Review",
      description: "Waiting for final review from the scholarship committee.",
      state: "pending" as "completed" | "current" | "pending" | "action_needed",
      date: "",
    },
    {
      id: "financial",
      title: "Financial Aid Release",
      description: "Scholarship funds will be released after approval.",
      state: "pending" as "completed" | "current" | "pending" | "action_needed",
      date: "",
    },
  ]

  if (status === "not_started" || status === "incomplete") {
    steps[0].state = "action_needed"
    steps[0].title = "Documents Required"
    steps[0].description = "Please go to the Documents tab to upload your requirements."
    return steps
  }

  if (status === "ready_to_submit") {
    steps[0].state = "action_needed"
    steps[0].title = "Ready to Submit"
    steps[0].description = "All documents uploaded. Please submit your application from the Documents tab."
    return steps
  }

  if (!application) return steps

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  steps[0].state = "completed"
  steps[0].date = formatDate(application.submittedAt || application.createdAt)

  if (application.status === "pending") {
    steps[1].state = "current"
    steps[1].date = "In Progress"
  } else if (application.status === "approved") {
    steps[1].state = "completed"
    steps[1].date = "Verified"
    steps[2].state = "completed"
    steps[2].date = formatDate(application.updatedAt)
    steps[2].description = "Your application has been approved by the scholarship committee."
    
    // 🔥 NEW: Check if claimed directly from application!
    if (application.isClaimed) {
      steps[3].state = "completed"
      steps[3].date = formatDate(application.claimedAt)
      steps[3].description = "Congratulations! You have successfully received your scholarship funds."
    } else {
      steps[3].state = "current"
      steps[3].date = "Ready for release"
    }
  } else if (application.status === "rejected") {
    steps[1].state = "completed"
    steps[2].state = "completed"
    steps[2].title = "Application Rejected"
    steps[2].description = application.feedback || "Your application was not approved."
  }

  return steps
}

export default function StudentDashboard() {
  const { user } = useAuth()
  
  // States
  const [studentData, setStudentData] = useState<any>(null)
  const [derivedStatus, setDerivedStatus] = useState<DerivedAppStatus>("not_started")
  const [docProgress, setDocProgress] = useState({ uploadedCount: 0, totalRequired: 4 })
  const [currentApp, setCurrentApp] = useState<Application | null>(null)
  
  // Schedules
  const [verificationSchedule, setVerificationSchedule] = useState<VerificationSchedule | null>(null)
  const [scheduleStatus, setScheduleStatus] = useState<"active" | "ended" | "upcoming" | "none">("none")
  const [financialSchedule, setFinancialSchedule] = useState<FinancialDistributionSchedule | null>(null)
  const [financialScheduleStatus, setFinancialScheduleStatus] = useState<"active" | "ended" | "upcoming" | "none">("none")

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      try {
        const [latestApplication, docs] = await Promise.all([
          getStudentApplicationDb(user.id),
          getDocumentsByStudentIdDb(user.id)
        ])

        setCurrentApp(latestApplication)

        const validation = checkDocumentCompletion(docs)
        setDocProgress({ uploadedCount: validation.uploadedCount, totalRequired: validation.totalRequired })

        const status = deriveApplicationStatus(latestApplication, validation.isComplete, validation.uploadedCount)
        setDerivedStatus(status)

        const profile = user.profileData as StudentProfile
        const activeBarangay = latestApplication?.barangay || profile?.barangay || ""

        setStudentData({
          id: user.id,
          name: profile?.fullName || user.name,
          course: latestApplication?.course || profile?.course || "Not specified",
          yearLevel: latestApplication?.yearLevel || profile?.yearLevel || "Not specified",
          school: latestApplication?.school || profile?.schoolName || "Not specified",
          academicYear: "2023-2024",
          semester: "1st Semester",
          barangay: activeBarangay,
        })

        if (activeBarangay) {
          const vSchedules = await getVerificationSchedulesDb()
          const matchingVSchedule = vSchedules.find((s) => s.barangay === activeBarangay)
          if (matchingVSchedule) {
            setVerificationSchedule(matchingVSchedule)
            const now = new Date()
            const start = new Date(matchingVSchedule.startDate)
            const end = new Date(matchingVSchedule.endDate)
            end.setHours(23, 59, 59, 999)
            if (now < start) setScheduleStatus("upcoming")
            else if (now > end) setScheduleStatus("ended")
            else setScheduleStatus("active")
          }

          const fSchedules = await getFinancialDistributionSchedulesDb()
          const matchingFSchedule = fSchedules.find((s) => s.barangays.includes(activeBarangay))
          if (matchingFSchedule) {
            setFinancialSchedule(matchingFSchedule)
            const now = new Date()
            const start = new Date(matchingFSchedule.startDate)
            const end = new Date(matchingFSchedule.endDate)
            end.setHours(23, 59, 59, 999)
            if (now < start) setFinancialScheduleStatus("upcoming")
            else if (now > end) setFinancialScheduleStatus("ended")
            else setFinancialScheduleStatus("active")
          }
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error)
      }
    }
    fetchDashboardData()
  }, [user])

  const getBadgeConfig = () => {
    // 🔥 NEW: Show CLAIMED badge if application is claimed!
    if (currentApp?.isClaimed) return { label: "CLAIMED", className: "bg-emerald-100 text-emerald-700 border-emerald-200" }

    switch (derivedStatus) {
      case "not_started": return { label: "NOT SUBMITTED", className: "bg-slate-100 text-slate-500 border-slate-200" }
      case "incomplete": return { label: "INCOMPLETE DOCS", className: "bg-amber-100 text-amber-700 border-amber-200" }
      case "ready_to_submit": return { label: "READY TO SUBMIT", className: "bg-blue-100 text-blue-700 border-blue-200" }
      case "submitted": return { label: "UNDER REVIEW", className: "bg-orange-100 text-orange-700 border-orange-200" }
      case "approved": return { label: "APPROVED", className: "bg-green-100 text-green-700 border-green-200" }
      case "rejected": return { label: "REJECTED", className: "bg-red-100 text-red-700 border-red-200" }
      default: return { label: "UNKNOWN", className: "bg-slate-100" }
    }
  }

  if (!studentData) return null 

  const badgeConfig = getBadgeConfig()

  return (
    <StudentLayout>
      <div className="relative overflow-hidden rounded-xl bg-pattern p-6 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400 rounded-full filter blur-3xl opacity-10 -mr-20 -mt-20"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back, {studentData.name}</h1>
          <p className="text-gray-600 mt-1">Here's an overview of your scholarship application</p>
        </div>
      </div>

      {/* 🔥 THE NEW CLAIMED BANNER */}
      {currentApp?.isClaimed && (
        <div className="mb-6 animate-fade-in">
          <Alert className="border-emerald-300 bg-emerald-50">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-900 font-semibold">Financial Aid Successfully Claimed</AlertTitle>
            <AlertDescription className="text-emerald-800">
              <div className="mt-2 space-y-2">
                <p>
                  Congratulations! You have successfully received your scholarship financial aid on{" "}
                  <span className="font-medium">
                    {new Date(currentApp.claimedAt!).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>.
                </p>
                <p className="mt-3 pt-3 border-t border-emerald-200 text-sm">
                  Thank you for being part of the BTS Scholarship Program. Continue to excel in your studies!
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* SCHEDULE ALERTS (Unchanged) */}
      <div className="mb-6 animate-fade-in">
        {scheduleStatus === "active" && verificationSchedule && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 font-semibold">Document Verification Schedule</AlertTitle>
            <AlertDescription className="text-green-800">
              <div className="mt-2 space-y-2">
                <p className="font-medium">Barangay: <span className="text-green-900">{verificationSchedule.barangay}</span></p>
                <p>Schedule: <span className="font-medium">{new Date(verificationSchedule.startDate).toLocaleDateString()}</span> to <span className="font-medium">{new Date(verificationSchedule.endDate).toLocaleDateString()}</span></p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
           
           {/* Application Status Card */}
           <Card className="overflow-hidden border border-slate-200 shadow-md h-full">
              <div className={`h-1.5 ${
                currentApp?.isClaimed ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
                derivedStatus === "approved" ? "bg-gradient-to-r from-green-400 to-green-600" :
                derivedStatus === "rejected" ? "bg-gradient-to-r from-red-400 to-red-600" :
                "bg-gradient-to-r from-slate-400 to-slate-600"
              }`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Application Status</CardTitle>
                <Badge variant="outline" className={badgeConfig.className}>
                  {badgeConfig.label}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Academic Year</div>
                    <div className="font-medium">{studentData.academicYear}, {studentData.semester}</div>
                  </div>
                </div>
                <ApplicationStatus status={derivedStatus} />
              </CardContent>
            </Card>

            {/* Academic Info */}
            <Card className="overflow-hidden border border-blue-100 shadow-md h-full">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Academic Information</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <School className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">School:</span>
                    <span className="text-sm font-medium truncate ml-4 max-w-[150px]">{studentData.school}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">Course:</span>
                    <span className="text-sm font-medium truncate ml-4 max-w-[150px]">{studentData.course}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">Year Level:</span>
                    <span className="text-sm font-medium">{studentData.yearLevel}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Required Documents */}
            <Card className="overflow-hidden border border-amber-100 shadow-md h-full flex flex-col">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploaded Files</span>
                    <span className="font-medium">{docProgress.uploadedCount} / {docProgress.totalRequired}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all" 
                      style={{ width: `${(docProgress.uploadedCount / docProgress.totalRequired) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 flex-1">
                  {derivedStatus === "not_started" ? "You have not uploaded any requirements yet." :
                   derivedStatus === "incomplete" ? "You are missing some required documents." :
                   derivedStatus === "ready_to_submit" ? "All documents uploaded. Please submit your application." :
                   "Your documents are locked while under review."}
                </p>

                <Link href="/student/documents" className="mt-auto">
                  <Button variant={derivedStatus === "ready_to_submit" ? "default" : "outline"} className="w-full group">
                    <span>{derivedStatus === "submitted" || derivedStatus === "approved" ? "View Documents" : "Manage Documents"}</span>
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
        </div>

        {/* TIMELINE */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Application Timeline</CardTitle>
                  <CardDescription>Track your progress</CardDescription>
                </div>
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative pl-6 border-l-2 border-slate-200">
                {getTimelineSteps(derivedStatus, currentApp).map((step, index) => (
                  <div key={step.id} className={`mb-8 relative animate-fade-in ${step.state === "pending" ? "opacity-50" : ""}`}>
                    <div className={`absolute -left-[25px] h-6 w-6 rounded-full flex items-center justify-center shadow-md ${
                      step.state === "completed" ? "bg-green-500" : 
                      step.state === "current" ? "bg-amber-400 animate-pulse" : 
                      step.state === "action_needed" ? "bg-blue-500 animate-pulse" : "bg-slate-300"
                    }`}>
                      {step.state === "completed" ? <CheckCircle className="h-3 w-3 text-white" /> : <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    <div className="pb-1">
                      <h3 className="text-base font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.date}</p>
                    </div>
                    <p className={`text-sm p-3 rounded-md border ${
                       step.state === "action_needed" ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-white border-gray-100"
                    }`}>{step.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StudentLayout>
  )
}