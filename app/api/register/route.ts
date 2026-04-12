import { NextResponse } from "next/server"
import * as admin from "firebase-admin"
import { 
  createUserDb, 
  createApplicationDb, 
  isEmailPreApprovedDb, 
  markEmailAsUsedDb,
  getAllUsersDb 
} from "@/lib/storage"

// Initialize Firebase Admin for secure backend operations
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle newline characters in the private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      action,
      studentPhoto, 
      firstName, 
      middleName, 
      lastName, 
      email, 
      password, 
      address, 
      contactNumber, 
      age, 
      gender,
      barangay, 
      schoolName, 
      program, // 🔥 FIX: Extracting 'program' instead of the legacy 'course'
      yearLevel,
      semester,
      isPWD 
    } = body

    // Force strict sanitization to prevent false rejections
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    if (action === "verify_email") {
      if (!cleanEmail) return NextResponse.json({ error: "Email is required" }, { status: 400 })
      
      const allUsers = await getAllUsersDb()
      const isDuplicate = allUsers.some((u: any) => u.email?.toLowerCase() === cleanEmail)
      if (isDuplicate) {
        return NextResponse.json({ error: "This email is already registered. Please sign in instead." }, { status: 409 })
      }

      const isApproved = await isEmailPreApprovedDb(cleanEmail)
      if (!isApproved) {
        return NextResponse.json({ error: "This email is not authorized to register. Please contact the administrator." }, { status: 403 })
      }

      return NextResponse.json({ success: true }) 
    }

    if (!firstName || !lastName || !cleanEmail || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Secondary verification just before final creation
    const allUsers = await getAllUsersDb();
    const isDuplicate = allUsers.some((u: any) => u.email?.toLowerCase() === cleanEmail);
    if (isDuplicate) {
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 })
    }

    const isApproved = await isEmailPreApprovedDb(cleanEmail);
    if (!isApproved) {
      return NextResponse.json({ error: "This email is not authorized to register." }, { status: 403 })
    }

    try {
      const combinedFullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim()

      // ==========================================
      // STEP 1: Create User in Firebase Auth
      // ==========================================
      try {
        await admin.auth().createUser({
          email: cleanEmail,
          password: password,
          displayName: combinedFullName,
        });
      } catch (authError: any) {
        console.error("Firebase Auth Error:", authError);
        
        if (authError.code === 'auth/email-already-exists') {
          // 🔥 GHOST ACCOUNT RECOVERY FIX:
          // We already verified above that the user DOES NOT exist in the Firestore database.
          // Therefore, this is an orphaned Firebase Auth account from a previously failed registration.
          // We will "adopt" this account, update its password, and proceed to build the database files.
          try {
            const existingAuthRecord = await admin.auth().getUserByEmail(cleanEmail);
            await admin.auth().updateUser(existingAuthRecord.uid, {
              password: password,
              displayName: combinedFullName
            });
            console.log("Ghost account recovered successfully.");
          } catch (updateErr) {
            return NextResponse.json({ error: "This email is stuck in the auth system. Please contact the admin." }, { status: 409 });
          }
        } else {
          return NextResponse.json({ error: authError.message || "Failed to create secure login account" }, { status: 400 });
        }
      }

      // ==========================================
      // STEP 2: Save to Firestore
      // ==========================================
      const newUser = await createUserDb({
        name: combinedFullName, 
        email: cleanEmail,
        password: password, 
        role: "student",
        profileData: {
          studentPhoto: studentPhoto || "", 
          firstName,
          middleName: middleName || "",
          lastName,
          fullName: combinedFullName, 
          email: cleanEmail,
          contactNumber: contactNumber || "",
          address: address || "",
          age: age || "",
          gender: gender || "", 
          barangay: barangay || "",
          schoolName: schoolName || "",
          program: program || "", // 🔥 FIX: Properly binding the frontend payload to 'program'
          course: program || "",  // 🔥 Dual-saving to legacy 'course' key to prevent breaking other UI elements
          yearLevel: yearLevel || "",
          semester: semester || "", 
          isPWD: !!isPWD,
          studentId: `STU-${Date.now()}`,
        },
      })

      // Generate the base application document
      await createApplicationDb({
        studentId: newUser.id,
        firstName,
        middleName: middleName || "",
        lastName,
        fullName: combinedFullName, 
        email: cleanEmail,
        program: program || "", 
        course: program || "",  
        yearLevel: yearLevel || "",
        semester: semester || "", 
        school: schoolName || "",
        barangay: barangay || "",
        isPWD: !!isPWD,
        status: "draft",
        isSubmitted: false, // Ensures it doesn't show up to admins yet
        isApproved: false,
        isRejected: false,
        isClaimed: false,
        isArchived: false, 
      })

      // Mark the email as consumed
      await markEmailAsUsedDb(cleanEmail);

      return NextResponse.json({ success: true, message: "Registration successful" }, { status: 201 })
    } catch (error: any) {
      console.error("Database Error:", error)
      return NextResponse.json({ error: error.message || "User creation failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Registration route error:", error)
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 })
  }
}