"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Download,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  GraduationCap,
  MapPin,
  School,
  BookOpen,
  UserIcon,
  ChevronRight,
  Accessibility,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { getAllApplications, getAllUsers, hasPermission, type Application, type User } from "@/lib/storage"
import { PermissionGuard } from "@/components/permission-guard"
import { useAuth } from "@/contexts/auth-context"
import type { StudentProfile } from "@/lib/types" // Added import for StudentProfile

interface StudentListModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  students: any[]
  applications?: Application[]
  filterType?: "all" | "approved" | "pending" | "rejected" | "pwd"
}

function StudentListModal({
  isOpen,
  onClose,
  title,
  description,
  students,
  applications,
  filterType,
}: StudentListModalProps) {
  const getFilteredStudents = () => {
    if (!filterType || filterType === "all") return students

    if (!applications) return students

    const filteredAppUserIds = applications.filter((app) => app.status === filterType).map((app) => app.userId)

    return students.filter((student) => filteredAppUserIds.includes(student.id))
  }

  const filteredStudents = getFilteredStudents()

  const getStatusBadge = (studentId: string) => {
    if (!applications) return null
    const app = applications.find((a) => a.userId === studentId)
    if (!app) return <Badge variant="outline">No Application</Badge>

    switch (app.status) {
      case "approved":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Approved</Badge>
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{app.status}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>No students found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStudents.map((student, index) => {
                const profile = student.profileData as StudentProfile
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{profile?.fullName || student.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {profile?.course && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {profile.course} • {profile.yearLevel || "N/A"} • {profile.schoolName || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                    {applications && getStatusBadge(student.id)}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  description: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  onClick?: () => void
  trend?: string
}

function StatCard({ title, value, description, icon, iconBg, iconColor, onClick, trend }: StatCardProps) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-primary/50" : ""}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">{value}</div>
          {trend && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {onClick && (
          <div className="flex items-center gap-1 text-xs text-primary mt-3 font-medium">
            Click to view list
            <ChevronRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to get current academic year
function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed (0 = January)
  // Academic year typically starts in June/August
  // If we're in June or later, it's the current year to next year
  // If we're before June, it's last year to current year
  if (month >= 5) { // June onwards
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}

// Generate academic year options (current + past 4 years)
function getAcademicYearOptions(): string[] {
  const currentYear = getCurrentAcademicYear()
  const [startYear] = currentYear.split("-").map(Number)
  const options: string[] = []
  for (let i = 0; i < 5; i++) {
    const year = startYear - i
    options.push(`${year}-${year + 1}`)
  }
  return options
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear())
  const [semester, setSemester] = useState("1st")
  const academicYearOptions = getAcademicYearOptions()

  const [scholars, setScholars] = useState<any[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedModal, setSelectedModal] = useState<{
    title: string
    description: string
    filter: string
  } | null>(null)

  useEffect(() => {
    const allApplications = getAllApplications()
    const allStudents = getAllUsers().filter((u) => u.role === "student")
    
    setApplications(allApplications)
    setUsers(allStudents)
    
    // Build scholars data by combining user data with application data
    const scholarsData = allApplications.map((app) => {
      const student = allStudents.find((u) => u.id === app.studentId)
      const studentProfile = student?.studentProfile || student?.profileData
      
      return {
        id: app.studentId,
        name: app.fullName || student?.name,
        email: student?.email || app.email,
        profileData: {
          fullName: app.fullName || studentProfile?.fullName || student?.name,
          yearLevel: app.yearLevel || studentProfile?.education?.yearLevel || studentProfile?.yearLevel,
          barangay: app.barangay || studentProfile?.barangay,
          gender: app.gender || studentProfile?.gender,
          age: app.age || studentProfile?.age || (studentProfile?.dateOfBirth ? calculateAge(studentProfile.dateOfBirth) : undefined),
          course: app.course || studentProfile?.education?.course || studentProfile?.course,
          schoolName: app.school || studentProfile?.education?.school || studentProfile?.schoolName,
        },
        applicationStatus: app.status,
      }
    })
    
    console.log("[v0] Reports - Applications loaded:", allApplications.length)
    console.log("[v0] Reports - Students loaded:", allStudents.length)
    console.log("[v0] Reports - Scholars data built:", scholarsData)
    
    setScholars(scholarsData)
  }, [])
  
  // Helper to calculate age from date of birth
  function calculateAge(dateOfBirth: string): string {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  const stats = useMemo(() => {
    const approved = applications.filter((a) => a.status === "approved").length
    const pending = applications.filter((a) => a.status === "pending").length
    const rejected = applications.filter((a) => a.status === "rejected").length
    const pwdCount = applications.filter((a) => a.isPWD === true).length // Added PWD count

    return {
      total: applications.length,
      approved,
      pending,
      rejected,
      pwdCount, // Added PWD count to stats
      approvalRate: applications.length > 0 ? Math.round((approved / applications.length) * 100) : 0,
    }
  }, [applications])

  const openStudentModal = (
    title: string,
    description: string,
    filterType: "all" | "approved" | "pending" | "rejected" | "pwd",
  ) => {
    setSelectedModal({ title, description, filter: filterType })
  }

  const getFilteredStudents = (filter: string) => {
    switch (filter) {
      case "approved":
        return applications.filter((a) => a.status === "approved")
      case "pending":
        return applications.filter((a) => a.status === "pending")
      case "rejected":
        return applications.filter((a) => a.status === "rejected")
      case "pwd": // Added PWD filter
        return applications.filter((a) => a.isPWD === true)
      default:
        return applications
    }
  }

  const getYearLevelData = () => {
    const yearLevels = scholars.reduce(
      (acc, scholar) => {
        const profile = scholar.profileData as StudentProfile
        const yearLevel = profile?.yearLevel || "Unknown"
        acc[yearLevel] = (acc[yearLevel] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const colorMap: Record<string, string> = {
      "1st Year": "#3b82f6",
      "2nd Year": "#10b981",
      "3rd Year": "#f59e0b",
      "4th Year": "#ef4444",
      "5th Year": "#8b5cf6",
    }

    const data = Object.entries(yearLevels).map(([name, value]) => ({
      name,
      value,
      fill: colorMap[name] || "#6b7280",
    }))
    return data
  }

  const getBarangayData = () => {
    const barangays = scholars.reduce(
      (acc, scholar) => {
        const profile = scholar.profileData as StudentProfile
        const barangay = profile?.barangay || "Unknown"
        acc[barangay] = (acc[barangay] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
    const data = Object.entries(barangays)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], index) => ({
        name,
        value,
        fill: colors[index],
      }))
    return data
  }

  const getGenderData = () => {
    const genders = scholars.reduce(
      (acc, scholar) => {
        const profile = scholar.profileData as StudentProfile
        const gender = profile?.gender || "Unknown"
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const data = Object.entries(genders).map(([name, value]) => ({
      name,
      value,
      fill: name === "Female" ? "#ec4899" : name === "Male" ? "#3b82f6" : "#6b7280",
    }))
    return data
  }

  const getAgeData = () => {
    const ageGroups = scholars.reduce(
      (acc, scholar) => {
        const profile = scholar.profileData as StudentProfile
        const age = Number.parseInt(profile?.age || "0")
        let group = "Unknown"
        if (age >= 16 && age <= 18) group = "16-18"
        else if (age >= 19 && age <= 21) group = "19-21"
        else if (age >= 22 && age <= 24) group = "22-24"
        else if (age >= 25) group = "25+"

        acc[group] = (acc[group] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    const data = ["16-18", "19-21", "22-24", "25+"].map((name, index) => ({
      name,
      value: ageGroups[name] || 0,
      fill: colors[index],
    }))
    return data
  }

  const getCourseData = () => {
    const courses = scholars.reduce(
      (acc, scholar) => {
        const profile = scholar.profileData as StudentProfile
        const course = profile?.course || "Unknown"
        const match = course.match(/\b([A-Z]{2,})\b/)
        const abbrev = match ? match[1] : course.split(" ").slice(0, 2).join(" ")
        acc[abbrev] = (acc[abbrev] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
    const data = Object.entries(courses).map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length],
    }))
    return data
  }

  const getSchoolData = () => {
    const schools = scholars.reduce(
      (acc, scholar) => {
        const profile = scholar.profileData as StudentProfile
        const school = profile?.schoolName || "Unknown"
        const shortName = school.length > 25 ? school.substring(0, 25) + "..." : school
        acc[shortName] = (acc[shortName] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
    const data = Object.entries(schools).map(([name, value], index) => ({
      name,
      value,
      fill: colors[index % colors.length],
    }))
    return data
  }

  const getApplicationStatusData = () => {
    const data = [
      { name: "Approved", value: stats.approved, fill: "#10b981" },
      { name: "Pending", value: stats.pending, fill: "#f59e0b" },
      { name: "Rejected", value: stats.rejected, fill: "#ef4444" },
    ]
    return data
  }

  const yearLevelData = getYearLevelData()
  const barangayData = getBarangayData()
  const genderData = getGenderData()
  const ageData = getAgeData()
  const courseData = getCourseData()
  const schoolData = getSchoolData()
  const applicationStatusData = getApplicationStatusData()

  const handleExportReport = (format: string) => {
    toast({
      title: `Exporting report as ${format.toUpperCase()}`,
      description: "Your report is being generated and will download shortly.",
    })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            Count: <span className="font-bold text-foreground">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const renderChart = (data: any[], chartElement: React.ReactNode, emptyMessage: string) => {
    if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <GraduationCap className="h-12 w-12 mb-4 opacity-30" />
          <p>{emptyMessage}</p>
        </div>
      )
    }
    return chartElement
  }

  return (
    <PermissionGuard permission="reports">
      <AdminLayout>
        {selectedModal && (
          <StudentListModal
            isOpen={true}
            onClose={() => setSelectedModal(null)}
            title={selectedModal.title}
            description={selectedModal.description}
            students={scholars}
            applications={applications}
            filterType={selectedModal.filter}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-1">Generate and view scholarship program insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExportReport("pdf")} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport("excel")} className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
          <div className="flex items-center gap-2">
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYearOptions.map((year) => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st">1st Semester</SelectItem>
                <SelectItem value="2nd">2nd Semester</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="demographics" className="gap-2">
              <Users className="h-4 w-4" />
              Demographics
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Academic
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard
                title="Total Scholars"
                value={stats.total}
                description="Registered students in the program"
                icon={<Users className="h-5 w-5" />}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-600"
                onClick={() =>
                  openStudentModal(
                    "All Registered Scholars",
                    "Complete list of all registered students in the scholarship program",
                    "all",
                  )
                }
              />
              <StatCard
                title="Approved Applications"
                value={stats.approved}
                description={`${stats.approvalRate}% approval rate`}
                icon={<CheckCircle className="h-5 w-5" />}
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-600"
                onClick={() =>
                  openStudentModal("Approved Scholars", "Students with approved scholarship applications", "approved")
                }
              />
              <StatCard
                title="Pending Applications"
                value={stats.pending}
                description="Awaiting review and approval"
                icon={<Clock className="h-5 w-5" />}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-600"
                onClick={() =>
                  openStudentModal("Pending Applications", "Students awaiting application review", "pending")
                }
              />
              <StatCard
                title="Rejected Applications"
                value={stats.rejected}
                description="Applications not approved"
                icon={<XCircle className="h-5 w-5" />}
                iconBg="bg-red-500/10"
                iconColor="text-red-600"
                onClick={() =>
                  openStudentModal("Rejected Applications", "Students with rejected applications", "rejected")
                }
              />
              <StatCard
                title="PWD Scholars"
                value={stats.pwdCount}
                description="Persons with disability"
                icon={<Accessibility className="h-5 w-5" />}
                iconBg="bg-purple-500/10"
                iconColor="text-purple-600"
                onClick={() => openStudentModal("PWD Scholars", "Students registered as Persons with Disability", "pwd")}
              />
            </div>

            <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overall Approval Rate</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-4xl font-bold text-primary">{stats.approvalRate}%</span>
                      <span className="text-sm text-muted-foreground">based on {applications.length} applications</span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Scholars by Year Level
                  </CardTitle>
                  <CardDescription>Distribution of scholars across different year levels</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(
                    yearLevelData,
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={yearLevelData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={true}
                        >
                          {yearLevelData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>,
                    "No scholar data available",
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Scholars by Barangay
                  </CardTitle>
                  <CardDescription>Top 5 barangays with most scholars</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(
                    barangayData,
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barangayData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {barangayData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>,
                    "No barangay data available",
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Application Status Overview
                </CardTitle>
                <CardDescription>Current status of all scholarship applications</CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {renderChart(
                  applicationStatusData,
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={applicationStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {applicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>,
                  "No application data available",
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard
                title="Total Scholars"
                value={stats.total}
                description="All scholarship recipients"
                icon={<Users className="h-5 w-5" />}
                iconBg="bg-blue-500/10"
                iconColor="text-blue-600"
                onClick={() => openStudentModal("All Scholars", "Complete list of all registered scholars", "all")}
              />
              <StatCard
                title="Approved Scholars"
                value={stats.approved}
                description={`${stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% of registered students`}
                icon={<CheckCircle className="h-5 w-5" />}
                iconBg="bg-emerald-500/10"
                iconColor="text-emerald-600"
                onClick={() => openStudentModal("Approved Scholars", "Students with approved applications", "approved")}
              />
              <StatCard
                title="Pending Applications"
                value={stats.pending}
                description="Awaiting review"
                icon={<Clock className="h-5 w-5" />}
                iconBg="bg-amber-500/10"
                iconColor="text-amber-600"
                onClick={() => openStudentModal("Pending Applications", "Students awaiting review", "pending")}
              />
              <StatCard
                title="PWD Scholars"
                value={stats.pwdCount}
                description={`${stats.total > 0 ? Math.round((stats.pwdCount / stats.total) * 100) : 0}% of total scholars`}
                icon={<Accessibility className="h-5 w-5" />}
                iconBg="bg-purple-500/10"
                iconColor="text-purple-600"
                onClick={() => openStudentModal("PWD Scholars", "Persons with Disability in the program", "pwd")}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" />
                    Gender Distribution
                  </CardTitle>
                  <CardDescription>Distribution of scholars by gender</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(
                    genderData,
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={genderData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {genderData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>,
                    "No gender data available",
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Age Distribution
                  </CardTitle>
                  <CardDescription>Distribution of scholars by age group</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(
                    ageData,
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {ageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>,
                    "No age data available",
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Scholars by Course
                  </CardTitle>
                  <CardDescription>Distribution of scholars across different courses</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  {renderChart(
                    courseData,
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={courseData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" />
                        <YAxis dataKey="name" type="category" width={80} stroke="#6b7280" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {courseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>,
                    "No course data available",
                  )}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-primary" />
                    Scholars by School
                  </CardTitle>
                  <CardDescription>Distribution of scholars across different schools</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  {renderChart(
                    schoolData,
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie
                          data={schoolData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ value }) => `${value}`}
                        >
                          {schoolData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>,
                    "No school data available",
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Application Statistics
                </CardTitle>
                <CardDescription>Overview of application statuses</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {renderChart(
                  applicationStatusData,
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={applicationStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {applicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>,
                  "No application data available",
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </PermissionGuard>
  )
}
