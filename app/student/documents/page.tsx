"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentLayout } from "@/components/student-layout"
import { DocumentUpload } from "@/components/document-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  FileText, CheckCircle, AlertCircle, Clock, 
  Download, Eye, FolderOpen, Loader2, Send 
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

import { 
  getDocumentsByStudentIdDb, 
  getStudentApplicationDb,
  createApplicationDb,
  notifyAdminsDb,
  type Document,
  type StudentProfile
} from "@/lib/storage"

// Defined requirements to match your UI info
const REQUIRED_DOCS = ["Enrollment Form", "Grades", "School ID", "Barangay Clearance"]

export default function DocumentsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState("upload")
  const [documentHistory, setDocumentHistory] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [application, setApplication] = useState<any>(null)

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [docs, app] = await Promise.all([
        getDocumentsByStudentIdDb(user.id),
        getStudentApplicationDb(user.id)
      ])
      setDocumentHistory(docs)
      setApplication(app)
    } catch (error) {
      console.error("Failed to fetch document data:", error)
      toast({ title: "Error", description: "Could not load your document data.", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // --- SUBMISSION LOGIC ---
  const checkRequirementsMet = () => {
    const uploadedTypes = new Set(documentHistory.map(d => d.name))
    return REQUIRED_DOCS.every(req => uploadedTypes.has(req))
  }

  const handleSubmitApplication = async () => {
    if (!user) return

    if (!checkRequirementsMet()) {
      toast({
        variant: "destructive",
        title: "Incomplete Requirements",
        description: `Please upload all required files: ${REQUIRED_DOCS.join(", ")}`,
      })
      return
    }

    setIsSubmitting(true)
    try {
      const profile = user.profileData as StudentProfile || {}
      
      // 1. Create Application Record
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

      // 2. Alert Admins
      await notifyAdminsDb(
        "New Application Received",
        `${profile.fullName || user.name} from ${profile.barangay} has submitted their documents for review.`,
        "/admin/applications"
      )

      toast({ title: "Success!", description: "Your application has been submitted to the LGU.", variant: "success" })
      
      // Refresh and redirect
      await loadData()
      setActiveTab("history")
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Submission failed. Please try again later." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- FILE HELPERS ---
  const handleViewFile = (url?: string, type?: string) => {
    if (!url) return toast({ title: "Error", description: "File link broken.", variant: "destructive" })
    
    if (type === 'pdf') {
      fetch(url).then(res => res.blob()).then(blob => {
        const blobUrl = URL.createObjectURL(blob)
        window.open(blobUrl, '_blank')
      }).catch(() => window.open(url, '_blank'))
    } else {
      window.open(url, '_blank')
    }
  }

  const handleDownloadFile = (doc: Document) => {
    if (!doc.url) return
    const link = document.createElement("a")
    link.href = doc.url
    link.download = `${doc.name}_${user?.name || 'document'}.${doc.type}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 🔥 THE MISSING FUNCTION IS RESTORED HERE
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      }).format(date)
    } catch (e) {
      return "N/A"
    }
  }

  return (
    <StudentLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Document Management</h1>
        <p className="text-slate-500 mt-1">Upload, track, and manage your scholarship requirements.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 border">
          <TabsTrigger value="upload" className="gap-2"><FileText className="h-4 w-4" /> Upload</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" /> History</TabsTrigger>
          <TabsTrigger value="requirements" className="gap-2"><AlertCircle className="h-4 w-4" /> Checklist</TabsTrigger>
        </TabsList>

        {/* --- UPLOAD TAB --- */}
        <TabsContent value="upload">
          <Card className="border-none shadow-md overflow-hidden">
            <div className="h-1.5 bg-emerald-500 w-full" />
            <CardHeader>
              <CardTitle>Submit Requirements</CardTitle>
              <CardDescription>Upload your digital copies. Supported formats: PDF, JPG, PNG (Max 5MB).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <DocumentUpload onUploadComplete={loadData} />
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mt-6">
                <div className="text-sm text-slate-600">
                  {application ? (
                    <span className="flex items-center gap-2 text-emerald-600 font-medium">
                      <CheckCircle className="h-4 w-4" /> Application already submitted
                    </span>
                  ) : (
                    <span>Ensure all 4 core requirements are uploaded before submitting.</span>
                  )}
                </div>
                <Button 
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting || !!application}
                  className="bg-emerald-600 hover:bg-emerald-700 min-w-[180px]"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  {application ? "Submitted" : "Submit to Admin"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- HISTORY TAB --- */}
        <TabsContent value="history">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>Track the review status of your documents.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-500" /></div>
              ) : documentHistory.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No documents found. Start by uploading in the first tab.</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-white overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documentHistory.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            <div>
                               <p className="leading-none">{doc.name}</p>
                               <span className="text-[10px] text-slate-400 uppercase">{doc.fileSize}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {doc.semester} <br/> <span className="text-xs text-slate-400">{doc.academicYear}</span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</TableCell>
                          <TableCell>
                            <Badge variant={doc.status === "approved" ? "success" : doc.status === "rejected" ? "destructive" : "outline"} className="capitalize">
                              {doc.status}
                            </Badge>
                            {doc.status === "rejected" && doc.feedback && (
                              <p className="text-[10px] text-red-500 mt-1 italic">"{doc.feedback}"</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleViewFile(doc.url, doc.type)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDownloadFile(doc)}><Download className="h-4 w-4" /></Button>
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

        {/* --- REQUIREMENTS TAB --- */}
        <TabsContent value="requirements">
          <Card className="border-none shadow-md">
            <CardHeader><CardTitle>Submission Checklist</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500"/> Core Requirements</h3>
                  <ul className="space-y-3">
                    {REQUIRED_DOCS.map(req => (
                      <li key={req} className="flex items-center gap-3 text-sm text-slate-600">
                        <div className={`h-2 w-2 rounded-full ${documentHistory.some(d => d.name === req) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {req}
                      </li>
                    ))}
                  </ul>
               </div>
               <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                  <h4 className="font-bold text-amber-900 mb-2">Important Instructions</h4>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Please ensure all uploaded documents are clear and readable. Blurred documents will be rejected by the verifier staff. Once you submit your application, you cannot delete documents until a staff member reviews them.
                  </p>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StudentLayout>
  )
}