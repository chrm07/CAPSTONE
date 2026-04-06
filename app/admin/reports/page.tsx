"use client"

import React, { useState, useEffect, useMemo } from "react"
import Script from "next/script"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users, CheckCircle, Clock, XCircle, TrendingUp, GraduationCap, 
  MapPin, School, BookOpen, UserIcon, ChevronDown, Loader2, Activity, 
  FileSpreadsheet, FileImage, FileBarChart, CalendarDays
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip,
} from "recharts"

import { PermissionGuard } from "@/components/permission-guard"
import { collection, onSnapshot, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

// --- STANDARDIZED DATA MODEL ---
type ReportScholar = {
  id: string
  studentId: string
  name: string
  email: string
  contactNumber: string
  age: string
  gender: string
  course: string
  schoolName: string
  barangay: string
  yearLevel: string
  applicationStatus: string
  archivedAt?: string
  archiveCycle?: string
  year: string
}

interface StatCardProps {
  title: string; value: number | string; description: string; icon: React.ReactNode; iconBg: string; iconColor: string;
}

function StatCard({ title, value, description, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden transition-all duration-200 border border-slate-100 shadow-sm hover:shadow-md rounded-3xl bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</CardTitle>
        <div className={`p-3 rounded-2xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-black text-slate-800">{value}</div>
        <p className="text-xs font-bold text-slate-400 mt-2 tracking-wide uppercase">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  const [activeScholars, setActiveScholars] = useState<ReportScholar[]>([])
  const [historyRecords, setHistoryRecords] = useState<ReportScholar[]>([])
  const [groupedHistory, setGroupedHistory] = useState<Record<string, ReportScholar[]>>({})
  
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null)
  
  const [historyYearFilter, setHistoryYearFilter] = useState("all")

  // ==========================================
  // REAL-TIME LISTENER FOR REPORTS
  // ==========================================
  useEffect(() => {
    let unsubscribeUsers: () => void;
    let unsubscribeApps: () => void;
    let unsubscribeHistory: () => void;

    const setupRealtimeListeners = () => {
      setLoading(true);

      let allUsers: any[] = [];
      let allApps: any[] = [];
      let historyData: any[] = [];

      // 🔥 FIX: Track loaded states to prevent infinite loading when collections are empty
      let usersLoaded = false;
      let appsLoaded = false;
      let historyLoaded = false;

      const processData = () => {
        // Wait until all 3 collections have responded at least once
        if (!usersLoaded || !appsLoaded || !historyLoaded) return;

        const activeData = allApps.map((app) => {
          const user = allUsers.find(u => u.id === app.studentId);
          const profile = user?.profileData || {} as any;
          
          let status = "pending";
          if (app.isApproved) status = "approved";
          if (app.isRejected) status = "rejected";

          return {
            id: app.id, 
            studentId: app.studentId, 
            name: app.fullName || profile.fullName || user?.name || "Unknown", 
            email: app.email || user?.email || "Unknown",
            contactNumber: profile.contactNumber || "N/A", 
            age: profile.age || "Unknown", 
            gender: profile.gender || "Unknown", 
            course: app.course || profile.course || "Unknown",
            schoolName: app.school || profile.schoolName || "Unknown", 
            barangay: app.barangay || profile.barangay || "Unknown", 
            yearLevel: app.yearLevel || profile.yearLevel || "Unknown",
            applicationStatus: status,
            year: new Date().getFullYear().toString()
          };
        });
        setActiveScholars(activeData);

        const formattedHistoryRecords = historyData.map(record => {
          const user = allUsers.find(u => u.id === record.studentId);
          const profile = user?.profileData || {} as any;
          
          let status = "pending";
          if (record.isApproved) status = "approved";
          if (record.isRejected) status = "rejected";

          const archivedDate = record.archivedAt || record.createdAt;
          const recordYear = archivedDate ? new Date(archivedDate).getFullYear().toString() : "Unknown";
          
          const dateStr = archivedDate ? new Date(archivedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown Date";

          return {
            id: record.id, 
            studentId: record.studentId, 
            archiveCycle: `Cycle Ended: ${dateStr}`, 
            name: record.fullName || profile.fullName || user?.name || "Unknown", 
            email: record.email || user?.email || "Unknown",
            contactNumber: profile.contactNumber || "N/A", 
            age: profile.age || "Unknown", 
            gender: profile.gender || "Unknown", 
            course: record.course || profile.course || "Unknown",
            schoolName: record.school || profile.schoolName || "Unknown", 
            barangay: record.barangay || profile.barangay || "Unknown", 
            yearLevel: record.yearLevel || profile.yearLevel || "Unknown", 
            applicationStatus: status, 
            archivedAt: archivedDate,
            year: recordYear
          };
        });
        setHistoryRecords(formattedHistoryRecords);

        const grouped = formattedHistoryRecords.reduce((acc, curr) => {
          const cycle = curr.archiveCycle || "Unknown Cycle";
          if (!acc[cycle]) acc[cycle] = [];
          acc[cycle].push(curr);
          return acc;
        }, {} as Record<string, ReportScholar[]>);
        
        setGroupedHistory(grouped);
        setLoading(false); // Successfully turns off loading screen
      };

      const usersQ = query(collection(db, "users"), where("role", "==", "student"));
      unsubscribeUsers = onSnapshot(usersQ, (snap) => {
        allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        usersLoaded = true;
        processData();
      });

      const appsQ = query(collection(db, "applications"), where("isSubmitted", "==", true));
      unsubscribeApps = onSnapshot(appsQ, (snap) => {
        allApps = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        appsLoaded = true;
        processData();
      });

      const historyQ = query(collection(db, "history"));
      unsubscribeHistory = onSnapshot(historyQ, (snap) => {
        historyData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        historyLoaded = true;
        processData();
      });
    };

    setupRealtimeListeners();

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeApps) unsubscribeApps();
      if (unsubscribeHistory) unsubscribeHistory();
    };
  }, [toast])

  const availableYears = useMemo(() => {
    const years = new Set(historyRecords.map(r => r.year));
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [historyRecords]);

  const displayedHistoryGroups = useMemo(() => {
    if (historyYearFilter === "all") return groupedHistory;
    
    const filtered: Record<string, ReportScholar[]> = {};
    Object.entries(groupedHistory).forEach(([cycle, data]) => {
      if (data[0]?.year === historyYearFilter) {
        filtered[cycle] = data;
      }
    });
    return filtered;
  }, [historyYearFilter, groupedHistory]);

  const getStats = (data: ReportScholar[]) => {
    const approved = data.filter(a => a.applicationStatus === "approved").length
    const pending = data.filter(a => a.applicationStatus === "pending").length
    const rejected = data.filter(a => a.applicationStatus === "rejected").length
    return { total: data.length, approved, pending, rejected, approvalRate: data.length > 0 ? Math.round((approved / data.length) * 100) : 0 }
  }

  const getYearLevelData = (data: ReportScholar[]) => { const counts = data.reduce((acc, s) => { acc[s.yearLevel] = (acc[s.yearLevel] || 0) + 1; return acc }, {} as Record<string, number>); const colors: Record<string, string> = { "1st Year": "#3b82f6", "2nd Year": "#10b981", "3rd Year": "#f59e0b", "4th Year": "#ef4444", "5th Year": "#8b5cf6" }; return Object.entries(counts).map(([name, value]) => ({ name, value, fill: colors[name] || "#6b7280" })) }
  const getBarangayData = (data: ReportScholar[]) => { const counts = data.reduce((acc, s) => { acc[s.barangay] = (acc[s.barangay] || 0) + 1; return acc }, {} as Record<string, number>); const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]; return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] })) }
  const getGenderData = (data: ReportScholar[]) => { const counts = data.reduce((acc, s) => { acc[s.gender] = (acc[s.gender] || 0) + 1; return acc }, {} as Record<string, number>); return Object.entries(counts).map(([name, value]) => ({ name, value, fill: name === "Female" ? "#ec4899" : name === "Male" ? "#3b82f6" : "#6b7280" })) }
  const getAgeData = (data: ReportScholar[]) => { const counts = data.reduce((acc, s) => { const age = Number.parseInt(s.age || "0"); let group = "Unknown"; if (age >= 16 && age <= 18) group = "16-18"; else if (age >= 19 && age <= 21) group = "19-21"; else if (age >= 22 && age <= 24) group = "22-24"; else if (age >= 25) group = "25+"; acc[group] = (acc[group] || 0) + 1; return acc }, {} as Record<string, number>); const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]; return ["16-18", "19-21", "22-24", "25+"].map((name, i) => ({ name, value: counts[name] || 0, fill: colors[i] })) }
  const getCourseData = (data: ReportScholar[]) => { const counts = data.reduce((acc, s) => { const match = s.course.match(/\b([A-Z]{2,})\b/); const abbrev = match ? match[1] : s.course.split(" ").slice(0, 2).join(" "); acc[abbrev] = (acc[abbrev] || 0) + 1; return acc }, {} as Record<string, number>); const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]; return Object.entries(counts).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] })) }
  const getSchoolData = (data: ReportScholar[]) => { const counts = data.reduce((acc, s) => { const shortName = s.schoolName.length > 25 ? s.schoolName.substring(0, 25) + "..." : s.schoolName; acc[shortName] = (acc[shortName] || 0) + 1; return acc }, {} as Record<string, number>); const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]; return Object.entries(counts).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] })) }
  const getApplicationStatusData = (stats: any) => [ { name: "Approved", value: stats.approved, fill: "#10b981" }, { name: "Pending", value: stats.pending, fill: "#f59e0b" }, { name: "Rejected", value: stats.rejected, fill: "#ef4444" } ]

  const handleExportExcel = (cycleData: ReportScholar[], exportName: string) => {
    try {
      const headers = ["Student Name", "Email", "Mobile Number", "Age", "Gender", "School / Course", "Barangay", "Status"];
      const rows = cycleData.map(s => [ `"${s.name}"`, `"${s.email}"`, `"${s.contactNumber}"`, s.age, s.gender, `"${s.schoolName} / ${s.course}"`, `"${s.barangay}"`, s.applicationStatus.toUpperCase() ]);
      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); 
      const url = URL.createObjectURL(blob); 
      const link = document.createElement("a"); 
      link.setAttribute("href", url); 
      link.setAttribute("download", `Student_List_${exportName.replace(/\s+/g, '_')}.csv`); 
      document.body.appendChild(link); 
      link.click(); 
      document.body.removeChild(link);
      toast({ title: "Export Successful", description: "The student list has been downloaded.", className: "bg-emerald-600 text-white" });
    } catch (error) { toast({ title: "Export Failed", description: "Could not generate file.", variant: "destructive" }); }
  }

  const handleExportPDF = (cycleName: string) => {
    const element = document.getElementById(`pdf-charts-export-${cycleName.replace(/\s+/g, '-')}`);
    if (typeof window !== "undefined" && (window as any).html2pdf && element) {
      toast({ title: "Generating PDF", description: "Your chart report will download shortly...", className: "bg-blue-600 text-white" });
      const opt = { margin: 0.5, filename: `Analytics_Charts_${cycleName.replace(/\s+/g, '_')}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' } };
      (window as any).html2pdf().set(opt).from(element).save();
    } else { window.print(); }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) { 
      return ( 
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4"> 
          <p className="font-black text-slate-800 uppercase tracking-tight">{payload[0].name}</p> 
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Count: <span className="text-emerald-600 text-base">{payload[0].value}</span></p> 
        </div> 
      ) 
    }
    return null
  }

  const renderChart = (data: any[], chartElement: React.ReactNode, emptyMessage: string) => {
    if (loading) return <div className="flex flex-col items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin mb-4 text-emerald-600" /></div>
    if (!data || data.length === 0 || data.every((d) => d.value === 0)) { 
      return ( 
        <div className="flex flex-col items-center justify-center h-full text-slate-400"> 
          <FileBarChart className="h-12 w-12 mb-4 opacity-20" /> 
          <p className="font-bold uppercase tracking-widest text-xs">{emptyMessage}</p> 
        </div> 
      ) 
    }
    return chartElement
  }

  const activeStats = getStats(activeScholars);

  return (
    <PermissionGuard permission="reports">
      <AdminLayout>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />

        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
          
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full filter blur-[80px] opacity-10 -mr-20 -mt-20 pointer-events-none"></div>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shrink-0">
                  <FileBarChart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Reports & Analytics</h1>
                  <p className="text-slate-500 font-medium mt-1">Generate actionable insights based on active or historical data.</p>
                </div>
              </div>
              
              {activeTab !== "history" && (
                <Badge className="bg-emerald-100 text-emerald-800 text-lg px-4 py-2 border-none shadow-none font-black uppercase tracking-widest hidden sm:flex">
                  Active Cycle
                </Badge>
              )}
            </div>
          </div>

          <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
            <TabsList className="bg-slate-100/50 p-1.5 shadow-sm flex flex-wrap h-auto w-full md:w-fit justify-start rounded-2xl border border-slate-200 gap-1">
              <TabsTrigger value="overview" className="gap-2 h-10 px-6 shrink-0 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><TrendingUp className="h-4 w-4" /> Overview</TabsTrigger>
              <TabsTrigger value="demographics" className="gap-2 h-10 px-6 shrink-0 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><Users className="h-4 w-4" /> Demographics</TabsTrigger>
              <TabsTrigger value="academic" className="gap-2 h-10 px-6 shrink-0 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><GraduationCap className="h-4 w-4" /> Academic</TabsTrigger>
              <TabsTrigger value="history" className="gap-2 h-10 px-6 shrink-0 rounded-xl font-bold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"><Clock className="h-4 w-4" /> History Archives</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-xl">Showing Data For: <span className="text-emerald-600">Active Cycle</span></h3>
                <Button variant="outline" size="sm" onClick={() => handleExportExcel(activeScholars, 'Active_Cycle')} className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Active List
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Applicants" value={activeStats.total} description="Active Cycle" icon={<Users className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" />
                <StatCard title="Approved" value={activeStats.approved} description={`${activeStats.approvalRate}% rate`} icon={<CheckCircle className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                <StatCard title="Pending Review" value={activeStats.pending} description="Awaiting evaluation" icon={<Clock className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" />
                <StatCard title="Rejected" value={activeStats.rejected} description="Unsuccessful" icon={<XCircle className="h-5 w-5" />} iconBg="bg-red-50" iconColor="text-red-600" />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><Activity className="h-4 w-4 text-emerald-600" /> Application Status</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    {renderChart(getApplicationStatusData(activeStats), 
                      <ResponsiveContainer width="100%" height={300}><PieChart margin={{ top: 10, bottom: 10 }}><Pie data={getApplicationStatusData(activeStats)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>{getApplicationStatusData(activeStats).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>, "No data."
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><UserIcon className="h-4 w-4 text-emerald-600" /> Gender Distribution</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    {renderChart(getGenderData(activeScholars), 
                      <ResponsiveContainer width="100%" height={300}><PieChart margin={{ top: 10, bottom: 10 }}><Pie data={getGenderData(activeScholars)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>{getGenderData(activeScholars).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>, "No data."
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><Users className="h-4 w-4 text-emerald-600" /> Age Distribution</CardTitle></CardHeader>
                  <CardContent className="h-80">
                    {renderChart(getAgeData(activeScholars), 
                      <ResponsiveContainer width="100%" height={300}><BarChart data={getAgeData(activeScholars)} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} /><XAxis dataKey="name" stroke="#6b7280" axisLine={false} tickLine={false} /><YAxis stroke="#6b7280" axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} /><Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>{getAgeData(activeScholars).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No data."
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="demographics" className="space-y-6">
              <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><MapPin className="h-4 w-4 text-emerald-600" /> Applicants by Barangay (Active)</CardTitle></CardHeader>
                <CardContent className="h-96">
                  {renderChart(getBarangayData(activeScholars), 
                    <ResponsiveContainer width="100%" height={350}><BarChart data={getBarangayData(activeScholars)} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} /><XAxis dataKey="name" stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} /><YAxis stroke="#6b7280" axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} /><Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>{getBarangayData(activeScholars).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No data."
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><GraduationCap className="h-4 w-4 text-emerald-600" /> Year Level (Active)</CardTitle></CardHeader>
                  <CardContent className="h-96">
                    {renderChart(getYearLevelData(activeScholars), 
                      <ResponsiveContainer width="100%" height={350}><PieChart margin={{ top: 10, bottom: 10 }}><Pie data={getYearLevelData(activeScholars)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>{getYearLevelData(activeScholars).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>, "No data."
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white lg:col-span-2">
                  <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><BookOpen className="h-4 w-4 text-emerald-600" /> Applicants by Course (Active)</CardTitle></CardHeader>
                  <CardContent className="h-96">
                    {renderChart(getCourseData(activeScholars), 
                      <ResponsiveContainer width="100%" height={350}><BarChart data={getCourseData(activeScholars)} layout="vertical" margin={{ top: 20, right: 30, left: 0, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} /><XAxis type="number" stroke="#6b7280" axisLine={false} tickLine={false} /><YAxis dataKey="name" type="category" width={100} stroke="#6b7280" fontSize={12} axisLine={false} tickLine={false} /><Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} /><Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>{getCourseData(activeScholars).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No data."
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-slate-200 shadow-sm bg-white md:col-span-2 lg:col-span-3">
                  <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><School className="h-4 w-4 text-emerald-600" /> Applicants by School (Active)</CardTitle></CardHeader>
                  <CardContent className="h-96">
                    {renderChart(getSchoolData(activeScholars), 
                      <ResponsiveContainer width="100%" height={350}><PieChart margin={{ top: 20, bottom: 20 }}><Pie data={getSchoolData(activeScholars)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>{getSchoolData(activeScholars).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ paddingTop: '20px' }} /></PieChart></ResponsiveContainer>, "No data."
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="h-2 bg-slate-500 w-full" />
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2"><Clock className="w-5 h-5 text-slate-600"/> History Archives</CardTitle>
                    <CardDescription className="font-medium text-slate-500 mt-1">Expand an archived cycle to view its specific data, charts, and export options.</CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <CalendarDays className="h-5 w-5 text-slate-400 ml-2" />
                    <Select value={historyYearFilter} onValueChange={setHistoryYearFilter}>
                      <SelectTrigger className="w-full sm:w-[150px] bg-transparent border-none shadow-none font-black uppercase tracking-widest text-slate-800 h-10">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 font-bold">
                        <SelectItem value="all">All Time</SelectItem>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {Object.keys(displayedHistoryGroups).length === 0 ? (
                    <div className="text-center py-24 text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-20"/>
                      <p className="font-bold uppercase tracking-widest text-sm">No historical records found for {historyYearFilter === 'all' ? 'All Time' : `Year ${historyYearFilter}`}.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-white">
                        <TableRow className="border-slate-100">
                          <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-6 py-4">Scholarship Cycle</TableHead>
                          <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Total Applicants</TableHead>
                          <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Approved Scholars</TableHead>
                          <TableHead className="text-right pr-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white">
                        {Object.entries(displayedHistoryGroups)
                          .sort((a, b) => b[0].localeCompare(a[0])) 
                          .map(([cycle, data]) => {
                          const cycleStats = getStats(data);
                          const isExpanded = expandedCycle === cycle;
                          return (
                            <React.Fragment key={cycle}>
                              <TableRow className={`cursor-pointer transition-colors border-slate-100 ${isExpanded ? "bg-emerald-50/50 border-b-emerald-100" : "hover:bg-slate-50/50"}`} onClick={() => setExpandedCycle(isExpanded ? null : cycle)}>
                                <TableCell className="pl-6 font-bold text-slate-800 py-4">{cycle}</TableCell>
                                <TableCell className="font-bold text-slate-500">{cycleStats.total}</TableCell>
                                <TableCell className="text-emerald-600 font-black">{cycleStats.approved}</TableCell>
                                <TableCell className="text-right pr-6">
                                  <Button variant="ghost" size="sm" className="font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 rounded-xl px-4">
                                    {isExpanded ? "Hide Report" : "View Report"}
                                    <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}/>
                                  </Button>
                                </TableCell>
                              </TableRow>
                              
                              {isExpanded && (
                                <TableRow className="bg-slate-50 hover:bg-slate-50 border-x-0 border-b border-emerald-100 shadow-inner">
                                  <TableCell colSpan={4} className="p-0 border-b-0">
                                    <div className="p-4 md:p-8 animate-in slide-in-from-top-2 duration-300">
                                      
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 md:px-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <h3 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                          <FileBarChart className="w-5 h-5 text-emerald-600"/> {cycle} Analytics Report
                                        </h3>
                                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                          <Button variant="outline" size="sm" onClick={() => handleExportExcel(data, cycle)} className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-bold">
                                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Student List
                                          </Button>
                                          <Button size="sm" onClick={() => handleExportPDF(cycle)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md">
                                            <FileImage className="h-4 w-4" /> Export Charts (PDF)
                                          </Button>
                                        </div>
                                      </div>

                                      <div id={`pdf-charts-export-${cycle.replace(/\s+/g, '-')}`} className="space-y-6 print:p-0 print:bg-white">
                                        <div className="hidden print:block text-center mb-8">
                                          <h2 className="text-3xl font-black text-slate-900 uppercase">{cycle}</h2>
                                          <p className="text-slate-500 font-medium">Historical Analytics & Data Report</p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                          <StatCard title="Total Applications" value={cycleStats.total} description="Archived records" icon={<Users className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" />
                                          <StatCard title="Approved" value={cycleStats.approved} description="Successful applicants" icon={<CheckCircle className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                                          <StatCard title="Rejected" value={cycleStats.rejected} description="Unsuccessful applicants" icon={<XCircle className="h-5 w-5" />} iconBg="bg-red-50" iconColor="text-red-600" />
                                          <StatCard title="Approval Rate" value={`${cycleStats.approvalRate}%`} description="Of total applications" icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" />
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2">
                                          <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
                                            <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><UserIcon className="h-4 w-4 text-emerald-600" /> Gender Distribution</CardTitle></CardHeader>
                                            <CardContent className="h-64">
                                              {renderChart(getGenderData(data), <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={getGenderData(data)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}>{getGenderData(data).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend /></PieChart></ResponsiveContainer>, "No gender data.")}
                                            </CardContent>
                                          </Card>

                                          <Card className="rounded-3xl border-slate-200 shadow-sm bg-white">
                                            <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><Users className="h-4 w-4 text-emerald-600" /> Age Distribution</CardTitle></CardHeader>
                                            <CardContent className="h-64">
                                              {renderChart(getAgeData(data), <ResponsiveContainer width="100%" height="100%"><BarChart data={getAgeData(data)}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false}/><YAxis fontSize={12} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip />} cursor={{fill:'#f8fafc'}}/><Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>{getAgeData(data).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No age data.")}
                                            </CardContent>
                                          </Card>

                                          <Card className="rounded-3xl border-slate-200 shadow-sm bg-white md:col-span-2">
                                            <CardHeader className="pb-2 border-b border-slate-100 mb-4"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase text-slate-700"><MapPin className="h-4 w-4 text-emerald-600" /> Top Barangays</CardTitle></CardHeader>
                                            <CardContent className="h-64">
                                              {renderChart(getBarangayData(data), <ResponsiveContainer width="100%" height="100%"><BarChart data={getBarangayData(data)}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false}/><YAxis fontSize={12} axisLine={false} tickLine={false}/><Tooltip content={<CustomTooltip />} cursor={{fill:'#f8fafc'}}/><Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>{getBarangayData(data).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer>, "No barangay data.")}
                                            </CardContent>
                                          </Card>
                                        </div>
                                      </div>

                                      {/* Inline Data Table */}
                                      <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden mt-8 print:hidden bg-white">
                                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                                          <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-800 flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-600" /> Student Roster - {cycle}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0 overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                                          <Table>
                                            <TableHeader className="bg-white sticky top-0 shadow-sm z-10">
                                              <TableRow className="border-slate-100">
                                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pl-6 py-4">Student Name</TableHead>
                                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Contact</TableHead>
                                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Age & Gender</TableHead>
                                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">School / Course</TableHead>
                                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Barangay</TableHead>
                                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest pr-6">Status</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {data.map(s => (
                                                <TableRow key={s.id} className="hover:bg-slate-50 transition-colors border-slate-100">
                                                  <TableCell className="pl-6 font-bold text-slate-800 text-sm py-3">{s.name}</TableCell>
                                                  <TableCell>
                                                    <div className="text-slate-600 font-medium text-xs">{s.email}</div>
                                                    <div className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{s.contactNumber}</div>
                                                  </TableCell>
                                                  <TableCell className="text-slate-600 font-medium text-xs">{s.age} yrs • {s.gender}</TableCell>
                                                  <TableCell>
                                                    <div className="flex flex-col">
                                                      <span className="font-bold text-slate-700 text-xs">{s.schoolName}</span>
                                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.course}</span>
                                                    </div>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 shadow-none">{s.barangay}</Badge>
                                                  </TableCell>
                                                  <TableCell className="pr-6">
                                                    <Badge className={`shadow-none font-bold uppercase tracking-widest text-[10px] border-none ${s.applicationStatus === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                      {s.applicationStatus}
                                                    </Badge>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </CardContent>
                                      </Card>

                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </AdminLayout>
    </PermissionGuard>
  )
}
