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
  Loader2
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

// IMPORT ONLY FIRESTORE FUNCTIONS
import { getApplicationsDb, getScholarsDb, type Application, type User } from "@/lib/storage"
import { PermissionGuard } from "@/components/permission-guard"

// Note: Removed local StudentProfile type to rely on the Firestore User 'profileData' object directly.

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

    // For PWD, check the application data directly
    if (filterType === "pwd") {
      const pwdAppIds = applications.filter((app) => app.isPWD).map((app) => app.studentId)
      return students.filter((student) => pwdAppIds.includes(student.id))
    }

    const filteredAppUserIds = applications.filter((app) => app.status === filterType).map((app) => app.studentId)
    return students.filter((student) => filteredAppUserIds.includes(student.id))
  }

  const filteredStudents = getFilteredStudents()

  const getStatusBadge = (studentId: string) => {
    if (!applications) return null
    const app = applications.find((a) => a.studentId === studentId)
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
                const profile = student.profileData || {}
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

function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  if (month >= 5) { return `${year}-${year + 1}` }
  return `${year - 1}-${year}`
}

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
  const [loading, setLoading] = useState(true)
  const [selectedModal, setSelectedModal] = useState<{
    title: string
    description: string
    filter: any // Changed from string to any to match exact types
  } | null>(null)

  // FETCH REAL DATA FROM FIRESTORE
  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true)
      try {
        const [allApplications, allUsers] = await Promise.all([
          getApplicationsDb(),
          getScholarsDb() // Gets all users with role: 'student'
        ])
        
        setApplications(allApplications)
        
        // Build combined scholar profiles
        const scholarsData = allUsers.map((student) => {
          const app = allApplications.find((a) => a.studentId === student.id)
          const profile = student.profileData || {} as any
          
          return {
            id: student.id,
            name: app?.fullName || profile.fullName || student.name || "Unknown",
            email: student.email,
            profileData: {
              fullName: app?.fullName || profile.fullName || student.name,
              yearLevel: app?.yearLevel || profile.yearLevel || "Unknown",
              barangay: app?.barangay || profile.barangay || "Unknown",
              gender: app?.gender || profile.gender || "Unknown",
              age: app?.age || profile.age || "Unknown",
              course: app?.course || profile.course || "Unknown",
              schoolName: app?.school || profile.schoolName || "Unknown",
            },
            applicationStatus: app?.status || "None",
            isPWD: app?.isPWD || false
          }
        })
        
        setScholars(scholarsData)
      } catch (error) {
        toast({ title: "Error", description: "Failed to load report data from database.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchReportsData()
  }, [toast])

  const stats = useMemo(() => {
    const approved = applications.filter((a) => a.status === "approved").length
    const pending = applications.filter((a) => a.status === "pending").length
    const rejected = applications.filter((a) => a.status === "rejected").length
    const pwdCount = applications.filter((a) => a.isPWD === true).length

    return {
      total: applications.length,
      approved,
      pending,
      rejected,
      pwdCount,
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

  // REAL CSV EXPORT LOGIC
  const handleExportReport = (format: string) => {
    if (format === "excel" || format === "csv") {
      try {
        // Define CSV Headers
        const headers = ["Student ID", "Full Name", "Email", "Course", "Year Level", "School", "Barangay", "Status", "PWD"]
        
        // Map data to rows
        const rows = scholars.map(s => [
          s.id,
          `"${s.name}"`, // Quote strings to handle commas in names
          s.email,
          `"${s.profileData.course}"`,
          s.profileData.yearLevel,
          `"${s.profileData.schoolName}"`,
          `"${s.profileData.barangay}"`,
          s.applicationStatus,
          s.isPWD ? "Yes" : "No"
        ])

        // Combine
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
        
        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `Scholarship_Report_${academicYear}_${semester}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({ title: "Export Successful", description: "Your CSV file has been downloaded.", variant: "success" })
      } catch (error) {
        toast({ title: "Export Failed", description: "Could not generate CSV file.", variant: "destructive" })
      }
    } else {
      toast({ title: "Feature Unavailable", description: "PDF export is currently disabled. Please use Excel/CSV.", variant: "destructive" })
    }
  }

  // --- CHART DATA HELPERS ---
  const getYearLevelData = () => {
    const yearLevels = scholars.reduce((acc, scholar) => {
      const level = scholar.profileData.yearLevel
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colorMap: Record<string, string> = { "1st Year": "#3b82f6", "2nd Year": "#10b981", "3rd Year": "#f59e0b", "4th Year": "#ef4444", "5th Year": "#8b5cf6" }
    return Object.entries(yearLevels).map(([name, value]) => ({ name, value, fill: colorMap[name] || "#6b7280" }))
  }

  const getBarangayData = () => {
    const barangays = scholars.reduce((acc, scholar) => {
      const b = scholar.profileData.barangay
      acc[b] = (acc[b] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
    return Object.entries(barangays)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], index) => ({ name, value, fill: colors[index] }))
  }

  const getGenderData = () => {
    const genders = scholars.reduce((acc, scholar) => {
      const g = scholar.profileData.gender
      acc[g] = (acc[g] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return Object.entries(genders).map(([name, value]) => ({ name, value, fill: name === "Female" ? "#ec4899" : name === "Male" ? "#3b82f6" : "#6b7280" }))
  }

  const getAgeData = () => {
    const ageGroups = scholars.reduce((acc, scholar) => {
      const age = Number.parseInt(scholar.profileData.age || "0")
      let group = "Unknown"
      if (age >= 16 && age <= 18) group = "16-18"
      else if (age >= 19 && age <= 21) group = "19-21"
      else if (age >= 22 && age <= 24) group = "22-24"
      else if (age >= 25) group = "25+"
      acc[group] = (acc[group] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]
    return ["16-18", "19-21", "22-24", "25+"].map((name, index) => ({ name, value: ageGroups[name] || 0, fill: colors[index] }))
  }

  const getCourseData = () => {
    const courses = scholars.reduce((acc, scholar) => {
      const course = scholar.profileData.course
      const match = course.match(/\b([A-Z]{2,})\b/)
      const abbrev = match ? match[1] : course.split(" ").slice(0, 2).join(" ")
      acc[abbrev] = (acc[abbrev] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]
    return Object.entries(courses).map(([name, value], index) => ({ name, value, fill: colors[index % colors.length] }))
  }

  const getSchoolData = () => {
    const schools = scholars.reduce((acc, scholar) => {
      const school = scholar.profileData.schoolName
      const shortName = school.length > 25 ? school.substring(0, 25) + "..." : school
      acc[shortName] = (acc[shortName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
    return Object.entries(schools).map(([name, value], index) => ({ name, value, fill: colors[index % colors.length] }))
  }

  const getApplicationStatusData = () => [
    { name: "Approved", value: stats.approved, fill: "#10b981" },
    { name: "Pending", value: stats.pending, fill: "#f59e0b" },
    { name: "Rejected", value: stats.rejected, fill: "#ef4444" },
  ]

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">Count: <span className="font-bold text-foreground">{payload[0].value}</span></p>
        </div>
      )
    }
    return null
  }

  const renderChart = (data: any[], chartElement: React.ReactNode, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p>Analyzing Data...</p>
        </div>
      )
    }
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
              <Download className="h-4 w-4" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport("excel")} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
          <div className="flex items-center gap-2">
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-[180px] bg-white"><SelectValue placeholder="Academic Year" /></SelectTrigger>
              <SelectContent>
                {academicYearOptions.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[150px] bg-white"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1st">1st Semester</SelectItem>
                <SelectItem value="2nd">2nd Semester</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-white border p-1 shadow-sm">
            <TabsTrigger value="overview" className="gap-2"><TrendingUp className="h-4 w-4" /> Overview</TabsTrigger>
            <TabsTrigger value="demographics" className="gap-2"><Users className="h-4 w-4" /> Demographics</TabsTrigger>
            <TabsTrigger value="academic" className="gap-2"><GraduationCap className="h-4 w-4" /> Academic</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <StatCard title="Total Scholars" value={stats.total} description="Registered students" icon={<Users className="h-5 w-5" />} iconBg="bg-blue-500/10" iconColor="text-blue-600" onClick={() => openStudentModal("All Registered Scholars", "Complete list of all registered students", "all")} />
              <StatCard title="Approved Applications" value={stats.approved} description={`${stats.approvalRate}% approval rate`} icon={<CheckCircle className="h-5 w-5" />} iconBg="bg-emerald-500/10" iconColor="text-emerald-600" onClick={() => openStudentModal("Approved Scholars", "Students with approved scholarship applications", "approved")} />
              <StatCard title="Pending Applications" value={stats.pending} description="Awaiting review" icon={<Clock className="h-5 w-5" />} iconBg="bg-amber-500/10" iconColor="text-amber-600" onClick={() => openStudentModal("Pending Applications", "Students awaiting review", "pending")} />
              <StatCard title="Rejected Applications" value={stats.rejected} description="Applications not approved" icon={<XCircle className="h-5 w-5" />} iconBg="bg-red-500/10" iconColor="text-red-600" onClick={() => openStudentModal("Rejected Applications", "Students with rejected applications", "rejected")} />
              <StatCard title="PWD Scholars" value={stats.pwdCount} description="Persons with disability" icon={<Accessibility className="h-5 w-5" />} iconBg="bg-purple-500/10" iconColor="text-purple-600" onClick={() => openStudentModal("PWD Scholars", "Students registered as PWD", "pwd")} />
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
                  <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Scholars by Year Level</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(getYearLevelData(), <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={getYearLevelData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`} labelLine={true}>{getYearLevelData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>, "No scholar data available")}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Scholars by Barangay</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(getBarangayData(), <ResponsiveContainer width="100%" height={300}><BarChart data={getBarangayData()}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" stroke="#6b7280" fontSize={12} /><YAxis stroke="#6b7280" /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" radius={[8, 8, 0, 0]}>{getBarangayData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No barangay data available")}
                </CardContent>
              </Card>
            </div>
            {/* Third chart block omitted for brevity, logic remains identical to tabs below */}
          </TabsContent>

          <TabsContent value="demographics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary" /> Gender Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(getGenderData(), <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={getGenderData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>{getGenderData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>, "No gender data available")}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Age Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {renderChart(getAgeData(), <ResponsiveContainer width="100%" height={300}><BarChart data={getAgeData()}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" stroke="#6b7280" /><YAxis stroke="#6b7280" /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" radius={[8, 8, 0, 0]}>{getAgeData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No age data available")}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academic" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Scholars by Course</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  {renderChart(getCourseData(), <ResponsiveContainer width="100%" height={350}><BarChart data={getCourseData()} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis type="number" stroke="#6b7280" /><YAxis dataKey="name" type="category" width={80} stroke="#6b7280" fontSize={12} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" radius={[0, 8, 8, 0]}>{getCourseData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No course data available")}
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><School className="h-5 w-5 text-primary" /> Scholars by School</CardTitle>
                </CardHeader>
                <CardContent className="h-96">
                  {renderChart(getSchoolData(), <ResponsiveContainer width="100%" height={350}><PieChart><Pie data={getSchoolData()} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ value }) => `${value}`}>{getSchoolData().map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>, "No school data available")}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </PermissionGuard>
  )
}