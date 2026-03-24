"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { ApplicationsTable } from "@/components/applications-table"
import { FileText } from "lucide-react"
import { PermissionGuard } from "@/components/permission-guard"

export default function ApplicationsPage() {
  return (
    <PermissionGuard permission="applications">
      <AdminLayout>
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Applications</h1>
              <p className="text-slate-600">Manage and review scholarship applications</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">All Applications</CardTitle>
            <CardDescription className="text-slate-600">Review and process scholarship applications</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationsTable />
          </CardContent>
        </Card>
      </AdminLayout>
    </PermissionGuard>
  )
}
