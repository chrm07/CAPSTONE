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
import {
  getVerificationSchedules,
  createVerificationSchedule,
  updateVerificationSchedule,
  deleteVerificationSchedule,
  endVerificationSchedule,
  type VerificationSchedule,
  getFinancialDistributionSchedules,
  createFinancialDistributionSchedule,
  updateFinancialDistributionSchedule,
  deleteFinancialDistributionSchedule,
  endFinancialDistributionSchedule,
  type FinancialDistributionSchedule,
  hasPermission,
} from "@/lib/storage"
import { PermissionGuard } from "@/components/permission-guard"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, Plus, Edit, Trash2, StopCircle, DollarSign, X } from 'lucide-react'
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
  "Barangay 1",
  "Barangay 2",
  "Barangay 3",
  "Barangay 4",
  "Barangay 5",
  "Barangay 6",
  "Barangay 7",
  "Barangay 8",
  "Barangay 9",
  "Barangay 10",
  "Barangay 11",
  "Barangay 12",
]

export default function SchedulingPage() {
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState("verification")
  const [verificationSchedules, setVerificationSchedules] = useState<VerificationSchedule[]>([])
  const [financialSchedules, setFinancialSchedules] = useState<FinancialDistributionSchedule[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<VerificationSchedule | FinancialDistributionSchedule | null>(null)
  const [formData, setFormData] = useState({
    barangay: "",
    barangays: [] as string[], // added barangays array for multi-select
    startDate: "",
    endDate: "",
    dailyLimit: "",
    distributionAmount: "",
    startTime: "",
  })

  useEffect(() => {
    loadSchedules()
  }, [])

  const loadSchedules = () => {
    const verificationLoaded = getVerificationSchedules()
    const financialLoaded = getFinancialDistributionSchedules()
    setVerificationSchedules(verificationLoaded)
    setFinancialSchedules(financialLoaded)
  }

  const resetForm = () => {
    setFormData({
      barangay: "",
      barangays: [],
      startDate: "",
      endDate: "",
      dailyLimit: "",
      distributionAmount: "",
      startTime: "",
    })
  }

  const toggleBarangay = (barangay: string) => {
    setFormData(prev => ({
      ...prev,
      barangays: prev.barangays.includes(barangay)
        ? prev.barangays.filter(b => b !== barangay)
        : [...prev.barangays, barangay]
    }))
  }

  const selectBarangayRange = (start: number, end: number) => {
    const newBarangays = BARANGAYS.slice(start - 1, end)
    setFormData(prev => ({
      ...prev,
      barangays: newBarangays
    }))
  }

  const handleAddSchedule = () => {
    if (activeTab === "verification") {
      if (!formData.barangay || !formData.startDate || !formData.endDate) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields.",
        })
        return
      }
    } else {
      if (formData.barangays.length === 0 || !formData.startDate || !formData.endDate) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please select at least one barangay and fill in dates.",
        })
        return
      }
    }

    // Validate dates
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (end < start) {
      toast({
        variant: "destructive",
        title: "Invalid Dates",
        description: "End date must be after start date.",
      })
      return
    }

    try {
      if (activeTab === "verification") {
        createVerificationSchedule({
          barangay: formData.barangay,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dailyLimit: formData.dailyLimit ? Number.parseInt(formData.dailyLimit) : undefined,
          createdBy: "admin",
        })

        toast({
          title: "Schedule Created",
          description: `Verification schedule for ${formData.barangay} has been created successfully.`,
        })
      } else {
        if (!formData.distributionAmount) {
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Distribution amount is required.",
          })
          return
        }

        formData.barangays.forEach(barangay => {
          createFinancialDistributionSchedule({
            barangays: [barangay],
            startDate: formData.startDate,
            endDate: formData.endDate,
            startTime: formData.startTime,
            distributionAmount: Number.parseFloat(formData.distributionAmount),
            createdBy: "admin",
          })
        })

        toast({
          title: "Schedules Created",
          description: `Financial distribution schedules for ${formData.barangays.length} barangays have been created successfully.`,
        })
      }

      setIsAddModalOpen(false)
      resetForm()
      loadSchedules()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create schedule. Please try again.",
      })
    }
  }

  const handleEditSchedule = () => {
    if (!selectedSchedule || !formData.startDate || !formData.endDate) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      })
      return
    }

    // Validate dates
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (end < start) {
      toast({
        variant: "destructive",
        title: "Invalid Dates",
        description: "End date must be after start date.",
      })
      return
    }

    try {
      if (activeTab === "verification") {
        updateVerificationSchedule(selectedSchedule.id, {
          barangay: formData.barangay,
          startDate: formData.startDate,
          endDate: formData.endDate,
          dailyLimit: formData.dailyLimit ? Number.parseInt(formData.dailyLimit) : undefined,
        })
      } else {
        updateFinancialDistributionSchedule(selectedSchedule.id, {
          barangays: formData.barangays.length > 0 ? formData.barangays : ["Barangay 1"],
          startDate: formData.startDate,
          endDate: formData.endDate,
          startTime: formData.startTime,
          distributionAmount: Number.parseFloat(formData.distributionAmount),
        })
      }

      toast({
        title: "Schedule Updated",
        description: `Schedule has been updated successfully.`,
      })

      setIsEditModalOpen(false)
      setSelectedSchedule(null)
      resetForm()
      loadSchedules()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update schedule. Please try again.",
      })
    }
  }

  const handleDeleteSchedule = () => {
    if (!selectedSchedule) return

    try {
      if (activeTab === "verification") {
        deleteVerificationSchedule(selectedSchedule.id)
      } else {
        deleteFinancialDistributionSchedule(selectedSchedule.id)
      }

      toast({
        title: "Schedule Deleted",
        description: "Schedule has been deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
      setSelectedSchedule(null)
      loadSchedules()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete schedule. Please try again.",
      })
    }
  }

  const handleEndSchedule = (schedule: VerificationSchedule | FinancialDistributionSchedule) => {
    try {
      if (activeTab === "verification") {
        endVerificationSchedule(schedule.id)
      } else {
        endFinancialDistributionSchedule(schedule.id)
      }

      toast({
        title: "Schedule Ended",
        description: `Schedule has been ended.`,
      })

      loadSchedules()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end schedule. Please try again.",
      })
    }
  }

  const openEditModal = (schedule: VerificationSchedule | FinancialDistributionSchedule) => {
    setSelectedSchedule(schedule)
    const isFinancial = "distributionAmount" in schedule
    setFormData({
      barangay: !isFinancial ? schedule.barangay : "",
      barangays: isFinancial ? schedule.barangays : [],
      startDate: schedule.startDate.split("T")[0],
      endDate: schedule.endDate.split("T")[0],
      dailyLimit: !isFinancial && "dailyLimit" in schedule ? schedule.dailyLimit?.toString() || "" : "",
      distributionAmount: isFinancial ? schedule.distributionAmount.toString() : "",
      startTime: isFinancial ? (schedule.startTime || "") : "",
    })
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (schedule: VerificationSchedule | FinancialDistributionSchedule) => {
    setSelectedSchedule(schedule)
    setIsDeleteDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "ended":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Ended</Badge>
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upcoming</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount)
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "N/A"
    return timeString
  }

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
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Document Verification
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-slate-900">Document Verification Scheduling</CardTitle>
                    <CardDescription className="text-slate-600">
                      View and manage barangay-based walk-in verification schedules
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Schedule
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
                      {verificationSchedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-500">
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditModal(schedule)}
                                  disabled={schedule.status === "ended"}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                {schedule.status === "active" && (
                                  <Button variant="ghost" size="icon" onClick={() => handleEndSchedule(schedule)}>
                                    <StopCircle className="h-4 w-4 text-amber-600" />
                                    <span className="sr-only">End</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(schedule)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
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
                    <CardTitle className="text-lg font-semibold text-slate-900">Financial Distribution Scheduling</CardTitle>
                    <CardDescription className="text-slate-600">
                      View and manage barangay-based financial aid distribution schedules
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Schedule
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
                      {financialSchedules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center text-slate-500">
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
                                {schedule.barangays.map(b => (
                                  <Badge key={b} className="bg-blue-100 text-blue-800 hover:bg-blue-100">{b}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(schedule.startDate)}</TableCell>
                            <TableCell className="font-mono text-sm">{formatTime(schedule.startTime)}</TableCell>
                            <TableCell>{formatDate(schedule.endDate)}</TableCell>
                            <TableCell className="font-semibold text-green-600">{formatCurrency(schedule.distributionAmount)}</TableCell>
                            <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditModal(schedule)}
                                  disabled={schedule.status === "ended"}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                {schedule.status === "active" && (
                                  <Button variant="ghost" size="icon" onClick={() => handleEndSchedule(schedule)}>
                                    <StopCircle className="h-4 w-4 text-amber-600" />
                                    <span className="sr-only">End</span>
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(schedule)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
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

        {/* Add Schedule Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {activeTab === "verification" ? "Add Verification Schedule" : "Add Financial Distribution Schedule"}
              </DialogTitle>
              <DialogDescription>
                {activeTab === "verification"
                  ? "Create a new document verification schedule for a barangay."
                  : "Create a new financial distribution schedule for barangays."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {activeTab === "verification" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay Name *</Label>
                    <Select
                      value={formData.barangay}
                      onValueChange={(value) => setFormData({ ...formData, barangay: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {BARANGAYS.map((barangay) => (
                          <SelectItem key={barangay} value={barangay}>
                            {barangay}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Label>Select Barangays *</Label>
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {BARANGAYS.map((barangay) => (
                        <label key={barangay} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded">
                          <input
                            type="checkbox"
                            checked={formData.barangays.includes(barangay)}
                            onChange={() => toggleBarangay(barangay)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{barangay}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectBarangayRange(1, 10)}>
                      Select 1-10
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => selectBarangayRange(1, 12)}>
                      Select All
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, barangays: [] })}>
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              {activeTab === "financial" && (
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time (Optional)</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              {activeTab === "verification" && (
                <div className="space-y-2">
                  <Label htmlFor="dailyLimit">Daily Limit (Optional)</Label>
                  <Input
                    id="dailyLimit"
                    type="number"
                    placeholder="Enter daily verification limit"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                  />
                </div>
              )}
              {activeTab === "financial" && (
                <div className="space-y-2">
                  <Label htmlFor="distributionAmount">Distribution Amount *</Label>
                  <Input
                    id="distributionAmount"
                    type="number"
                    placeholder="Enter distribution amount in PHP"
                    value={formData.distributionAmount}
                    onChange={(e) => setFormData({ ...formData, distributionAmount: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddSchedule} className="bg-emerald-600 hover:bg-emerald-700">
                Create Schedule
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Schedule Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {activeTab === "verification" ? "Edit Verification Schedule" : "Edit Financial Distribution Schedule"}
              </DialogTitle>
              <DialogDescription>Update the schedule details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {activeTab === "verification" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-barangay">Barangay Name *</Label>
                    <Select
                      value={formData.barangay}
                      onValueChange={(value) => setFormData({ ...formData, barangay: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {BARANGAYS.map((barangay) => (
                          <SelectItem key={barangay} value={barangay}>
                            {barangay}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Label>Select Barangays *</Label>
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {BARANGAYS.map((barangay) => (
                        <label key={barangay} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded">
                          <input
                            type="checkbox"
                            checked={formData.barangays.includes(barangay)}
                            onChange={() => toggleBarangay(barangay)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{barangay}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectBarangayRange(1, 10)}>
                      Select 1-10
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => selectBarangayRange(1, 12)}>
                      Select All
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, barangays: [] })}>
                      Clear All
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date *</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              {activeTab === "financial" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-startTime">Start Time (Optional)</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date *</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
              {activeTab === "verification" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-dailyLimit">Daily Limit (Optional)</Label>
                  <Input
                    id="edit-dailyLimit"
                    type="number"
                    placeholder="Enter daily verification limit"
                    value={formData.dailyLimit}
                    onChange={(e) => setFormData({ ...formData, dailyLimit: e.target.value })}
                  />
                </div>
              )}
              {activeTab === "financial" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-distributionAmount">Distribution Amount *</Label>
                  <Input
                    id="edit-distributionAmount"
                    type="number"
                    placeholder="Enter distribution amount in PHP"
                    value={formData.distributionAmount}
                    onChange={(e) => setFormData({ ...formData, distributionAmount: e.target.value })}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedSchedule(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEditSchedule} className="bg-emerald-600 hover:bg-emerald-700">
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
              <AlertDialogDescription>
                This will permanently delete the schedule. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setSelectedSchedule(null)
                }}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSchedule} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </PermissionGuard>
  )
}
