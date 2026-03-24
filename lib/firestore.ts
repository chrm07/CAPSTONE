import { collection, doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { User, Application } from "./storage"; // Reusing your existing types!

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