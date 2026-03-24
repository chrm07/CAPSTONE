"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminLayout } from "@/components/admin-layout"
import { QrScanner } from "@/components/qr-scanner"
import { useToast } from "@/components/ui/use-toast"
import { getUsers, getApplications, markStudentAsEligible, markStudentAsClaimed, hasStudentClaimed, isStudentEligible } from "@/lib/storage"
import { useAuth } from "@/contexts/auth-context"
import { Check, User, QrCode, Keyboard, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function decryptData(encryptedData: string, key: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const keyBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(key))
    const cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, ["decrypt"])

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0)),
    )

    // Extract IV and encrypted data
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
  const [isClaimed, setIsClaimed] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    userId?: string // The actual user ID for marking as claimed
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

  const handleMarkAsClaimed = () => {
    if (!verificationResult?.userId || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot mark as claimed. Student or admin information missing.",
      })
      return
    }

    const result = markStudentAsClaimed(verificationResult.userId, user.id)
    
    if (result.success) {
      setIsClaimed(true)
      toast({
        title: "Financial Aid Claimed",
        description: result.message,
      })
      
      // Clear the verification result after a delay to allow for another scan
      setTimeout(() => {
        setVerificationResult(null)
        setIsClaimed(false)
        setStudentId("")
      }, 3000)
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      })
    }
  }

  const handleManualVerify = () => {
    if (!studentId.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a student ID or email",
      })
      return
    }

    const searchTerm = studentId.trim().toLowerCase()

    // Get all users and find the student with matching student ID, email, or user ID
    const users = getUsers()
    
    const student = users.find(
      (user) =>
        user.role === "student" &&
        (user.studentProfile?.studentId?.toLowerCase() === searchTerm ||
          user.studentProfile?.education?.studentId?.toLowerCase() === searchTerm ||
          user.profileData?.studentId?.toLowerCase() === searchTerm ||
          user.email?.toLowerCase() === searchTerm ||
          user.id?.toLowerCase() === searchTerm)
    )



    if (student) {
      const profile = student.studentProfile || student.profileData
      
      // Check if student has an approved application
      // Application.studentId is the user's id (not a separate student ID number)
      const applications = getApplications()
      
      const studentApplication = applications.find(
        (app) => app.studentId === student.id && app.status === "approved"
      )

if (studentApplication) {
  const eligibilityResult = markStudentAsEligible(profile?.studentId || student.id)
  
  // Check if already claimed
  const alreadyClaimed = hasStudentClaimed(student.id)
  setIsClaimed(alreadyClaimed)
  
  setVerificationResult({
  verified: true,
  userId: student.id, // Store the user ID for marking as claimed
  student: {
  id: profile?.studentId || profile?.education?.studentId || student.id,
  name: profile?.fullName ||
  (profile?.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : null) ||
  student.name ||
  "Unknown",
  course: profile?.course || profile?.education?.course || "N/A",
  yearLevel: profile?.yearLevel || profile?.education?.yearLevel || "N/A",
  status: alreadyClaimed ? "claimed" : studentApplication.status,
  profilePicture: profile?.profilePicture || student.profilePicture,
  },
  })

        toast({
          title: (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Verification successful
            </div>
          ),
          description: eligibilityResult.success
            ? "Student verified and marked as eligible"
            : "Student verified but eligibility marking failed",
        })
      } else {
        // Student found but no approved application
        const allApplications = applications.filter((app) => app.studentId === student.id)
        const latestApp = allApplications[allApplications.length - 1]
        
        let failureReason = "No Approved Application"
        let failureDetails = "Student found but has no approved scholarship application."
        
        if (latestApp) {
          if (latestApp.status === "pending") {
            failureReason = "Application Pending"
            failureDetails = "Student's application is still under review. Please wait for admin approval."
          } else if (latestApp.status === "rejected") {
            failureReason = "Application Rejected"
            failureDetails = latestApp.feedback 
              ? `Application was rejected: ${latestApp.feedback}`
              : "Student's application was rejected by the scholarship committee."
          }
        } else {
          failureReason = "No Application Found"
          failureDetails = "Student is registered but has not submitted a scholarship application."
        }
        
        setVerificationResult({
          verified: false,
          failureReason,
          failureDetails,
        })

        toast({
          variant: "destructive",
          title: "Verification failed",
          description: failureReason,
        })
      }
    } else {
      setVerificationResult({
        verified: false,
        failureReason: "Student Not Found",
        failureDetails: "No student found with this ID, email, or user ID. Please check the information and try again.",
      })

      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Student not found. Try searching by email or user ID.",
      })
    }
  }

  const handleQRCodeResult = async (result: string) => {
    try {
      let studentIdFromQR: string
      let data: any = {}; // Declare data variable

      // Check for new simple format: BTS:studentId
      if (result.startsWith("BTS:")) {
        studentIdFromQR = result.replace("BTS:", "")
      }
      // Check if QR code is encrypted (legacy)
      else if (result.startsWith("BTS_ENCRYPTED:")) {
        const encryptedData = result.replace("BTS_ENCRYPTED:", "")
        const secretKey = "BTS-SCHOLARSHIP-SECRET-KEY-2024"
        const decryptedJson = await decryptData(encryptedData, secretKey)
        data = JSON.parse(decryptedJson)
        studentIdFromQR = data.studentId || data.id
      } else {
        // Handle legacy JSON format
        try {
          data = JSON.parse(result)
          studentIdFromQR = data.studentId || data.id
        } catch {
          // If not JSON, treat the whole string as student ID
          studentIdFromQR = result
        }
      }

      setStudentId(studentIdFromQR)

      // Get all users and find the student with matching student ID
      const users = getUsers()

      const student = users.find(
        (user) =>
          user.role === "student" &&
          (user.studentProfile?.studentId === studentIdFromQR ||
            user.profileData?.studentId === studentIdFromQR ||
            user.id === studentIdFromQR),
      )

      if (student) {
        const profile = student.studentProfile || student.profileData
        if (profile) {
          // Check if student has an approved application
          const applications = getApplications()

          const studentApplication = applications.find((app) => app.studentId === student.id && app.status === "approved")

if (studentApplication) {
  const eligibilityResult = markStudentAsEligible(profile.studentId || student.id)
  
  // Check if already claimed
  const alreadyClaimed = hasStudentClaimed(student.id)
  setIsClaimed(alreadyClaimed)
  
  setVerificationResult({
  verified: true,
  userId: student.id, // Store the user ID for marking as claimed
  student: {
  id: profile.studentId || student.id,
  name: profile.fullName || profile.firstName + " " + profile.lastName || student.name,
  course: profile.course || profile.education?.course || "N/A",
  yearLevel: profile.yearLevel || profile.education?.yearLevel || "N/A",
  status: alreadyClaimed ? "claimed" : studentApplication.status,
  profilePicture: profile.profilePicture || student.profilePicture,
  },
  })

            toast({
              title: (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Verification successful
                </div>
              ),
              description: eligibilityResult.success
                ? "Student verified and marked as eligible"
                : "Student verified but eligibility marking failed",
            })
          } else {
            // Student found but no approved application
            const allApplications = applications.filter((app) => app.studentId === student.id)
            const latestApp = allApplications[allApplications.length - 1]
            
            let failureReason = "No Approved Application"
            let failureDetails = "Student found but has no approved scholarship application."
            
            if (latestApp) {
              if (latestApp.status === "pending") {
                failureReason = "Application Pending"
                failureDetails = "Student's application is still under review. Please wait for admin approval."
              } else if (latestApp.status === "rejected") {
                failureReason = "Application Rejected"
                failureDetails = latestApp.feedback 
                  ? `Application was rejected: ${latestApp.feedback}`
                  : "Student's application was rejected by the scholarship committee."
              }
            } else {
              failureReason = "No Application Found"
              failureDetails = "Student is registered but has not submitted a scholarship application."
            }
            
            setVerificationResult({
              verified: false,
              failureReason,
              failureDetails,
            })

            toast({
              variant: "destructive",
              title: "Verification failed",
              description: failureReason,
            })
          }
        }
      } else {
        setVerificationResult({
          verified: false,
          failureReason: "Student Not Found",
          failureDetails: "No student found with this QR code. The student may not be registered in the system.",
        })

        toast({
          variant: "destructive",
          title: "Verification failed",
          description: "Student not found in the system",
        })
      }

      // Camera stays on for continuous scanning - no setIsScanning(false) here
    } catch (error) {
      console.error("QR Code decryption error:", error)
      toast({
        variant: "destructive",
        title: "Invalid QR code",
        description: "The QR code contains invalid or corrupted data",
      })
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
                      />
                    </div>
                    <Button onClick={handleManualVerify} className="shrink-0">
                      <Check className="h-4 w-4 mr-2" />
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
            {verificationResult ? (
              verificationResult.verified ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-green-50 p-4 text-green-700 border border-green-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
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
                          src={verificationResult.student.profilePicture || "/placeholder.svg"}
                          alt={`${verificationResult.student.name} profile`}
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
                      <div className="text-sm">{verificationResult.student?.status}</div>
                    </div>
                  </div>

                  {isClaimed ? (
  <div className="w-full p-4 rounded-lg bg-green-50 border border-green-200 text-center">
    <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
      <Check className="h-5 w-5" />
      Financial Aid Successfully Claimed
    </div>
    <p className="text-sm text-green-600 mt-2">
      Application archived to history. Student can now apply for next semester.
    </p>
    <p className="text-xs text-muted-foreground mt-2">
      Resetting in a moment...
    </p>
  </div>
) : (
  <Button className="w-full" onClick={handleMarkAsClaimed}>
    Mark as Claimed
  </Button>
)}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verification Failed
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg border p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Reason</p>
                      <p className="text-base font-semibold text-red-600">
                        {verificationResult.failureReason || "Unknown Error"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Details</p>
                      <p className="text-sm text-gray-700">
                        {verificationResult.failureDetails || "This student is not eligible or not found in the system."}
                      </p>
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
