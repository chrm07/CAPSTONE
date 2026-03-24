"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { AdminLayout } from "@/components/admin-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Mail, CheckCircle, XCircle, Calendar, User, AlertCircle, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PermissionGuard } from "@/components/permission-guard"

// Import our Firestore functions
import { getPreApprovedEmailsListDb, addPreApprovedEmailDb, deletePreApprovedEmailDb } from "@/lib/storage"

// FIX: Updated to match Firestore schema exactly!
type PreApprovedEmail = {
  id: string
  email: string
  isUsed: boolean
  createdAt: string // Changed from addedAt to createdAt
  fullName?: string
}

export default function ApprovedEmailsPage() {
  const { toast } = useToast()
  const [emails, setEmails] = useState<PreApprovedEmail[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [emailsInput, setEmailsInput] = useState("")
  const [addResults, setAddResults] = useState<{ success: string[]; failed: string[] }>({ success: [], failed: [] })

  // Load emails on component mount
  useEffect(() => {
    loadEmails()
  }, [])

  const loadEmails = async () => {
    setIsFetching(true)
    try {
      const preApprovedEmails = await getPreApprovedEmailsListDb()
      // Sort by newest first
      const sortedEmails = (preApprovedEmails as PreApprovedEmail[]).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setEmails(sortedEmails)
    } catch (error) {
      console.error("Failed to load pre-approved emails:", error)
      toast({ title: "Error", description: "Failed to load emails from database.", variant: "destructive" })
    } finally {
      setIsFetching(false)
    }
  }

  const handleAddEmails = async () => {
    if (!emailsInput.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter at least one email address" })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const rawEmails = emailsInput.split(/[\n,;\s]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0)
    const uniqueEmails = [...new Set(rawEmails)]

    if (uniqueEmails.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "No valid email addresses found" })
      return
    }

    setIsLoading(true)
    const successEmails: string[] = []
    const failedEmails: string[] = []

    try {
      // Fetch current emails to manually prevent duplicates
      const currentEmailsList = await getPreApprovedEmailsListDb()
      const currentEmailStrings = currentEmailsList.map(e => e.email.toLowerCase())

      for (const email of uniqueEmails) {
        if (!emailRegex.test(email)) {
          failedEmails.push(`${email} (invalid format)`)
          continue
        }
        
        if (currentEmailStrings.includes(email)) {
          failedEmails.push(`${email} (already exists)`)
          continue
        }

        try {
          await addPreApprovedEmailDb(email)
          successEmails.push(email)
        } catch (error: any) {
          failedEmails.push(`${email} (${error.message || "failed"})`)
        }
      }

      setAddResults({ success: successEmails, failed: failedEmails })

      if (successEmails.length > 0) {
        toast({
          title: "Emails Added",
          description: `Successfully added ${successEmails.length} email${successEmails.length > 1 ? "s" : ""}${failedEmails.length > 0 ? `. ${failedEmails.length} failed.` : ""}`,
        })
        loadEmails() // Refresh the list
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No emails were added. Check the results below.",
        })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Database Error", description: "Could not connect to the database to add emails." })
    } finally {
      setIsLoading(false)
    }
  }

  const resetDialog = () => {
    setEmailsInput("")
    setAddResults({ success: [], failed: [] })
    setIsAddDialogOpen(false)
  }

  const handleRemoveEmail = async (id: string, email: string) => {
    try {
      await deletePreApprovedEmailDb(id)
      
      // Optistically update UI for immediate feedback
      setEmails(emails.filter(e => e.id !== id))
      
      toast({ title: "Success", description: `Removed ${email} from pre-approved list` })
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to remove email" })
      // Reload just in case the optimistic update was wrong
      loadEmails()
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <PermissionGuard permission="approved-emails">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Pre-Approved Emails</h1>
              <p className="text-muted-foreground">Manage the list of emails authorized to register for scholarships</p>
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              if (!open) resetDialog()
              else setIsAddDialogOpen(true)
            }}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" /> Add Emails
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Pre-Approved Emails</DialogTitle>
                  <DialogDescription>
                    Add one or multiple email addresses to the pre-approved list. You can paste a list of emails separated by commas, semicolons, spaces, or new lines.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="emails">Email Addresses *</Label>
                    <Textarea
                      id="emails"
                      placeholder="Enter emails (one per line or separated by commas)&#10;example1@email.com&#10;example2@email.com, example3@email.com"
                      value={emailsInput}
                      onChange={(e) => setEmailsInput(e.target.value)}
                      className="min-h-[120px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supports multiple formats: one email per line, comma-separated, or space-separated.
                    </p>
                  </div>

                  {/* Results display */}
                  {(addResults.success.length > 0 || addResults.failed.length > 0) && (
                    <div className="space-y-3">
                      {addResults.success.length > 0 && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <span className="font-medium">Added ({addResults.success.length}):</span>
                            <div className="mt-1 text-xs max-h-20 overflow-y-auto">
                              {addResults.success.join(", ")}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      {addResults.failed.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <span className="font-medium">Failed ({addResults.failed.length}):</span>
                            <div className="mt-1 text-xs max-h-20 overflow-y-auto">
                              {addResults.failed.join(", ")}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetDialog} disabled={isLoading}>
                    {addResults.success.length > 0 ? "Done" : "Cancel"}
                  </Button>
                  <Button onClick={handleAddEmails} disabled={isLoading || !emailsInput.trim()}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Adding..." : "Add Emails"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pre-Approved</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{emails.length}</div>
                <p className="text-xs text-muted-foreground">Emails in the system</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{emails.filter((email) => !email.isUsed).length}</div>
                <p className="text-xs text-muted-foreground">Ready for registration</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Used</CardTitle>
                <XCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{emails.filter((email) => email.isUsed).length}</div>
                <p className="text-xs text-muted-foreground">Already registered</p>
              </CardContent>
            </Card>
          </div>

          {/* Emails Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-Approved Email List</CardTitle>
              <CardDescription>All emails authorized to register for the scholarship program</CardDescription>
            </CardHeader>
            <CardContent>
              {isFetching ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-green-600" />
                  <p>Loading emails from database...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No pre-approved emails</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get started by adding the first pre-approved email.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow key={email.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {email.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {email.isUsed ? (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">Used</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(email.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Pre-Approved Email</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove <strong>{email.email}</strong> from the pre-approved
                                  list? This action cannot be undone. If the student has already registered, their account will not be deleted, but they won't be able to register again.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveEmail(email.id, email.email)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </PermissionGuard>
  )
}