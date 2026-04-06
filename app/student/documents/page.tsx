"use client"

import { useState, useEffect } from "react"
import { StudentLayout } from "@/components/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { 
  FileText, CheckCircle, AlertCircle, Trash2, 
  Eye, Loader2, Lock, Download, X, CalendarDays, UploadCloud
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"

import { collection, query, where, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase" 
import { createDocumentDb, createApplicationDb } from "@/lib/storage"

const REQUIRED_DOC_TYPES = [
  { id: "app_form", name: "Filled-out Application Form" },
  { id: "reg_form", name: "School Registration Form" },
  { id: "receipt", name: "Enrollment Receipt" },
  { id: "id_cert", name: "School ID / Cert of Non-issuance" },
  { id: "indigency", name: "Original Barangay Indigency" },
  { id: "clearance", name: "Original Barangay Clearance" },
  { id: "mayor_letter", name: "Letter to City Mayor" },
  { id: "voter_cert", name: "Voter's Certification" },
  { id: "grades", name: "Previous Grades" }
]

export default function StudentDocumentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<any[]>([])
  const [application, setApplication] = useState<any>(null)
  const [schedule, setSchedule] = useState<any>(null) 
  const [isLoading, setIsLoading] = useState(true)
  
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => {
    if (!user) return
    setIsLoading(true)

    const unsubs: (() => void)[] = []

    unsubs.push(onSnapshot(doc(db, "settings", "schedule"), (docSnap) => {
      if (docSnap.exists()) setSchedule(docSnap.data())
    }))

    const docsQ = query(collection(db, "documents"), where("studentId", "==", user.id))
    unsubs.push(onSnapshot(docsQ, (snapshot) => {
      const activeDocs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((d: any) => !d.isArchived)
      setDocuments(activeDocs)
    }))

    const appQ = query(collection(db, "applications"), where("studentId", "==", user.id))
    unsubs.push(onSnapshot(appQ, async (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const activeApp = apps.find((a: any) => !a.isArchived)
      setApplication(activeApp || null)
      setIsLoading(false)
    }))

    return () => {
      unsubs.forEach(unsub => unsub())
    }
  }, [user])

  // 🔥 CORE FIX: Unlock the portal if the application is 'rejected'
  const isActuallySubmitted = application?.status === 'pending' || application?.status === 'approved';
  const canUpload = schedule?.submissionOpen && !isActuallySubmitted && !application?.isClaimed;
  const isLocked = !canUpload;
  
  const uploadedCount = REQUIRED_DOC_TYPES.filter(req => documents.some(d => (d.categoryName || d.name) === req.name)).length
  const hasAllDocuments = uploadedCount === REQUIRED_DOC_TYPES.length;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, reqName: string) => {
    if (!canUpload) return 
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Please upload a file smaller than 5MB." })
      e.target.value = ''
      return
    }

    try {
      setUploadingId(reqName)
      
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

      if (!cloudName || !uploadPreset) throw new Error("Cloudinary credentials missing")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)
      formData.append("folder", `bts_documents/${user.id}`)

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
      const res = await fetch(cloudinaryUrl, { method: "POST", body: formData })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      
      await createDocumentDb({
        studentId: user.id,
        name: file.name,
        categoryName: reqName,
        url: data.secure_url, 
        type: file.type,
        uploadedAt: new Date().toISOString()
      })

      toast({ title: "Success", description: `${reqName} uploaded!`, className: "bg-emerald-600 text-white border-none" })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: error.message })
    } finally {
      setUploadingId(null)
      e.target.value = '' 
    }
  }

  const handleDelete = async (docId: string) => {
    if (!canUpload) return
    try {
      await deleteDoc(doc(db, "documents", docId))
      toast({ title: "Deleted", description: "Document removed." })
    } catch (e) { 
      toast({ variant: "destructive", title: "Error", description: "Could not delete document." }) 
    }
  }

  const handleSubmitApplication = async () => {
    if (!user) return
    setIsSubmitting(true)
    
    try {
      const profile = user.profileData as any || {}
      const isResubmission = application?.status === 'rejected';
      
      if (application?.id) {
        await updateDoc(doc(db, "applications", application.id), {
          isSubmitted: true,
          isApproved: false,
          isRejected: false, // 🔥 RESET: Clear rejection status
          isClaimed: false,
          status: "pending", // 🔥 RESET: Move back to pending for Admin review
          round: schedule?.round || 1,
          updatedAt: new Date().toISOString()
        })
      } else {
        await createApplicationDb({
          studentId: user.id,
          status: 'pending',
          isSubmitted: true,
          isApproved: false,
          isRejected: false,
          isClaimed: false,
          isArchived: false,
          round: schedule?.round || 1,
          school: profile.schoolName || "N/A",
          course: profile.course || "N/A",
          yearLevel: profile.yearLevel || "N/A",
          semester: profile.semester || "N/A",
          fullName: profile.fullName || user.name || "Unknown",
          barangay: profile.barangay || "Unknown",
        })
      }

      await addDoc(collection(db, "activity_logs"), {
        studentId: user.id,
        action: isResubmission ? "Application Resubmitted" : "Application Submitted",
        details: isResubmission ? "Student updated documents and resubmitted." : "Application documents submitted for review.",
        timestamp: new Date().toISOString(),
        type: "submission"
      })

      // NOTIFY ADMIN: Alert them that documents have been corrected
      await addDoc(collection(db, "notifications"), {
        to: "admin",
        senderId: user.id,
        userId: "admin", 
        message: isResubmission 
          ? `${profile.fullName || user.name} has corrected and resubmitted their documents.`
          : `${profile.fullName || user.name} has submitted a new application.`,
        link: "/admin/applications",
        read: false,
        createdAt: new Date().toISOString()
      })

      toast({ 
        title: isResubmission ? "Application Resubmitted!" : "Application Submitted!", 
        description: "Your documents are now under review.", 
        className: "bg-emerald-600 text-white border-none" 
      })
    } catch (error) {
      toast({ variant: "destructive", title: "Submission Failed" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-emerald-600">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm font-bold tracking-widest uppercase text-slate-400">Loading Documents...</p>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-emerald-900 uppercase">Document Portal</h1>
          <p className="text-slate-500 font-medium">Follow the steps below to complete your application.</p>
        </div>

        {/* ADMIN FEEDBACK / REJECTION ALERT */}
        {application?.status === 'rejected' && (
          <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-3xl p-6">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <AlertTitle className="text-red-800 font-black uppercase tracking-tight ml-2">Action Required: Application Rejected</AlertTitle>
            <AlertDescription className="text-red-700 font-medium mt-2 ml-2">
              <p className="text-lg font-bold">Reason: {application.feedback || "Please review and update your documents."}</p>
              <p className="text-sm mt-1 opacity-80 italic">The portal has been unlocked. You can now delete incorrect documents and upload corrected versions below.</p>
            </AlertDescription>
          </Alert>
        )}

        {!schedule?.submissionOpen && (
          <div className="bg-slate-50 border-2 border-slate-200 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm animate-in zoom-in-95">
            <div className="bg-slate-200 p-4 rounded-full shrink-0">
              <CalendarDays className="h-8 w-8 text-slate-500" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-2xl">Submissions Closed</h3>
              <p className="text-slate-600 font-bold mt-2 text-lg">
                The application period is not currently active.
              </p>
            </div>
          </div>
        )}

        <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100 flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-emerald-400/30">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border border-white/30 shrink-0">1</div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-tight">Step 1: Download Official Form</h3>
              <p className="text-emerald-50 text-sm font-medium">Download, print, and fill out the BTS Application Form before uploading.</p>
            </div>
          </div>
          <Button asChild className="bg-white text-emerald-600 hover:bg-emerald-50 rounded-2xl font-black h-14 px-8 shrink-0 shadow-lg">
            <a href="/BTS_Application_Form.pdf" download>
              <Download className="mr-2 h-5 w-5" /> Download Form
            </a>
          </Button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-emerald-800 uppercase tracking-tight text-sm">Step 2: Upload Progress</h3>
            <Badge variant="outline" className="font-black text-emerald-700 border-emerald-200 bg-emerald-50 px-3 py-1">
              {uploadedCount} / {REQUIRED_DOC_TYPES.length} Completed
            </Badge>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${(uploadedCount / REQUIRED_DOC_TYPES.length) * 100}%` }} />
          </div>
        </div>

        <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${!schedule?.submissionOpen ? "opacity-60 grayscale" : ""}`}>
          {REQUIRED_DOC_TYPES.map((req) => {
            const uploadedDoc = documents.find(d => (d.categoryName || d.name) === req.name)
            const isUploading = uploadingId === req.name
            
            return (
              <Card key={req.id} className={`rounded-3xl border-2 shadow-sm flex flex-col transition-all ${uploadedDoc ? 'border-emerald-200 bg-white' : 'border-dashed border-slate-200 bg-slate-50/50'}`}>
                <CardHeader className="p-5 pb-3 flex flex-row justify-between items-start gap-2 space-y-0">
                  <CardTitle className="text-sm font-black text-slate-800 leading-tight">{req.name}</CardTitle>
                  {uploadedDoc ? <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" /> : <AlertCircle className="h-5 w-5 text-slate-300 shrink-0" />}
                </CardHeader>
                
                <CardContent className="p-5 pt-0 mt-auto">
                  {uploadedDoc ? (
                    <div className="flex flex-col gap-2">
                      <Badge className="w-fit bg-emerald-50 text-emerald-700 border-emerald-100 shadow-none mb-2 font-bold uppercase text-[10px] tracking-widest">Uploaded</Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-10 rounded-xl font-bold bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => setViewingDoc({ url: uploadedDoc.url, name: req.name })}>
                          <Eye className="h-4 w-4 mr-2" /> Review
                        </Button>
                        {!isLocked && (
                          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-slate-400 border-slate-200 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(uploadedDoc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      {isLocked ? (
                        <div className="bg-slate-100 rounded-2xl p-4 text-center border border-slate-200">
                          <Lock className="h-5 w-5 mx-auto mb-1 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {!schedule?.submissionOpen ? "Submissions Closed" : "Locked"}
                          </span>
                        </div>
                      ) : (
                        <label className={`cursor-pointer group flex flex-col items-center justify-center py-4 border-2 border-dashed rounded-2xl transition-all ${isUploading ? 'border-emerald-400 bg-emerald-100/50' : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/80'}`}>
                          {isUploading ? <Loader2 className="h-5 w-5 text-emerald-600 animate-spin mb-1" /> : <UploadCloud className="h-5 w-5 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />}
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isUploading ? 'text-emerald-800' : 'text-emerald-700'}`}>
                            {isUploading ? "Uploading..." : "Click to Upload"}
                          </span>
                          <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleUpload(e, req.name)} disabled={!canUpload || isUploading} />
                        </label>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {canUpload && (
           <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm ${hasAllDocuments ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <h3 className={`font-black uppercase tracking-tight text-xl ${hasAllDocuments ? 'text-emerald-900' : 'text-slate-600'}`}>
                  {application?.status === 'rejected' ? "Correct & Resubmit" : (hasAllDocuments ? "Ready to Submit" : "Submit Application")}
                </h3>
                <p className={`text-sm font-medium mt-1 ${hasAllDocuments ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {hasAllDocuments 
                    ? (application?.status === 'rejected' ? "All corrections have been made. Resubmit your application for re-review." : "You have uploaded all required documents. Submit your application for review.")
                    : `You must upload all ${REQUIRED_DOC_TYPES.length} documents before you can submit.`}
                </p>
              </div>
              <Button 
                onClick={handleSubmitApplication} 
                disabled={isSubmitting || !hasAllDocuments} 
                className={`w-full sm:w-auto font-black px-8 h-14 rounded-2xl text-lg shadow-lg active:scale-95 transition-transform ${hasAllDocuments ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null} 
                {/* 🔥 DYNAMIC RESUBMIT BUTTON */}
                {application?.status === 'rejected' ? "Resubmit Documents" : "Submit All Documents"}
              </Button>
           </div>
        )}

        <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
          <DialogContent aria-describedby={undefined} className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden bg-slate-900 border-none rounded-3xl shadow-2xl [&>button]:hidden z-[100]">
            <DialogHeader className="p-4 bg-white border-b border-slate-200 flex flex-row items-center justify-between shrink-0">
              <DialogTitle className="text-lg font-black uppercase text-emerald-900 truncate pr-4">
                {viewingDoc?.name}
              </DialogTitle>
              <DialogClose className="rounded-full h-10 w-10 flex items-center justify-center hover:bg-slate-100 transition-colors shrink-0">
                <X className="h-5 w-5 text-slate-500" />
              </DialogClose>
            </DialogHeader>
            <div className="flex-1 w-full bg-slate-900 flex items-center justify-center overflow-hidden">
              {viewingDoc?.url.endsWith('.pdf') ? (
                <iframe src={`${viewingDoc.url}#toolbar=0`} className="w-full h-full border-none bg-white" title="Document Preview" />
              ) : (
                <img src={viewingDoc?.url} alt="Document Preview" className="w-full h-full object-contain bg-slate-900" />
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </StudentLayout>
  )
}