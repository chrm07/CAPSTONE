"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StudentLayout } from "@/components/student-layout"
import { ApplicationStatus } from "@/components/application-status"
import { useAuth } from "@/contexts/auth-context"

// IMPORT FIRESTORE FUNCTIONS
import {
  getStudentApplicationDb,
  getVerificationSchedulesDb,
  getFinancialDistributionSchedulesDb,
  getDocumentsByStudentIdDb,
  getApplicationHistoryByStudentId,
  hasStudentClaimed,
  getClaimedRecord,
  type StudentProfile,
  type VerificationSchedule,
  type FinancialDistributionSchedule,
  type Application,
} from "@/lib/storage"

import {
  FileText,
  Calendar,
  School,
  ChevronRight,
  Clock,
  History,
  AlertCircle,
  CheckCircle,
  Info,
  DollarSign,
  Wallet,
  XCircle,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function formatDate(dateString: string | undefined): string {
  if (!dateString) return "Not yet"
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function getTimelineSteps(application: Application | null, userId?: string, docCount: number = 0) {
  const steps = [
    {
      id: "submitted",
      title: "Application Submitted",
      description: "Your application has been successfully submitted.",
      status: "pending" as "completed" | "current" | "pending",
      date: "",
    },
    {
      id: "verification",
      title: "Document Verification",
      description: "Your documents are being reviewed by our staff.",
      status: "pending" as "completed" | "current" | "pending",
      date: "",
    },
    {
      id: "approval",
      title: "Application Review",
      description: "Waiting for final review from the scholarship committee.",
      status: "pending" as "completed" | "current" | "pending",
      date: "",
    },
    {
      id: "financial",
      title: "Financial Aid Release",
      description: "Scholarship funds will be released after approval.",
      status: "pending" as "completed" | "current" | "pending",
      date: "",
    },
  ]

  // If 0 documents, override the timeline to show "Action Required"
  if (docCount === 0) {
    steps[0].status = "current"
    steps[0].date = "Action Required"
    steps[0].description = "Please go to the Documents tab to upload your requirements."
    return steps
  }

  if (!application) return steps

  const hasClaimed = userId ? hasStudentClaimed(userId) : false
  const claimedRecord = userId ? getClaimedRecord(userId) : undefined

  steps[0].status = "completed"
  steps[0].date = formatDate(application.submittedAt || application.createdAt)

  if (application.status === "pending") {
    steps[1].status = "current"
    steps[1].date = "In Progress"
  } else if (application.status === "approved") {
    steps[1].status = "completed"
    steps[1].date = "Verified"
    steps[2].status = "completed"
    steps[2].date = formatDate(application.updatedAt)
    steps[2].description = "Your application has been approved by the scholarship committee."
    if (hasClaimed) {
      steps[3].status = "completed"
      steps[3].date = claimedRecord ? formatDate(claimedRecord.odeclaimedAt) : "Claimed"
    } else {
      steps[3].status = "current"
      steps[3].date = "Ready for release"
    }
  } else if (application.status === "rejected") {
    steps[1].status = "completed"
    steps[2].status = "completed"
    steps[2].title = "Application Rejected"
    steps[2].description = application.feedback || "Your application was not approved."
  }

  return steps
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [studentData, setStudentData] = useState({
    id: "", name: "", email: "", course: "", yearLevel: "", school: "",
    applicationStatus: "unsubmitted", 
    semester: "1st Semester", academicYear: "2023-2024", barangay: "",
  })

  const [currentApplication, setCurrentApplication] = useState<Application | null>(null)
  const [applicationHistory, setApplicationHistory] = useState<any[]>([])
  const [documentCount, setDocumentCount] = useState(0) 
  
  const [verificationSchedule, setVerificationSchedule] = useState<VerificationSchedule | null>(null)
  const [scheduleStatus, setScheduleStatus] = useState<"active" | "ended" | "upcoming" | "none">("none")
  const [financialSchedule, setFinancialSchedule] = useState<FinancialDistributionSchedule | null>(null)
  const [financialScheduleStatus, setFinancialScheduleStatus] = useState<"active" | "ended" | "upcoming" | "none">("none")
  
  const [hasClaimed, setHasClaimed] = useState(false)
  const [claimedDate, setClaimedDate] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        const claimed = hasStudentClaimed(user.id)
        setHasClaimed(claimed)
        if (claimed) {
          const record = getClaimedRecord(user.id)
          if (record) setClaimedDate(record.odeclaimedAt)
        }
        
        const history = getApplicationHistoryByStudentId(user.id)
        setApplicationHistory(history)
        const profile = user.profileData as StudentProfile

        try {
          const [latestApplication, docs] = await Promise.all([
            getStudentApplicationDb(user.id),
            getDocumentsByStudentIdDb(user.id)
          ])
          
          const docCount = docs.length
          setDocumentCount(docCount)

          const realStatus = docCount === 0 ? "unsubmitted" : (latestApplication ? latestApplication.status : "unsubmitted")
          const activeBarangay = latestApplication?.barangay || profile?.barangay || ""

          if (latestApplication) {
            setCurrentApplication(latestApplication)
            setStudentData({
              id: user.id,
              name: user.profileData?.fullName || user.name,
              email: user.profileData?.email || user.email,
              course: latestApplication.course || user.profileData?.course || "",
              yearLevel: latestApplication.yearLevel || user.profileData?.yearLevel || "",
              school: latestApplication.school || user.profileData?.schoolName || "",
              applicationStatus: realStatus, 
              semester: "1st Semester",
              academicYear: "2023-2024",
              barangay: activeBarangay,
            })
          } else {
            setCurrentApplication(null)
            setStudentData({
              id: user.id,
              name: user.profileData?.fullName || user.name,
              email: user.profileData?.email || user.email,
              course: user.profileData?.course || "",
              yearLevel: user.profileData?.yearLevel || "",
              school: user.profileData?.schoolName || "",
              applicationStatus: realStatus,
              semester: "1st Semester",
              academicYear: "2023-2024",
              barangay: activeBarangay,
            })
          }

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
            } else { setScheduleStatus("none") }

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
            } else { setFinancialScheduleStatus("none") }
          } else {
            setScheduleStatus("none")
            setFinancialScheduleStatus("none")
          }
        } catch (error) {
          console.error("Dashboard error:", error)
        }
      }
    }
    fetchDashboardData()
  }, [user])

  return (
    <StudentLayout>
      <div className="relative overflow-hidden rounded-xl bg-pattern p-6 mb-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-400 rounded-full filter blur-3xl opacity-10 -mr-20 -mt-20"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back, {studentData.name}</h1>
          <p className="text-gray-600 mt-1">Here's an overview of your scholarship application</p>
        </div>
      </div>

      {hasClaimed && (
        <div className="mb-6 animate-fade-in">
          <Alert className="border-emerald-300 bg-emerald-50">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <AlertTitle className="text-emerald-900 font-semibold">Financial Aid Successfully Claimed</AlertTitle>
            <AlertDescription className="text-emerald-800">
              <div className="mt-2 space-y-2">
                <p>
                  Congratulations! You have successfully received your scholarship financial aid
                  {claimedDate && (
                    <span> on <span className="font-medium">{new Date(claimedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></span>
                  )}.
                </p>
                <p className="mt-3 pt-3 border-t border-emerald-200 text-sm">
                  Thank you for being part of the BTS Scholarship Program. Continue to excel in your studies!
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* VERIFICATION SCHEDULE ALERTS */}
      <div className="mb-6 animate-fade-in">
        {scheduleStatus === "active" && verificationSchedule && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 font-semibold">Document Verification Schedule</AlertTitle>
            <AlertDescription className="text-green-800">
              <div className="mt-2 space-y-2">
                <p className="font-medium">Barangay: <span className="text-green-900">{verificationSchedule.barangay}</span></p>
                <p>Schedule: <span className="font-medium">{new Date(verificationSchedule.startDate).toLocaleDateString()}</span> to <span className="font-medium">{new Date(verificationSchedule.endDate).toLocaleDateString()}</span></p>
                {verificationSchedule.dailyLimit && <p className="text-sm">Daily limit: {verificationSchedule.dailyLimit} students</p>}
                <p className="mt-3 pt-3 border-t border-green-200 text-sm"><strong>Reminder:</strong> Please bring your original documents to the Municipal Hall for verification.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {scheduleStatus === "upcoming" && verificationSchedule && (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">Upcoming Verification Schedule</AlertTitle>
            <AlertDescription className="text-blue-800">
              <div className="mt-2 space-y-2">
                <p className="font-medium">Barangay: <span className="text-blue-900">{verificationSchedule.barangay}</span></p>
                <p>Starts on: <span className="font-medium">{new Date(verificationSchedule.startDate).toLocaleDateString()}</span></p>
                <p>Ends on: <span className="font-medium">{new Date(verificationSchedule.endDate).toLocaleDateString()}</span></p>
                <p className="mt-3 pt-3 border-t border-blue-200 text-sm">Please prepare your original documents for verification.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {scheduleStatus === "ended" && verificationSchedule && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-900 font-semibold">Verification Period Ended</AlertTitle>
            <AlertDescription className="text-amber-800">
              <div className="mt-2 space-y-2">
                <p>The document verification period for <span className="font-medium">{verificationSchedule.barangay}</span> ended on <span className="font-medium">{new Date(verificationSchedule.endDate).toLocaleDateString()}</span>.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {scheduleStatus === "none" && (
          <Alert className="border-gray-200 bg-gray-50">
            <Info className="h-5 w-5 text-gray-600" />
            <AlertTitle className="text-gray-900 font-semibold">Verification Schedule</AlertTitle>
            <AlertDescription className="text-gray-700">
              <p className="mt-2">The document verification schedule for your barangay has not been announced yet. Please check back later.</p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* FINANCIAL DISTRIBUTION SCHEDULE ALERTS */}
      <div className="mb-6 animate-fade-in">
        {financialScheduleStatus === "active" && financialSchedule && (
          <Alert className="border-blue-200 bg-blue-50">
            <Wallet className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">Financial Aid Distribution Schedule</AlertTitle>
            <AlertDescription className="text-blue-800">
              <div className="mt-2 space-y-2">
                <p className="font-medium">Distribution is now active for your barangay</p>
                <p>Start Date: <span className="font-medium">{new Date(financialSchedule.startDate).toLocaleDateString()}</span></p>
                <p>End Date: <span className="font-medium">{new Date(financialSchedule.endDate).toLocaleDateString()}</span></p>
                <p>Time: <span className="font-medium">{financialSchedule.startTime}</span></p>
                <p>Aid Amount: <span className="font-medium text-blue-900">₱{financialSchedule.distributionAmount.toLocaleString()}</span></p>
                <p className="mt-3 pt-3 border-t border-blue-200 text-sm"><strong>Important:</strong> Please proceed to the Municipal Hall at the scheduled time. Bring a valid ID.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {financialScheduleStatus === "upcoming" && financialSchedule && (
          <Alert className="border-indigo-200 bg-indigo-50">
            <DollarSign className="h-5 w-5 text-indigo-600" />
            <AlertTitle className="text-indigo-900 font-semibold">Upcoming Financial Aid Distribution</AlertTitle>
            <AlertDescription className="text-indigo-800">
              <div className="mt-2 space-y-2">
                <p className="font-medium">Get ready! Financial aid distribution is coming soon.</p>
                <p>Starts: <span className="font-medium">{new Date(financialSchedule.startDate).toLocaleDateString()} at {financialSchedule.startTime}</span></p>
                <p>Amount: <span className="font-medium text-indigo-900">₱{financialSchedule.distributionAmount.toLocaleString()}</span></p>
                <p className="mt-3 pt-3 border-t border-indigo-200 text-sm">Mark your calendar! Financial aid will be distributed at the Municipal Hall.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {financialScheduleStatus === "ended" && financialSchedule && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">Financial Aid Distribution Ended</AlertTitle>
            <AlertDescription className="text-orange-800">
              <div className="mt-2 space-y-2">
                <p>The distribution period ended on <span className="font-medium">{new Date(financialSchedule.endDate).toLocaleDateString()}</span>.</p>
                <p className="mt-3 pt-3 border-t border-orange-200 text-sm">If you haven't claimed your aid, please contact the Scholarship Office.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {financialScheduleStatus === "none" && (
          <Alert className="border-gray-200 bg-gray-50">
            <Info className="h-5 w-5 text-gray-600" />
            <AlertTitle className="text-gray-900 font-semibold">Financial Aid Distribution Schedule</AlertTitle>
            <AlertDescription className="text-gray-700">
              <p className="mt-2">The financial aid distribution schedule for your barangay has not been announced yet.</p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="card-hover">
            <Card className="overflow-hidden border border-green-100 shadow-md h-full">
              <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-sm font-medium">Application Status</CardTitle>
                <Badge
                  variant={studentData.applicationStatus === "approved" ? "custom" : "outline"}
                  className={
                    studentData.applicationStatus === "unsubmitted" ? "bg-slate-100 text-slate-500" :
                    studentData.applicationStatus === "approved" ? "bg-green-100 text-green-800" : 
                    "bg-amber-100 text-amber-800 border-amber-200"
                  }
                >
                  {studentData.applicationStatus === "unsubmitted" ? "Not Submitted" : studentData.applicationStatus.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Academic Year</div>
                    <div className="font-medium">{studentData.academicYear}, {studentData.semester}</div>
                  </div>
                </div>
                <ApplicationStatus status={studentData.applicationStatus as any} />
              </CardContent>
            </Card>
          </div>

          <div className="card-hover">
            <Card className="overflow-hidden border border-blue-100 shadow-md h-full">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-white">
                <CardTitle className="text-sm font-medium">Academic Information</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <School className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid gap-3">
                  <div className="flex justify-between items-center p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">School:</span>
                    <span className="text-sm font-medium">{studentData.school || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">Course:</span>
                    <span className="text-sm font-medium">{studentData.course || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">Year Level:</span>
                    <span className="text-sm font-medium">{studentData.yearLevel || "Not provided"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="card-hover">
            <Card className="overflow-hidden border border-amber-100 shadow-md h-full">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader className="bg-gradient-to-r from-amber-50 to-white pb-2">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-sm font-medium">Required Documents</CardTitle></div>
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex flex-col justify-between h-[calc(100%-3rem)]">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uploaded Files</span>
                    <span className="font-medium">{documentCount} / 4</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                    <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${(documentCount / 4) * 100}%` }}></div>
                  </div>
                </div>
                <div className="mt-4 pt-2">
                  <Link href="/student/documents">
                    <Button variant="outline" size="sm" className="w-full group shadow-sm hover:shadow transition-all duration-200">
                      <span>View all documents</span>
                      <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          <div className="card-hover">
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Application Timeline</CardTitle>
                    <CardDescription>Track your scholarship application progress</CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative pl-6 border-l-2 border-green-200">
                  {getTimelineSteps(currentApplication, user?.id, documentCount).map((step, index) => {
                    const isCompleted = step.status === "completed"
                    const isCurrent = step.status === "current"
                    const isPending = step.status === "pending"
                    
                    return (
                      <div key={step.id} className={`mb-8 relative animate-fade-in ${isPending ? "opacity-50" : ""}`}>
                        <div className={`absolute -left-[25px] h-6 w-6 rounded-full flex items-center justify-center shadow-md ${
                            isCompleted ? "bg-green-500" : isCurrent ? "bg-amber-400 animate-pulse" : "bg-muted"
                          }`}
                        >
                          {isCompleted ? <CheckCircle className="h-3 w-3 text-white" /> : <div className="h-2 w-2 rounded-full bg-white"></div>}
                        </div>
                        <div className="pb-2">
                          <h3 className="text-base font-semibold">{step.title}</h3>
                          <p className="text-sm text-muted-foreground">{step.date}</p>
                        </div>
                        <p className="text-sm p-3 rounded-md shadow-sm border bg-white border-gray-100">{step.description}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}