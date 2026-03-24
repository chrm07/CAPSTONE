"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { createUser, createApplication, initializeStorage, isEmailPreApproved } from "@/lib/storage"
import { ArrowLeft, ArrowRight, CheckCircle, User, School, Lock, Mail } from "lucide-react"

// Initialize storage when the page loads
if (typeof window !== "undefined") {
  initializeStorage()
}

type FormData = {
  email: string
  fullName: string
  address: string
  contactNumber: string
  age: string
  gender: string
  barangay: string
  school: string
  course: string
  yearLevel: string
  password: string
  confirmPassword: string
  isPWD: boolean
}

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [emailValidated, setEmailValidated] = useState(false)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const totalSteps = 4

  const [formData, setFormData] = useState<FormData>({
    email: "",
    fullName: "",
    address: "",
    contactNumber: "",
    age: "",
    gender: "",
    barangay: "",
    school: "",
    course: "",
    yearLevel: "",
    password: "",
    confirmPassword: "",
    isPWD: false,
  })

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateEmail = async () => {
    if (!formData.email) {
      setErrors({ email: "Please enter your email address" })
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address",
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: "Please enter a valid email address" })
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
      })
      return false
    }

    const isApproved = isEmailPreApproved(formData.email)
    if (!isApproved) {
      setErrors({ email: "This email is not authorized to register" })
      toast({
        variant: "destructive",
        title: "Email not authorized",
        description: "This email is not authorized to register. Please contact the administrator.",
      })
      return false
    }

    setEmailValidated(true)
    setErrors({ email: "" })
    return true
  }

  const validateCurrentStep = async () => {
    if (step === 0) {
      return await validateEmail()
    }

    const newErrors: Partial<FormData> = {}
    let isValid = true

    if (step === 1) {
      const requiredFields: (keyof FormData)[] = ["fullName", "address", "contactNumber", "age", "gender", "barangay"]

      requiredFields.forEach((field) => {
        if (!formData[field] || formData[field].trim() === "") {
          newErrors[field] = "This field is required"
          isValid = false
        }
      })

      if (formData.contactNumber && formData.contactNumber.length < 10) {
        newErrors.contactNumber = "Contact number must be at least 10 digits"
        isValid = false
      }
    }

    if (step === 2) {
      const requiredFields: (keyof FormData)[] = ["school", "course", "yearLevel"]

      requiredFields.forEach((field) => {
        if (!formData[field] || formData[field].trim() === "") {
          newErrors[field] = "This field is required"
          isValid = false
        }
      })
    }

    if (step === 3) {
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters"
        isValid = false
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match"
        isValid = false
      }
      if (!formData.isPWD) {
        toast({
          variant: "destructive",
          title: "Terms and Conditions required",
          description: "You must agree to the Terms of Service and Privacy Policy to create an account.",
        })
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid && step < totalSteps - 1) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step < 3) {
      handleNext()
      return
    }

    const isValid = await validateCurrentStep()
    if (!isValid) return

    setIsLoading(true)
    try {
      const userData = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: "student" as const,
      }

      const profileData = {
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        address: formData.address,
        age: formData.age,
        gender: formData.gender,
        barangay: formData.barangay,
        bio: "",
        school: formData.school,
        course: formData.course,
        yearLevel: formData.yearLevel,
        isPWD: formData.isPWD,
      }

      const newUser = createUser(userData, profileData)

      const applicationData = {
        studentId: newUser.id,
        fullName: formData.fullName,
        email: formData.email,
        course: formData.course,
        yearLevel: formData.yearLevel,
        school: formData.school,
        barangay: formData.barangay,
        gender: formData.gender,
        age: formData.age,
        status: "pending" as const,
      }

      createApplication(applicationData)

      toast({
        title: "Registration successful",
        description: "Your account has been created. Please login to access your account.",
      })

      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "An error occurred during registration. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const progressPercentage = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <header className="w-full bg-green-600 shadow-xl">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center space-x-2 text-white hover:text-green-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Progress Bar */}
            <div className="h-3 bg-slate-200">
              <div
                className="h-full bg-green-500 transition-all duration-700"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="px-8 py-8 text-center bg-green-600 text-white">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/image.png"
                    alt="City of Carmona Logo"
                    className="h-12 w-12 rounded-full object-contain"
                  />
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full">
                  {step === 0 && <Mail className="w-8 h-8 text-white" />}
                  {step === 1 && <User className="w-8 h-8 text-white" />}
                  {step === 2 && <School className="w-8 h-8 text-white" />}
                  {step === 3 && <Lock className="w-8 h-8 text-white" />}
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold mb-2 text-white">Join Our Program</h1>
                  <p className="text-white/90">Create your scholarship account</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-white">Step {step + 1}</span>
                  <span className="text-white/80">/</span>
                  <span className="text-white/80">{totalSteps}</span>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-8">
              <Card className="border-0 shadow-none bg-transparent">
                <CardHeader className="pb-6 px-0">
                  <CardTitle className="text-xl text-center text-slate-800">
                    {step === 0 && "Email Verification"}
                    {step === 1 && "Personal Information"}
                    {step === 2 && "Educational Information"}
                    {step === 3 && "Account Credentials"}
                  </CardTitle>
                  <CardDescription className="text-center text-slate-600">
                    {step === 0 && "Verify your email is authorized to register"}
                    {step === 1 && "Enter your personal details"}
                    {step === 2 && "Tell us about your education"}
                    {step === 3 && "Create your login credentials"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-0">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Step 0: Email Verification */}
                    {step === 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-1">
                          Email Address
                          {emailValidated && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          className="h-12 rounded-xl"
                        />
                        <p className="text-sm text-slate-600">
                          Only pre-approved emails can register for the scholarship program.
                        </p>
                        {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                      </div>
                    )}

                    {/* Step 1: Personal Information */}
                    {step === 1 && (
                      <>
                        {emailValidated && (
                          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Email verified: {formData.email}</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                              id="fullName"
                              placeholder="Juan Dela Cruz"
                              value={formData.fullName}
                              onChange={(e) => updateField("fullName", e.target.value)}
                              className="h-12 rounded-xl"
                            />
                            {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="contactNumber">Contact Number</Label>
                            <Input
                              id="contactNumber"
                              type="tel"
                              placeholder="09123456789"
                              value={formData.contactNumber}
                              onChange={(e) => updateField("contactNumber", e.target.value.replace(/[^0-9]/g, ""))}
                              className="h-12 rounded-xl"
                            />
                            {errors.contactNumber && <p className="text-sm text-red-600">{errors.contactNumber}</p>}
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                              id="address"
                              placeholder="123 Main St, City"
                              value={formData.address}
                              onChange={(e) => updateField("address", e.target.value)}
                              className="h-12 rounded-xl"
                            />
                            {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input
                              id="age"
                              type="number"
                              placeholder="18"
                              value={formData.age}
                              onChange={(e) => updateField("age", e.target.value)}
                              className="h-12 rounded-xl"
                              min="16"
                              max="30"
                            />
                            {errors.age && <p className="text-sm text-red-600">{errors.age}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select value={formData.gender} onValueChange={(value) => updateField("gender", value)}>
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Select your gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.gender && <p className="text-sm text-red-600">{errors.gender}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label>Person with Disability (PWD)</Label>
                            <div className="flex items-center gap-3 h-12 px-4 border rounded-xl bg-background">
                              <input
                                type="checkbox"
                                id="isPWD"
                                checked={formData.isPWD}
                                onChange={(e) => updateField("isPWD", e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor="isPWD" className="text-sm font-normal cursor-pointer">
                                Yes, I am a Person with Disability
                              </Label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Barangay</Label>
                            <Select value={formData.barangay} onValueChange={(value) => updateField("barangay", value)}>
                              <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue placeholder="Select your barangay" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Barangay 1">Barangay 1</SelectItem>
                                <SelectItem value="Barangay 2">Barangay 2</SelectItem>
                                <SelectItem value="Barangay 3">Barangay 3</SelectItem>
                                <SelectItem value="Barangay 4">Barangay 4</SelectItem>
                                <SelectItem value="Barangay 5">Barangay 5</SelectItem>
                                <SelectItem value="Barangay 6">Barangay 6</SelectItem>
                                <SelectItem value="Barangay 7">Barangay 7</SelectItem>
                                <SelectItem value="Barangay 8">Barangay 8</SelectItem>
                                <SelectItem value="Barangay 9">Barangay 9</SelectItem>
                                <SelectItem value="Barangay 10">Barangay 10</SelectItem>
                                <SelectItem value="Barangay 11">Barangay 11</SelectItem>
                                <SelectItem value="Barangay 12">Barangay 12</SelectItem>
                              </SelectContent>
                            </Select>
                            {errors.barangay && <p className="text-sm text-red-600">{errors.barangay}</p>}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 2: Educational Information */}
                    {step === 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="school">School Name</Label>
                          <Input
                            id="school"
                            placeholder="University of Example"
                            value={formData.school}
                            onChange={(e) => updateField("school", e.target.value)}
                            className="h-12 rounded-xl"
                          />
                          {errors.school && <p className="text-sm text-red-600">{errors.school}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="course">Course</Label>
                          <Input
                            id="course"
                            placeholder="Bachelor of Science in Computer Science"
                            value={formData.course}
                            onChange={(e) => updateField("course", e.target.value)}
                            className="h-12 rounded-xl"
                          />
                          {errors.course && <p className="text-sm text-red-600">{errors.course}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>Year Level</Label>
                          <Select value={formData.yearLevel} onValueChange={(value) => updateField("yearLevel", value)}>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select your year level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st Year">1st Year</SelectItem>
                              <SelectItem value="2nd Year">2nd Year</SelectItem>
                              <SelectItem value="3rd Year">3rd Year</SelectItem>
                              <SelectItem value="4th Year">4th Year</SelectItem>
                            </SelectContent>
                          </Select>
                          {errors.yearLevel && <p className="text-sm text-red-600">{errors.yearLevel}</p>}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Account Information */}
                    {step === 3 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="••••••••"
                              value={formData.password}
                              onChange={(e) => updateField("password", e.target.value)}
                              className="h-12 rounded-xl"
                            />
                            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="••••••••"
                              value={formData.confirmPassword}
                              onChange={(e) => updateField("confirmPassword", e.target.value)}
                              className="h-12 rounded-xl"
                            />
                            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
                          </div>

                          <div className="md:col-span-2">
                            <p className="text-sm text-slate-600">
                              Password must be at least 8 characters with at least one uppercase letter, one lowercase
                              letter, and one number.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-xl border">
                          <Checkbox
                            id="acceptTerms"
                            checked={formData.isPWD}
                            onCheckedChange={(checked) => updateField("isPWD", checked as boolean)}
                            className="mt-1"
                          />
                          <div className="space-y-1">
                            <Label htmlFor="acceptTerms" className="text-sm font-medium leading-relaxed cursor-pointer">
                              I agree to the{" "}
                              <Link
                                href="/terms"
                                target="_blank"
                                className="text-green-600 hover:text-green-700 underline"
                              >
                                Terms of Service
                              </Link>{" "}
                              and{" "}
                              <Link
                                href="/privacy"
                                target="_blank"
                                className="text-green-600 hover:text-green-700 underline"
                              >
                                Privacy Policy
                              </Link>
                              .
                            </Label>
                            <p className="text-xs text-slate-500">
                              By checking this box, you acknowledge that you have read and understood our terms and
                              privacy policy.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-8 border-t border-slate-100">
                      {step > 0 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevious}
                          className="flex items-center gap-2 h-12 px-6 rounded-xl bg-transparent"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      ) : (
                        <div></div>
                      )}

                      {step < 3 ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 h-12 px-6 rounded-xl"
                        >
                          {step === 0 ? "Verify Email" : "Next"}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2 h-12 px-6 rounded-xl"
                        >
                          {isLoading ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Creating Account...
                            </>
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>

                <CardFooter className="flex flex-col items-center space-y-4 pt-6 px-0 border-t border-slate-100">
                  <div className="text-sm text-center text-slate-600">
                    Already have an account?{" "}
                    <Link href="/login" className="text-green-600 hover:text-green-700 font-medium transition-colors">
                      Sign in here
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
