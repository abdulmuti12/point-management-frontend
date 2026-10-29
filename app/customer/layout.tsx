"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { CustomerDashboardLayout } from "./components/customer-dashboard-layout"
import { checkAuth } from "@/lib/auth"

const DASHBOARD_PREFIXES = [
  "/customer/account",
  "/customer/orders",
  "/customer/reward",
  "/customer/address",
]

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // After hydration, check auth on dashboard routes.
  useEffect(() => {
    if (!mounted) return
    const isDashboard = pathname === "/customer" || DASHBOARD_PREFIXES.some((x) => pathname.startsWith(x))
    if (!isDashboard) return
    let active = true
    checkAuth().then((result) => {
      if (!active) return
      if (!result.authenticated) {
        const token = localStorage.getItem("customer_token")
        const neededPasswordSet = token?.includes('"set_password"') || false
        router.replace(neededPasswordSet ? "/customer/set-password" : "/customer/login")
      }
    })
    return () => { active = false }
  }, [pathname, router, mounted])

  // Dashboard routes get the persistent layout; public routes are pass-through.
  const isDashboard = pathname === "/customer" || DASHBOARD_PREFIXES.some((x) => pathname.startsWith(x))

  return (
    <Suspense fallback={<div className="flex-1" />}>
      {mounted && isDashboard ? (
        <CustomerDashboardLayout>{children}</CustomerDashboardLayout>
      ) : (
        <>{children}</>
      )}
    </Suspense>
  )
}
