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
import { Search, Eye, Users, Mail, GraduationCap, Calendar, Phone, MapPin } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PermissionGuard } from "@/components/permission-guard"

// Import real Firestore functions
import { getScholarsDb, getApplicationsDb, type User, type Application } from "@/lib/storage"

type Scholar = {
  id: string          // User Document ID
  studentId: string   // Human readable ID (STU-XXX)
  name: string
  course: string
  yearLevel: string
  barangay: string
  school: string
  status: "active" | "inactive" | "pending"
  email: string
  phone: string
  address: string
  profileImage?: string
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

  useEffect(() => {
    const fetchScholarsData = async () => {
      setLoading(true)
      try {
        const [users, applications] = await Promise.all([
          getScholarsDb(),
          getApplicationsDb()
        ])

        const uniqueBarangays = new Set<string>()

        const scholarsList: Scholar[] = users.map((user) => {
          // Match application by student ID
          const app = applications.find((a) => a.studentId === user.id)
          const profile = user.profileData as any || {}
          
          const barangay = app?.barangay || profile?.barangay || "Not Specified"
          if (barangay !== "Not Specified") uniqueBarangays.add(barangay)

          return {
            id: user.id,
            studentId: profile?.studentId || "N/A",
            name: user.name || profile?.fullName || "Anonymous",
            course: app?.course || profile?.course || "N/A",
            yearLevel: app?.yearLevel || profile?.yearLevel || "N/A",
            school: app?.school || profile?.schoolName || "N/A",
            barangay: barangay,
            // If application is approved, they are an "active" scholar
            status: app?.status === "approved" ? "active" : app?.status === "pending" ? "pending" : "inactive",
            email: user.email,
            phone: profile?.contactNumber || "N/A",
            address: profile?.address || "N/A",
            profileImage: user.profilePicture,
          }
        })

        setScholars(scholarsList)
        setBarangays(Array.from(uniqueBarangays).sort())
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load scholars from Firestore.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchScholarsData()
  }, [toast])

  const filteredScholars = scholars.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesYear = yearFilter === "all" || s.yearLevel.includes(yearFilter)
    const matchesBarangay = barangayFilter === "all" || s.barangay === barangayFilter
    return matchesSearch && matchesYear && matchesBarangay
  })

  return (
    <PermissionGuard permission="scholars">
      <AdminLayout>
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 shadow-lg shadow-purple-200">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Scholars Directory</h1>
              <p className="text-muted-foreground">View and manage all registered students in the system.</p>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search by name or Scholar ID..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[140px] bg-white"><SelectValue placeholder="Year Level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={barangayFilter} onValueChange={setBarangayFilter}>
                  <SelectTrigger className="w-[160px] bg-white"><SelectValue placeholder="Barangay" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Barangays</SelectItem>
                    {barangays.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="pl-6 w-[140px]">Scholar ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Barangay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">Connecting to database...</TableCell></TableRow>
                ) : filteredScholars.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">No scholars found matching your criteria.</TableCell></TableRow>
                ) : (
                  filteredScholars.map((scholar) => (
                    <TableRow key={scholar.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-6 font-mono text-xs text-slate-500">{scholar.studentId}</TableCell>
                      <TableCell className="font-semibold">{scholar.name}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{scholar.course}</TableCell>
                      <TableCell>{scholar.barangay}</TableCell>
                      <TableCell>
                        <Badge variant={scholar.status === "active" ? "success" : scholar.status === "pending" ? "secondary" : "outline"}>
                          {scholar.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedScholar(scholar); setIsProfileModalOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Profile Modal */}
        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
            {selectedScholar && (
              <>
                <div className="h-24 bg-gradient-to-r from-emerald-500 to-green-600" />
                <div className="px-6 pb-6">
                  <div className="flex justify-between items-end -mt-10 mb-4">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                      <AvatarImage src={selectedScholar.profileImage} />
                      <AvatarFallback className="text-xl bg-slate-100">{selectedScholar.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Badge className="mb-2" variant={selectedScholar.status === "active" ? "success" : "outline"}>
                      {selectedScholar.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 mb-6">
                    <h2 className="text-2xl font-bold">{selectedScholar.name}</h2>
                    <p className="text-slate-500 flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3" /> {selectedScholar.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Education</p>
                          <p className="text-sm font-medium">{selectedScholar.course}</p>
                          <p className="text-xs text-slate-500">{selectedScholar.school}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                          <p className="text-sm font-medium">{selectedScholar.barangay}</p>
                          <p className="text-xs text-slate-500">{selectedScholar.address}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                          <p className="text-sm font-medium">{selectedScholar.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enrollment</p>
                          <p className="text-sm font-medium">{selectedScholar.yearLevel}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </PermissionGuard>
  )
}