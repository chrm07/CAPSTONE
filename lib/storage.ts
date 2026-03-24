// Storage utility functions for the scholarship system
// IN-MEMORY ONLY - No localStorage or sessionStorage - Data resets on page refresh

// ==================== TYPE DEFINITIONS ====================

// Admin role types for RBAC
export type AdminRole = "head_admin" | "verifier_staff" | "scanner_staff"

// Permissions for each admin role
export const ADMIN_PERMISSIONS: Record<AdminRole, string[]> = {
  head_admin: [
    "dashboard", "scholars", "applications", "approved-emails", 
    "verification", "reports", "scheduling", "staff-management", "settings"
  ],
  verifier_staff: [
    "dashboard", "scholars", "applications", "verification"
  ],
  scanner_staff: [
    "dashboard", "verification"
  ],
}

export type User = {
  id: string
  name: string
  email: string
  password: string
  role: "student" | "admin"
  adminRole?: AdminRole // Sub-role for admin users
  profileData?: StudentProfile | AdminProfile
  isPWD?: boolean // Added PWD field
  studentProfile?: any // For student registration data
  profilePicture?: string
}

export type StudentProfile = {
  fullName: string
  email: string
  contactNumber: string
  address: string
  age: string
  barangay: string
  bio?: string
  schoolName: string
  course: string
  yearLevel: string
  studentId: string
  isPWD?: boolean // Added PWD field
}

export type AdminProfile = {
  fullName: string
  email: string
  contactNumber: string
  position: string
  department: string
  bio?: string
}

export type Application = {
  id: string
  studentId: string
  fullName: string
  email: string
  course: string
  yearLevel: string
  school: string
  barangay: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
  submittedAt: string
  feedback?: string
  isPWD?: boolean // Added PWD field
}

export type Document = {
  id: string
  studentId: string
  name: string
  type: string
  status: "pending" | "approved" | "rejected"
  uploadedAt: string
  reviewedAt?: string
  feedback?: string
  fileSize: string
  semester: string
  academicYear: string
  url?: string // Vercel Blob URL for the actual file
}

export type Notification = {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "announcement"
  isRead: boolean
  createdAt: string
  actionUrl?: string
}

export type NewScholarApplication = {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  barangayClearance?: string
  indigencyCertificate?: string
  voterCertification?: string
  status: "pending" | "approved" | "rejected"
  submittedAt: string
  updatedAt: string
}

export type PreApprovedEmail = {
  id: string
  email: string
  fullName?: string
  notes?: string
  status: "available" | "used"
  addedBy: string
  addedAt: string
  isUsed: boolean
  usedAt?: string
  usedBy?: string
}

export type ApplicationHistory = {
  id: string
  studentId: string
  applicationData: {
    course: string
    yearLevel: string
    school: string
    schoolName: string
    barangay: string
    academicYear: string
  }
  outcome: "approved" | "rejected"
  completedAt: string
  completedDate: string
  financialAidAmount: number
  notes?: string
}

export type VerificationSchedule = {
  id: string
  barangay: string
  startDate: string
  endDate: string
  dailyLimit?: number
  status: "active" | "ended" | "upcoming"
  createdAt: string
  createdBy: string
  updatedAt: string
}

export type FinancialDistributionSchedule = {
  id: string
  barangays: string[]
  startDate: string
  endDate: string
  startTime: string
  distributionAmount: number
  status: "active" | "ended" | "upcoming"
  createdAt: string
  createdBy: string
  updatedAt: string
}

// ==================== IN-MEMORY DATA STORE ====================
// This data will reset when the page refreshes

let currentUser: User | null = null
let users: User[] = []
let applications: Application[] = []
let documents: Document[] = []
let notifications: Notification[] = []
let newScholarApplications: NewScholarApplication[] = []
let preApprovedEmails: PreApprovedEmail[] = []
let verificationSchedules: VerificationSchedule[] = []
let financialDistributionSchedules: FinancialDistributionSchedule[] = []
let eligibleStudents: { odestudentId: string; odemarkedAt: string; odeverifiedBy: string }[] = []
let applicationHistory: ApplicationHistory[] = []

// ==================== INITIALIZATION ====================

export function initializeStorage(): void {
  // Only initialize if data is empty
  if (users.length > 0) return

  const adminUser: User = {
    id: "admin1",
    name: "Admin User",
    email: "admin@carmona.gov.ph",
    password: "Admin123",
    role: "admin",
    adminRole: "head_admin", // Head admin has full access
    profileData: {
      fullName: "Maria Elena Santos",
      email: "admin@carmona.gov.ph",
      contactNumber: "09171234567",
      position: "Scholarship Program Administrator",
      department: "Municipal Scholarship Office",
      bio: "Responsible for overseeing the BTS scholarship program.",
    },
  }

  users = [adminUser]

  applications = []
  documents = []
  notifications = []
}

// ==================== USER FUNCTIONS ====================

export function getUsers(): User[] {
  return [...users]
}

export function getAllUsers(): User[] {
  return [...users]
}

export function getUserByEmail(email: string): User | null {
  if (!email) return null
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null
}

export function getUserById(id: string): User | null {
  if (!id) return null
  return users.find((user) => user.id === id) || null
}

export function getCurrentUser(): User | null {
  return currentUser
}

export function login(email: string, password: string): User | null {
  const user = users.find((u) => u.email === email && u.password === password)
  if (user) {
    currentUser = user
    return user
  }
  return null
}

export function logout(): void {
  currentUser = null
}

export function updateUserProfile(userId: string, profileData: Partial<StudentProfile | AdminProfile>): User | null {
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) return null

  users[userIndex] = {
    ...users[userIndex],
    profileData: { ...users[userIndex].profileData, ...profileData } as StudentProfile | AdminProfile,
  }

  if (currentUser && currentUser.id === userId) {
    currentUser = users[userIndex]
  }

  return users[userIndex]
}

export function updateUserPassword(userId: string, currentPassword: string, newPassword: string): boolean {
  const userIndex = users.findIndex((u) => u.id === userId)
  if (userIndex === -1) return false
  if (users[userIndex].password !== currentPassword) return false

  users[userIndex].password = newPassword
  return true
}

export function createUser(userData: Omit<User, "id">, profileData?: any): User {
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    profileData: profileData || userData.profileData,
  }
  users.push(newUser)

  if (newUser.role === "student") {
    createNotification({
      userId: newUser.id,
      title: "Welcome to BTS Scholarship Program!",
      message:
        "Thank you for registering. Complete your profile and submit your scholarship application to get started.",
      type: "info",
      isRead: false,
      actionUrl: "/student/dashboard",
    })

    // Notify admins about new student registration
    const admins = users.filter((u) => u.role === "admin")
    admins.forEach((admin) => {
      createNotification({
        userId: admin.id,
        title: "New Student Registration",
        message: `${newUser.name} (${newUser.email}) has registered for the scholarship program.`,
        type: "info",
        isRead: false,
        actionUrl: "/admin/scholars",
      })
    })
  }

  return newUser
}

// Alias functions
export function getUser(userId: string): User | null {
  return getUserById(userId)
}

export function updateUser(userId: string, profileData: Partial<StudentProfile | AdminProfile>): User | null {
  return updateUserProfile(userId, profileData)
}

export function updateEducationInfo(userId: string, educationData: Partial<StudentProfile>): User | null {
  return updateUserProfile(userId, educationData)
}

// ==================== APPLICATION FUNCTIONS ====================

export function getApplications(): Application[] {
  return [...applications]
}

export function getAllApplications(): Application[] {
  return [...applications]
}

export function getApplicationById(id: string): Application | null {
  if (!id) return null
  return applications.find((app) => app.id === id) || null
}

export function getApplicationsByStudentId(studentId: string): Application[] {
  if (!studentId) return []
  return applications.filter((app) => app.studentId === studentId)
}

export function createApplication(
  data: Omit<Application, "id" | "createdAt" | "updatedAt" | "submittedAt">,
): Application {
  const newApplication: Application = {
    ...data,
    id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
  }
  applications.push(newApplication)

  createNotification({
    userId: data.studentId,
    title: "Application Submitted Successfully",
    message:
      "Your scholarship application has been submitted and is now under review. You'll receive updates on your application status.",
    type: "success",
    isRead: false,
    actionUrl: "/student/dashboard",
  })

  const admins = users.filter((u) => u.role === "admin")
  admins.forEach((admin) => {
    createNotification({
      userId: admin.id,
      title: "New Application Submitted",
      message: `${data.fullName} submitted a scholarship application. Course: ${data.course}, Year: ${data.yearLevel}, Barangay: ${data.barangay}`,
      type: "info",
      isRead: false,
      actionUrl: "/admin/dashboard",
    })
  })

  return newApplication
}

export function updateApplicationStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  feedback?: string,
): Application | null {
  const appIndex = applications.findIndex((app) => app.id === id)
  if (appIndex === -1) return null

  applications[appIndex] = {
    ...applications[appIndex],
    status,
    feedback,
    updatedAt: new Date().toISOString(),
  }

  const application = applications[appIndex]
  const student = users.find((u) => u.id === application.studentId)

  if (student) {
    if (status === "approved") {
      createNotification({
        userId: student.id,
        title: "Application Approved!",
        message: `Congratulations! Your scholarship application has been approved. ${feedback || "You can now proceed with the next steps in your student dashboard."}`,
        type: "success",
        isRead: false,
        actionUrl: "/student/dashboard",
      })
    } else if (status === "rejected") {
      createNotification({
        userId: student.id,
        title: "Application Update",
        message: `Your scholarship application has been reviewed. ${feedback || "Please contact the scholarship office for more information."}`,
        type: "warning",
        isRead: false,
        actionUrl: "/student/dashboard",
      })
    }
  }

  const admins = users.filter((u) => u.role === "admin")
  admins.forEach((admin) => {
    createNotification({
      userId: admin.id,
      title: "Application Status Updated",
      message: `Application for ${application.fullName} has been ${status}. Course: ${application.course}, Barangay: ${application.barangay}`,
      type: "info",
      isRead: false,
      actionUrl: "/admin/scholars",
    })
  })

  return applications[appIndex]
}

export function updateApplication(id: string, updates: Partial<Application>): Application | null {
  const appIndex = applications.findIndex((app) => app.id === id)
  if (appIndex === -1) return null

  applications[appIndex] = {
    ...applications[appIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return applications[appIndex]
}

// ==================== DOCUMENT FUNCTIONS ====================

export function getDocuments(): Document[] {
  return [...documents]
}

export function getDocumentsByStudentId(studentId: string): Document[] {
  if (!studentId) return []
  return documents.filter((doc) => doc.studentId === studentId)
}

export function createDocument(data: Omit<Document, "id" | "uploadedAt">): Document {
  const newDocument: Document = {
    ...data,
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    uploadedAt: new Date().toISOString(),
  }
  documents.push(newDocument)
  return newDocument
}

export function updateDocumentStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
  feedback?: string,
): Document | null {
  const docIndex = documents.findIndex((doc) => doc.id === id)
  if (docIndex === -1) return null

  documents[docIndex] = {
    ...documents[docIndex],
    status,
    feedback,
    reviewedAt: new Date().toISOString(),
  }

  return documents[docIndex]
}

// ==================== NOTIFICATION FUNCTIONS ====================

export function getNotifications(): Notification[] {
  return [...notifications]
}

export function getNotificationsByUserId(userId: string): Notification[] {
  if (!userId) return []
  return notifications.filter((n) => n.userId === userId)
}

export function createNotification(data: Omit<Notification, "id" | "createdAt">): Notification {
  const newNotification: Notification = {
    ...data,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  notifications.push(newNotification)
  return newNotification
}

export function markNotificationAsRead(id: string): Notification | null {
  const notifIndex = notifications.findIndex((n) => n.id === id)
  if (notifIndex === -1) return null

  notifications[notifIndex] = {
    ...notifications[notifIndex],
    isRead: true,
  }

  return notifications[notifIndex]
}

export function markAllNotificationsAsRead(userId: string): void {
  notifications = notifications.map((n) => (n.userId === userId ? { ...n, isRead: true } : n))
}

// ==================== PRE-APPROVED EMAIL FUNCTIONS ====================

export function getPreApprovedEmails(): PreApprovedEmail[] {
  return [...preApprovedEmails]
}

export function addPreApprovedEmail(
  email: string,
  fullName?: string,
  notes?: string,
  addedBy?: string,
): PreApprovedEmail {
  const newEmail: PreApprovedEmail = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: email,
    fullName,
    notes,
    status: "available",
    addedBy: addedBy || "admin",
    addedAt: new Date().toISOString(),
    isUsed: false,
  }
  preApprovedEmails.push(newEmail)

  const admins = users.filter((u) => u.role === "admin")
  admins.forEach((admin) => {
    if (admin.id !== addedBy) {
      createNotification({
        userId: admin.id,
        title: "New Pre-Approved Email Added",
        message: `Email ${email}${fullName ? ` (${fullName})` : ""} has been added to the pre-approved list.`,
        type: "info",
        isRead: false,
        actionUrl: "/admin/approved-emails",
      })
    }
  })

  return newEmail
}

export function removePreApprovedEmail(id: string): boolean {
  const initialLength = preApprovedEmails.length
  preApprovedEmails = preApprovedEmails.filter((e) => e.id !== id)
  return preApprovedEmails.length < initialLength
}

export function isEmailPreApproved(email: string): boolean {
  if (!email) return false
  const result = preApprovedEmails.some((e) => e?.email?.toLowerCase() === email.toLowerCase() && !e.isUsed)
  return result
}

export function markEmailAsUsed(email: string, userId: string): void {
  const emailIndex = preApprovedEmails.findIndex((e) => e.email.toLowerCase() === email.toLowerCase())
  if (emailIndex !== -1) {
    preApprovedEmails[emailIndex] = {
      ...preApprovedEmails[emailIndex],
      isUsed: true,
      usedAt: new Date().toISOString(),
      usedBy: userId,
    }
  }
}

// ==================== NEW SCHOLAR APPLICATION FUNCTIONS ====================

export function getNewScholarApplications(): NewScholarApplication[] {
  return [...newScholarApplications]
}

export function createNewScholarApplication(
  data: Omit<NewScholarApplication, "id" | "submittedAt" | "updatedAt" | "status">,
): NewScholarApplication {
  const newApp: NewScholarApplication = {
    ...data,
    id: `new-app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: "pending",
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  newScholarApplications.push(newApp)
  return newApp
}

export function updateNewScholarApplicationStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
): NewScholarApplication | null {
  const appIndex = newScholarApplications.findIndex((app) => app.id === id)
  if (appIndex === -1) return null

  newScholarApplications[appIndex] = {
    ...newScholarApplications[appIndex],
    status,
    updatedAt: new Date().toISOString(),
  }

  return newScholarApplications[appIndex]
}

export function updateNewScholarApplication(
  id: string,
  updates: Partial<NewScholarApplication>,
): NewScholarApplication | null {
  const appIndex = newScholarApplications.findIndex((app) => app.id === id)
  if (appIndex === -1) return null

  newScholarApplications[appIndex] = {
    ...newScholarApplications[appIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return newScholarApplications[appIndex]
}

// ==================== VERIFICATION SCHEDULE FUNCTIONS ====================

export function getVerificationSchedules(): VerificationSchedule[] {
  return verificationSchedules.map((schedule) => ({
    ...schedule,
    status: calculateScheduleStatus(schedule.startDate, schedule.endDate),
  }))
}

export function createVerificationSchedule(data: Omit<VerificationSchedule, "id" | "createdAt">): VerificationSchedule {
  const newSchedule: VerificationSchedule = {
    ...data,
    id: `vs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  verificationSchedules.push(newSchedule)

  const affectedStudents = users.filter((u) => u.role === "student" && u.profileData?.barangay === data.barangay)

  affectedStudents.forEach((student) => {
    createNotification({
      userId: student.id,
      title: "Verification Schedule Announced",
      message: `Document verification for ${data.barangay} is scheduled from ${new Date(data.startDate).toLocaleDateString()} to ${new Date(data.endDate).toLocaleDateString()}. Please prepare your documents.`,
      type: "announcement",
      isRead: false,
      actionUrl: "/student/dashboard",
    })
  })

  return newSchedule
}

export function updateVerificationSchedule(
  id: string,
  updates: Partial<VerificationSchedule>,
): VerificationSchedule | null {
  const scheduleIndex = verificationSchedules.findIndex((s) => s.id === id)
  if (scheduleIndex === -1) return null

  verificationSchedules[scheduleIndex] = {
    ...verificationSchedules[scheduleIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return verificationSchedules[scheduleIndex]
}

export function deleteVerificationSchedule(id: string): boolean {
  const initialLength = verificationSchedules.length
  verificationSchedules = verificationSchedules.filter((s) => s.id !== id)
  return verificationSchedules.length < initialLength
}

export function endVerificationSchedule(id: string): VerificationSchedule | null {
  const scheduleIndex = verificationSchedules.findIndex((s) => s.id === id)
  if (scheduleIndex === -1) return null

  verificationSchedules[scheduleIndex] = {
    ...verificationSchedules[scheduleIndex],
    status: "ended",
    endDate: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString(),
  }

  return verificationSchedules[scheduleIndex]
}

// ==================== FINANCIAL DISTRIBUTION SCHEDULE FUNCTIONS ====================

export function getFinancialDistributionSchedules(): FinancialDistributionSchedule[] {
  return financialDistributionSchedules.map((schedule) => ({
    ...schedule,
    status: calculateScheduleStatus(schedule.startDate, schedule.endDate),
  }))
}

export function getFinancialDistributionScheduleForBarangay(barangay: string): FinancialDistributionSchedule | null {
  const schedule = financialDistributionSchedules.find(
    (s) => s.barangays.includes(barangay) && calculateScheduleStatus(s.startDate, s.endDate) !== "ended",
  )

  if (!schedule) return null

  return {
    ...schedule,
    status: calculateScheduleStatus(schedule.startDate, schedule.endDate),
  }
}

export function createFinancialDistributionSchedule(
  data: Omit<FinancialDistributionSchedule, "id" | "createdAt">,
): FinancialDistributionSchedule {
  const newSchedule: FinancialDistributionSchedule = {
    ...data,
    id: `fds-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  financialDistributionSchedules.push(newSchedule)

  data.barangays.forEach((barangay) => {
    const affectedStudents = users.filter((u) => u.role === "student" && u.profileData?.barangay === barangay)

    const approvedApplications = applications.filter((app) => app.status === "approved" && app.barangay === barangay)

    // Only notify students with approved applications
    const notifiedStudents = affectedStudents.filter((student) =>
      approvedApplications.some((app) => app.studentId === student.id),
    )

    notifiedStudents.forEach((student) => {
      createNotification({
        userId: student.id,
        title: "Financial Aid Distribution Scheduled",
        message: `Financial aid distribution for ${barangay} is scheduled on ${new Date(data.startDate).toLocaleDateString()}${data.startTime ? ` at ${data.startTime}` : ""}. Amount: ₱${data.distributionAmount.toLocaleString()}. Please bring valid ID.`,
        type: "success",
        isRead: false,
        actionUrl: "/student/dashboard",
      })
    })
  })

  return newSchedule
}

export function updateFinancialDistributionSchedule(
  id: string,
  updates: Partial<FinancialDistributionSchedule>,
): FinancialDistributionSchedule | null {
  const scheduleIndex = financialDistributionSchedules.findIndex((s) => s.id === id)
  if (scheduleIndex === -1) return null

  financialDistributionSchedules[scheduleIndex] = {
    ...financialDistributionSchedules[scheduleIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  return financialDistributionSchedules[scheduleIndex]
}

export function deleteFinancialDistributionSchedule(id: string): boolean {
  const initialLength = financialDistributionSchedules.length
  financialDistributionSchedules = financialDistributionSchedules.filter((s) => s.id !== id)
  return financialDistributionSchedules.length < initialLength
}

export function endFinancialDistributionSchedule(id: string): FinancialDistributionSchedule | null {
  const scheduleIndex = financialDistributionSchedules.findIndex((s) => s.id === id)
  if (scheduleIndex === -1) return null

  financialDistributionSchedules[scheduleIndex] = {
    ...financialDistributionSchedules[scheduleIndex],
    status: "ended",
    endDate: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString(),
  }

  return financialDistributionSchedules[scheduleIndex]
}

// ==================== HELPER FUNCTIONS ====================

function calculateScheduleStatus(startDate: string, endDate: string): "active" | "ended" | "upcoming" {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) return "upcoming"
  if (now > end) return "ended"
  return "active"
}

// ==================== STATISTICS FUNCTIONS ====================

export function getStatistics() {
  const allApplications = getApplications()
  const allUsers = getUsers()

  return {
    totalScholars: allUsers.filter((u) => u.role === "student").length,
    pendingApplications: allApplications.filter((a) => a.status === "pending").length,
    approvedApplications: allApplications.filter((a) => a.status === "approved").length,
    rejectedApplications: allApplications.filter((a) => a.status === "rejected").length,
    totalApplications: allApplications.length,
  }
}

// ==================== ELIGIBILITY FUNCTIONS ====================

export function markStudentAsEligible(studentId: string, verifiedBy: string): boolean {
  const existingIndex = eligibleStudents.findIndex((e) => e.odestudentId === studentId)
  if (existingIndex !== -1) return true

  eligibleStudents.push({
    odestudentId: studentId,
    odemarkedAt: new Date().toISOString(),
    odeverifiedBy: verifiedBy,
  })

  return true
}

export function isStudentEligible(studentId: string): boolean {
  return eligibleStudents.some((e) => e.odestudentId === studentId)
}

export function getEligibleStudents() {
  return [...eligibleStudents]
}

// ==================== CLAIMED STATUS FUNCTIONS ====================

type ClaimedRecord = {
  odestudentId: string
  odeclaimedAt: string
  odeclaimedBy: string
  odeamount?: number
}

let claimedStudents: ClaimedRecord[] = []

export function markStudentAsClaimed(studentId: string, claimedBy: string, amount?: number): { success: boolean; message: string } {
  // Check if student is eligible first
  if (!isStudentEligible(studentId)) {
    return { success: false, message: "Student must be verified as eligible before claiming" }
  }
  
  // Check if already claimed
  const existingIndex = claimedStudents.findIndex((c) => c.odestudentId === studentId)
  if (existingIndex !== -1) {
    return { success: false, message: "Student has already claimed their financial aid" }
  }

  // Get the student's current application
  const studentApplication = applications.find((app) => app.studentId === studentId && app.status === "approved")
  const student = users.find((u) => u.id === studentId)
  const profile = student?.studentProfile || student?.profileData

  const claimedAt = new Date().toISOString()

  // Add to claimed records
  claimedStudents.push({
    odestudentId: studentId,
    odeclaimedAt: claimedAt,
    odeclaimedBy: claimedBy,
    odeamount: amount,
  })

  // Archive to application history
  if (studentApplication && student) {
    const historyEntry: Omit<ApplicationHistory, "id"> = {
      studentId: studentId,
      applicationData: {
        course: profile?.education?.course || profile?.course || studentApplication.course || "N/A",
        yearLevel: profile?.education?.yearLevel || profile?.yearLevel || studentApplication.yearLevel || "N/A",
        school: profile?.education?.school || profile?.school || studentApplication.school || "N/A",
        schoolName: profile?.education?.school || profile?.school || studentApplication.school || "N/A",
        barangay: profile?.barangay || studentApplication.barangay || "N/A",
        academicYear: studentApplication.academicYear || getCurrentAcademicYear(),
      },
      outcome: "approved",
      completedAt: claimedAt,
      completedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      financialAidAmount: amount || 0,
      notes: "Financial aid successfully claimed",
    }
    addApplicationHistory(historyEntry)

    // Remove the current application (clear for next semester)
    applications = applications.filter((app) => !(app.studentId === studentId && app.status === "approved"))
    
    // Remove from eligible students
    eligibleStudents = eligibleStudents.filter((e) => e.odestudentId !== studentId)
    
    // Remove from claimed students (since it's now in history)
    claimedStudents = claimedStudents.filter((c) => c.odestudentId !== studentId)
    
    // Clear student's documents for next semester
    documents = documents.filter((doc) => doc.studentId !== studentId)
  }

  return { success: true, message: "Financial aid claimed and archived to history. Ready for next semester!" }
}

// Helper function to get current academic year
function getCurrentAcademicYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  // Academic year typically starts in June/August
  if (month >= 5) {
    return `${year}-${year + 1}`
  }
  return `${year - 1}-${year}`
}

export function hasStudentClaimed(studentId: string): boolean {
  return claimedStudents.some((c) => c.odestudentId === studentId)
}

export function getClaimedRecord(studentId: string): ClaimedRecord | undefined {
  return claimedStudents.find((c) => c.odestudentId === studentId)
}

export function getClaimedStudents() {
  return [...claimedStudents]
}

// ==================== APPLICATION HISTORY FUNCTIONS ====================

export function getApplicationHistoryByStudentId(studentId: string): ApplicationHistory[] {
  return applicationHistory.filter((h) => h.studentId === studentId)
}

export function addApplicationHistory(data: Omit<ApplicationHistory, "id">): ApplicationHistory {
  const newHistory: ApplicationHistory = {
    ...data,
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  }
  applicationHistory.push(newHistory)
  return newHistory
}

// ==================== VERIFICATION FUNCTIONS ====================

export function verifyStudent(
  studentId: string,
  adminId: string,
): { success: boolean; message: string; student?: User } {
  const user = getUserById(studentId)
  if (!user) {
    return { success: false, message: "Student not found" }
  }

  const userApplications = getApplicationsByStudentId(studentId)
  const approvedApp = userApplications.find((app) => app.status === "approved")

  if (!approvedApp) {
    return { success: false, message: "No approved application found for this student" }
  }

  markStudentAsEligible(studentId, adminId)

  return {
    success: true,
    message: "Student verified successfully",
    student: user,
  }
}

// ==================== RBAC FUNCTIONS ====================

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user || user.role !== "admin") return false
  const adminRole = user.adminRole || "head_admin" // Default to head_admin for backwards compatibility
  return ADMIN_PERMISSIONS[adminRole]?.includes(permission) || false
}

export function getAdminRoleLabel(adminRole: AdminRole): string {
  switch (adminRole) {
    case "head_admin":
      return "Head Administrator"
    case "verifier_staff":
      return "Verification Staff"
    case "scanner_staff":
      return "QR Scanner Staff"
    default:
      return "Staff"
  }
}

export function getStaffMembers(): User[] {
  return users.filter((u) => u.role === "admin")
}

export function createStaffMember(data: {
  name: string
  email: string
  password: string
  adminRole: AdminRole
}): User | { error: string } {
  // Check if email already exists
  const existingUser = getUserByEmail(data.email)
  if (existingUser) {
    return { error: "Email already exists" }
  }

  const newStaff: User = {
    id: `staff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: data.name,
    email: data.email,
    password: data.password,
    role: "admin",
    adminRole: data.adminRole,
    profileData: {
      fullName: data.name,
      email: data.email,
      contactNumber: "",
      position: getAdminRoleLabel(data.adminRole),
      department: "Municipal Scholarship Office",
    },
  }

  users.push(newStaff)
  return newStaff
}

export function updateStaffRole(staffId: string, newRole: AdminRole): User | null {
  const staffIndex = users.findIndex((u) => u.id === staffId && u.role === "admin")
  if (staffIndex === -1) return null

  users[staffIndex] = {
    ...users[staffIndex],
    adminRole: newRole,
    profileData: {
      ...users[staffIndex].profileData,
      position: getAdminRoleLabel(newRole),
    } as AdminProfile,
  }

  return users[staffIndex]
}

export function deleteStaffMember(staffId: string): boolean {
  // Prevent deleting the head admin
  const staff = users.find((u) => u.id === staffId)
  if (!staff || staff.adminRole === "head_admin") return false

  const initialLength = users.length
  users = users.filter((u) => u.id !== staffId)
  return users.length < initialLength
}

// ==================== DEBUG FUNCTIONS (NO-OP) ====================

export function clearAllData(): void {
  users = []
  applications = []
  documents = []
  notifications = []
  newScholarApplications = []
  preApprovedEmails = []
  verificationSchedules = []
  financialDistributionSchedules = []
  eligibleStudents = []
  claimedStudents = []
  applicationHistory = []
  currentUser = null
  }

export function debugViewAllUsers(): void {
  console.log("Users:", users)
}

export function checkStorageStatus() {
  return {
    isInitialized: users.length > 0,
    version: "in-memory",
    userCount: users.length,
    applicationCount: applications.length,
    documentCount: documents.length,
  }
}

export function resetToFreshState(): void {
  clearAllData()
  initializeStorage()
}
