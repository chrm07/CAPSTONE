import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";
import { User, Application } from "./storage";

// Check if an email is pre-approved
export async function isEmailPreApprovedDb(email: string): Promise<boolean> {
  const preApprovedRef = collection(db, "preApprovedEmails");
  const q = query(preApprovedRef, where("email", "==", email), where("isUsed", "==", false));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Create a new user in Firestore
export async function createUserDb(userData: Omit<User, "id">, profileData?: any): Promise<User> {
  const userId = `user-${Date.now()}`;
  
  const newUser: User = {
    ...userData,
    id: userId,
    profileData: profileData || userData.profileData,
  };

  // Save to the 'users' collection in Firestore
  await setDoc(doc(db, "users", userId), newUser);
  
  return newUser;
}

// Create a new application in Firestore
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

  // Save to the 'applications' collection
  await setDoc(doc(db, "applications", appId), newApplication);
  
  return newApplication;
}
// Fetch a user by email for login/authentication
export async function getUserByEmailDb(email: string): Promise<User | null> {
  // Reference the 'users' collection
  const usersRef = collection(db, "users");
  
  // Create a query to find the document where the email matches
  const q = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(q);

  // If no user is found, return null
  if (snapshot.empty) {
    return null;
  }

  // Return the data of the first matched user document
  const userDoc = snapshot.docs[0];
  return userDoc.data() as User;
}
// Fetch dashboard statistics
export async function getDashboardStatsDb() {
  const appsRef = collection(db, "applications");
  const usersRef = collection(db, "users");

  // Fetch all applications and student users
  const appsSnapshot = await getDocs(appsRef);
  const usersSnapshot = await getDocs(query(usersRef, where("role", "==", "student")));

  let pending = 0;
  let approved = 0;
  let rejected = 0;

  // Tally up the statuses
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

// Fetch recent applications for the dashboard
export async function getRecentApplicationsDb(limitCount = 5): Promise<Application[]> {
  const appsRef = collection(db, "applications");
  const snapshot = await getDocs(appsRef);
  
  const apps = snapshot.docs.map(doc => doc.data() as Application);
  
  // Sort descending by date locally (newest first) 
  // Note: We sort locally for now to avoid dealing with complex Firestore Index requirements during initial dev!
  return apps
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitCount);
}