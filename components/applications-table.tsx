"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Check, X, FileText, Loader2, ExternalLink, ChevronRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

// IMPORT OUR REAL FIRESTORE FUNCTIONS
import { 
  getApplicationsDb, 
  updateApplicationStatusDb, 
  getDocumentsByStudentIdDb,
  type Application,
  type Document 
} from "@/lib/storage"

interface ApplicationsTableProps {
  limit?: number
}

// Converts Base64 to a trusted browser Blob URL for the "Open in new tab" button
const openBase64InNewTab = async (base64Data: string) => {
  try {
    const response = await fetch(base64Data)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank')
  } catch (error) {
    console.error("Failed to open document", error)
    window.open(base64Data, '_blank')
  }
}

export function ApplicationsTable({ limit }: ApplicationsTableProps) {
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal States
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [studentDocs, setStudentDocs] = useState<Document[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  
  // NEW: Keep track of which document is currently active in the viewer
  const [activeDocument, setActiveDocument] = useState<Document | null>(null)
  
  // Rejection States
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [applicationToReject, setApplicationToReject] = useState<Application | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)
  const [isApproving, setIsApproving] = useState<string | null>(null)

  // 1. Fetch Applications on Load
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true)
      try {
        const allApplications = await getApplicationsDb()
        const limitedApplications = limit ? allApplications.slice(0, limit) : allApplications
        setApplications(limitedApplications)
      } catch (error) {
        console.error("Error:", error)
        toast({ title: "Error", description: "Failed to load applications.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [limit, toast])

  // 2. Fetch Real Base64 Documents for the Modal
  const handleViewDocuments = async (application: Application) => {
    setSelectedApplication(application)
    setDocumentsModalOpen(true)
    setLoadingDocs(true)
    setStudentDocs([])
    setActiveDocument(null)

    try {
      const docs = await getDocumentsByStudentIdDb(application.studentId)
      setStudentDocs(docs)
      // Automatically select the first document to display when the modal opens
      if (docs.length > 0) {
        setActiveDocument(docs[0])
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not retrieve student documents.", variant: "destructive" })
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleApproveApplication = async (applicationId: string) => {
    setIsApproving(applicationId)
    try {
      await updateApplicationStatusDb(applicationId, "approved")
      setApplications(applications.map((app) => (app.id === applicationId ? { ...app, status: "approved" } : app)))
      toast({ title: "Approved!", description: "Application status updated.", variant: "success" })
    } catch (error) {
      toast({ title: "Error", description: "Approval failed.", variant: "destructive" })
    } finally {
      setIsApproving(null)
    }
  }

  const handleRejectApplication = async () => {
    if (!applicationToReject || !rejectionReason.trim()) return
    setIsRejecting(true)
    try {
      await updateApplicationStatusDb(applicationToReject.id, "rejected", rejectionReason.trim())
      setApplications(applications.map((app) => 
        app.id === applicationToReject.id 
          ? { ...app, status: "rejected", feedback: rejectionReason.trim() } 
          : app
      ))
      setRejectDialogOpen(false)
      toast({ title: "Rejected", description: "Student has been notified." })
    } catch (error) {
      toast({ title: "Error", description: "Rejection failed.", variant: "destructive" })
    } finally {
      setIsRejecting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString() } catch (e) { return "N/A" }
  }

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Application ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center">Loading Firestore data...</TableCell></TableRow>
            ) : applications.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center">No applications found.</TableCell></TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-mono text-xs">{app.id}</TableCell>
                  <TableCell className="font-medium">{app.fullName}</TableCell>
                  <TableCell className="text-sm">{app.course}</TableCell>
                  <TableCell className="text-sm">{app.school}</TableCell>
                  <TableCell className="text-sm">{app.barangay}</TableCell>
                  <TableCell className="text-sm">{formatDate(app.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={app.status === "approved" ? "success" : app.status === "rejected" ? "destructive" : "outline"}>
                      {app.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isApproving === app.id}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDocuments(app)}>
                          <FileText className="mr-2 h-4 w-4" /> View Documents
                        </DropdownMenuItem>
                        {app.status === "pending" && (
                          <>
                            <DropdownMenuItem className="text-green-600" onClick={() => handleApproveApplication(app.id)}>
                              <Check className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => { setApplicationToReject(app); setRejectDialogOpen(true); }}>
                              <X className="mr-2 h-4 w-4" /> Reject
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

      {/* --- SPLIT-PANE DOCUMENTS MODAL --- */}
      <Dialog open={documentsModalOpen} onOpenChange={setDocumentsModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
            <DialogTitle className="text-xl">Documents for {selectedApplication?.fullName}</DialogTitle>
            <DialogDescription>Select a document from the sidebar to view it.</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar: List of Documents */}
            <div className="w-1/3 max-w-[300px] border-r bg-white flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {loadingDocs ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                    </div>
                  ) : studentDocs.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-10">No documents found.</p>
                  ) : (
                    studentDocs.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setActiveDocument(doc)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-2 ${
                          activeDocument?.id === doc.id 
                            ? 'bg-green-50 border-green-500 ring-1 ring-green-500 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-green-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between w-full">
                          <span className="font-semibold text-sm text-slate-800 pr-2">{doc.name}</span>
                          <Badge variant={activeDocument?.id === doc.id ? "default" : "secondary"} className="text-[10px] uppercase">
                            {doc.type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between w-full text-xs text-slate-500">
                          <span>{doc.fileSize}</span>
                          {activeDocument?.id === doc.id && <ChevronRight className="h-4 w-4 text-green-600" />}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Main Viewer: Fixed Full Height */}
            <div className="flex-1 bg-slate-100 flex flex-col relative">
              {activeDocument ? (
                <div className="flex-1 flex flex-col w-full h-full">
                  
                  {/* Top Bar for active document */}
                  <div className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                    <span className="font-semibold text-slate-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600"/>
                      {activeDocument.name}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-green-200 hover:bg-green-50 hover:text-green-700"
                      onClick={() => openBase64InNewTab(activeDocument.url)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" /> 
                      Open in New Tab
                    </Button>
                  </div>

                  {/* The Document Itself (Scroll is contained inside here!) */}
                  <div className="flex-1 p-4 overflow-hidden flex items-center justify-center">
                    {activeDocument.type === 'pdf' ? (
                      <div className="w-full h-full bg-white rounded-lg shadow-md border overflow-hidden">
                        <object 
                          data={activeDocument.url} 
                          type="application/pdf" 
                          className="w-full h-full"
                        >
                          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
                            <FileText className="h-16 w-16 text-slate-300" />
                            <p className="text-slate-500">PDF Viewer not supported in this browser.</p>
                            <Button onClick={() => openBase64InNewTab(activeDocument.url)}>
                              Download / Open PDF
                            </Button>
                          </div>
                        </object>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-md border p-2 overflow-hidden">
                        <img 
                          src={activeDocument.url} 
                          alt={activeDocument.name} 
                          className="max-w-full max-h-full object-contain rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <FileText className="h-16 w-16 mb-4 opacity-20" />
                  <p>Select a document from the left to view it here.</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-4 border-t bg-white shrink-0">
            <Button variant="outline" onClick={() => setDocumentsModalOpen(false)}>Close Viewer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- REJECT DIALOG --- */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {applicationToReject?.fullName}&apos;s application.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Reason for Rejection</Label>
            <Textarea 
              placeholder="e.g. Incomplete documents, invalid ID..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectApplication} disabled={isRejecting || !rejectionReason.trim()}>
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}