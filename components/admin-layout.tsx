"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
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
import {
  LayoutDashboard,
  FileText,
  Users,
  QrCode,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  Calendar,
  CheckCircle,
  Info,
  AlertCircle,
  Mail,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  hasPermission,
  getAdminRoleLabel,
  type Notification,
  type AdminRole,
} from "@/lib/storage"
import { Shield, UsersRound } from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, isLoading } = useAuth()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true)
      if (!user) {
        console.log("AdminLayout: No user found, redirecting to login")
        router.push("/login")
      } else if (user.role !== "admin") {
        console.log("AdminLayout: User is not an admin, redirecting to student dashboard")
        router.push("/student/dashboard")
      } else {
        console.log("AdminLayout: User is an admin, allowing access")
      }
    }
  }, [user, isLoading, hasCheckedAuth, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      const adminNotifications = getNotificationsByUserId(user.id)
      setNotifications(adminNotifications)
    }
  }, [user])

  useEffect(() => {
    if (user && user.role === "admin") {
      const interval = setInterval(() => {
        const adminNotifications = getNotificationsByUserId(user.id)
        setNotifications(adminNotifications)
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user])

  if (isLoading || !hasCheckedAuth || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    setIsLogoutDialogOpen(false)
    logout()
  }

  // All navigation items with their required permissions
  const allNavigationItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", permission: "dashboard" },
    { href: "/admin/scholars", icon: Users, label: "Scholars", permission: "scholars" },
    { href: "/admin/applications", icon: FileText, label: "Applications", permission: "applications" },
    { href: "/admin/approved-emails", icon: Mail, label: "Approved Emails", permission: "approved-emails" },
    { href: "/admin/verification", icon: QrCode, label: "QR Verification", permission: "verification" },
    { href: "/admin/reports", icon: BarChart3, label: "Reports", permission: "reports" },
    { href: "/admin/scheduling", icon: Calendar, label: "Scheduling", permission: "scheduling" },
    { href: "/admin/staff-management", icon: UsersRound, label: "Staff Management", permission: "staff-management" },
  ]

  // Filter navigation items based on user permissions
  const navigationItems = allNavigationItems.filter((item) => hasPermission(user, item.permission))

  const adminRoleLabel = user?.adminRole ? getAdminRoleLabel(user.adminRole as AdminRole) : "Administrator"

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "announcement":
        return <Calendar className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id)
      const updatedNotifications = getNotificationsByUserId(user!.id)
      setNotifications(updatedNotifications)
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    setIsNotificationOpen(false)
  }

  const handleMarkAllAsRead = () => {
    if (user) {
      markAllNotificationsAsRead(user.id)
      const updatedNotifications = getNotificationsByUserId(user.id)
      setNotifications(updatedNotifications)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex h-full flex-col bg-white">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                        <img
                          src="/images/image.png"
                          alt="City of Carmona Logo"
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      </div>
                      <span className="text-lg font-bold text-slate-900">BTS Admin</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Mobile Navigation */}
                  <div className="flex-1 overflow-auto py-6">
                    <div className="mb-6 px-6">
                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{adminRoleLabel}</p>
                        </div>
                      </div>
                    </div>

                    <nav className="space-y-1 px-4">
                      <div className="mb-4">
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Navigation
                        </p>
                        {navigationItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                              isActive(item.href)
                                ? "bg-emerald-100 text-emerald-700"
                                : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                                isActive(item.href)
                                  ? "bg-emerald-200 text-emerald-700"
                                  : "bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                              }`}
                            >
                              <item.icon className="h-4 w-4" />
                            </div>
                            {item.label}
                          </Link>
                        ))}
                      </div>

                      <div>
                        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Account
                        </p>
                        <button
                          onClick={() => setIsLogoutDialogOpen(true)}
                          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 transition-colors group-hover:bg-red-100 group-hover:text-red-600">
                            <LogOut className="h-4 w-4" />
                          </div>
                          Logout
                        </button>
                      </div>
                    </nav>
                  </div>

                  {/* Mobile Logout */}
                  <div className="border-t border-slate-200 p-4">
                    <button
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        setIsLogoutDialogOpen(true)
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Brand */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                <img src="/images/image.png" alt="City of Carmona Logo" className="h-6 w-6 rounded-full object-cover" />
              </div>
              <span className="text-lg font-bold text-slate-900">BTS Admin</span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex justify-center max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-10" />
                <Input
                  placeholder="Search anything..."
                  className="pl-10 w-full h-9 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Admin Notifications */}
            <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100 relative">
                  <Bell className="h-5 w-5 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Admin Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-6 px-2">
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`p-3 cursor-pointer ${!notification.isRead ? "bg-blue-50" : ""}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3 w-full">
                        <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-600"}`}
                            >
                              {notification.title}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                          {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hover:bg-slate-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="hidden sm:inline-block text-sm font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Enhanced Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/60 bg-white">
          <div className="flex-1 overflow-auto py-6">
            {/* User Profile Card */}
            <div className="mx-4 mb-6">
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-emerald-600">{adminRoleLabel}</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 px-4">
              <div className="mb-6">
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Main Navigation
                </p>
                <div className="space-y-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive(item.href)
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                          isActive(item.href)
                            ? "bg-emerald-200 text-emerald-700"
                            : "bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-600"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Account</p>
                <button
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 transition-colors group-hover:bg-red-100 group-hover:text-red-600">
                    <LogOut className="h-4 w-4" />
                  </div>
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account and redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-emerald-600 hover:bg-emerald-700">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
