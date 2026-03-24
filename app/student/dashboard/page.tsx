"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StudentLayout } from "@/components/student-layout"
import { ApplicationStatus } from "@/components/application-status"
import { useAuth } from "@/contexts/auth-context"
import {
  getApplicationsByStudentId,
  getDocumentsByStudentId,
  getApplicationHistoryByStudentId,
  getVerificationSchedules,
  getFinancialDistributionScheduleForBarangay,
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
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getTimelineSteps(application: Application | null, userId?: string) {
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

  if (!application) {
    // No application yet - all steps pending
    return steps
  }

  // Check if student has claimed their financial aid
  const hasClaimed = userId ? hasStudentClaimed(userId) : false
  const claimedRecord = userId ? getClaimedRecord(userId) : undefined

  // Step 1: Application Submitted - always completed if application exists
  steps[0].status = "completed"
  steps[0].date = formatDate(application.submittedAt || application.createdAt)

  if (application.status === "pending") {
    // Application is pending - verification is in progress
    steps[1].status = "current"
    steps[1].date = "In Progress"
    steps[2].status = "pending"
    steps[2].date = "Pending"
    steps[3].status = "pending"
    steps[3].date = "Pending"
  } else if (application.status === "approved") {
    // Application approved
    steps[1].status = "completed"
    steps[1].date = "Verified"
    steps[2].status = "completed"
    steps[2].date = formatDate(application.updatedAt)
    steps[2].description = "Your application has been approved by the scholarship committee."
    
    if (hasClaimed) {
      // Financial aid has been claimed
      steps[3].status = "completed"
      steps[3].date = claimedRecord ? formatDate(claimedRecord.odeclaimedAt) : "Claimed"
      steps[3].title = "Financial Aid Claimed"
      steps[3].description = "Congratulations! You have successfully received your scholarship funds."
    } else {
      // Approved but not yet claimed
      steps[3].status = "current"
      steps[3].date = "Ready for release"
      steps[3].description = "You are eligible to receive your scholarship funds during the distribution schedule."
    }
  } else if (application.status === "rejected") {
    // Application rejected
    steps[1].status = "completed"
    steps[1].date = "Reviewed"
    steps[2].status = "completed"
    steps[2].date = formatDate(application.updatedAt)
    steps[2].title = "Application Rejected"
    steps[2].description =
      application.feedback || "Your application was not approved. Please contact the office for more information."
    steps[3].status = "pending"
    steps[3].date = "N/A"
  }

  return steps
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [studentData, setStudentData] = useState({
    id: "",
    name: "",
    email: "",
    course: "",
    yearLevel: "",
    school: "",
    applicationStatus: "pending",
    semester: "1st Semester",
    academicYear: "2023-2024",
    barangay: "",
  })

  const [currentApplication, setCurrentApplication] = useState<Application | null>(null)
  const [applicationHistory, setApplicationHistory] = useState([])
  const [verificationSchedule, setVerificationSchedule] = useState<VerificationSchedule | null>(null)
  const [scheduleStatus, setScheduleStatus] = useState<"active" | "ended" | "upcoming" | "none">("none")
  const [financialSchedule, setFinancialSchedule] = useState<FinancialDistributionSchedule | null>(null)
  const [financialScheduleStatus, setFinancialScheduleStatus] = useState<"active" | "ended" | "upcoming" | "none">(
    "none",
  )
  const [hasClaimed, setHasClaimed] = useState(false)
  const [claimedDate, setClaimedDate] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      // Check if student has claimed their financial aid
      const claimed = hasStudentClaimed(user.id)
      setHasClaimed(claimed)
      if (claimed) {
        const record = getClaimedRecord(user.id)
        if (record) {
          setClaimedDate(record.odeclaimedAt)
        }
      }
      
      // Get student application data
      const applications = getApplicationsByStudentId(user.id)
      const documents = getDocumentsByStudentId(user.id)
      const history = getApplicationHistoryByStudentId(user.id)
      setApplicationHistory(history)

      // Get student's barangay from profile
      const profile = user.profileData as StudentProfile
      const studentBarangay = profile?.barangay || ""

      if (applications.length > 0) {
        const latestApplication = applications[applications.length - 1]
        setCurrentApplication(latestApplication)
        setStudentData({
          id: user.id,
          name: user.profileData?.fullName || user.name,
          email: user.profileData?.email || user.email,
          course: latestApplication.course || user.profileData?.course || "",
          yearLevel: latestApplication.yearLevel || user.profileData?.yearLevel || "",
          school: latestApplication.school || user.profileData?.schoolName || "",
          applicationStatus: latestApplication.status,
          semester: "1st Semester",
          academicYear: "2023-2024",
          barangay: studentBarangay,
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
          applicationStatus: "pending",
          semester: "1st Semester",
          academicYear: "2023-2024",
          barangay: studentBarangay,
        })
      }

      if (studentBarangay) {
        const schedules = getVerificationSchedules()
        const matchingSchedule = schedules.find((schedule) => schedule.barangay === studentBarangay)

        if (matchingSchedule) {
          setVerificationSchedule(matchingSchedule)

          // Determine current status based on dates
          const now = new Date()
          const start = new Date(matchingSchedule.startDate)
          const end = new Date(matchingSchedule.endDate)

          if (now < start) {
            setScheduleStatus("upcoming")
          } else if (now > end) {
            setScheduleStatus("ended")
          } else {
            setScheduleStatus("active")
          }
        } else {
          setScheduleStatus("none")
        }

        const financialDistributionSchedule = getFinancialDistributionScheduleForBarangay(studentBarangay)

        if (financialDistributionSchedule) {
          setFinancialSchedule(financialDistributionSchedule)

          // Determine current status based on dates
          const now = new Date()
          const start = new Date(financialDistributionSchedule.startDate)
          const end = new Date(financialDistributionSchedule.endDate)

          if (now < start) {
            setFinancialScheduleStatus("upcoming")
          } else if (now > end) {
            setFinancialScheduleStatus("ended")
          } else {
            setFinancialScheduleStatus("active")
          }
        } else {
          setFinancialScheduleStatus("none")
        }
      }
    }
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
                    <span>
                      {" "}on{" "}
                      <span className="font-medium">
                        {new Date(claimedDate).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </span>
                  )}
                  .
                </p>
                <p className="mt-3 pt-3 border-t border-emerald-200 text-sm">
                  Thank you for being part of the BTS Scholarship Program. Continue to excel in your studies!
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="mb-6 animate-fade-in">
        {scheduleStatus === "active" && verificationSchedule && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900 font-semibold">Document Verification Schedule</AlertTitle>
            <AlertDescription className="text-green-800">
              <div className="mt-2 space-y-2">
                <p className="font-medium">
                  Barangay: <span className="text-green-900">{verificationSchedule.barangay}</span>
                </p>
                <p>
                  Schedule:{" "}
                  <span className="font-medium">
                    {new Date(verificationSchedule.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {new Date(verificationSchedule.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
                {verificationSchedule.dailyLimit && (
                  <p className="text-sm">Daily limit: {verificationSchedule.dailyLimit} students</p>
                )}
                <p className="mt-3 pt-3 border-t border-green-200 text-sm">
                  <strong>Reminder:</strong> Please bring your original documents to the Municipal Hall for verification
                  during the scheduled period.
                </p>
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
                <p className="font-medium">
                  Barangay: <span className="text-blue-900">{verificationSchedule.barangay}</span>
                </p>
                <p>
                  Schedule starts on:{" "}
                  <span className="font-medium">
                    {new Date(verificationSchedule.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <p>
                  Schedule ends on:{" "}
                  <span className="font-medium">
                    {new Date(verificationSchedule.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <p className="mt-3 pt-3 border-t border-blue-200 text-sm">
                  Please prepare your original documents for verification at the Municipal Hall.
                </p>
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
                <p>
                  The document verification period for{" "}
                  <span className="font-medium">{verificationSchedule.barangay}</span> has ended on{" "}
                  <span className="font-medium">
                    {new Date(verificationSchedule.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  .
                </p>
                <p className="mt-3 pt-3 border-t border-amber-200 text-sm">
                  Please wait for future announcements regarding the next verification schedule.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {scheduleStatus === "none" && (
          <Alert className="border-gray-200 bg-gray-50">
            <Info className="h-5 w-5 text-gray-600" />
            <AlertTitle className="text-gray-900 font-semibold">Verification Schedule</AlertTitle>
            <AlertDescription className="text-gray-700">
              <p className="mt-2">
                The document verification schedule for your barangay has not been announced yet. Please check back later
                for updates.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="mb-6 animate-fade-in">
        {financialScheduleStatus === "active" && financialSchedule && (
          <Alert className="border-blue-200 bg-blue-50">
            <Wallet className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">Financial Aid Distribution Schedule</AlertTitle>
            <AlertDescription className="text-blue-800">
              <div className="mt-2 space-y-2">
                <p className="font-medium">Distribution is now active for your barangay</p>
                <p>
                  Start Date:{" "}
                  <span className="font-medium">
                    {new Date(financialSchedule.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <p>
                  End Date:{" "}
                  <span className="font-medium">
                    {new Date(financialSchedule.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </p>
                <p>
                  Distribution Time: <span className="font-medium">{financialSchedule.startTime}</span>
                </p>
                <p>
                  Aid Amount:{" "}
                  <span className="font-medium text-blue-900">
                    ₱{financialSchedule.distributionAmount.toLocaleString()}
                  </span>
                </p>
                <p className="mt-3 pt-3 border-t border-blue-200 text-sm">
                  <strong>Important:</strong> Please proceed to the Municipal Hall at the scheduled time to claim your
                  financial aid. Bring a valid ID for verification.
                </p>
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
                <p>
                  Distribution Starts:{" "}
                  <span className="font-medium">
                    {new Date(financialSchedule.startDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    at {financialSchedule.startTime}
                  </span>
                </p>
                <p>
                  Expected Aid Amount:{" "}
                  <span className="font-medium text-indigo-900">
                    ₱{financialSchedule.distributionAmount.toLocaleString()}
                  </span>
                </p>
                <p className="mt-3 pt-3 border-t border-indigo-200 text-sm">
                  Mark your calendar! Financial aid will be distributed at the Municipal Hall during the scheduled
                  period.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {financialScheduleStatus === "ended" && financialSchedule && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">Financial Aid Distribution Period Ended</AlertTitle>
            <AlertDescription className="text-orange-800">
              <div className="mt-2 space-y-2">
                <p>
                  The financial aid distribution period ended on{" "}
                  <span className="font-medium">
                    {new Date(financialSchedule.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  .
                </p>
                <p className="mt-3 pt-3 border-t border-orange-200 text-sm">
                  If you haven't claimed your aid, please contact the Municipal Scholarship Office for assistance.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {financialScheduleStatus === "none" && (
          <Alert className="border-gray-200 bg-gray-50">
            <Info className="h-5 w-5 text-gray-600" />
            <AlertTitle className="text-gray-900 font-semibold">Financial Aid Distribution Schedule</AlertTitle>
            <AlertDescription className="text-gray-700">
              <p className="mt-2">
                The financial aid distribution schedule for your barangay has not been announced yet. Please check back
                later for updates.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="card-hover">
            <Card className="overflow-hidden border border-green-100 shadow-md">
              <div className="h-1.5 bg-gradient-to-r from-green-400 to-green-600"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-white">
                <CardTitle className="text-sm font-medium">Application Status</CardTitle>
<Badge
  variant={
  hasClaimed
  ? "custom"
  : studentData.applicationStatus === "approved"
  ? "custom"
  : studentData.applicationStatus === "rejected"
  ? "destructive"
  : "outline"
  }
  className={
  hasClaimed
  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 shadow-sm"
  : studentData.applicationStatus === "approved"
  ? "bg-green-100 text-green-800 hover:bg-green-200 shadow-sm"
  : studentData.applicationStatus === "rejected"
  ? "shadow-sm"
  : !currentApplication && applicationHistory.length > 0
  ? "bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm"
  : "shadow-sm"
  }
  >
  {hasClaimed
  ? "Claimed"
  : studentData.applicationStatus === "approved"
  ? "Approved"
  : studentData.applicationStatus === "rejected"
  ? "Rejected"
  : !currentApplication && applicationHistory.length > 0
  ? "Ready to Apply"
  : "Pending"}
  </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Academic Year</div>
                    <div className="font-medium">
                      {studentData.academicYear}, {studentData.semester}
                    </div>
                  </div>
                </div>
                <ApplicationStatus status={studentData.applicationStatus} />
              </CardContent>
            </Card>
          </div>

          <div className="card-hover">
            <Card className="overflow-hidden border border-green-100 shadow-md">
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
            <Card className="overflow-hidden border border-green-100 shadow-md">
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-amber-600"></div>
              <CardHeader className="bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Required Documents</CardTitle>
                    <CardDescription>Check your document submission status</CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">Enrollment Form</span>
                    <Badge variant="outline" className="shadow-sm">
                      Required
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">Grades</span>
                    <Badge variant="outline" className="shadow-sm">
                      Required
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-md bg-white shadow-sm border border-gray-100">
                    <span className="text-sm">School ID</span>
                    <Badge variant="outline" className="shadow-sm">
                      Required
                    </Badge>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/student/documents">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group shadow-sm hover:shadow transition-all duration-200 bg-transparent"
                    >
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
                {!currentApplication ? (
                  <div className="text-center py-8">
                    {applicationHistory.length > 0 ? (
                      <>
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-green-800">Ready for Next Semester!</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                          Your previous application has been completed. You can now apply for the next semester's scholarship.
                        </p>
                        <Link href="/student/documents">
                          <Button className="bg-green-600 hover:bg-green-700">
                            Apply for Next Semester
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Application Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          You haven't submitted a scholarship application yet.
                        </p>
                        <Link href="/student/documents">
                          <Button className="bg-green-600 hover:bg-green-700">Submit Application</Button>
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-green-200">
                    {getTimelineSteps(currentApplication, user?.id).map((step, index) => {
                      const isCompleted = step.status === "completed"
                      const isCurrent = step.status === "current"
                      const isPending = step.status === "pending"
                      const isRejected = currentApplication?.status === "rejected" && step.id === "approval"

                      return (
                        <div
                          key={step.id}
                          className={`mb-8 relative animate-fade-in ${isPending ? "opacity-50" : ""}`}
                          style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                        >
                          <div
                            className={`absolute -left-[25px] h-6 w-6 rounded-full flex items-center justify-center shadow-md ${
                              isCompleted
                                ? isRejected
                                  ? "bg-gradient-to-r from-red-500 to-red-600"
                                  : "bg-gradient-to-r from-green-500 to-green-600"
                                : isCurrent
                                  ? "bg-gradient-to-r from-green-200 to-green-300 animate-pulse"
                                  : "bg-muted"
                            }`}
                          >
                            {isCompleted ? (
                              isRejected ? (
                                <XCircle className="h-3 w-3 text-white" />
                              ) : (
                                <CheckCircle className="h-3 w-3 text-white" />
                              )
                            ) : (
                              <div
                                className={`h-2 w-2 rounded-full ${isCurrent ? "bg-green-600" : "bg-muted-foreground"}`}
                              ></div>
                            )}
                          </div>
                          <div className="pb-2">
                            <h3 className={`text-base font-semibold ${isRejected ? "text-red-600" : ""}`}>
                              {step.title}
                            </h3>
                            <p className={`text-sm ${isRejected ? "text-red-500" : "text-muted-foreground"}`}>
                              {step.date}
                            </p>
                          </div>
                          <p
                            className={`text-sm p-3 rounded-md shadow-sm border ${
                              isRejected ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-100"
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {applicationHistory.length > 0 && (
          <div className="grid gap-6 md:grid-cols-1">
            <div className="card-hover">
              <Card className="overflow-hidden border border-purple-100 shadow-md">
                <div className="h-1.5 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Application History</CardTitle>
                      <CardDescription>Your previous scholarship applications and outcomes</CardDescription>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <History className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {applicationHistory.slice(0, 3).map((historyItem, index) => (
                      <div
                        key={historyItem.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm border border-gray-100 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              historyItem.outcome === "approved" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            <Calendar
                              className={`h-5 w-5 ${
                                historyItem.outcome === "approved" ? "text-green-600" : "text-red-600"
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {historyItem.applicationData.course} - {historyItem.applicationData.yearLevel}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {historyItem.applicationData.school} • {historyItem.applicationData.barangay}
                            </p>
                            <p className="text-xs text-gray-500">
                              Completed: {new Date(historyItem.completedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={historyItem.outcome === "approved" ? "custom" : "destructive"}
                            className={
                              historyItem.outcome === "approved" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""
                            }
                          >
                            {historyItem.outcome === "approved" ? "Approved" : "Rejected"}
                          </Badge>
                          {historyItem.financialAidAmount > 0 && (
                            <p className="text-sm font-medium text-green-600 mt-1">
                              ₱{historyItem.financialAidAmount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {applicationHistory.length > 3 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 bg-transparent"
                        >
                          View All History ({applicationHistory.length} total)
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  )
}
