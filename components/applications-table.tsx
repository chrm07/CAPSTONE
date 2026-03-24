"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Check, X, FileText, Download, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getApplications, updateApplication, type Application } from "@/lib/storage"

interface ApplicationsTableProps {
  limit?: number
}

export function ApplicationsTable({ limit }: ApplicationsTableProps) {
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [applicationToReject, setApplicationToReject] = useState<Application | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    setLoading(true)
    const allApplications = getApplications()

    const sortedApplications = allApplications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    const limitedApplications = limit ? sortedApplications.slice(0, limit) : sortedApplications

    setApplications(limitedApplications)
    setLoading(false)
  }, [limit])

  const handleViewApplication = (applicationId: string) => {
    toast({
      title: "Viewing application",
      description: `Opening application ${applicationId} for review.`,
    })
  }

  const handleViewDocuments = (applicationId: string) => {
    const application = applications.find((app) => app.id === applicationId)
    if (application) {
      setSelectedApplication(application)
      setDocumentsModalOpen(true)
    }
  }

  const handleApproveApplication = (applicationId: string) => {
    const updatedApplication = updateApplication(applicationId, { status: "approved" })

    if (updatedApplication) {
      setApplications(applications.map((app) => (app.id === applicationId ? { ...app, status: "approved" } : app)))

      toast({
        title: "Application approved",
        description: `Application ${applicationId} has been approved.`,
        variant: "success",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openRejectDialog = (application: Application) => {
    setApplicationToReject(application)
    setRejectionReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectApplication = () => {
    if (!applicationToReject) return

    if (!rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejecting this application.",
        variant: "destructive",
      })
      return
    }

    setIsRejecting(true)
    const updatedApplication = updateApplication(applicationToReject.id, { 
      status: "rejected",
      feedback: rejectionReason.trim()
    })

    if (updatedApplication) {
      setApplications(applications.map((app) => 
        app.id === applicationToReject.id 
          ? { ...app, status: "rejected", feedback: rejectionReason.trim() } 
          : app
      ))

      toast({
        title: "Application rejected",
        description: `Application for ${applicationToReject.fullName} has been rejected.`,
        variant: "default",
      })

      setRejectDialogOpen(false)
      setApplicationToReject(null)
      setRejectionReason("")
    } else {
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      })
    }
    setIsRejecting(false)
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Application ID</TableHead>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead className="w-[250px]">Course</TableHead>
              <TableHead className="w-[200px]">School</TableHead>
              <TableHead className="w-[120px]">Year Level</TableHead>
              <TableHead className="w-[150px]">Location</TableHead>
              <TableHead className="w-[140px]">Date Applied</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Loading applications...
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No applications found. Students need to apply for scholarships to see them here.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium w-[120px] font-mono text-sm">{application.id}</TableCell>
                  <TableCell className="w-[200px] font-medium">{application.fullName}</TableCell>
                  <TableCell className="w-[250px] text-sm">{application.course}</TableCell>
                  <TableCell className="w-[200px] text-sm">{application.school}</TableCell>
                  <TableCell className="w-[120px] text-sm">{application.yearLevel}</TableCell>
                  <TableCell className="w-[150px] text-sm text-muted-foreground">{application.barangay}</TableCell>
                  <TableCell className="w-[140px] text-sm">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="w-[100px]">
                    <Badge
                      variant={
                        application.status === "approved"
                          ? "success"
                          : application.status === "rejected"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-[80px] text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocuments(application.id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleApproveApplication(application.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRejectDialog(application)}>
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={documentsModalOpen} onOpenChange={setDocumentsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              Student Documents - {selectedApplication?.fullName}
            </DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-emerald-800">Application ID:</span>
                    <p className="text-emerald-700">{selectedApplication.id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-emerald-800">Course:</span>
                    <p className="text-emerald-700">{selectedApplication.course}</p>
                  </div>
                  <div>
                    <span className="font-medium text-emerald-800">School:</span>
                    <p className="text-emerald-700">{selectedApplication.school}</p>
                  </div>
                  <div>
                    <span className="font-medium text-emerald-800">Date Applied:</span>
                    <p className="text-emerald-700">{new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Academic Records
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Official transcript and grades</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Status: <span className="text-green-600 font-medium">Verified</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      Financial Documents
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Income statements and tax documents</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Status: <span className="text-green-600 font-medium">Verified</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Identification
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Valid government-issued ID</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Status: <span className="text-green-600 font-medium">Verified</span>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Enrollment Certificate
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Current enrollment verification</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Status: <span className="text-green-600 font-medium">Verified</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setDocumentsModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    toast({
                      title: "Documents verified",
                      description: `All documents for ${selectedApplication.fullName} have been verified.`,
                    })
                  }}
                >
                  Mark as Verified
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setRejectDialogOpen(false)
          setApplicationToReject(null)
          setRejectionReason("")
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              You are about to reject the application for <span className="font-medium">{applicationToReject?.fullName}</span>. 
              Please provide a reason for rejection. This will be visible to the student.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg border text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Application ID:</span>
                  <p className="font-medium">{applicationToReject?.id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Course:</span>
                  <p className="font-medium">{applicationToReject?.course}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm font-medium">
                Reason for Rejection <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Incomplete documents, Ineligible based on residency requirements, Missing academic records..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be displayed to the student in their dashboard.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectDialogOpen(false)
                setApplicationToReject(null)
                setRejectionReason("")
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectApplication}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
