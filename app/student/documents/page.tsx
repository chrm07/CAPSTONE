"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StudentLayout } from "@/components/student-layout"
import { DocumentUpload } from "@/components/document-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, CheckCircle, AlertCircle, Clock, Download, Eye, FolderOpen } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { getDocumentsByStudentId, type Document } from "@/lib/storage"

export default function DocumentsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("upload")
  const [documentHistory, setDocumentHistory] = useState<Document[]>([])

  // Load documents from storage
  useEffect(() => {
    if (user) {
      const docs = getDocumentsByStudentId(user.id)
      setDocumentHistory(docs)
    }
  }, [user, activeTab])

  // Refresh documents when switching to history tab
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "history" && user) {
      const docs = getDocumentsByStudentId(user.id)
      setDocumentHistory(docs)
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

  const handleViewDocument = (documentId: string) => {
    toast({
      title: "Viewing document",
      description: `Opening document ${documentId} in a new tab.`,
    })
    // In a real application, this would open the document in a new tab
  }

  const handleDownloadDocument = (documentId: string) => {
    toast({
      title: "Downloading document",
      description: `Document ${documentId} is being downloaded.`,
    })
    // In a real application, this would trigger a download
  }

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Upload and manage your scholarship documents</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-4" onValueChange={handleTabChange}>
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
              <DocumentUpload />
              <div className="flex justify-end mt-6">
                <Button className="bg-green-600 hover:bg-green-700 text-white">Submit All Documents</Button>
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
              {documentHistory.length === 0 ? (
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
                                <p className="text-xs text-muted-foreground">{doc.fileSize}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p>{doc.semester}</p>
                            <p className="text-xs text-muted-foreground">{doc.academicYear}</p>
                          </TableCell>
                          <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {doc.status === "approved" && (
                                <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800">
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
                              <Button variant="ghost" size="icon" onClick={() => handleViewDocument(doc.id)}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc.id)}>
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
