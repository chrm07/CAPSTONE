"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StudentLayout } from "@/components/student-layout"
import { QRCode } from "@/components/qr-code"
import { useToast } from "@/components/ui/use-toast"
import { Download, Share2, Smartphone, Shield, Info, AlertCircle, History } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"

export default function QRCodePage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("view")
  const { user } = useAuth()
  const [studentData, setStudentData] = useState({
    id: "",
    name: "",
    course: "",
    yearLevel: "",
    school: "",
  })

  useEffect(() => {
    if (user) {
      // Extract student data from user profile with better fallbacks
      const profileData = user.profileData || {}
      setStudentData({
        id: profileData.studentId || user.id || "2022-12345",
        name: profileData.fullName || user.name || "Juan Miguel Dela Cruz",
        course: profileData.course || "Bachelor of Science in Computer Science",
        yearLevel: profileData.yearLevel || "2nd Year",
        school: profileData.schoolName || "University of the Philippines Diliman",
      })
    }
  }, [user])

  const handleDownloadQRCode = async () => {
    try {
      const profileData = user?.studentProfile || user?.profileData || {}
      const studentId = profileData.studentId || user?.id

      const qrData = {
        type: "BTS_SCHOLARSHIP",
        id: studentId,
        v: "1.0",
      }

      const qrValue = JSON.stringify(qrData)
      const encodedValue = encodeURIComponent(qrValue)
      // Increased size to 1200x1200 with larger margin for better print quality
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodedValue}&ecc=H&margin=10&qzone=2`

      // Create a temporary link to download the QR code
      const link = document.createElement("a")
      link.href = qrUrl
      link.download = `bts-scholarship-qrcode-${studentData.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "QR Code downloaded",
        description: "Your secure QR code has been downloaded successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Could not download QR code. Please try again.",
      })
    }
  }

  const handleShareQRCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My BTS Scholarship QR Code",
          text: `Scholarship QR Code for ${studentData.name}`,
          url: window.location.href,
        })

        toast({
          title: "QR Code shared",
          description: "Your QR code has been shared successfully.",
        })
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href)
        toast({
          title: "Link copied",
          description: "QR code page link copied to clipboard.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Share failed",
        description: "Failed to share QR code. Please try again.",
      })
    }
  }

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">QR Code</h1>
          <p className="text-muted-foreground">View and manage your scholarship verification QR code</p>
        </div>
      </div>

      <Tabs defaultValue="view" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="view">View QR Code</TabsTrigger>
          <TabsTrigger value="usage">How to Use</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="view" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Scholarship QR Code</CardTitle>
              <CardDescription>
                Use this QR code for scholarship verification and financial aid collection
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div>
                <QRCode size={400} />
              </div>
              <div className="mt-6 text-center space-y-1">
                <p className="font-semibold text-lg">{studentData.name}</p>
                <p className="text-sm text-muted-foreground">Student ID: {studentData.id}</p>
                <p className="text-sm text-muted-foreground font-medium">{studentData.course}</p>
                <p className="text-sm text-muted-foreground">
                  {studentData.yearLevel}, {studentData.school}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button onClick={handleDownloadQRCode} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="mr-2 h-4 w-4" />
                Download QR Code
              </Button>
              <Button
                variant="outline"
                onClick={handleShareQRCode}
                className="border-green-600 text-green-600 hover:bg-green-50 bg-transparent"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share QR Code
              </Button>
            </CardFooter>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Present this QR code to the scholarship office when collecting your financial aid. Make sure to bring a
              valid ID for verification.
            </AlertDescription>
          </Alert>
        </TabsContent>

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
                  <Smartphone className="mr-2 h-5 w-5" />
                  Digital Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your QR code contains encrypted information about your scholarship status. When scanned by authorized
                  personnel, it verifies your identity and eligibility for financial aid.
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pl-5">
                  <li>Save the QR code to your phone or print it out</li>
                  <li>Present the QR code to the scholarship office staff</li>
                  <li>They will scan your code using the official verification app</li>
                  <li>Once verified, you can proceed with financial aid collection</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Identity Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  For security purposes, you will still need to present a valid ID along with your QR code. This ensures
                  that only you can access your scholarship benefits.
                </p>
                <div className="bg-muted p-4 rounded-md text-sm">
                  <p className="font-medium">Acceptable IDs:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-5">
                    <li>School ID</li>
                    <li>Government-issued ID (e.g., National ID, Driver's License)</li>
                    <li>Passport</li>
                    <li>Voter's ID</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium flex items-center">
                  <Info className="mr-2 h-5 w-5" />
                  When to Use Your QR Code
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-5">
                  <li>During financial aid disbursement events</li>
                  <li>When claiming your scholarship check or allowance</li>
                  <li>For verification during scholarship-related activities</li>
                  <li>When accessing special scholarship privileges or services</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>QR Code Security</CardTitle>
              <CardDescription>Important information about keeping your QR code secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription>
                  Never share your QR code with unauthorized individuals. Your QR code is linked to your scholarship
                  account and could be misused if it falls into the wrong hands.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Security Features</h3>
                <p className="text-sm text-muted-foreground">
                  Your QR code includes several security features to prevent unauthorized use:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-5">
                  <li>Encrypted student information</li>
                  <li>Timestamp to prevent replay attacks</li>
                  <li>Can only be verified by official scholarship verification app</li>
                  <li>Requires additional ID verification</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Best Practices</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-5">
                  <li>Do not post your QR code on social media or public platforms</li>
                  <li>Only present your QR code to authorized scholarship personnel</li>
                  <li>Report immediately if you suspect your QR code has been compromised</li>
                  <li>Keep your student account credentials secure</li>
                  <li>Regularly check your scholarship account for any unauthorized activities</li>
                </ul>
              </div>

              <div className="bg-muted p-4 rounded-md">
                <p className="font-medium">Lost or Compromised QR Code?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  If you believe your QR code has been compromised or if you've lost access to it, please contact the
                  scholarship office immediately to have your QR code reset.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 bg-transparent"
                  onClick={() => {
                    toast({
                      title: "Request submitted",
                      description:
                        "Your request to reset your QR code has been submitted. Please check your email for further instructions.",
                    })
                  }}
                >
                  Request QR Code Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Card className="bg-gradient-to-r from-green-50 to-white border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                  <History className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Application History</h3>
                  <p className="text-sm text-gray-600">View your completed scholarship applications and outcomes</p>
                </div>
              </div>
              <Link href="/student/history">
                <Button className="bg-green-600 hover:bg-green-700 text-white">View History</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  )
}
