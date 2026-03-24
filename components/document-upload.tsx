"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  X, 
  AlertCircle,
  ImageIcon,
  RefreshCw
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

// NEW: Import our real Firestore functions!
import { createDocumentDb, getDocumentsByStudentIdDb, deleteDocumentDb } from "@/lib/storage"

type DocumentStatus = {
  isUploading: boolean
  isUploaded: boolean
  progress: number
  fileName: string
  fileSize: string
  error: string | null
}

const initialDocumentStatus: DocumentStatus = {
  isUploading: false,
  isUploaded: false,
  progress: 0,
  fileName: "",
  fileSize: "",
  error: null,
}

// Helper function to convert a File to a Base64 String
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Add the onUploadComplete prop interface
interface DocumentUploadProps {
  onUploadComplete?: () => void
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Record<string, DocumentStatus>>({
    enrollmentForm: { ...initialDocumentStatus },
    grades: { ...initialDocumentStatus },
    schoolId: { ...initialDocumentStatus },
    barangayClearance: { ...initialDocumentStatus },
  })
  const [dragOver, setDragOver] = useState<string | null>(null)

  // Load existing documents from Firestore on mount
  useEffect(() => {
    const loadDocs = async () => {
      if (user) {
        try {
          const existingDocs = await getDocumentsByStudentIdDb(user.id)
          const updatedDocuments = { ...documents } // copy current state
          
          existingDocs.forEach((doc) => {
            const docType = getDocumentType(doc.name)
            if (docType && updatedDocuments[docType]) {
              updatedDocuments[docType] = {
                ...initialDocumentStatus,
                isUploaded: true,
                fileName: doc.name, 
                fileSize: doc.fileSize,
              }
            }
          })
          
          setDocuments(updatedDocuments)
        } catch (error) {
          console.error("Error loading documents:", error)
        }
      }
    }
    loadDocs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const getDocumentType = (name: string): string | null => {
    const nameMap: Record<string, string> = {
      "Enrollment Form": "enrollmentForm",
      "Grades": "grades",
      "School ID": "schoolId",
      "Barangay Clearance": "barangayClearance",
    }
    return nameMap[name] || null
  }

  const getDocumentName = (documentType: string) => {
    switch (documentType) {
      case "enrollmentForm": return "Enrollment Form"
      case "grades": return "Grades"
      case "schoolId": return "School ID"
      case "barangayClearance": return "Barangay Clearance"
      default: return documentType
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const validateFile = (file: File, acceptedTypes: string): string | null => {
    // Check file size (max 2MB is safer for Base64 Firestore limits!)
    if (file.size > 2 * 1024 * 1024) {
      return "File size exceeds 2MB limit. Please compress your file."
    }

    const extensions = acceptedTypes.split(",").map((t) => t.trim().toLowerCase())
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase()
    
    if (!extensions.includes(fileExt)) {
      return `Invalid file type. Accepted: ${acceptedTypes}`
    }

    return null
  }

  const handleFileUpload = useCallback(async (documentType: string, file: File, acceptedTypes: string) => {
    const error = validateFile(file, acceptedTypes)
    if (error) {
      toast({ variant: "destructive", title: "Upload failed", description: error })
      return
    }

    const fileSize = formatFileSize(file.size)

    // Start UI upload state
    setDocuments((prev) => ({
      ...prev,
      [documentType]: {
        ...prev[documentType],
        isUploading: true,
        progress: 30,
        fileName: file.name,
        fileSize,
        error: null,
      },
    }))

    try {
      if (!user) throw new Error("Must be logged in to upload")

      // Convert the file to a massive Base64 string!
      const base64String = await fileToBase64(file)
      
      setDocuments((prev) => ({
        ...prev,
        [documentType]: { ...prev[documentType], progress: 70 },
      }))

      // Save directly to Firestore Database
      await createDocumentDb({
        studentId: user.id,
        name: getDocumentName(documentType),
        type: file.type.includes("pdf") ? "pdf" : "image",
        status: "pending",
        fileSize,
        semester: "1st Semester",
        academicYear: "2024-2025",
        url: base64String, // Store the Base64 string directly as the URL!
      })

      // Complete upload state
      setDocuments((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          isUploading: false,
          isUploaded: true,
          progress: 100,
        },
      }))

      toast({
        title: "Document uploaded successfully",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>{getDocumentName(documentType)} is now pending review</span>
          </div>
        ),
      })

      // Notify parent component that an upload finished
      if (onUploadComplete) {
        onUploadComplete()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setDocuments((prev) => ({
        ...prev,
        [documentType]: { ...initialDocumentStatus, error: errorMessage },
      }))
      toast({ variant: "destructive", title: "Upload failed", description: errorMessage })
    }
  }, [user, toast, onUploadComplete])

  const handleFileChange = (documentType: string, acceptedTypes: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    handleFileUpload(documentType, e.target.files[0], acceptedTypes)
  }

  const handleDrop = useCallback((documentType: string, acceptedTypes: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(documentType, e.dataTransfer.files[0], acceptedTypes)
    }
  }, [handleFileUpload])

  const handleDragOver = (documentType: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(documentType)
  }

  const handleDragLeave = () => setDragOver(null)

  const handleRemoveDocument = async (documentType: string) => {
    if (!user) return

    try {
      // Delete from Firestore
      await deleteDocumentDb(user.id, getDocumentName(documentType))
      
      // Update UI
      setDocuments((prev) => ({
        ...prev,
        [documentType]: { ...initialDocumentStatus },
      }))
      
      toast({ title: "Document removed", description: "You can upload a new document" })
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove document" })
    }
  }

  const documentConfigs = [
    { type: "enrollmentForm", title: "Enrollment Form", description: "Current semester enrollment form", acceptedTypes: ".pdf", icon: FileText, required: true },
    { type: "grades", title: "Grades / Report Card", description: "Previous semester grades", acceptedTypes: ".pdf", icon: FileText, required: true },
    { type: "schoolId", title: "School ID", description: "Clear photo of your school ID", acceptedTypes: ".jpg,.jpeg,.png", icon: ImageIcon, required: true },
    { type: "barangayClearance", title: "Barangay Clearance", description: "Valid barangay clearance", acceptedTypes: ".pdf", icon: FileText, required: true },
  ]

  const uploadedCount = Object.values(documents).filter((d) => d.isUploaded).length
  const totalRequired = documentConfigs.filter((d) => d.required).length

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Upload Progress</span>
          <span className="text-sm text-muted-foreground">
            {uploadedCount} of {totalRequired} documents uploaded
          </span>
        </div>
        <Progress value={(uploadedCount / totalRequired) * 100} className="h-2" />
        {uploadedCount === totalRequired && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            All required documents uploaded
          </p>
        )}
      </div>

      {/* Document Upload Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {documentConfigs.map((config) => {
          const docStatus = documents[config.type]
          const IconComponent = config.icon

          return (
            <Card 
              key={config.type}
              className={`transition-all duration-200 ${
                dragOver === config.type ? "ring-2 ring-green-500 bg-green-50" : ""
              } ${docStatus.isUploaded ? "bg-green-50/50 border-green-200" : ""}`}
            >
              <CardContent className="p-4">
                <div 
                  className="flex flex-col"
                  onDrop={(e) => handleDrop(config.type, config.acceptedTypes, e)}
                  onDragOver={(e) => handleDragOver(config.type, e)}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${docStatus.isUploaded ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{config.title}</h3>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                    {config.required && !docStatus.isUploaded && (
                      <span className="text-xs text-red-500 font-medium">Required</span>
                    )}
                  </div>

                  {docStatus.isUploaded ? (
                    <div className="border rounded-lg p-3 bg-background">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{docStatus.fileName}</p>
                            <p className="text-xs text-muted-foreground">{docStatus.fileSize}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                            Pending Review
                          </span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => handleRemoveDocument(config.type)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : docStatus.isUploading ? (
                    <div className="border rounded-lg p-3 bg-background">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
                        <span className="text-sm">Uploading {docStatus.fileName}...</span>
                      </div>
                      <Progress value={docStatus.progress} className="h-1.5" />
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        id={config.type}
                        type="file"
                        accept={config.acceptedTypes}
                        className="hidden"
                        onChange={(e) => handleFileChange(config.type, config.acceptedTypes, e)}
                      />
                      <Label
                        htmlFor={config.type}
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          dragOver === config.type
                            ? "border-green-500 bg-green-50"
                            : "border-muted-foreground/25 hover:border-green-500 hover:bg-muted/50"
                        }`}
                      >
                        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">Drop file here or click to browse</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {config.acceptedTypes.replace(/\./g, "").toUpperCase()} (max 2MB)
                        </span>
                      </Label>
                      {docStatus.error && (
                        <div className="flex items-center gap-1 mt-2 text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">{docStatus.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}