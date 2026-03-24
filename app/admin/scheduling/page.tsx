"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Import ONLY our new async Firestore functions
import {
  getVerificationSchedulesDb,
  createVerificationScheduleDb,
  updateVerificationScheduleDb,
  deleteVerificationScheduleDb,
  getFinancialDistributionSchedulesDb,
  createFinancialDistributionScheduleDb,
  updateFinancialDistributionScheduleDb,
  deleteFinancialDistributionScheduleDb,
  type VerificationSchedule,
  type FinancialDistributionSchedule,
} from "@/lib/storage"

import { PermissionGuard } from "@/components/permission-guard"
import { Calendar, Plus, Edit, Trash2, StopCircle, DollarSign, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const BARANGAYS = [
  "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6",
  "Barangay 7", "Barangay 8", "Barangay 9", "Barangay 10", "Barangay 11", "Barangay 12",
]

export default function SchedulingPage() {
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("verification")
  const [verificationSchedules, setVerificationSchedules] = useState<VerificationSchedule[]>([])
  const [financialSchedules, setFinancialSchedules] = useState<FinancialDistributionSchedule[]>([])
  
  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<VerificationSchedule | FinancialDistributionSchedule | null>(null)
  
  const [formData, setFormData] = useState({
    barangay: "",
    barangays: [] as string[],
    startDate: "",
    endDate: "",
    dailyLimit: "",
    distributionAmount: "",
    startTime: "",
  })

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = async () => {
    setIsFetching(true)
    try {
      const [vLoaded, fLoaded] = await Promise.all([
        getVerificationSchedulesDb(),
        getFinancialDistributionSchedulesDb()
      ])
      setVerificationSchedules(vLoaded)
      setFinancialSchedules(fLoaded)
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to load schedules from database." })
    } finally {
      setIsFetching(false)
    }
  }

  const resetForm = () => {
    setFormData({ barangay: "", barangays: [], startDate: "", endDate: "", dailyLimit: "", distributionAmount: "", startTime: "" })
  }

  const toggleBarangay = (barangay: string) => {
    setFormData(prev => ({
      ...prev,
      barangays: prev.barangays.includes(barangay) ? prev.barangays.filter(b => b !== barangay) : [...prev.barangays, barangay]
    }))
  }

  const selectBarangayRange = (start: number, end: number) => {
    setFormData(prev => ({ ...prev, barangays: BARANGAYS.slice(start - 1, end) }))
  }

  const handleAddSchedule = async () => {
    // Standard Validations
    if (activeTab === "verification" && (!formData.barangay || !formData.startDate || !formData.endDate)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all required fields." })
      return
    }
    if (activeTab === "financial" && (formData.barangays.length === 0 || !formData.startDate || !formData.endDate)) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please select at least one barangay and fill in dates." })
      return
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast({ variant: "destructive", title: "Invalid Dates", description: "End date must be after start date." })
      return
    }
    if (activeTab === "financial" && !formData.distributionAmount) {
      toast({ variant: "destructive", title: "Validation Error", description: "Distribution amount is required." })
      return
    }

    setIsLoading(true)
    try {
      if (activeTab === "verification") {
        await createVerificationScheduleDb({
          barangay: formData.barangay,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dailyLimit: formData.dailyLimit ? Number.parseInt(formData.dailyLimit) : 0, 
          createdBy: "admin",
        })
        toast({ title: "Created", description: `Verification schedule for ${formData.barangay} created.` })
      } else {
        await Promise.all(formData.barangays.map(barangay => 
          createFinancialDistributionScheduleDb({
            barangays: [barangay],
            startDate: formData.startDate,
            endDate: formData.endDate,
            startTime: formData.startTime || "",
            distributionAmount: Number.parseFloat(formData.distributionAmount),
            createdBy: "admin",
          })
        ))
        toast({ title: "Created", description: `Financial schedules for ${formData.barangays.length} barangays created.` })
      }

      setIsAddModalOpen(false)
      resetForm()
      loadSchedules()
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to create schedule in database." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSchedule = async () => {
    if (!selectedSchedule || !formData.startDate || !formData.endDate) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all required fields." })
      return
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast({ variant: "destructive", title: "Invalid Dates", description: "End date must be after start date." })
      return
    }

    setIsLoading(true)
    try {
      if (activeTab === "verification") {
        await updateVerificationScheduleDb(selectedSchedule.id, {
          barangay: formData.barangay,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dailyLimit: formData.dailyLimit ? Number.parseInt(formData.dailyLimit) : 0,
        })
      } else {
        await updateFinancialDistributionScheduleDb(selectedSchedule.id, {
          barangays: formData.barangays.length > 0 ? formData.barangays : ["Barangay 1"],
          startDate: formData.startDate,
          endDate: formData.endDate,
          startTime: formData.startTime || "",
          distributionAmount: Number.parseFloat(formData.distributionAmount),
        })
      }

      toast({ title: "Updated", description: `Schedule updated successfully.` })
      setIsEditModalOpen(false)
      setSelectedSchedule(null)
      resetForm()
      loadSchedules()
    } catch (error) {
      console.error(error)
      toast({ variant: "destructive", title: "Error", description: "Failed to update schedule." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return
    setIsLoading(true)
    try {
      if (activeTab === "verification") await deleteVerificationScheduleDb(selectedSchedule.id)
      else await deleteFinancialDistributionScheduleDb(selectedSchedule.id)

      toast({ title: "Deleted", description: "Schedule deleted successfully." })
      setIsDeleteDialogOpen(false)
      setSelectedSchedule(null)
      loadSchedules()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete schedule." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndSchedule = async (schedule: VerificationSchedule | FinancialDistributionSchedule) => {
    try {
      if (activeTab === "verification") {
        await updateVerificationScheduleDb(schedule.id, { status: "ended" })
      } else {
        await updateFinancialDistributionScheduleDb(schedule.id, { status: "ended" })
      }
      toast({ title: "Ended", description: `Schedule status set to ended.` })
      loadSchedules()
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to end schedule." })
    }
  }

  const openEditModal = (schedule: VerificationSchedule | FinancialDistributionSchedule) => {
    setSelectedSchedule(schedule)
    const isFinancial = "distributionAmount" in schedule
    setFormData({
      barangay: !isFinancial ? (schedule as VerificationSchedule).barangay : "",
      barangays: isFinancial ? (schedule as FinancialDistributionSchedule).barangays : [],
      startDate: schedule.startDate.split("T")[0],
      endDate: schedule.endDate.split("T")[0],
      dailyLimit: !isFinancial && "dailyLimit" in schedule && schedule.dailyLimit ? schedule.dailyLimit.toString() : "",
      distributionAmount: isFinancial ? (schedule as FinancialDistributionSchedule).distributionAmount.toString() : "",
      startTime: isFinancial ? ((schedule as FinancialDistributionSchedule).startTime || "") : "",
    })
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (schedule: VerificationSchedule | FinancialDistributionSchedule) => {
    setSelectedSchedule(schedule)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "ended": return <Badge className="bg-gray-100 text-gray-800">Ended</Badge>
      case "upcoming": return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount)
  const formatTime = (timeString: string) => !timeString ? "N/A" : timeString

  return (
    <PermissionGuard permission="scheduling">
      <AdminLayout>
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Scheduling Management</h1>
              <p className="text-slate-600">Manage schedules for document verification and financial distribution</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verification" className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Document Verification</TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Financial Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Document Verification Scheduling</CardTitle>
                    <CardDescription>View and manage barangay-based walk-in verification schedules</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barangay Name</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Daily Limit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" /></TableCell></TableRow>
                      ) : verificationSchedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex flex-col items-center text-slate-500">
                              <Calendar className="h-12 w-12 mb-2 text-slate-300" />
                              <p>No schedules found. Click "Add Schedule" to create one.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        verificationSchedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{schedule.barangay}</TableCell>
                            <TableCell>{formatDate(schedule.startDate)}</TableCell>
                            <TableCell>{formatDate(schedule.endDate)}</TableCell>
                            <TableCell>{schedule.dailyLimit || "No limit"}</TableCell>
                            <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditModal(schedule)} disabled={schedule.status === "ended"}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {schedule.status === "active" && (
                                  <Button variant="ghost" size="icon" onClick={() => handleEndSchedule(schedule)}>
                                    <StopCircle className="h-4 w-4 text-amber-600" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(schedule)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Financial Distribution Scheduling</CardTitle>
                    <CardDescription>View and manage barangay-based financial aid distribution schedules</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" /> Add Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barangays</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Distribution Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isFetching ? (
                        <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-500" /></TableCell></TableRow>
                      ) : financialSchedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex flex-col items-center text-slate-500">
                              <DollarSign className="h-12 w-12 mb-2 text-slate-300" />
                              <p>No schedules found. Click "Add Schedule" to create one.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        financialSchedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium text-sm">
                              <div className="flex flex-wrap gap-1">
                                {schedule.barangays.map(b => <Badge key={b} className="bg-blue-100 text-blue-800">{b}</Badge>)}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(schedule.startDate)}</TableCell>
                            <TableCell className="font-mono text-sm">{formatTime(schedule.startTime)}</TableCell>
                            <TableCell>{formatDate(schedule.endDate)}</TableCell>
                            <TableCell className="font-semibold text-green-600">{formatCurrency(schedule.distributionAmount)}</TableCell>
                            <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditModal(schedule)} disabled={schedule.status === "ended"}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {schedule.status === "active" && (
                                  <Button variant="ghost" size="icon" onClick={() => handleEndSchedule(schedule)}>
                                    <StopCircle className="h-4 w-4 text-amber-600" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(schedule)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Schedule Modal - NOW WIDER (max-w-[800px]) */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <DialogTitle>{activeTab === "verification" ? "Add Verification Schedule" : "Add Financial Distribution Schedule"}</DialogTitle>
              <DialogDescription>
                {activeTab === "verification" ? "Create a new document verification schedule for a barangay." : "Create a new financial distribution schedule for barangays."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {activeTab === "verification" ? (
                <div className="space-y-2">
                  <Label htmlFor="barangay">Barangay Name *</Label>
                  <Select value={formData.barangay} onValueChange={(value) => setFormData({ ...formData, barangay: value })}>
                    <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                    <SelectContent>
                      {BARANGAYS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Select Barangays *</Label>
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 max-h-64 overflow-y-auto">
                    {/* WIDER GRID: 2 cols on mobile, 3 on small screens, 4 on medium screens */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {BARANGAYS.map((barangay) => (
                        <label key={barangay} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors">
                          <input type="checkbox" checked={formData.barangays.includes(barangay)} onChange={() => toggleBarangay(barangay)} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                          <span className="text-sm font-medium text-slate-700">{barangay}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectBarangayRange(1, 10)}>Select 1-10</Button>
                    <Button size="sm" variant="outline" onClick={() => selectBarangayRange(1, 12)}>Select All</Button>
                    <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, barangays: [] })}>Clear All</Button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                {activeTab === "financial" ? (
                  <div className="space-y-2">
                    <Label>Start Time (Optional)</Label>
                    <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Daily Limit (Optional)</Label>
                    <Input type="number" placeholder="Enter daily verification limit" value={formData.dailyLimit} onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                {activeTab === "financial" && (
                  <div className="space-y-2">
                    <Label>Distribution Amount *</Label>
                    <Input type="number" placeholder="Enter distribution amount in PHP" value={formData.distributionAmount} onChange={(e) => setFormData({ ...formData, distributionAmount: e.target.value })} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0 bg-slate-50 rounded-b-lg">
              <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleAddSchedule} className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Schedule Modal - NOW WIDER (max-w-[800px]) */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <DialogTitle>{activeTab === "verification" ? "Edit Verification Schedule" : "Edit Financial Distribution Schedule"}</DialogTitle>
              <DialogDescription>Update the schedule details.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {activeTab === "verification" ? (
                <div className="space-y-2">
                  <Label>Barangay Name *</Label>
                  <Select value={formData.barangay} onValueChange={(value) => setFormData({ ...formData, barangay: value })}>
                    <SelectTrigger><SelectValue placeholder="Select barangay" /></SelectTrigger>
                    <SelectContent>
                      {BARANGAYS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>Select Barangays *</Label>
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 max-h-64 overflow-y-auto">
                    {/* WIDER GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {BARANGAYS.map((barangay) => (
                        <label key={barangay} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-colors">
                          <input type="checkbox" checked={formData.barangays.includes(barangay)} onChange={() => toggleBarangay(barangay)} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                          <span className="text-sm font-medium text-slate-700">{barangay}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                {activeTab === "financial" ? (
                  <div className="space-y-2">
                    <Label>Start Time (Optional)</Label>
                    <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Daily Limit (Optional)</Label>
                    <Input type="number" placeholder="Enter daily verification limit" value={formData.dailyLimit} onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
                {activeTab === "financial" && (
                  <div className="space-y-2">
                    <Label>Distribution Amount *</Label>
                    <Input type="number" placeholder="Enter distribution amount in PHP" value={formData.distributionAmount} onChange={(e) => setFormData({ ...formData, distributionAmount: e.target.value })} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0 bg-slate-50 rounded-b-lg">
              <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setSelectedSchedule(null); resetForm(); }}>Cancel</Button>
              <Button onClick={handleEditSchedule} className="bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete the schedule. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsDeleteDialogOpen(false); setSelectedSchedule(null); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSchedule} className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </PermissionGuard>
  )
}