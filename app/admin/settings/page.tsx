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
import { AdminLayout } from "@/components/admin-layout"
import { useToast } from "@/components/ui/use-toast"
import { Moon, Sun, Laptop, Bell, Database, Settings2, Shield, FileText, Save, RefreshCw } from "lucide-react"

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
  language: z.string().min(1, { message: "Please select a language" }),
})

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  systemAlerts: z.boolean(),
  applicationUpdates: z.boolean(),
  securityAlerts: z.boolean(),
})

const systemSchema = z.object({
  autoApproveDocuments: z.boolean(),
  requireAdminVerification: z.boolean(),
  enableQRVerification: z.boolean(),
  enableBulkOperations: z.boolean(),
  enableAuditLog: z.boolean(),
  backupFrequency: z.enum(["daily", "weekly", "monthly"]),
  retentionPeriod: z.enum(["30days", "60days", "90days", "1year"]),
})

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("appearance")
  const [isLoading, setIsLoading] = useState(false)

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
      systemAlerts: true,
      applicationUpdates: true,
      securityAlerts: true,
    },
  })

  const systemForm = useForm<z.infer<typeof systemSchema>>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      autoApproveDocuments: false,
      requireAdminVerification: true,
      enableQRVerification: true,
      enableBulkOperations: true,
      enableAuditLog: true,
      backupFrequency: "daily",
      retentionPeriod: "90days",
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

  async function onSystemSubmit(values: z.infer<typeof systemSchema>) {
    setIsLoading(true)
    try {
      // Here you would typically make an API call to update system settings
      setTimeout(() => {
        toast({
          title: "System settings updated",
          description: "The system settings have been updated successfully.",
        })
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "An error occurred while updating the system settings. Please try again.",
      })
      setIsLoading(false)
    }
  }

  const handleBackupDatabase = () => {
    setIsLoading(true)
    // Here you would typically make an API call to backup the database
    setTimeout(() => {
      toast({
        title: "Database backup initiated",
        description: "The database backup has been initiated. You will be notified when it's complete.",
      })
      setIsLoading(false)
    }, 1500)
  }

  const handleRestoreDatabase = () => {
    setIsLoading(true)
    // Here you would typically make an API call to restore the database
    setTimeout(() => {
      toast({
        title: "Database restore initiated",
        description: "The database restore has been initiated. You will be notified when it's complete.",
      })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Manage system settings and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
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
                        name="systemAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">System Alerts</FormLabel>
                              <FormDescription>Important system alerts and announcements</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="applicationUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Application Updates</FormLabel>
                              <FormDescription>Notifications about new scholarship applications</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={notificationForm.control}
                        name="securityAlerts"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Security Alerts</FormLabel>
                              <FormDescription>Notifications about security-related events</FormDescription>
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

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings for the scholarship program</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...systemForm}>
                <form onSubmit={systemForm.handleSubmit(onSystemSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <Settings2 className="mr-2 h-5 w-5" />
                      Application Processing
                    </h3>
                    <div className="space-y-2">
                      <FormField
                        control={systemForm.control}
                        name="autoApproveDocuments"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Auto-Approve Documents</FormLabel>
                              <FormDescription>
                                Automatically approve documents that meet all requirements
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="requireAdminVerification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Require Admin Verification</FormLabel>
                              <FormDescription>Require administrator verification for all applications</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="enableQRVerification"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable QR Verification</FormLabel>
                              <FormDescription>Enable QR code verification for scholarship recipients</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="enableBulkOperations"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Bulk Operations</FormLabel>
                              <FormDescription>Enable bulk approval/rejection of applications</FormDescription>
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
                      Security & Compliance
                    </h3>
                    <div className="space-y-2">
                      <FormField
                        control={systemForm.control}
                        name="enableAuditLog"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Audit Log</FormLabel>
                              <FormDescription>Keep a detailed log of all system activities</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="backupFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Backup Frequency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select backup frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>How often the system should automatically backup data</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={systemForm.control}
                        name="retentionPeriod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Retention Period</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select retention period" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="30days">30 Days</SelectItem>
                                <SelectItem value="60days">60 Days</SelectItem>
                                <SelectItem value="90days">90 Days</SelectItem>
                                <SelectItem value="1year">1 Year</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>How long to keep audit logs and system data</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save System Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>Manage database operations and maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Save className="mr-2 h-5 w-5" />
                  Backup Database
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create a backup of the entire scholarship database. This includes all student records, applications,
                  documents, and system settings.
                </p>
                <Button variant="outline" onClick={handleBackupDatabase} disabled={isLoading}>
                  <Database className="mr-2 h-4 w-4" />
                  {isLoading ? "Backing up..." : "Backup Database"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Restore Database
                </h3>
                <p className="text-sm text-muted-foreground">
                  Restore the database from a previous backup. This will replace all current data with the data from the
                  backup.
                </p>
                <Alert>
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Restoring the database will overwrite all current data. This action cannot be undone.
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-4">
                  <Select defaultValue="latest">
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Select backup to restore" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest Backup (March 29, 2023 - 10:30 AM)</SelectItem>
                      <SelectItem value="march28">March 28, 2023 - 10:30 AM</SelectItem>
                      <SelectItem value="march27">March 27, 2023 - 10:30 AM</SelectItem>
                      <SelectItem value="march26">March 26, 2023 - 10:30 AM</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" onClick={handleRestoreDatabase} disabled={isLoading}>
                    {isLoading ? "Restoring..." : "Restore Database"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Database Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium">Total Records</div>
                    <div className="text-2xl font-bold">1,256</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium">Database Size</div>
                    <div className="text-2xl font-bold">256 MB</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium">Last Backup</div>
                    <div className="text-2xl font-bold">1 day ago</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-sm font-medium">Backup Size</div>
                    <div className="text-2xl font-bold">128 MB</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  )
}
