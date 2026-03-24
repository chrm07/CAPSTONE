"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Eye, CheckCircle, XCircle, Clock, FileText } from "lucide-react"
import {
  getNewScholarApplications,
  updateNewScholarApplication,
  addPreApprovedEmail,
  type NewScholarApplication,
} from "@/lib/storage"
import { useToast } from "@/components/ui/use-toast"

export default function ApplyNowPage() {
  const [applications, setApplications] = useState<NewScholarApplication[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    const loadApplications = () => {
      const newApplications = getNewScholarApplications()
      setApplications(newApplications)
    }

    loadApplications()
  }, [])

  const handleApproveApplication = async (application: NewScholarApplication) => {
    try {
      // Add email to pre-approved emails list
      await addPreApprovedEmail(
        application.email,
        `${application.firstName} ${application.lastName}`,
        `Approved from Apply Now application ${application.id}`,
        "admin",
      )

      // Update application status
      const updatedApp = updateNewScholarApplication(application.id, { status: "approved" })
      if (updatedApp) {
        setApplications((prev) => prev.map((app) => (app.id === application.id ? updatedApp : app)))

        toast({
          title: "Application Approved",
          description: `${application.firstName} ${application.lastName}'s email has been added to approved emails list.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve application",
        variant: "destructive",
      })
    }
  }

  const handleRejectApplication = (applicationId: string) => {
    const updatedApp = updateNewScholarApplication(applicationId, { status: "rejected" })
    if (updatedApp) {
      setApplications((prev) => prev.map((app) => (app.id === applicationId ? updatedApp : app)))

      toast({
        title: "Application Rejected",
        description: "The application has been rejected.",
      })
    }
  }

  const filteredApplications = applications.filter((app) => {
    const fullName = `${app.firstName} ${app.lastName}`.toLowerCase()
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((app) => app.status === "pending").length,
    approved: applications.filter((app) => app.status === "approved").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Apply Now (New Scholar Applications)</h1>
          <p className="text-slate-600 mt-2">
            Manage new scholarship applications submitted through the Apply Now page
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{statusCounts.all}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Review and manage new scholarship applications from first-time applicants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name, email, or application ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {["all", "pending", "approved", "rejected"].map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className={statusFilter === status ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  >
                    {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                    <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600">
                      {statusCounts[status as keyof typeof statusCounts]}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        {applications.length === 0
                          ? "No applications submitted yet. Applications will appear here when users submit the Apply Now form."
                          : "No applications found matching your criteria"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {application.firstName} {application.middleName && `${application.middleName} `}
                              {application.lastName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{application.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {application.barangayClearance && (
                              <div className="flex items-center gap-1 text-xs">
                                <FileText className="w-3 h-3" />
                                <span>Barangay: {application.barangayClearance}</span>
                              </div>
                            )}
                            {application.indigencyCertificate && (
                              <div className="flex items-center gap-1 text-xs">
                                <FileText className="w-3 h-3" />
                                <span>Indigency: {application.indigencyCertificate}</span>
                              </div>
                            )}
                            {application.voterCertification && (
                              <div className="flex items-center gap-1 text-xs">
                                <FileText className="w-3 h-3" />
                                <span>Voter: {application.voterCertification}</span>
                              </div>
                            )}
                            {!application.barangayClearance &&
                              !application.indigencyCertificate &&
                              !application.voterCertification && (
                                <div className="text-xs text-slate-500">No documents uploaded</div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell className="text-sm">{formatDate(application.submittedAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {application.status !== "approved" && (
                                <DropdownMenuItem onClick={() => handleApproveApplication(application)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve & Add to Emails
                                </DropdownMenuItem>
                              )}
                              {application.status !== "rejected" && (
                                <DropdownMenuItem onClick={() => handleRejectApplication(application.id)}>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
