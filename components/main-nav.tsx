"use client"
import { usePathname } from "next/navigation"

export function MainNav() {
  const pathname = usePathname()

  return <div className="mr-4 flex">{/* Brand and navigation items removed */}</div>
}
