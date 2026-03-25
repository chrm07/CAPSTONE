"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { StudentLayout } from "@/components/student-layout"
import { useToast } from "@/components/ui/use-toast"
import { 
  Download, Share2, Smartphone, Shield, Info, 
  AlertCircle, History, Clock, QrCode as QrIcon, Loader2 
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import QRCode from "react-qr-code"

// IMPORT FIRESTORE LOGIC
import { getStudentApplicationDb, type Application, type StudentProfile } from "@/lib/storage"

export default function QRCodePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("view")
  
  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const profileData = (user?.profileData as StudentProfile) || {}

  useEffect(() => {
    const fetchApp = async () => {
      if (user) {
        try {
          const app = await getStudentApplicationDb(user.id)
          setApplication(app)
        } catch (error) {
          console.error("Failed to fetch application", error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchApp()
  }, [user])

  // Native SVG to PNG downloader for high-quality, offline QR codes
  const handleDownloadQRCode = async () => {
    const svg = document.getElementById("QRCode")
    if (svg) {
      try {
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()
        
        img.onload = () => {
          // Scale it up for a high-res download
          canvas.width = img.width * 2
          canvas.height = img.height * 2
          ctx?.scale(2, 2)
          ctx?.drawImage(img, 0, 0)
          
          const pngFile = canvas.toDataURL("image/png")
          const downloadLink = document.createElement("a")
          downloadLink.download = `BTS_QR_${application?.id || "Ticket"}.png`
          downloadLink.href = `${pngFile}`
          downloadLink.click()
          
          toast({ title: "Success", description: "QR Code downloaded to your device." })
        }
        img.src = "data:image/svg+xml;base64," + btoa(svgData)
      } catch (err) {
        toast({ variant: "destructive", title: "Download failed", description: "Could not generate image." })
      }
    }
  }

  const handleShareQRCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My BTS Scholarship QR Code",
          text: `Scholarship QR Code for ${profileData.fullName || user?.name}`,
          url: window.location.href,
        })
        toast({ title: "QR Code shared", description: "Your QR code has been shared successfully." })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast({ title: "Link copied", description: "QR code page link copied to clipboard." })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Share failed", description: "Failed to share QR code." })
    }
  }

  // The payload the scanner reads
  const qrValue = application ? `BTS-APP-${application.id}` : ""

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Claiming Ticket</h1>
          <p className="text-muted-foreground">View and manage your scholarship verification QR code.</p>
        </div>
      </div>

      <Tabs defaultValue="view" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 border">
          <TabsTrigger value="view">View Ticket</TabsTrigger>
          <TabsTrigger value="usage">How to Use</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card className="border-none shadow-md overflow-hidden max-w-2xl mx-auto">
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-emerald-700 w-full" />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Official Claiming Pass</CardTitle>
              <CardDescription>
                Present this to the municipal staff on distribution day.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
              
              {/* --- DYNAMIC QR CODE DISPLAY LOGIC --- */}
              {isLoading ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-emerald-600">
                  <Loader2 className="h-10 w-10 animate-spin mb-4" />
                  <p className="text-sm font-medium">Verifying application status...</p>
                </div>
              ) : !application ? (
                <div className="h-[250px] flex flex-col items-center justify-center text-slate-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No application found. Please submit documents first.</p>
                </div>
              ) : application.status === "pending" ? (
                <div className="text-center">
                  <div className="h-[250px] w-[250px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 mx-auto mb-6 relative overflow-hidden">
                    <QrIcon className="h-16 w-16 mb-2 opacity-30 blur-sm" />
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[3px] flex items-center justify-center">
                       <div className="bg-white p-4 rounded-full shadow-lg">
                         <Clock className="h-8 w-8 text-amber-500 animate-pulse" />
                       </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mb-3 text-sm px-3 py-1">UNDER REVIEW</Badge>
                  <p className="text-sm text-slate-500 max-w-[250px] mx-auto">Your QR code will unlock automatically once your documents are approved.</p>
                </div>
              ) : application.status === "rejected" ? (
                <div className="text-center">
                  <div className="h-[250px] w-[250px] bg-red-50 border-2 border-dashed border-red-200 rounded-xl flex flex-col items-center justify-center text-red-400 mx-auto mb-6">
                    <AlertCircle className="h-16 w-16 mb-2" />
                    <p className="font-medium text-red-700">Action Required</p>
                  </div>
                  <Badge variant="destructive" className="mb-3 text-sm px-3 py-1">APPLICATION REJECTED</Badge>
                  <p className="text-sm text-slate-500 max-w-[250px] mx-auto">Please check your documents tab for feedback and resubmit.</p>
                </div>
              ) : (
                // ✅ APPROVED: SHOW NATIVE REACT QR CODE
                <div className="text-center w-full animate-fade-in">
                  <div className={`p-5 bg-white rounded-2xl shadow-sm border-2 border-slate-100 inline-block mb-6 relative ${application.isClaimed ? 'opacity-50 grayscale' : ''}`}>
                    <QRCode
                      id="QRCode"
                      value={qrValue}
                      size={220}
                      level="H"
                    />
                    {application.isClaimed && (
                       <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="bg-slate-900/90 text-white font-bold text-2xl px-6 py-2 rounded-xl backdrop-blur-md transform -rotate-12 border-2 border-slate-400 shadow-2xl">
                             CLAIMED
                          </div>
                       </div>
                    )}
                  </div>
                  
                  <div className="mt-2 text-center space-y-1">
                    <p className="font-bold text-xl text-slate-900">{profileData.fullName || user?.name}</p>
                    <p className="font-mono text-sm font-bold text-emerald-700 bg-emerald-50 py-1 px-3 rounded-md inline-block my-2">
                      ID: {application.id}
                    </p>
                    <p className="text-sm text-slate-500">{profileData.course || "N/A"}</p>
                    <p className="text-sm text-slate-500">
                      {profileData.yearLevel || "N/A"} • {profileData.schoolName || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
            
            {/* Action Buttons only show if approved */}
            {application?.status === "approved" && (
              <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 border-t bg-slate-50 pt-6">
                <Button 
                  onClick={handleDownloadQRCode} 
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={application.isClaimed}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Save to Gallery
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareQRCode}
                  className="w-full sm:w-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50 bg-white"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Ticket
                </Button>
              </CardFooter>
            )}
          </Card>

          <Alert className="max-w-2xl mx-auto border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 font-semibold">Important Reminder</AlertTitle>
            <AlertDescription className="text-blue-800">
              Present this QR code to the municipal staff when collecting your financial aid. Make sure to bring a valid School or Government ID for physical verification.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* --- USAGE TAB (UNCHANGED) --- */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How to Use Your QR Code</CardTitle>
              <CardDescription>
                Learn how to use your QR code for scholarship verification and financial aid collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <Smartphone className="mr-2 h-5 w-5 text-emerald-600" />
                  Digital Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your QR code contains an encrypted unique identifier linked directly to your approved application in our secure database.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground pl-5 mt-3">
                  <li>Save the QR code to your phone gallery before arriving at the venue.</li>
                  <li>Present the QR code (screen brightness up) to the Scanner Staff.</li>
                  <li>Staff will scan your code using the official municipal tablet.</li>
                  <li>Once the system says "Verified", you will receive your financial assistance.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <Shield className="mr-2 h-5 w-5 text-emerald-600" />
                  Identity Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  For security purposes, you will still need to present a physical valid ID along with your QR code to prove ownership.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3">
                  <p className="font-semibold text-slate-800 mb-2">Acceptable IDs:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 pl-2">
                    <li>Valid School ID for the current semester</li>
                    <li>Government-issued ID (e.g., National ID, Driver's License, Passport)</li>
                    <li>Barangay Certification of Identity with photo</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- SECURITY TAB (UNCHANGED) --- */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Security</CardTitle>
              <CardDescription>Important information about keeping your claiming ticket secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-900 font-bold">Security Warning</AlertTitle>
                <AlertDescription className="text-red-800">
                  Never post your QR code on Facebook, Instagram, or any public platform. If someone else scans your code, they may claim your financial aid. The system will mark it as "CLAIMED" and you will not be able to get a replacement.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">System Protections</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                  <li>Can only be verified by logged-in official Scanner Staff.</li>
                  <li>Automatically locks and greys out immediately after being scanned once.</li>
                  <li>QR payloads are randomly generated Document IDs, not predictable numbers.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Card className="bg-gradient-to-r from-emerald-50 to-white border-emerald-100">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Application History</h3>
                  <p className="text-sm text-slate-600">View past semesters and claiming dates.</p>
                </div>
              </div>
              <Link href="/student/history" className="w-full sm:w-auto">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">View History</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  )
}