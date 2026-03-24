import { NextResponse } from "next/server"
import { createUser, createApplication, isEmailPreApproved } from "@/lib/storage"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, email, password, address, contactNumber, age, barangay, schoolName, course, yearLevel } = body

    // Validate required fields
    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!isEmailPreApproved(email)) {
      return NextResponse.json(
        {
          error:
            "This email is not authorized to register. Please contact the administrator to get your email approved.",
        },
        { status: 403 },
      )
    }

    try {
      // Create user in in-memory storage
      const newUser = createUser({
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

      // Create application in in-memory storage
      createApplication({
        studentId: newUser.id,
        fullName: fullName,
        email: email,
        course: course || "",
        yearLevel: yearLevel || "",
        school: schoolName || "",
        barangay: barangay || "",
        status: "pending",
      })

      return NextResponse.json({ success: true, message: "Registration successful" }, { status: 201 })
    } catch (error: any) {
      return NextResponse.json({ error: error.message || "User creation failed" }, { status: 400 })
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 })
  }
}
