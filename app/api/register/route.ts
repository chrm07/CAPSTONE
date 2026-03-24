import { NextResponse } from "next/server"
import { createUserDb, createApplicationDb, isEmailPreApprovedDb, markEmailAsUsedDb } from "@/lib/storage"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, email, password, address, contactNumber, age, barangay, schoolName, course, yearLevel } = body

    // Validate required fields
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // AWAIT the database check
    const isApproved = await isEmailPreApprovedDb(email);
    
    // ENFORCE PRE-APPROVED EMAILS (Comments removed!)
    if (!isApproved) {
      return NextResponse.json(
        {
          error: "This email is not authorized to register. Please contact the administrator.",
        },
        { status: 403 },
      )
    }

    try {
      // Create user in Firestore
      const newUser = await createUserDb({
        name: fullName,
        email: email,
        password: password,
        role: "student",
        profileData: {
          fullName,
          email,
          contactNumber: contactNumber || "",
          address: address || "",
          age: age || "",
          barangay: barangay || "",
          schoolName: schoolName || "",
          course: course || "",
          yearLevel: yearLevel || "",
          studentId: `STU-${Date.now()}`,
        },
      })

      // Create application in Firestore
      await createApplicationDb({
        studentId: newUser.id,
        fullName: fullName,
        email: email,
        course: course || "",
        yearLevel: yearLevel || "",
        school: schoolName || "",
        barangay: barangay || "",
        status: "pending",
      })

      // NEW: Mark the email as used so it cannot be registered twice!
      await markEmailAsUsedDb(email);

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