"use client"

import React, { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { PermissionGuard } from "@/components/permission-guard"
import { 
  CalendarDays, Plus, Loader2, Banknote, Clock, MapPin, StopCircle, UploadCloud, RotateCcw, History, ChevronDown, ChevronUp
} from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

import { useAuth } from "@/contexts/auth-context"
import { collection, onSnapshot, query, doc, setDoc, getDocs, writeBatch, deleteDoc, addDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

const BARANGAYS = [
  "Barangay 1", "Barangay 2", "Barangay 3", "Barangay 4", "Barangay 5", "Barangay 6",
  "Barangay 7", "Barangay 8", "Barangay 9", "Barangay 10", "Barangay 11", "Barangay 12", "Barangay 13"
]

export default function SchedulingPage() {
  const { toast } = useToast(); 
  const { user } = useAuth()
  
  const [schedule, setSchedule] = useState<any>(null)
  const [scheduleHistory, setScheduleHistory] = useState<any[]>([]) 
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)

  const [isSubModalOpen, setIsSubModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)
  const [isCloseSubDialogOpen, setIsCloseSubDialogOpen] = useState(false)
  const [isCloseDistDialogOpen, setIsCloseDistDialogOpen] = useState(false)

  const [subFormData, setSubFormData] = useState({ startDate: "", endDate: "" })
  const [formData, setFormData] = useState({ barangays: [] as string[], startDate: "", endDate: "", startTime: "", distributionAmount: "" })

  useEffect(() => {
    let unsubSched: () => void;
    let unsubHist: () => void;

    unsubSched = onSnapshot(doc(db, "settings", "schedule"), (docSnap) => {
      if (docSnap.exists()) {
        setSchedule(docSnap.data());
      } else {
        setDoc(doc(db, "settings", "schedule"), {
          submissionOpen: false,
          distributionOpen: false,
        }, { merge: true })
      }
      setIsFetching(false);
    });

    const histQ = query(collection(db, "schedule_history"));
    unsubHist = onSnapshot(histQ, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      historyData.sort((a: any, b: any) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
      setScheduleHistory(historyData);
    });

    return () => {
      if (unsubSched) unsubSched();
      if (unsubHist) unsubHist();
    }
  }, []);

  const handleOpenSubmissions = async () => {
    if (!subFormData.startDate || !subFormData.endDate) return toast({ variant: "destructive", title: "Error", description: "Please fill in dates." })
    setIsLoading(true)
    try {
      await setDoc(doc(db, "settings", "schedule"), {
        submissionOpen: true,
        submissionStart: subFormData.startDate,
        submissionEnd: subFormData.endDate
      }, { merge: true })

      const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
      const notifPromises = usersSnap.docs.map(u => 
        addDoc(collection(db, "notifications"), {
          to: "student",
          userId: u.id,
          message: `The scholarship submission portal is now open from ${formatDate(subFormData.startDate)} to ${formatDate(subFormData.endDate)}.`,
          link: "/student/documents",
          read: false,
          createdAt: new Date().toISOString()
        })
      );
      await Promise.all(notifPromises);

      toast({ title: "Success", description: "Submission portal is now OPEN." })
      setIsSubModalOpen(false)
      setSubFormData({ startDate: "", endDate: "" })
    } catch (e) { 
      toast({ variant: "destructive", title: "Error", description: "Failed to open submissions." }) 
    } 
    finally { setIsLoading(false) }
  }

  const handleCloseSubmissions = async () => {
    setIsLoading(true)
    try {
      await setDoc(doc(db, "settings", "schedule"), { submissionOpen: false }, { merge: true })
      toast({ title: "Closed", description: "Submission portal is now CLOSED." })
      setIsCloseSubDialogOpen(false)
    } catch (e) { 
      toast({ variant: "destructive", title: "Error", description: "Failed to close submissions." }) 
    } 
    finally { setIsLoading(false) }
  }

  const handleOpenDistribution = async () => {
    if (!formData.startDate || !formData.endDate || formData.barangays.length === 0) return toast({ variant: "destructive", title: "Error", description: "Please fill required fields." })
    setIsLoading(true)
    try {
      await setDoc(doc(db, "settings", "schedule"), {
        distributionOpen: true,
        distributionStart: formData.startDate,
        distributionEnd: formData.endDate,
        distributionTime: formData.startTime,
        distributionAmount: formData.distributionAmount,
        distributionBarangays: formData.barangays
      }, { merge: true })

      const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
      const notifPromises = usersSnap.docs.map(u => 
        addDoc(collection(db, "notifications"), {
          to: "student",
          userId: u.id,
          message: `Financial distribution is scheduled from ${formatDate(formData.startDate)} to ${formatDate(formData.endDate)} (${formData.startTime}).`,
          link: "/student/qrcode",
          read: false,
          createdAt: new Date().toISOString()
        })
      );
      await Promise.all(notifPromises);

      toast({ title: "Success", description: "Financial Distribution is now OPEN." })
      setIsAddModalOpen(false)
      resetForm()
    } catch (e) { 
      toast({ variant: "destructive", title: "Error", description: "Failed to open distribution." }) 
    } 
    finally { setIsLoading(false) }
  }

  const handleCloseDistribution = async () => {
    setIsLoading(true)
    try {
      await setDoc(doc(db, "settings", "schedule"), { distributionOpen: false }, { merge: true })
      toast({ title: "Closed", description: "Financial Distribution is now CLOSED." })
      setIsCloseDistDialogOpen(false)
    } catch (e) { 
      toast({ variant: "destructive", title: "Error", description: "Failed to close distribution." }) 
    } 
    finally { setIsLoading(false) }
  }

  const resetCycle = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);

      const appsSnapshot = await getDocs(query(collection(db, "applications")));
      const docsSnapshot = await getDocs(query(collection(db, "documents")));
      const allDocs = docsSnapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));

      const studentHistoryMap: Record<string, string> = {};

      appsSnapshot.forEach((appSnap) => {
        const appData = appSnap.data();
        const historyRef = doc(collection(db, "history"));
        
        batch.set(historyRef, {
          ...appData,
          archivedAt: new Date().toISOString(),
          originalAppId: appSnap.id
        });
        
        studentHistoryMap[appData.studentId] = historyRef.id;
        batch.delete(doc(db, "applications", appSnap.id));
      });

      allDocs.forEach(d => {
        if (!d.isArchived) {
          batch.update(doc(db, "documents", d.id), {
            isArchived: true,
            applicationId: studentHistoryMap[d.studentId] || null, 
            archivedAt: new Date().toISOString()
          });
        }
      });

      if (schedule) {
        const scheduleHistRef = doc(collection(db, "schedule_history"));
        batch.set(scheduleHistRef, {
          ...schedule,
          endedAt: new Date().toISOString()
        });
      }

      batch.set(doc(db, "settings", "schedule"), {
        submissionOpen: false, submissionStart: null, submissionEnd: null,
        distributionOpen: false, distributionStart: null, distributionEnd: null,
        distributionTime: null, distributionAmount: null, distributionBarangays: null
      }, { merge: true });

      await batch.commit();
      
      toast({ title: "Cycle Ended", description: "Applications securely archived. Dashboards reset.", className: "bg-emerald-600 text-white" });
      setIsResetDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to end cycle." });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => { setFormData({ barangays: [], startDate: "", endDate: "", startTime: "", distributionAmount: "" }) }
  const toggleBarangay = (barangay: string) => { setFormData(prev => ({ ...prev, barangays: prev.barangays.includes(barangay) ? prev.barangays.filter(b => b !== barangay) : [...prev.barangays, barangay] })) }
  const selectBarangayRange = (start: number, end: number) => { setFormData(prev => ({ ...prev, barangays: BARANGAYS.slice(start - 1, end) })) }

  const formatCurrency = (amount: string) => amount ? new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(amount)) : "N/A"
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  return (
    <PermissionGuard permission="scheduling">
      <AdminLayout>
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
          
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full filter blur-[80px] opacity-10 -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shrink-0">
                  <CalendarDays className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Global Scheduling</h1>
                  <p className="text-slate-500 font-medium mt-1">Control submission and distribution portals.</p>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="submissions" className="space-y-6">
            {/* 🔥 FIX: Changed back to flex-wrap h-auto, removing forced scroll constraints, and swapped End Cycle & History */}
            <TabsList className="bg-slate-100/50 p-1.5 shadow-sm flex flex-wrap h-auto w-full lg:w-fit justify-start rounded-2xl border border-slate-200 gap-1">
              <TabsTrigger value="submissions" className="gap-2 h-10 px-6 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><UploadCloud className="h-4 w-4" /> Submission Portal</TabsTrigger>
              <TabsTrigger value="financial" className="gap-2 h-10 px-6 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><Banknote className="h-4 w-4" /> Financial Distribution</TabsTrigger>
              <TabsTrigger value="reset" className="gap-2 h-10 px-6 rounded-xl font-bold text-slate-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow-sm"><RotateCcw className="h-4 w-4" /> End Cycle</TabsTrigger>
              <TabsTrigger value="history" className="gap-2 h-10 px-6 rounded-xl font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><History className="h-4 w-4" /> History</TabsTrigger>
            </TabsList>

            <TabsContent value="submissions">
              <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-200">
                <div className="h-2 bg-blue-500 w-full" />
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Submission Portal</CardTitle>
                    <CardDescription className="font-medium text-slate-500">Allow students to submit applications for the current cycle.</CardDescription>
                  </div>
                  {!schedule?.submissionOpen ? (
                    <Button onClick={() => setIsSubModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md font-bold h-11 px-6">
                      <Plus className="w-4 h-4 mr-2" /> Open Submissions
                    </Button>
                  ) : (
                    <Button onClick={() => setIsCloseSubDialogOpen(true)} disabled={isLoading} variant="destructive" className="rounded-xl shadow-md font-bold h-11 px-6">
                      <StopCircle className="w-4 h-4 mr-2" /> Close Submissions
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {isFetching ? <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div> : 
                   (!schedule?.submissionStart && !schedule?.submissionOpen) ? (
                    <div className="py-24 text-center text-slate-400 flex flex-col items-center">
                      <UploadCloud className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-sm text-slate-500">No active submission schedule.</p>
                      <p className="text-xs mt-1">Open a schedule to allow student submissions.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-white">
                        <TableRow className="border-slate-100">
                          <TableHead className="pl-6 font-black text-slate-400 uppercase text-[10px] tracking-widest py-4">Date Range</TableHead>
                          <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        <TableRow className="hover:bg-slate-50 transition-colors border-slate-100">
                          <TableCell className="pl-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{schedule.submissionStart}</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest">to {schedule.submissionEnd}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {schedule.submissionOpen ? (
                                <Badge className="bg-emerald-50 text-emerald-700 border-none shadow-none font-bold px-3 py-1 uppercase tracking-widest text-[10px]">Active</Badge>
                            ) : (
                                <Badge className="bg-red-50 text-red-700 border-none shadow-none font-bold px-3 py-1 uppercase tracking-widest text-[10px]">Closed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial">
              <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-200">
                <div className="h-2 bg-emerald-500 w-full" />
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">
                      Financial Distribution Portal
                    </CardTitle>
                    <CardDescription className="font-medium text-slate-500 mt-1">
                      Allow approved scholars to claim their assistance.
                    </CardDescription>
                  </div>
                  
                  {!schedule?.distributionOpen ? (
                    <Button onClick={() => setIsAddModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md font-bold h-11 px-6">
                      <Plus className="w-4 h-4 mr-2" /> Open Distribution
                    </Button>
                  ) : (
                    <Button onClick={() => setIsCloseDistDialogOpen(true)} disabled={isLoading} variant="destructive" className="rounded-xl shadow-md font-bold h-11 px-6">
                      <StopCircle className="w-4 h-4 mr-2" /> Close Distribution
                    </Button>
                  )}
                </CardHeader>
                
                <CardContent className="p-0">
                  {isFetching ? (
                    <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
                  ) : (!schedule?.distributionStart && !schedule?.distributionOpen) ? (
                    <div className="py-24 text-center text-slate-400 flex flex-col items-center">
                      <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-sm text-slate-500">No active distribution schedule.</p>
                      <p className="text-xs mt-1">Open a schedule to allow QR verification.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-white">
                          <TableRow className="border-slate-100">
                            <TableHead className="pl-6 font-black text-slate-400 uppercase text-[10px] tracking-widest py-4">Barangay(s)</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Date Range</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Time</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Amount</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                            <TableRow className="hover:bg-slate-50 transition-colors border-slate-100">
                              <TableCell className="pl-6 py-4">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-emerald-600/60 shrink-0 mt-0.5" />
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {schedule.distributionBarangays?.map((b: string) => <Badge key={b} variant="outline" className="bg-white text-slate-700 border-slate-200">{b}</Badge>)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-blue-600/60" />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-800">{schedule.distributionStart}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">to {schedule.distributionEnd}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <Clock className="h-4 w-4 text-amber-600/60" />
                                  {schedule.distributionTime || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="font-black text-emerald-700 text-sm">
                                  {formatCurrency(schedule.distributionAmount)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {schedule.distributionOpen ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border-none shadow-none font-bold px-3 py-1 uppercase tracking-widest text-[10px]">Active</Badge>
                                ) : (
                                    <Badge className="bg-red-50 text-red-700 border-none shadow-none font-bold px-3 py-1 uppercase tracking-widest text-[10px]">Closed</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: END CYCLE */}
            <TabsContent value="reset">
               <Card className="rounded-3xl border-red-200 shadow-sm overflow-hidden bg-red-50/50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="h-2 bg-red-600 w-full" />
                  <CardHeader className="pb-6 text-center">
                    <CardTitle className="text-2xl font-black text-red-700 uppercase tracking-tight">End Current Cycle</CardTitle>
                    <CardDescription className="font-bold text-red-900/60 mt-2 max-w-lg mx-auto">
                      Warning: This will move all current applications into the History collection and close both the submission and distribution portals. Students will need to re-apply for the next cycle.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-12">
                     <Button 
                       onClick={() => setIsResetDialogOpen(true)} 
                       className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black h-14 px-8 text-lg shadow-xl hover:scale-105 transition-transform"
                     >
                       <RotateCcw className="mr-2 h-5 w-5" /> End Cycle & Archive Applications
                     </Button>
                  </CardContent>
               </Card>
            </TabsContent>

            {/* TAB 4: HISTORY (EXPANDABLE) */}
            <TabsContent value="history">
              <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white animate-in fade-in zoom-in-95 duration-200">
                <div className="h-2 bg-slate-600 w-full" />
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <History className="h-5 w-5 text-slate-500" /> Historical Cycles
                    </CardTitle>
                    <CardDescription className="font-medium text-slate-500 mt-1">
                      A complete log of previous scholarship cycles and their configurations. Click a row to expand details.
                    </CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {isFetching ? (
                    <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-600" /></div>
                  ) : scheduleHistory.length === 0 ? (
                    <div className="py-24 text-center text-slate-400 flex flex-col items-center">
                      <History className="h-12 w-12 mb-4 opacity-20" />
                      <p className="font-bold uppercase tracking-widest text-sm text-slate-500">No History Available.</p>
                      <p className="text-xs mt-1">Past cycles will appear here after they are ended.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-white">
                          <TableRow className="border-slate-100">
                            <TableHead className="pl-6 font-black text-slate-400 uppercase text-[10px] tracking-widest py-4">Ended Date</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Submission Window</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Distribution Window</TableHead>
                            <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-right pr-6">Payout Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white">
                          {scheduleHistory.map((hist) => (
                            <React.Fragment key={hist.id}>
                              <TableRow 
                                onClick={() => setExpandedHistoryId(expandedHistoryId === hist.id ? null : hist.id)}
                                className="hover:bg-slate-50 transition-colors border-slate-100 cursor-pointer group"
                              >
                                <TableCell className="pl-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded-md transition-colors ${expandedHistoryId === hist.id ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                                      {expandedHistoryId === hist.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                    <span className="text-sm font-black text-slate-800">
                                      {formatDate(hist.endedAt)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <UploadCloud className="h-4 w-4 text-blue-500/60" />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-slate-700">{hist.submissionStart || "N/A"}</span>
                                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">to {hist.submissionEnd || "N/A"}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Banknote className="h-4 w-4 text-emerald-500/60" />
                                    <div className="flex flex-col">
                                      <span className="text-xs font-bold text-slate-700">{hist.distributionStart || "N/A"}</span>
                                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">to {hist.distributionEnd || "N/A"}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right pr-6">
                                  <span className="font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-md text-xs border border-slate-100">
                                    {formatCurrency(hist.distributionAmount)}
                                  </span>
                                </TableCell>
                              </TableRow>

                              {/* EXPANDABLE CONTENT ROW */}
                              {expandedHistoryId === hist.id && (
                                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                  <TableCell colSpan={4} className="p-0 border-b border-slate-200">
                                    <div className="p-6 border-l-4 border-emerald-500 ml-6 my-4 bg-white rounded-r-2xl shadow-sm space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Targeted Barangays</h4>
                                          <div className="flex flex-wrap gap-1">
                                            {hist.distributionBarangays && hist.distributionBarangays.length > 0 ? (
                                              hist.distributionBarangays.map((b: string) => (
                                                <Badge key={b} variant="outline" className="bg-white text-slate-600 shadow-none border-slate-200">{b}</Badge>
                                              ))
                                            ) : (
                                              <span className="text-sm text-slate-500 italic">No barangays specified</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="space-y-3">
                                          <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Distribution Time</h4>
                                            <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                              <Clock className="h-4 w-4 text-amber-500/70" />
                                              {hist.distributionTime || "N/A"}
                                            </p>
                                          </div>
                                          <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Cycle Officially Ended</h4>
                                            <p className="text-sm font-medium text-slate-700">
                                              {formatDateTime(hist.endedAt)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          {/* MODALS */}
          <Dialog open={isSubModalOpen} onOpenChange={setIsSubModalOpen}>
            <DialogContent className="rounded-3xl border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-blue-600 uppercase tracking-tight">Open Submission Portal</DialogTitle>
                <DialogDescription>Set the date range for students to submit their documents.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Date</Label>
                    <Input type="date" value={subFormData.startDate} onChange={(e) => setSubFormData({...subFormData, startDate: e.target.value})} className="rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">End Date</Label>
                    <Input type="date" value={subFormData.endDate} onChange={(e) => setSubFormData({...subFormData, endDate: e.target.value})} className="rounded-xl bg-slate-50" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl font-bold" onClick={() => { setIsSubModalOpen(false); setSubFormData({ startDate: "", endDate: "" }); }}>Cancel</Button>
                <Button onClick={handleOpenSubmissions} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Open Submissions</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 rounded-3xl overflow-hidden border-0 shadow-2xl">
              <div className="h-2 bg-emerald-600 w-full shrink-0" />
              <DialogHeader className="px-6 py-4 border-b shrink-0 bg-white">
                <DialogTitle className="text-xl font-black uppercase text-slate-800 tracking-tight flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-600" /> Open Financial Distribution</DialogTitle>
                <DialogDescription className="font-medium text-slate-500">Set details for the financial distribution.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Target Barangays *</Label>
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 max-h-64 overflow-y-auto shadow-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {BARANGAYS.map((barangay) => (
                        <label key={barangay} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-200 transition-colors">
                          <input type="checkbox" checked={formData.barangays.includes(barangay)} onChange={() => toggleBarangay(barangay)} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                          <span className="text-sm font-medium text-slate-700">{barangay}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => selectBarangayRange(1, 13)} className="rounded-xl font-bold">Select All</Button>
                    <Button size="sm" variant="outline" onClick={() => setFormData({ ...formData, barangays: [] })} className="rounded-xl font-bold">Clear All</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Date *</Label><Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="rounded-xl bg-white border-slate-200" /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Time *</Label><Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className="rounded-xl bg-white border-slate-200" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">End Date *</Label><Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="rounded-xl bg-white border-slate-200" /></div>
                  <div className="space-y-2"><Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Distribution Amount (₱) *</Label><Input type="number" placeholder="Enter amount" value={formData.distributionAmount} onChange={(e) => setFormData({ ...formData, distributionAmount: e.target.value })} className="rounded-xl bg-white border-slate-200" /></div>
                </div>
              </div>
              <DialogFooter className="flex justify-end gap-3 px-6 py-4 border-t shrink-0 bg-white rounded-b-3xl">
                <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="rounded-xl font-bold">Cancel</Button>
                <Button onClick={handleOpenDistribution} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold" disabled={isLoading}>{isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Open Distribution</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={isCloseSubDialogOpen} onOpenChange={setIsCloseSubDialogOpen}>
            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Close Submissions?</AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-slate-600">
                  Are you sure you want to close the submission portal? Students will no longer be able to upload documents or submit applications until you open it again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl font-bold border-slate-200 text-slate-600">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCloseSubmissions} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white shadow-md" disabled={isLoading}>{isLoading ? "Closing..." : "Close Submissions"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={isCloseDistDialogOpen} onOpenChange={setIsCloseDistDialogOpen}>
            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black text-slate-800 uppercase tracking-tight">Close Distribution?</AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-slate-600">
                  Are you sure you want to close the financial distribution portal? QR codes cannot be verified and payouts cannot be processed until it is reopened.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl font-bold border-slate-200 text-slate-600">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCloseDistribution} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white shadow-md" disabled={isLoading}>{isLoading ? "Closing..." : "Close Distribution"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
            <AlertDialogContent className="rounded-3xl border-0 shadow-2xl p-6">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-black text-red-600 uppercase tracking-tight">End Current Cycle?</AlertDialogTitle>
                <AlertDialogDescription className="font-medium text-slate-600">
                  This action will: <br/>
                  1. Move all current applications into the History collection.<br/>
                  2. Delete all uploaded documents to clear the slate for students.<br/>
                  3. Close Submission and Distribution portals.<br/>
                  4. Save this cycle to the History Tab.<br/><br/>
                  Are you absolutely sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel className="rounded-xl font-bold border-slate-200 text-slate-600">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetCycle} className="bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white shadow-md" disabled={isLoading}>{isLoading ? "Ending Cycle..." : "End Cycle & Archive"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </AdminLayout>
    </PermissionGuard>
  )
}