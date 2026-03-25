"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { 
  FileText, QrCode, Search, History, Settings, User, 
  LogOut, Menu, X, ChevronDown, Bell, Calendar, 
  CheckCircle, Info, AlertCircle, Loader2 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"

// 🔥 IMPORT REAL DATABASE FUNCTIONS
import {
  getNotificationsByUserIdDb,
  markNotificationAsReadDb,
  markAllNotificationsAsReadDb,
  type Notification,
} from "@/lib/storage"

interface StudentLayoutProps {
  children: React.ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Authentication Guard
  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true)
      if (!user) {
        router.push("/login")
      } else if (user.role !== "student") {
        router.push("/admin/dashboard")
      }
    }
  }, [user, isLoading, hasCheckedAuth, router])

  // 🔥 LIVE NOTIFICATION FETCHING
  const refreshNotifications = async () => {
    if (user?.id && user.role === "student") {
      const liveNotifications = await getNotificationsByUserIdDb(user.id)
      setNotifications(liveNotifications)
    }
  }

  useEffect(() => {
    if (user && user.role === "student") {
      refreshNotifications()
      // Check for updates every 30 seconds
      const interval = setInterval(refreshNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsReadDb(notification.id)
      refreshNotifications()
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    setIsNotificationOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return
    await markAllNotificationsAsReadDb(user.id)
    refreshNotifications()
  }

  // --- UI Helpers ---
  const isActive = (path: string) => pathname === path

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "warning": return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "announcement": return <Calendar className="h-4 w-4 text-blue-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    return `${Math.floor(diffInHours / 24)}d ago`
  }

  if (isLoading || !hasCheckedAuth || !user || user.role !== "student") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Loading your portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* 🔥 HEADER ALIGNED WITH LANDING PAGE */}
      <header className="sticky top-0 z-40 border-b bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white shadow-lg">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white hover:bg-white/10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="p-6 border-b bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-emerald-700 font-medium">Student Portal</p>
                    </div>
                  </div>
                </div>
                <nav className="p-4 space-y-2">
                  <SidebarLink href="/student/dashboard" icon={Calendar} label="Dashboard" active={isActive("/student/dashboard")} />
                  <SidebarLink href="/student/documents" icon={FileText} label="Documents" active={isActive("/student/documents")} />
                  <SidebarLink href="/student/qrcode" icon={QrCode} label="QR Code" active={isActive("/student/qrcode")} />
                  <SidebarLink href="/student/history" icon={History} label="History" active={isActive("/student/history")} />
                </nav>
              </SheetContent>
            </Sheet>

            <Link href="/student/dashboard" className="flex items-center gap-2">
               <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
               </div>
               <span className="text-xl font-bold tracking-tight">BTS Portal</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Search - Integrated into Header */}
            <div className="hidden md:flex relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input
                placeholder="Search portal..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 h-9 rounded-full pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notifications */}
            <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 rounded-full">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center border-2 border-emerald-600">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border-slate-200">
                <div className="p-4 border-b flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                      Mark all read
                    </Button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">All caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 border-b last:border-0 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${!n.isRead ? 'bg-emerald-50/30' : ''}`}
                      >
                        <div className="mt-1">{getNotificationIcon(n.type)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm leading-tight ${!n.isRead ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatNotificationTime(n.createdAt)}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/10 gap-2 pl-2 rounded-full">
                  <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border border-white/30">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden sm:inline-block font-medium text-sm">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="text-sm font-bold">{user.name}</p>
                  <p className="text-xs text-slate-500 font-normal">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/student/profile")}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/student/settings")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={() => setIsLogoutDialogOpen(true)}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 flex-1 md:grid md:grid-cols-[240px_minmax(0,1fr)] md:gap-8">
        {/* SIDEBAR */}
        <aside className="hidden md:block py-8 border-r border-slate-200 pr-6">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Main Menu</p>
              <nav className="space-y-1">
                <SidebarLink href="/student/dashboard" icon={Calendar} label="Dashboard" active={isActive("/student/dashboard")} />
                <SidebarLink href="/student/documents" icon={FileText} label="Documents" active={isActive("/student/documents")} />
                <SidebarLink href="/student/qrcode" icon={QrCode} label="Your QR Code" active={isActive("/student/qrcode")} />
                <SidebarLink href="/student/history" icon={History} label="History" active={isActive("/student/history")} />
              </nav>
            </div>
            
            <div className="pt-6 border-t">
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Support</p>
              <nav className="space-y-1">
                <SidebarLink href="/student/settings" icon={Settings} label="Portal Settings" active={isActive("/student/settings")} />
                <button onClick={() => setIsLogoutDialogOpen(true)} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </nav>
            </div>
          </div>
        </aside>

        <main className="py-8 min-w-0">{children}</main>
      </div>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>You will need to login again to access your scholarship portal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={logout} className="bg-red-600 hover:bg-red-700">Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Helper Component for Navigation
function SidebarLink({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
        active 
          ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" 
          : "text-slate-600 hover:bg-white hover:text-emerald-700 hover:shadow-sm"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
      {label}
    </Link>
  )
}