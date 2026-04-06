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
import { StudentLayout } from "@/components/student-layout"
import { useToast } from "@/components/ui/use-toast"
import { Moon, Sun, Laptop, Bell, Shield, Save, RefreshCw, Settings2, Lock, Smartphone } from "lucide-react"

const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  fontSize: z.enum(["small", "medium", "large"]),
})

const notificationSchema = z.object({
  emailAlerts: z.boolean(),
  smsAlerts: z.boolean(),
  applicationUpdates: z.boolean(),
  scheduleReminders: z.boolean(),
})

export default function StudentSettingsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("appearance")
  const [isLoading, setIsLoading] = useState(false)

  const appearanceForm = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: { theme: "system", fontSize: "medium" },
  })

  const notificationForm = useForm<z.infer<typeof notificationSchema>>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { emailAlerts: true, smsAlerts: true, applicationUpdates: true, scheduleReminders: true },
  })

  async function onAppearanceSubmit(values: z.infer<typeof appearanceSchema>) {
    setIsLoading(true)
    setTimeout(() => {
      toast({ title: "Appearance updated", description: "Your preferences have been saved.", className: "bg-emerald-600 text-white border-none" })
      setIsLoading(false)
    }, 1000)
  }

  async function onNotificationSubmit(values: z.infer<typeof notificationSchema>) {
    setIsLoading(true)
    setTimeout(() => {
      toast({ title: "Notifications updated", description: "Your alert preferences have been saved.", className: "bg-emerald-600 text-white border-none" })
      setIsLoading(false)
    }, 1000)
  }

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-400 rounded-full filter blur-[80px] opacity-10 -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative flex items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shrink-0">
              <Settings2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Account Settings</h1>
              <p className="text-slate-500 font-medium mt-1">Customize your app experience and notification preferences.</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="appearance" className="space-y-6" onValueChange={setActiveTab}>
          
          <TabsList className="bg-slate-100/50 p-1.5 shadow-sm flex flex-wrap h-auto w-full md:w-fit justify-start rounded-2xl border border-slate-200 gap-1">
            <TabsTrigger value="appearance" className="gap-2 h-10 px-6 shrink-0 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"><Sun className="h-4 w-4" /> Appearance</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 h-10 px-6 shrink-0 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="security" className="gap-2 h-10 px-6 shrink-0 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"><Shield className="h-4 w-4" /> Security</TabsTrigger>
          </TabsList>

          {/* ================= APPEARANCE TAB ================= */}
          <TabsContent value="appearance">
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-300">
              <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 w-full" />
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800">Theme & Display</CardTitle>
                <CardDescription className="font-medium text-slate-500">Customize how the scholarship portal looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <Form {...appearanceForm}>
                  <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-8">
                    
                    <FormField control={appearanceForm.control} name="theme" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-500">Theme Preference</FormLabel>
                        <div className="mt-3">
                          <FormControl>
                            <div className="flex flex-wrap gap-4">
                              <div className={`flex flex-col items