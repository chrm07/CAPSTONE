"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StudentLayout } from "@/components/student-layout"
import { useToast } from "@/components/ui/use-toast"
import { Moon, Sun, Laptop, Bell, Eye, Download, Trash2, AlertTriangle, Shield, FileText } from "lucide-react"

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  language: z.string().min(1, { message: "Please select a language" }),
})

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  applicationUpdates: z.boolean(),
  documentReminders: z.boolean(),
  paymentNotifications: z.boolean(),
})

const privacySchema = z.object({
  showProfile: z.boolean(),
  showContactInfo: z.boolean(),
  allowDataCollection: z.boolean(),
  allowCookies: z.boolean(),
})

export default function SettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("appearance")
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const appearanceForm = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: "system",
      fontSize: "medium",
      language: "en",
    },
  })

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: true,
      applicationUpdates: true,
      documentReminders: true,
      paymentNotifications: true,
    },
  })

  const privacyForm = useForm<z.infer<typeof privacySchema>>({
    resolver: zodResolver(privacySchema),
    defaultValues: {
      showProfile: true,
      showContactInfo: false,
      allowDataCollection: true,
      allowCookies: true,
    },
  })

  async function onAppearanceSubmit(values: z.infer<typeof appearanceSchema>) {
    setIsLoading(true)
    try {
      // Here you would typically make an API call to update appearance settings
      setTimeout(() => {
        toast({
          title: "Appearance settings updated",
          description: "Your appearance settings have been updated successfully.",
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An error occurred while updating your appearance settings. Please try again.",
      })
      setIsLoading(false)
    }
  }

  async function onNotificationSubmit(values: z.infer<typeof notificationSchema>) {
    setIsLoading(true)
    try {
      // Here you would typically make an API call to update notification settings
      setTimeout(() => {
        toast({
          title: "Notification settings updated",
          description: "Your notification settings have been updated successfully.",
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An error occurred while updating your notification settings. Please try again.",
      })
      setIsLoading(false)
    }
  }

  async function onPrivacySubmit(values: z.infer<typeof privacySchema>) {
    setIsLoading(true)
    try {
      // Here you would typically make an API call to update privacy settings
      setTimeout(() => {
        toast({
          title: "Privacy settings updated",
          description: "Your privacy settings have been updated successfully.",
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An error occurred while updating your privacy settings. Please try again.",
      })
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    setIsLoading(true)
    // Here you would typically make an API call to export user data
    setTimeout(() => {
      toast({
        title: "Data export initiated",
        description: "Your data export has been initiated. You will receive an email with your data shortly.",
      })
      setIsLoading(false)
    }, 1500)
  }

  const handleDeleteAccount = () => {
    setIsLoading(true)
    // Here you would typically make an API call to delete the account
    setTimeout(() => {
      toast({
        title: "Account deletion initiated",
        description: "Your account deletion has been initiated. You will receive a confirmation email shortly.",
      })
      setShowDeleteConfirm(false)
      setIsLoading(false)
    }, 1500)
  }

  return (
    <StudentLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the scholarship system looks for you</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...appearanceForm}>
                <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-6">
                  <FormField
                    control={appearanceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormControl>
                            <div className="flex space-x-4">
                              <div
                                className={`flex flex-col items-center space-y-2 ${field.value === "light" ? "text-primary" : "text-muted-foreground"}`}
                              >
                                <div
                                  className={`p-2 rounded-full cursor-pointer ${field.value === "light" ? "bg-primary/10" : "hover:bg-muted"}`}
                                  onClick={() => field.onChange("light")}
                                >
                                  <Sun className="h-5 w-5" />
                                </div>
                                <span className="text-xs">Light</span>
                              </div>
                              <div
                                className={`flex flex-col items-center space-y-2 ${field.value === "dark" ? "text-primary" : "text-muted-foreground"}`}
                              >
                                <div
                                  className={`p-2 rounded-full cursor-pointer ${field.value === "dark" ? "bg-primary/10" : "hover:bg-muted"}`}
                                  onClick={() => field.onChange("dark")}
                                >
                                  <Moon className="h-5 w-5" />
                                </div>
                                <span className="text-xs">Dark</span>
                              </div>
                              <div
                                className={`flex flex-col items-center space-y-2 ${field.value === "system" ? "text-primary" : "text-muted-foreground"}`}
                              >
                                <div
                                  className={`p-2 rounded-full cursor-pointer ${field.value === "system" ? "bg-primary/10" : "hover:bg-muted"}`}
                                  onClick={() => field.onChange("system")}
                                >
                                  <Laptop className="h-5 w-5" />
                                </div>
                                <span className="text-xs">System</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appearanceForm.control}
                    name="fontSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select font size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>This will adjust the size of text throughout the application.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={appearanceForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fil">Filipino</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This will change the language used throughout the application.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Appearance Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Bell className="mr-2 h-5 w-5" />
                      Communication Channels
                    </h3>
                    <div className="space-y-2">
                      <FormField
                        control={notificationForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Email Notifications</FormLabel>
                              <FormDescription>Receive notifications via email</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">SMS Notifications</FormLabel>
                              <FormDescription>Receive notifications via text message</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Notification Types
                    </h3>
                    <div className="space-y-2">
                      <FormField
                        control={notificationForm.control}
                        name="applicationUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Application Updates</FormLabel>
                              <FormDescription>Notifications about your scholarship application status</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="documentReminders"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Document Reminders</FormLabel>
                              <FormDescription>Reminders about required document submissions</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="paymentNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Payment Notifications</FormLabel>
                              <FormDescription>Notifications about scholarship fund disbursements</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Manage your privacy and data preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...privacyForm}>
                <form onSubmit={privacyForm.handleSubmit(onPrivacySubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Eye className="mr-2 h-5 w-5" />
                      Profile Visibility
                    </h3>
                    <div className="space-y-2">
                      <FormField
                        control={privacyForm.control}
                        name="showProfile"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Show Profile to Administrators</FormLabel>
                              <FormDescription>
                                Allow scholarship administrators to view your profile information
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={privacyForm.control}
                        name="showContactInfo"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Show Contact Information</FormLabel>
                              <FormDescription>
                                Allow scholarship administrators to view your contact information
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      Data Privacy
                    </h3>
                    <div className="space-y-2">
                      <FormField
                        control={privacyForm.control}
                        name="allowDataCollection"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Allow Data Collection</FormLabel>
                              <FormDescription>
                                Allow the scholarship system to collect data for program improvement
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={privacyForm.control}
                        name="allowCookies"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Allow Cookies</FormLabel>
                              <FormDescription>
                                Allow the scholarship system to use cookies for better user experience
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>Manage your account data and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Export Your Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  You can export all your personal data and scholarship information in a downloadable format.
                </p>
                <Button variant="outline" onClick={handleExportData} disabled={isLoading}>
                  {isLoading ? "Exporting..." : "Export My Data"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center text-destructive">
                  <Trash2 className="mr-2 h-5 w-5" />
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                    Delete My Account
                  </Button>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Are you sure you want to delete your account?</AlertTitle>
                    <AlertDescription>
                      <p className="mb-4">
                        This will permanently delete your account, all your personal information, and scholarship data.
                        This action cannot be undone.
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading}>
                          {isLoading ? "Deleting..." : "Yes, Delete My Account"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isLoading}>
                          Cancel
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </StudentLayout>
  )
}
