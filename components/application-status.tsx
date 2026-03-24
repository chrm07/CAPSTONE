import { CheckCircle, Clock, XCircle } from "lucide-react"

interface ApplicationStatusProps {
  status: string
}

export function ApplicationStatus({ status }: ApplicationStatusProps) {
  const steps = [
    { id: 1, name: "Submitted", status: "complete" },
    {
      id: 2,
      name: "Under Review",
      status:
        status === "pending" ? "current" : status === "approved" || status === "rejected" ? "complete" : "upcoming",
    },
    { id: 3, name: "Decision", status: status === "approved" || status === "rejected" ? "complete" : "upcoming" },
  ]

  return (
    <div className="mt-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="h-0.5 w-full bg-gray-200"></div>
        </div>
        <ul className="relative flex w-full justify-between">
          {steps.map((step) => (
            <li key={step.id} className="flex items-center justify-center">
              {step.status === "complete" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-md">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              ) : step.status === "current" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-md animate-pulse-slow">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              ) : step.status === "upcoming" ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-md">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <ul className="mt-2 grid grid-cols-3 text-sm">
        {steps.map((step) => (
          <li key={step.id} className="text-center">
            <span
              className={`${
                step.status === "complete"
                  ? "text-green-600 font-medium"
                  : step.status === "current"
                    ? "text-amber-600 font-medium"
                    : step.status === "upcoming"
                      ? "text-gray-500"
                      : "text-red-600 font-medium"
              }`}
            >
              {step.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
