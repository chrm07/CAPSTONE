"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Eye, Users, Mail, GraduationCap, Calendar } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getUsers, getApplications, hasPermission } from "@/lib/storage"
import { PermissionGuard } from "@/components/permission-guard"
import { useAuth } from "@/contexts/auth-context"

// Define a type for scholar data
type Scholar = {
  id: string
  name: string
  course: string
  yearLevel: string
  barangay: string
  school: string
  status: "active" | "inactive"
  semester: string
  academicYear: string
  email?: string
  phone?: string
  address?: string
  profileImage?: string
  gpa?: string
  birthDate?: string
}

export default function ScholarsPage() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [yearFilter, setYearFilter] = useState("all")
  const [barangayFilter, setBarangayFilter] = useState("all")
  const [scholars, setScholars] = useState<Scholar[]>([])
  const [barangays, setBarangays] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [selectedScholar, setSelectedScholar] = useState<Scholar | null>(null)

  // Load real data from local storage
  useEffect(() => {
    setLoading(true)

    // Get all users and applications from local storage
    const users = getUsers().filter((user) => user.role === "student")
    const applications = getApplications()

    // Create a map of barangays for filtering
    const uniqueBarangays = new Set<string>()

    // Transform users and applications into scholar objects
    const scholarsList: Scholar[] = users.map((user) => {
      // Find the application for this user if it exists
      const application = applications.find((app) => app.studentId === user.id || app.email === user.email)

      // Get profile data
      const profileData = user.profileData || {}

      // Add barangay to the set of unique barangays
      const barangay = application?.barangay || profileData?.barangay || "Unknown"
      uniqueBarangays.add(barangay)

      return {
        id: user.id,
        name: user.name || profileData?.fullName || "Unknown",
        course: application?.course || profileData?.course || "Unknown",
        yearLevel: application?.yearLevel || profileData?.yearLevel || "Unknown",
        barangay: barangay,
        school: application?.school || profileData?.schoolName || "Unknown",
        status: "active", // Default to active for now
        semester: "1st Semester", // Default value
        academicYear: "2023-2024", // Default value
        email: user.email,
        phone: profileData?.phoneNumber || application?.phoneNumber,
        address: profileData?.address || application?.address,
        profileImage: profileData?.profileImage,
        gpa: profileData?.gpa || "N/A",
        birthDate: profileData?.birthDate,
      }
    })

    setScholars(scholarsList)
    setBarangays(Array.from(uniqueBarangays))
    setLoading(false)
  }, [])

  // Filter scholars based on search term and filters
  const filteredScholars = scholars.filter((scholar) => {
    const matchesSearch =
      scholar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholar.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scholar.course.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesYear = yearFilter === "all" || scholar.yearLevel.toLowerCase().includes(yearFilter.toLowerCase())

    const matchesBarangay = barangayFilter === "all" || scholar.barangay === barangayFilter

    return matchesSearch && matchesYear && matchesBarangay
  })

  const handleViewProfile = (scholarId: string) => {
    const scholar = scholars.find((s) => s.id === scholarId)
    if (scholar) {
      setSelectedScholar(scholar)
      setIsProfileModalOpen(true)
    }
  }

  return (
    <PermissionGuard permission="scholars">
      <AdminLayout>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Scholars</h1>
              <p className="text-slate-600">Manage and monitor scholarship recipients</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">All Scholars</CardTitle>
            <CardDescription className="text-slate-600">
              List of all students who have registered in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search scholars..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[150px] border-slate-200">
                      <SelectValue placeholder="Year Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="1st">1st Year</SelectItem>
                      <SelectItem value="2nd">2nd Year</SelectItem>
                      <SelectItem value="3rd">3rd Year</SelectItem>
                      <SelectItem value="4th">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={barangayFilter} onValueChange={setBarangayFilter}>
                    <SelectTrigger className="w-[150px] border-slate-200">
                      <SelectValue placeholder="Barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Barangays</SelectItem>
                      {barangays.map((barangay) => (
                        <SelectItem key={barangay} value={barangay}>
                          {barangay}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scholar ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Year Level</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          Loading scholars...
                        </TableCell>
                      </TableRow>
                    ) : filteredScholars.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No scholars found. Please register students to see them here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredScholars.map((scholar) => (
                        <TableRow key={scholar.id}>
                          <TableCell className="font-medium">{scholar.id}</TableCell>
                          <TableCell>{scholar.name}</TableCell>
                          <TableCell>{scholar.course}</TableCell>
                          <TableCell>{scholar.yearLevel}</TableCell>
                          <TableCell>{scholar.school}</TableCell>
                          <TableCell>{scholar.barangay}</TableCell>
                          <TableCell>
                            <Badge variant={scholar.status === "active" ? "success" : "outline"}>
                              {scholar.status === "active" ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleViewProfile(scholar.id)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Profile</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Scholar Profile</DialogTitle>
            </DialogHeader>

            {selectedScholar && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedScholar.profileImage || "/placeholder.svg"} alt={selectedScholar.name} />
                    <AvatarFallback className="bg-emerald-500 text-white text-lg">
                      {selectedScholar.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{selectedScholar.name}</h3>
                    <p className="text-slate-600">Scholar ID: {selectedScholar.id}</p>
                    <Badge variant={selectedScholar.status === "active" ? "success" : "outline"} className="mt-1">
                      {selectedScholar.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-emerald-600" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm font-medium">{selectedScholar.email || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm font-medium">{selectedScholar.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Address</p>
                        <p className="text-sm font-medium">{selectedScholar.address || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Barangay</p>
                        <p className="text-sm font-medium">{selectedScholar.barangay}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-emerald-600" />
                        Academic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">School</p>
                        <p className="text-sm font-medium">{selectedScholar.school}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Course</p>
                        <p className="text-sm font-medium">{selectedScholar.course}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Year Level</p>
                        <p className="text-sm font-medium">{selectedScholar.yearLevel}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">GPA</p>
                        <p className="text-sm font-medium">{selectedScholar.gpa}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scholarship Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      Scholarship Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Academic Year</p>
                      <p className="text-sm font-medium">{selectedScholar.academicYear}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Semester</p>
                      <p className="text-sm font-medium">{selectedScholar.semester}</p>
                    </div>
                    {selectedScholar.birthDate && (
                      <div>
                        <p className="text-xs text-slate-500">Birth Date</p>
                        <p className="text-sm font-medium">{selectedScholar.birthDate}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </PermissionGuard>
  )
}
