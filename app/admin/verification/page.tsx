"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminLayout } from "@/components/admin-layout"
import { QrScanner } from "@/components/qr-scanner"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Check, User, QrCode, Keyboard, Search, Loader2, XCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// FIRESTORE IMPORTS
import { 
  getUserDb, 
  getAllUsersDb, 
  getStudentApplicationDb, 
  markStudentAsEligible, 
  markStudentAsClaimed, 
  hasStudentClaimed 
} from "@/lib/storage"

// Decrypt logic kept for legacy support
async function decryptData(encryptedData: string, key: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(key))
    const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"])
    const combined = new Uint8Array(
      atob(encryptedData).split("").map((char) => char.charCodeAt(0)),
    )
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted)
    return new TextDecoder().decode(decrypted)
  } catch (error) {
    throw new Error("Failed to decrypt QR code data")
  }
}

export default function QRVerificationPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [studentId, setStudentId] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    userId?: string
    failureReason?: string
    failureDetails?: string
    student?: {
      id: string
      name: string
      course: string
      yearLevel: string
      status: string
      profilePicture?: string
    }
  } | null>(null)

  // 🔥 THE FIX: THIS IS NOW ASYNC/AWAIT AND CONNECTS TO FIRESTORE
  const handleMarkAsClaimed = async () => {
    if (!verificationResult?.userId || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot mark as claimed. Student or admin information missing.",
      })
      return
    }

    setIsProcessing(true) // Show loading spinner
    try {
      const result = await markStudentAsClaimed(verificationResult.userId, user.id)
      
      if (result.success) {
        setIsClaimed(true)
        toast({ title: "Financial Aid Claimed", description: result.message })
        setTimeout(() => {
          setVerificationResult(null)
          setIsClaimed(false)
          setStudentId("")
        }, 3000)
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to mark as claimed." })
    } finally {
      setIsProcessing(false)
    }
  }

  // THE NEW ASYNC FIRESTORE VERIFICATION LOGIC
  const verifyStudentInFirestore = async (searchTerm: string) => {
    setIsProcessing(true)
    try {
      let studentUser: any = null
      
      // 1. Try direct ID lookup first
      const directUser = await getUserDb(searchTerm)
      if (directUser && directUser.role === "student") {
        studentUser = directUser
      } else {
        // 2. Fallback: Search all users by email or internal studentId
        const allUsers = await getAllUsersDb()
        studentUser = allUsers.find(u => 
          u.role === "student" && (
            u.email?.toLowerCase() === searchTerm.toLowerCase() ||
            u.profileData?.studentId?.toLowerCase() === searchTerm.toLowerCase()
          )
        )
      }

      if (!studentUser) {
        setVerificationResult({
          verified: false,
          failureReason: "Student Not Found",
          failureDetails: "No student found with this ID or email in the database.",
        })
        toast({ variant: "destructive", title: "Verification failed", description: "Student not found." })
        setIsProcessing(false)
        return
      }

      // 3. Student Found -> Fetch Application
      const application = await getStudentApplicationDb(studentUser.id)
      const profile = studentUser.profileData || {}

      if (application && application.status === "approved") {
        // Stub eligibility logic
        const eligibilityResult = markStudentAsEligible(studentUser.id)
        
        // Check if claimed (Using application's claim status or fallback)
        const alreadyClaimed = application.isClaimed || hasStudentClaimed(studentUser.id)
        
        setIsClaimed(alreadyClaimed)
        setVerificationResult({
          verified: true,
          userId: studentUser.id,
          student: {
            id: profile.studentId || studentUser.id,
            name: profile.fullName || studentUser.name || "Unknown",
            course: application.course || profile.course || "N/A",
            yearLevel: application.yearLevel || profile.yearLevel || "N/A",
            status: alreadyClaimed ? "claimed" : application.status,
            profilePicture: profile.profilePicture || studentUser.profilePicture,
          },
        })

        toast({
          title: <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Verification successful</div>,
          description: "Student verified and marked as eligible",
        })
      } else {
        // Handle failures (Pending, Rejected, No App)
        let failureReason = "No Approved Application"
        let failureDetails = "Student found but has no approved scholarship application."

        if (application) {
          if (application.status === "pending") {
            failureReason = "Application Pending"
            failureDetails = "Student's application is still under review."
          } else if (application.status === "rejected") {
            failureReason = "Application Rejected"
            failureDetails = application.feedback ? `Rejected: ${application.feedback}` : "Application was rejected."
          }
        } else {
          failureReason = "No Application Found"
          failureDetails = "Student is registered but has not submitted an application."
        }

        setVerificationResult({ verified: false, failureReason, failureDetails })
        toast({ variant: "destructive", title: "Verification failed", description: failureReason })
      }
    } catch (error) {
      console.error("Verification Error:", error)
      toast({ variant: "destructive", title: "Error", description: "Database connection failed." })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualVerify = () => {
    if (!studentId.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a student ID or email" })
      return
    }
    verifyStudentInFirestore(studentId.trim())
  }

  const handleQRCodeResult = async (result: string) => {
    try {
      let studentIdFromQR: string

      // Handle simple format
      if (result.startsWith("BTS:")) {
        studentIdFromQR = result.replace("BTS:", "")
      } 
      // Handle legacy encryption
      else if (result.startsWith("BTS_ENCRYPTED:")) {
        const encryptedData = result.replace("BTS_ENCRYPTED:", "")
        const secretKey = "BTS-SCHOLARSHIP-SECRET-KEY-2024"
        const decryptedJson = await decryptData(encryptedData, secretKey)
        const data = JSON.parse(decryptedJson)
        studentIdFromQR = data.id || data.studentId
      } 
      // Handle the exact format we just built
      else {
        try {
          const data = JSON.parse(result)
          studentIdFromQR = data.id || data.studentId
        } catch {
          studentIdFromQR = result
        }
      }

      setStudentId(studentIdFromQR)
      verifyStudentInFirestore(studentIdFromQR)
      
    } catch (error) {
      console.error("QR Code parse error:", error)
      toast({ variant: "destructive", title: "Invalid QR code", description: "Could not read QR data" })
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Code Verification</h1>
          <p className="text-muted-foreground">Verify students for financial aid distribution</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verify Student</CardTitle>
            <CardDescription>Scan QR code or enter student details manually</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Scanner
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Enter the student's ID, email address, or user ID to verify their eligibility.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Student ID / Email / User ID</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="e.g., 2024-00001 or student@email.com"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleManualVerify()}
                        className="pl-10"
                        disabled={isProcessing}
                      />
                    </div>
                    <Button onClick={handleManualVerify} className="shrink-0" disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Verify
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Tip: You can search by student ID number, registered email, or system user ID.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="qr" className="space-y-4">
                {isScanning ? (
                  <div className="space-y-4">
                    <QrScanner onResult={handleQRCodeResult} />
                    <Button variant="outline" className="w-full bg-transparent" onClick={() => setIsScanning(false)}>
                      Cancel Scanning
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        Make sure to allow camera access when prompted. Position the QR code within the scanner frame.
                      </p>
                    </div>
                    <Button className="w-full" onClick={() => setIsScanning(true)}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Start QR Scanner
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Camera not working? Use the Manual Entry tab instead.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Result</CardTitle>
            <CardDescription>Student information and verification status</CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
               <div className="flex flex-col items-center justify-center h-48 text-center text-indigo-500">
                 <Loader2 className="h-8 w-8 animate-spin mb-4" />
                 <p>Processing...</p>
               </div>
            ) : verificationResult ? (
              verificationResult.verified ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4 text-green-700 border border-green-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <Check className="h-5 w-5" />
                      Student Verified & Eligible
                    </div>
                    <p className="mt-1 text-sm">
                      This student has been verified and marked as eligible for financial aid distribution.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
                    <div className="relative">
                      {verificationResult.student?.profilePicture ? (
                        <img
                          src={verificationResult.student.profilePicture}
                          alt="Profile"
                          className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 border-2 border-green-500 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{verificationResult.student?.name}</h3>
                      <p className="text-sm text-gray-600">{verificationResult.student?.id}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-sm font-medium">Course:</div>
                      <div className="text-sm">{verificationResult.student?.course}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-sm font-medium">Year Level:</div>
                      <div className="text-sm">{verificationResult.student?.yearLevel}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-sm font-medium">Status:</div>
                      <div className="text-sm font-bold text-green-600 uppercase">{verificationResult.student?.status}</div>
                    </div>
                  </div>

                  {isClaimed ? (
                    <div className="w-full p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                      <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                        <Check className="h-5 w-5" /> Financial Aid Successfully Claimed
                      </div>
                      <p className="text-sm text-green-600 mt-2">Application archived to history.</p>
                      <p className="text-xs text-muted-foreground mt-2">Resetting in a moment...</p>
                    </div>
                  ) : (
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleMarkAsClaimed} disabled={isProcessing}>
                      {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Mark as Claimed
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <XCircle className="h-5 w-5" />
                      Verification Failed
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg border p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reason</p>
                      <p className="text-base font-semibold text-red-600">{verificationResult.failureReason}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Details</p>
                      <p className="text-sm text-gray-700">{verificationResult.failureDetails}</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      <span className="font-medium">What to do:</span> Direct the student to the admin office to resolve their application status or verify their registration.
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                <p>No verification result yet.</p>
                <p className="text-sm">Scan a QR code or enter a student ID to verify.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}