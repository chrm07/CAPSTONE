"use client"

import type React from "react"
import { FileText, QrCode, Search, History, Settings, User } from "lucide-react"
import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
import { LogOut, Menu, X, ChevronDown, Bell, Calendar, CheckCircle, Info, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
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

  useEffect(() => {
    // Only check auth once loading is complete
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true)

      // Only redirect if not logged in or not a student
      if (!user) {
        console.log("StudentLayout: No user found, redirecting to login")
        router.push("/login")
      } else if (user.role !== "student") {
        console.log("StudentLayout: User is not a student, redirecting to admin dashboard")
        router.push("/admin/dashboard")
      } else {
        console.log("StudentLayout: User is a student, allowing access")
      }
    }
  }, [user, isLoading, hasCheckedAuth, router])

  // Load notifications when user is available
  useEffect(() => {
    if (user && user.role === "student") {
      const userNotifications = getNotificationsByUserId(user.id)
      setNotifications(userNotifications)
    }
  }, [user])

  // Don't render anything while checking auth
  if (isLoading || !hasCheckedAuth || !user || user.role !== "student") {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id)
      // Refresh notifications
      const updatedNotifications = getNotificationsByUserId(user.id)
      setNotifications(updatedNotifications)
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
    setIsNotificationOpen(false)
  }

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead(user.id)
    const updatedNotifications = getNotificationsByUserId(user.id)
    setNotifications(updatedNotifications)
  }

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

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b header-gradient text-primary-foreground shadow-md">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden transition-transform hover:rotate-180 duration-300"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b px-4 py-4">
                    <div className="flex items-center gap-2">
                      <img
                        src="/images/image.png"
                        alt="City of Carmona Logo"
                        className="h-8 w-8 rounded-full object-cover"
                      />
                      <span className="text-lg font-bold">BTS</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="transition-transform hover:rotate-90 duration-200"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </Button>
                  </div>

                  <div className="flex-1 overflow-auto py-6">
                    <div className="mb-6 px-4">
                      <div className="flex items-center gap-2 rounded-md bg-white p-3 shadow-sm border border-gray-100">
                        <div className="h-8 w-8 rounded-full bg-green-100 p-1.5">
                          <User className="h-full w-full text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">Student</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 px-4">
                      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Main Navigation
                      </p>
                      <div className="flex flex-col gap-1">
                        <Link
                          href="/student/dashboard"
                          className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive("/student/dashboard")
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                              : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                              isActive("/student/dashboard")
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600"
                            }`}
                          >
                            <Calendar className="h-4 w-4" />
                          </div>
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/student/documents"
                          className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive("/student/documents")
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                              : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                              isActive("/student/documents")
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600"
                            }`}
                          >
                            <FileText className="h-4 w-4" />
                          </div>
                          <span>Documents</span>
                        </Link>
                        <Link
                          href="/student/qrcode"
                          className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive("/student/qrcode")
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                              : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                              isActive("/student/qrcode")
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600"
                            }`}
                          >
                            <QrCode className="h-4 w-4" />
                          </div>
                          <span>QR Code</span>
                        </Link>
                        <Link
                          href="/student/history"
                          className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive("/student/history")
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                              : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                              isActive("/student/history")
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600"
                            }`}
                          >
                            <History className="h-4 w-4" />
                          </div>
                          <span>Application History</span>
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-1 px-4">
                      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Account</p>
                      <div className="flex flex-col gap-1">
                        <Link
                          href="/student/profile"
                          className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive("/student/profile")
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                              : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                              isActive("/student/profile")
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600"
                            }`}
                          >
                            <User className="h-4 w-4" />
                          </div>
                          <span>Profile</span>
                        </Link>
                        <Link
                          href="/student/settings"
                          className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isActive("/student/settings")
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                              : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                              isActive("/student/settings")
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600"
                            }`}
                          >
                            <Settings className="h-4 w-4" />
                          </div>
                          <span>Settings</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Link href="/student/dashboard" className="flex items-center gap-2 text-primary-foreground">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
                <img src="/images/image.png" alt="City of Carmona Logo" className="h-6 w-6 rounded-full object-cover" />
              </div>
              <span className="text-lg font-bold">BTS</span>
            </Link>
          </div>
          <div className="hidden lg:flex lg:items-center lg:gap-6">
            <nav className="flex items-center gap-4"></nav>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex justify-center max-w-sm mx-6">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70 z-10" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full h-9 border-white/20 focus:border-white/40 focus:ring-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70"
                />
              </div>
            </div>

            {/* Notifications Dropdown */}
            <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/10"
                >
                  <span className="hidden sm:inline-block">{user.name}</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-lg border border-gray-200 rounded-lg p-1">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Added Profile button */}
                <DropdownMenuItem
                  href="/student/profile"
                  className="cursor-pointer hover:bg-green-50 transition-colors duration-200"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {/* Added Settings button */}
                <DropdownMenuItem
                  href="/student/settings"
                  className="cursor-pointer hover:bg-green-50 transition-colors duration-200"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="cursor-pointer text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar and Main Content */}
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar */}
        <aside className="fixed top-16 z-30 hidden h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/50 md:sticky md:block">
          <div className="py-6 pr-6">
            <div className="mb-6 px-3">
              <div className="flex items-center gap-2 rounded-md bg-white p-3 shadow-sm">
                <div className="h-8 w-8 rounded-full bg-green-100 p-1.5">
                  <User className="h-full w-full text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
              </div>
            </div>

            <div className="space-y-1 px-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Main Navigation</p>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/student/dashboard"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive("/student/dashboard")
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/student/documents"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive("/student/documents")
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span>Documents</span>
                </Link>
                <Link
                  href="/student/qrcode"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive("/student/qrcode")
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <span>QR Code</span>
                </Link>
                <Link
                  href="/student/history"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive("/student/history")
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200">
                    <History className="h-4 w-4" />
                  </div>
                  <span>Application History</span>
                </Link>
              </nav>
            </div>

            {/* Added Account section with Profile and Settings links for sidebar */}
            <div className="mt-6 space-y-1 px-3">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Account</p>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/student/profile"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive("/student/profile")
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200">
                    <User className="h-4 w-4" />
                  </div>
                  <span>Profile</span>
                </Link>
                <Link
                  href="/student/settings"
                  className={`group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive("/student/settings")
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md"
                      : "hover:bg-white hover:text-green-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span>Settings</span>
                </Link>
                <button
                  onClick={() => setIsLogoutDialogOpen(true)}
                  className="group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-white hover:text-red-600 hover:shadow-sm"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-500 transition-all duration-200 group-hover:bg-red-100 group-hover:text-red-600">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full py-6 bg-dots">{children}</main>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="border-2 border-gray-200 shadow-xl rounded-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-red-600 w-full"></div>
          <AlertDialogHeader className="pt-6">
            <AlertDialogTitle className="text-xl">Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out of your account and redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="shadow-sm hover:shadow transition-all duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout()
                setIsLogoutDialogOpen(false)
              }}
              className="relative bg-gradient-to-b from-red-500 to-red-600 text-white font-medium py-2 px-4 rounded-md shadow-md transform transition-all duration-200 active:translate-y-0.5 active:shadow-sm hover:-translate-y-0.5 hover:shadow-lg border-b-2 border-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
