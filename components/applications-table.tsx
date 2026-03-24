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

// IMPORT OUR NEW FIRESTORE FUNCTIONS
import { getApplicationsDb, updateApplicationStatusDb } from "@/lib/storage"
import { type Application } from "@/lib/storage"

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
  const [isApproving, setIsApproving] = useState<string | null>(null)

  // Load real data from Firestore
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true)
      try {
        const allApplications = await getApplicationsDb()
        const limitedApplications = limit ? allApplications.slice(0, limit) : allApplications
        setApplications(limitedApplications)
      } catch (error) {
        console.error("Error fetching applications:", error)
        toast({
          title: "Error",
          description: "Failed to load applications from the database.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [limit, toast])

  const handleViewDocuments = (applicationId: string) => {
    const application = applications.find((app) => app.id === applicationId)
    if (application) {
      setSelectedApplication(application)
      setDocumentsModalOpen(true)
    }
  }

  const handleApproveApplication = async (applicationId: string) => {
    setIsApproving(applicationId)
    try {
      // UPDATE STATUS IN FIRESTORE
      await updateApplicationStatusDb(applicationId, "approved")

      // Update local state to reflect change immediately
      setApplications(applications.map((app) => (app.id === applicationId ? { ...app, status: "approved" } : app)))

      toast({
        title: "Application approved",
        description: "The application has been successfully approved in the database.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve application. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsApproving(null)
    }
  }

  const openRejectDialog = (application: Application) => {
    setApplicationToReject(application)
    setRejectionReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectApplication = async () => {
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
    try {
      // UPDATE STATUS IN FIRESTORE
      await updateApplicationStatusDb(applicationToReject.id, "rejected", rejectionReason.trim())

      // Update local state
      setApplications(applications.map((app) => 
        app.id === applicationToReject.id 
          ? { ...app, status: "rejected", feedback: rejectionReason.trim() } 
          : app
      ))

      toast({
        title: "Application rejected",
        description: `Application for ${applicationToReject.fullName} has been rejected.`,
      })

      setRejectDialogOpen(false)
      setApplicationToReject(null)
      setRejectionReason("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject application.",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  // Helper to format the Date consistently
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch (e) {
      return "N/A"
    }
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
                  Loading applications from Firestore...
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No applications found in the database.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium w-[120px] font-mono text-xs">{application.id}</TableCell>
                  <TableCell className="w-[200px] font-medium">{application.fullName}</TableCell>
                  <TableCell className="w-[250px] text-sm">{application.course}</TableCell>
                  <TableCell className="w-[200px] text-sm">{application.school}</TableCell>
                  <TableCell className="w-[120px] text-sm">{application.yearLevel}</TableCell>
                  <TableCell className="w-[150px] text-sm text-muted-foreground">{application.barangay}</TableCell>
                  <TableCell className="w-[140px] text-sm">
                    {formatDate(application.createdAt)}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isApproving === application.id}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocuments(application.id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Documents
                        </DropdownMenuItem>
                        {application.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleApproveApplication(application.id)}>
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRejectDialog(application)}>
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
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

      {/* Rejection and Documents Modals remain mostly the same UI-wise ... */}
      {/* (Skipping identical UI code for brevity, ensure the rejection handler matches the function above) */}
      
      {/* [Keep your existing Dialog components for documentsModalOpen and rejectDialogOpen here, 
          ensuring handleRejectApplication is the one we defined with 'async' above] */}
    </>
  )
}