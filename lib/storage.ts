import { collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

// ==================== TYPE DEFINITIONS ====================

export type AdminRole = "head_admin" | "verifier_staff" | "scanner_staff"

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
  adminRole?: AdminRole 
  profileData?: StudentProfile | AdminProfile
  isPWD?: boolean 
  studentProfile?: any 
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
  isPWD?: boolean 
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
  isPWD?: boolean 
  isClaimed?: boolean
  claimedAt?: string
  processedByAdmin?: string
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
  url?: string 
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
  createdAt: string // Fixed from addedAt
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

// ==================== FIRESTORE DATABASE FUNCTIONS ====================

export async function isEmailPreApprovedDb(email: string): Promise<boolean> {
  const preApprovedRef = collection(db, "preApprovedEmails");
  const safeEmail = email.trim().toLowerCase(); 
  
  const q = query(preApprovedRef, where("email", "==", safeEmail), where("isUsed", "==", false));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function createUserDb(userData: Omit<User, "id">, profileData?: any): Promise<User> {
  const userId = `user-${Date.now()}`;
  const newUser: User = {
    ...userData,
    id: userId,
    profileData: profileData || userData.profileData,
  };
  await setDoc(doc(db, "users", userId), newUser);
  return newUser;
}

export async function createApplicationDb(data: Omit<Application, "id" | "createdAt" | "updatedAt" | "submittedAt">): Promise<Application> {
  const appId = `app-${Date.now()}`;
  const now = new Date().toISOString();
  const newApplication: Application = {
    ...data,
    id: appId,
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
  };
  await setDoc(doc(db, "applications", appId), newApplication);
  return newApplication;
}

export async function getUserByEmailDb(email: string): Promise<User | null> {
  const usersRef = collection(db, "users");
  const safeEmail = email.trim().toLowerCase(); 
  const q = query(usersRef, where("email", "==", safeEmail));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as User;
}

export async function getDashboardStatsDb() {
  const appsRef = collection(db, "applications");
  const usersRef = collection(db, "users");

  const appsSnapshot = await getDocs(appsRef);
  const usersSnapshot = await getDocs(query(usersRef, where("role", "==", "student")));

  let pending = 0;
  let approved = 0;
  let rejected = 0;

  appsSnapshot.forEach((doc) => {
    const data = doc.data() as Application;
    if (data.status === "pending") pending++;
    if (data.status === "approved") approved++;
    if (data.status === "rejected") rejected++;
  });

  return {
    totalScholars: usersSnapshot.size,
    pendingApplications: pending,
    approvedApplications: approved,
    rejectedApplications: rejected,
    totalApplications: appsSnapshot.size,
  };
}

export async function getRecentApplicationsDb(limitCount = 5): Promise<Application[]> {
  const appsRef = collection(db, "applications");
  const snapshot = await getDocs(appsRef);
  const apps = snapshot.docs.map(doc => doc.data() as Application);
  return apps
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
}

export async function getScholarsDb(): Promise<User[]> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", "student"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as User);
}

export async function getApplicationsDb(): Promise<Application[]> {
  const appsRef = collection(db, "applications");
  const snapshot = await getDocs(appsRef);
  const apps = snapshot.docs.map(doc => doc.data() as Application);
  return apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateApplicationStatusDb(
  id: string,
  status: "pending" | "approved" | "rejected",
  feedback?: string
): Promise<void> {
  const appRef = doc(db, "applications", id);
  await updateDoc(appRef, {
    status,
    feedback: feedback || "",
    updatedAt: new Date().toISOString()
  });
}

export async function getStudentApplicationDb(studentId: string): Promise<Application | null> {
  const appsRef = collection(db, "applications");
  const q = query(appsRef, where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as Application;
}

export async function getPreApprovedEmailsListDb() {
  const ref = collection(db, "preApprovedEmails");
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({ 
    id: doc.id, 
    email: doc.data().email,
    isUsed: doc.data().isUsed,
    createdAt: doc.data().createdAt || doc.data().addedAt || new Date().toISOString(), // Fallback for old data
    fullName: doc.data().fullName || "" 
  }));
}

export async function addPreApprovedEmailDb(email: string) {
  const ref = collection(db, "preApprovedEmails");
  await addDoc(ref, { 
    email: email.toLowerCase(), 
    isUsed: false, 
    createdAt: new Date().toISOString(), 
    fullName: ""
  });
}

export async function deletePreApprovedEmailDb(id: string) {
  await deleteDoc(doc(db, "preApprovedEmails", id));
}

export async function markEmailAsUsedDb(email: string) {
  const ref = collection(db, "preApprovedEmails");
  const safeEmail = email.trim().toLowerCase(); 
  const q = query(ref, where("email", "==", safeEmail));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await updateDoc(doc(db, "preApprovedEmails", docId), { isUsed: true });
  }
}

// Fetch documents for a specific student
export async function getDocumentsByStudentIdDb(studentId: string): Promise<Document[]> {
  const docsRef = collection(db, "documents");
  const q = query(docsRef, where("studentId", "==", studentId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Document);
}

// Save a new document (Base64 string) to Firestore
export async function createDocumentDb(data: Omit<Document, "id" | "uploadedAt">): Promise<Document> {
  const docId = `doc-${Date.now()}`;
  const newDocument: Document = {
    ...data,
    id: docId,
    uploadedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, "documents", docId), newDocument);
  return newDocument;
}

// Delete a document from Firestore
export async function deleteDocumentDb(studentId: string, documentName: string) {
  const docsRef = collection(db, "documents");
  const q = query(docsRef, where("studentId", "==", studentId), where("name", "==", documentName));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    await deleteDoc(doc(db, "documents", docId));
  }
}

// ==================== SCHEDULING FUNCTIONS ====================

export async function getVerificationSchedulesDb(): Promise<VerificationSchedule[]> {
  const q = query(collection(db, "verificationSchedules"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as VerificationSchedule))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createVerificationScheduleDb(data: Omit<VerificationSchedule, "id" | "status" | "createdAt" | "updatedAt">): Promise<VerificationSchedule> {
  const docRef = doc(collection(db, "verificationSchedules"));
  const schedule: VerificationSchedule = {
    ...data,
    id: docRef.id,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(docRef, schedule);
  return schedule;
}

export async function updateVerificationScheduleDb(id: string, data: Partial<VerificationSchedule>): Promise<void> {
  await updateDoc(doc(db, "verificationSchedules", id), {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteVerificationScheduleDb(id: string): Promise<void> {
  await deleteDoc(doc(db, "verificationSchedules", id));
}

export async function getFinancialDistributionSchedulesDb(): Promise<FinancialDistributionSchedule[]> {
  const q = query(collection(db, "financialSchedules"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as FinancialDistributionSchedule))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createFinancialDistributionScheduleDb(data: Omit<FinancialDistributionSchedule, "id" | "status" | "createdAt" | "updatedAt">): Promise<FinancialDistributionSchedule> {
  const docRef = doc(collection(db, "financialSchedules"));
  const schedule: FinancialDistributionSchedule = {
    ...data,
    id: docRef.id,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await setDoc(docRef, schedule);
  return schedule;
}

export async function updateFinancialDistributionScheduleDb(id: string, data: Partial<FinancialDistributionSchedule>): Promise<void> {
  await updateDoc(doc(db, "financialSchedules", id), {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteFinancialDistributionScheduleDb(id: string): Promise<void> {
  await deleteDoc(doc(db, "financialSchedules", id));
}

// ==================== EMPTY STUBS FOR UNMIGRATED FEATURES ====================

export function getApplicationHistoryByStudentId(studentId: string): ApplicationHistory[] { return [] }
export function getFinancialDistributionScheduleForBarangay(barangay: string): FinancialDistributionSchedule | null { return null }
export function hasStudentClaimed(studentId: string): boolean { return false }
export function getClaimedRecord(studentId: string): any { return undefined }
export function markNotificationAsRead(id: string): Notification | null { return null }
export function markAllNotificationsAsRead(userId: string): void {}
export function getNotificationsByUserId(userId: string): Notification[] { return []; }

export function hasPermission(user: User | null, permission: string): boolean {
  if (!user || user.role !== "admin") return false
  const adminRole = user.adminRole || "head_admin"
  return ADMIN_PERMISSIONS[adminRole]?.includes(permission) || false
}

export function getAdminRoleLabel(adminRole: AdminRole): string {
  switch (adminRole) {
    case "head_admin": return "Head Administrator"
    case "verifier_staff": return "Verification Staff"
    case "scanner_staff": return "QR Scanner Staff"
    default: return "Staff"
  }
}
export function getVerificationSchedules(): any[] { return [] }
export function getDocumentsByStudentId(studentId: string): any[] { return [] }
// ============================================================================
// PHASE 15 & 16: QR VERIFICATION & CLAIMING FIRESTORE FUNCTIONS
// ============================================================================

// 1. Get a single user by their ID
export async function getUserDb(userId: string) {
  try {
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

// 2. Get all users (used for fallback searching by email/studentId)
export async function getAllUsersDb() {
  try {
    const q = query(collection(db, "users"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }))
  } catch (error) {
    console.error("Error fetching all users:", error)
    return []
  }
}

// 3. Mark Student as Eligible (Stub function for compatibility)
export function markStudentAsEligible(studentId: string) {
  // In our new Firestore flow, eligibility is determined by the application status being "approved".
  // We keep this function to satisfy the UI's success toast message.
  return { success: true }
}

// 4. Mark Student as Claimed (Real Firestore Logic)
export async function markStudentAsClaimed(studentId: string, adminId: string) {
  try {
    console.log("Attempting to mark claimed for student:", studentId);
    
    // Query ONLY by studentId to avoid Firestore Composite Index errors
    const q = query(
      collection(db, "applications"), 
      where("studentId", "==", studentId)
    )
    
    const snapshot = await getDocs(q)
    
    // Filter for the approved application using JavaScript
    const approvedApps = snapshot.docs.filter(doc => doc.data().status === "approved")
    
    if (approvedApps.length === 0) {
      return { success: false, message: "No approved application found for this student." }
    }

    // Update the application to show it has been claimed
    const appDoc = approvedApps[0]
    console.log("Found application, updating document ID:", appDoc.id);

    await updateDoc(doc(db, "applications", appDoc.id), {
      isClaimed: true,
      claimedAt: new Date().toISOString(),
      processedByAdmin: adminId || "unknown_admin"
    })

    return { success: true, message: "Student has been successfully marked as claimed." }
  } catch (error: any) {
    console.error("EXACT FIREBASE ERROR:", error);
    // 🔥 THIS WILL SHOW THE REAL ERROR ON YOUR SCREEN
    return { success: false, message: `Firebase Error: ${error.message}` }
  }
}
// ============================================================================
// PHASE 17: STAFF MANAGEMENT FIRESTORE FUNCTIONS
// ============================================================================

export async function getStaffMembersDb(): Promise<User[]> {
  try {
    const q = query(collection(db, "users"), where("role", "==", "admin"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => doc.data() as User)
  } catch (error) {
    console.error("Error fetching staff:", error)
    return []
  }
}

export async function createStaffMemberDb(data: { name: string; email: string; password: string; adminRole: AdminRole }): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    // Check if email already exists
    const existing = await getUserByEmailDb(data.email)
    if (existing) {
      return { success: false, error: "An account with this email already exists." }
    }

    const userId = `admin-${Date.now()}`
    const newUser: User = {
      id: userId,
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password, // Note: In a production app with Firebase Auth, this is handled via auth()
      role: "admin",
      adminRole: data.adminRole,
      profileData: {
        fullName: data.name,
        email: data.email.toLowerCase(),
        contactNumber: "",
        position: getAdminRoleLabel(data.adminRole),
        department: "Scholarship Office",
      }
    }
    
    await setDoc(doc(db, "users", userId), newUser)
    return { success: true, user: newUser }
  } catch (error) {
    console.error("Error creating staff:", error)
    return { success: false, error: "Database error. Failed to create staff member." }
  }
}

export async function updateStaffRoleDb(userId: string, newRole: AdminRole): Promise<boolean> {
  try {
    await updateDoc(doc(db, "users", userId), {
      adminRole: newRole,
      "profileData.position": getAdminRoleLabel(newRole)
    })
    return true
  } catch (error) {
    console.error("Error updating role:", error)
    return false
  }
}

export async function deleteStaffMemberDb(userId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "users", userId))
    return true
  } catch (error) {
    console.error("Error deleting staff:", error)
    return false
  }
}