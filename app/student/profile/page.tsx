"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Mail, GraduationCap, User, Lock, Bell, ArrowLeft } from "lucide-react"
import { updateUser, updateUserPassword } from "@/lib/storage" // Note: getUserById is not used in the provided updates

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("personal")
  const [isLoading, setIsLoading] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    address: "",
    age: "",
    gender: "",
    barangay: "",
    isPWD: false,
  })

  const [educationInfo, setEducationInfo] = useState({
    school: "",
    course: "",
    yearLevel: "",
    studentId: "",
  })

  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    applicationUpdates: true,
    documentReminders: true,
    paymentNotifications: true,
    marketingEmails: false,
  })

  useEffect(() => {
    // Handle both studentProfile and profileData (from registration)
    console.log("[v0] Profile page - user:", user)
    console.log("[v0] Profile page - studentProfile:", user?.studentProfile)
    console.log("[v0] Profile page - profileData:", user?.profileData)
    
    const profile = user?.studentProfile || user?.profileData
    console.log("[v0] Profile page - using profile:", profile)
    
    if (profile) {
      setPersonalInfo({
        fullName: profile.fullName || `${profile.firstName || ""} ${profile.middleName ? profile.middleName + " " : ""}${profile.lastName || ""}${profile.suffix ? " " + profile.suffix : ""}`.trim() || user?.name || "",
        email: user?.email || "",
        contactNumber: profile.contactNumber || "",
        address: profile.address || "",
        age: profile.age || (profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : ""),
        gender: profile.gender || "",
        barangay: profile.barangay || "",
        isPWD: profile.isPWD || false,
      })

      // Handle education data from both structures
      if (profile.education) {
        setEducationInfo({
          school: profile.education.school || "",
          course: profile.education.course || "",
          yearLevel: profile.education.yearLevel || "",
          studentId: profile.education.studentId || "",
        })
      } else if (profile.school || profile.course || profile.yearLevel) {
        // Handle flat structure from registration
        setEducationInfo({
          school: profile.school || "",
          course: profile.course || "",
          yearLevel: profile.yearLevel || "",
          studentId: profile.studentId || "",
        })
      }

      if (user?.profilePicture) {
        setProfilePicture(user.profilePicture)
      }
    }
  }, [user])

  const calculateAge = (dateOfBirth: string): string => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  const handlePersonalUpdate = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const nameParts = personalInfo.fullName.trim().split(" ")
      const currentProfile = user.studentProfile || user.profileData || {}
      const updatedProfile = {
        ...currentProfile,
        fullName: personalInfo.fullName,
        firstName: nameParts[0] || "",
        lastName: nameParts[nameParts.length - 1] || "",
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : undefined,
        contactNumber: personalInfo.contactNumber,
        address: personalInfo.address,
        age: personalInfo.age,
        gender: personalInfo.gender,
        barangay: personalInfo.barangay,
        isPWD: personalInfo.isPWD,
      }

      const success = updateUser(user.id, {
        name: personalInfo.fullName, // Assuming 'name' is a top-level field in your user object
        studentProfile: updatedProfile,
      })

      if (success) {
        toast({
          title: "Success",
          description: "Personal information updated successfully",
        })
      } else {
        throw new Error("Update failed")
      }
    } catch (error) {
      console.error("Failed to update personal information:", error)
      toast({
        title: "Error",
        description: "Failed to update personal information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEducationUpdate = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const updatedProfile = {
        ...user.studentProfile,
        education: {
          school: educationInfo.school,
          course: educationInfo.course,
          yearLevel: educationInfo.yearLevel,
          studentId: educationInfo.studentId,
        },
      }

      const success = updateUser(user.id, {
        studentProfile: updatedProfile,
      })

      if (success) {
        toast({
          title: "Success",
          description: "Education information updated successfully",
        })
      } else {
        throw new Error("Update failed")
      }
    } catch (error) {
      console.error("Failed to update education information:", error)
      toast({
        title: "Error",
        description: "Failed to update education information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecurityUpdate = async () => {
    if (!user) return

    if (securityInfo.newPassword !== securityInfo.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const success = updateUserPassword(user.id, securityInfo.currentPassword, securityInfo.newPassword)

      if (success) {
        toast({
          title: "Success",
          description: "Password updated successfully",
        })
        setSecurityInfo({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        throw new Error("Password update failed")
      }
    } catch (error) {
      console.error("Failed to update password:", error)
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setIsLoading(true)
    try {
      // In a real application, you would call an API to update notification settings here.
      // For this example, we'll just simulate a successful update.
      setTimeout(() => {
        toast({
          title: "Success",
          description: "Notification preferences updated successfully",
        })
        setIsLoading(false)
      }, 500) // Simulate network delay
    } catch (error) {
      console.error("Failed to update notification preferences:", error)
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Basic validation for image file type and size
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "File too large",
          description: "Profile picture must be less than 5MB.",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)
      try {
        // Upload to Vercel Blob
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'profile-pictures')
        formData.append('userId', user?.id || 'anonymous')

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        
        // Update local state with the Blob URL
        setProfilePicture(data.url)
        
        if (user) {
          // Save the Blob URL to user storage
          const success = updateUser(user.id, { profilePicture: data.url })
          if (success) {
            toast({
              title: "Success",
              description: "Profile picture updated successfully",
            })
          } else {
            toast({
              title: "Error",
              description: "Failed to save profile picture.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Failed to upload profile picture:", error)
        toast({
          title: "Error",
          description: "Failed to upload profile picture. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Handle removing profile picture
  const removeProfilePicture = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // If there's a current profile picture URL, delete it from Blob storage
      if (profilePicture && profilePicture.includes('blob.vercel-storage.com')) {
        await fetch('/api/upload/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: profilePicture }),
        })
      }
      
      setProfilePicture(null)
      const success = updateUser(user.id, { profilePicture: null })
      if (success) {
        toast({
          title: "Success",
          description: "Profile picture removed successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove profile picture.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to remove profile picture:", error)
      toast({
        title: "Error",
        description: "Failed to remove profile picture.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Please log in to view your profile</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/student/dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-green-100">
                <AvatarImage src={profilePicture || undefined} alt={personalInfo.fullName} />
                <AvatarFallback className="bg-green-500 text-white text-3xl">
                  {personalInfo.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-md hover:shadow-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
              />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">{personalInfo.fullName}</h1>
              <p className="text-gray-600 flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-4 w-4" />
                {personalInfo.email}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Student
                </Badge>
                {personalInfo.isPWD && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    PWD
                  </Badge>
                )}
                <Badge variant="outline">{personalInfo.barangay}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="education" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                    placeholder="Juan Dela Cruz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={personalInfo.email} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={personalInfo.contactNumber}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, contactNumber: e.target.value })}
                    placeholder="09123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={personalInfo.age}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, age: e.target.value })}
                    placeholder="20"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={personalInfo.gender}
                    onValueChange={(value) => setPersonalInfo({ ...personalInfo, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barangay">Barangay</Label>
                  <Select
                    value={personalInfo.barangay}
                    onValueChange={(value) => setPersonalInfo({ ...personalInfo, barangay: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select barangay" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={`Barangay ${num}`}>
                          Barangay {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })}
                    placeholder="Complete address"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPWD"
                  checked={personalInfo.isPWD}
                  onCheckedChange={(checked) => setPersonalInfo({ ...personalInfo, isPWD: checked as boolean })}
                />
                <Label htmlFor="isPWD" className="text-sm font-normal cursor-pointer">
                  I am a Person with Disability (PWD)
                </Label>
              </div>
              <Separator />
              <Button onClick={handlePersonalUpdate} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Tab */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>Education Information</CardTitle>
              <CardDescription>Update your educational background and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="school">School/University</Label>
                  <Input
                    id="school"
                    value={educationInfo.school}
                    onChange={(e) => setEducationInfo({ ...educationInfo, school: e.target.value })}
                    placeholder="University of the Philippines"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course/Program</Label>
                  <Input
                    id="course"
                    value={educationInfo.course}
                    onChange={(e) => setEducationInfo({ ...educationInfo, course: e.target.value })}
                    placeholder="Bachelor of Science in Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Year Level</Label>
                  <Select
                    value={educationInfo.yearLevel}
                    onValueChange={(value) => setEducationInfo({ ...educationInfo, yearLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="5th Year">5th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={educationInfo.studentId}
                    onChange={(e) => setEducationInfo({ ...educationInfo, studentId: e.target.value })}
                    placeholder="2024-12345"
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              <Separator />
              <Button onClick={handleEducationUpdate} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={securityInfo.currentPassword}
                    onChange={(e) => setSecurityInfo({ ...securityInfo, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={securityInfo.newPassword}
                    onChange={(e) => setSecurityInfo({ ...securityInfo, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={securityInfo.confirmPassword}
                    onChange={(e) => setSecurityInfo({ ...securityInfo, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Separator />
              <Button onClick={handleSecurityUpdate} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive updates and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Checkbox
                    id="emailNotifications" // Added ID for clarity
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked as boolean })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                  </div>
                  <Checkbox
                    id="smsNotifications" // Added ID for clarity
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, smsNotifications: checked as boolean })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Application Updates</Label>
                    <p className="text-sm text-gray-500">Get notified about application status changes</p>
                  </div>
                  <Checkbox
                    id="applicationUpdates" // Added ID for clarity
                    checked={notificationSettings.applicationUpdates}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, applicationUpdates: checked as boolean })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Document Reminders</Label>
                    <p className="text-sm text-gray-500">Receive reminders about document submissions</p>
                  </div>
                  <Checkbox
                    id="documentReminders" // Added ID for clarity
                    checked={notificationSettings.documentReminders}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, documentReminders: checked as boolean })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Notifications</Label>
                    <p className="text-sm text-gray-500">Get notified about financial distribution</p>
                  </div>
                  <Checkbox
                    id="paymentNotifications" // Added ID for clarity
                    checked={notificationSettings.paymentNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, paymentNotifications: checked as boolean })
                    }
                  />
                </div>
              </div>
              <Separator />
              <Button
                onClick={handleNotificationUpdate}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
