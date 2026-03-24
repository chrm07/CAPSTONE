"use client"

import { CheckCircle, Clock, XCircle } from "lucide-react"

interface ApplicationStatusProps {
  status: "unsubmitted" | "pending" | "approved" | "rejected"
}

export function ApplicationStatus({ status }: ApplicationStatusProps) {
  const steps = [
    { id: "submitted", label: "Submitted" },
    { id: "review", label: "Under Review" },
    { id: "decision", label: "Decision" },
  ]

  const getStepState = (stepId: string) => {
    // 🔥 THE FIX: If no documents are uploaded, all steps stay inactive (gray)
    if (status === "unsubmitted") return "inactive"

    if (stepId === "submitted") return "completed"

    if (stepId === "review") {
      if (status === "approved" || status === "rejected") return "completed"
      return "current" // This is for 'pending'
    }

    if (stepId === "decision") {
      if (status === "approved") return "completed"
      if (status === "rejected") return "rejected"
      return "inactive"
    }

    return "inactive"
  }

  return (
    <div className="relative flex items-center justify-between w-full px-2 py-4">
      {/* Background line */}
      <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>

      {steps.map((step) => {
        const state = getStepState(step.id)

        return (
          <div key={step.id} className="relative flex flex-col items-center z-10 bg-white px-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                state === "completed"
                  ? "border-green-500 bg-white"
                  : state === "rejected"
                  ? "border-red-500 bg-white"
                  : state === "current"
                  ? "border-amber-500 bg-white"
                  : "border-gray-200 bg-white"
              }`}
            >
              {state === "completed" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : state === "current" ? (
                <Clock className="h-5 w-5 text-amber-500" />
              ) : state === "rejected" ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <div className="h-2.5 w-2.5 rounded-full bg-gray-200" /> // Inactive gray dot
              )}
            </div>
            <span
              className={`mt-2 text-[11px] font-semibold ${
                state === "completed"
                  ? "text-green-600"
                  : state === "rejected"
                  ? "text-red-600"
                  : state === "current"
                  ? "text-amber-600"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}