"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentLayout } from "@/components/student-layout"
import { DocumentUpload } from "@/components/document-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, CheckCircle, AlertCircle, Clock, Download, Eye, FolderOpen, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

// IMPORT ONLY FIRESTORE FUNCTIONS
import { 
  getDocumentsByStudentIdDb, 
  getStudentApplicationDb,
  createApplicationDb,
  type Document,
  type StudentProfile
} from "@/lib/storage"

export default function DocumentsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("upload")
  const [documentHistory, setDocumentHistory] = useState<Document[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasApplication, setHasApplication] = useState(false)

  // Load documents and check application status from storage
  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        setIsLoadingHistory(true)
        try {
          const [docs, app] = await Promise.all([
            getDocumentsByStudentIdDb(user.id),
            getStudentApplicationDb(user.id)
          ])
          setDocumentHistory(docs)
          setHasApplication(!!app)
        } catch (error) {
          console.error("Error fetching docs", error)
        } finally {
          setIsLoadingHistory(false)
        }
      }
    }
    checkStatus()
  }, [user, activeTab])

  // Refresh documents when switching to history tab
  const handleTabChange = async (value: string) => {
    setActiveTab(value)
    if (value === "history" && user) {
      setIsLoadingHistory(true)
      try {
        const docs = await getDocumentsByStudentIdDb(user.id)
        setDocumentHistory(docs)
      } catch (error) {
        console.error(error)
      } finally {
        setIsLoadingHistory(false)
      }
    }
  }

  // --- SUBMIT APPLICATION LOGIC ---
  const handleSubmitApplication = async () => {
    if (!user) return

    // Require at least 1 document to apply
    if (documentHistory.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Requirements",
        description: "You must upload your required documents before submitting an application.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const profile = user.profileData as StudentProfile || {}
      
      // Create the official pending application
      await createApplicationDb({
        studentId: user.id,
        fullName: profile.fullName || user.name,
        email: user.email,
        course: profile.course || "Not specified",
        yearLevel: profile.yearLevel || "Not specified",
        school: profile.schoolName || "Not specified",
        barangay: profile.barangay || "Not specified",
        isPWD: profile.isPWD || false,
        status: "pending",
      })

      setHasApplication(true)
      toast({
        title: "Application Submitted!",
        description: "Your scholarship application is now pending review by the admin.",
        variant: "success",
      })
      
      // Switch to history tab to view status
      setActiveTab("history")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  const handleViewDocument = (doc: Document) => {
    if (doc.url) {
      // In our setup, doc.url holds the Base64 string
      if (doc.type === 'pdf') {
        // Convert base64 to a Blob for safe viewing in a new tab
        try {
          fetch(doc.url)
            .then(res => res.blob())
            .then(blob => {
              const blobUrl = URL.createObjectURL(blob)
              window.open(blobUrl, '_blank')
            })
        } catch (e) {
          window.open(doc.url, '_blank')
        }
      } else {
        // Images can be opened directly usually
        window.open(doc.url, '_blank')
      }
    } else {
      toast({ title: "Error", description: "Document file not found.", variant: "destructive" })
    }
  }

  const handleDownloadDocument = (doc: Document) => {
    if (doc.url) {
      const a = document.createElement("a")
      a.href = doc.url
      a.download = `${doc.name}.${doc.type}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Upload and manage your scholarship documents</p>
        </div>
      </div>

      <Tabs value={activeTab} className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="history">Document History</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Required Documents</CardTitle>
              <CardDescription>Upload all required documents for your scholarship application</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Passes a callback so DocumentUpload can tell this page when a file is uploaded */}
              <DocumentUpload onUploadComplete={() => handleTabChange("history")} />
              
              <div className="flex justify-end mt-6 border-t pt-6">
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white" 
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting || hasApplication}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {hasApplication ? "Application Already Submitted" : "Submit Scholarship Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document History</CardTitle>
              <CardDescription>View the status and history of your uploaded documents</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Loading documents...</p>
                </div>
              ) : documentHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <FolderOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No documents uploaded yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload your required documents in the Upload tab to see them here
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("upload")}>
                    Go to Upload
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentHistory.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">{doc.fileSize || "Unknown size"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p>{doc.semester || "1st Semester"}</p>
                            <p className="text-xs text-muted-foreground">{doc.academicYear || "2023-2024"}</p>
                          </TableCell>
                          <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {doc.status === "approved" && (
                                <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                                  <CheckCircle className="h-3 w-3" />
                                  Approved
                                </Badge>
                              )}
                              {doc.status === "rejected" && (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Rejected
                                </Badge>
                              )}
                              {doc.status === "pending" && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            {doc.status === "rejected" && doc.feedback && (
                              <p className="text-xs text-red-500 mt-1">{doc.feedback}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc)}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc)}>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Requirements</CardTitle>
              <CardDescription>List of required documents for scholarship application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">General Requirements</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Enrollment Form (PDF format)</li>
                    <li>Official Receipt (if applicable, PDF format)</li>
                    <li>Last Semester's Grades (PDF format)</li>
                    <li>School ID or Government ID (JPG or PNG format)</li>
                    <li>2x2 ID Picture (JPG or PNG format)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Barangay Requirements</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Barangay Clearance (PDF format)</li>
                    <li>Indigency Certificate (PDF format)</li>
                    <li>Letter of Request from Parent/Guardian (PDF format)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium">File Requirements</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Maximum file size: 5MB per document</li>
                    <li>Accepted formats: PDF, JPG, PNG</li>
                    <li>Documents must be clear and legible</li>
                    <li>All pages must be included in a single file</li>
                  </ul>
                </div>

                <div className="rounded-md bg-amber-50 p-4 text-amber-800 border border-amber-200">
                  <h4 className="font-medium">Important Notes:</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    <li>All documents must be submitted before the deadline to be considered for the scholarship.</li>
                    <li>Incomplete or illegible documents may result in rejection of your application.</li>
                    <li>
                      If any document is rejected, you will receive feedback and can resubmit the corrected document.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StudentLayout>
  )
}