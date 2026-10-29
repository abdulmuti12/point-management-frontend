"use client"

import { useEffect, useState } from "react"

function timeGreeting(hour: number) {
  if (hour < 12) return "Good Morning"
  if (hour < 18) return "Good Afternoon"
  if (hour < 22) return "Good Evening"
  return "Good Night"
}

export default function CustomerDashboardPage() {
  const [greeting, setGreeting] = useState<string>("Hello")
  const [name, setName] = useState("")

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(timeGreeting(h))
    setName(localStorage.getItem("customer_name") || localStorage.getItem("customer_email") || "")
  }, [])

  const firstName = name.split(" ")[0]

  return (
    <div className="max-w-3xl">
      <div className="text-4xl mb-4">👋</div>
      <h2 className="text-2xl font-bold mb-2 text-white">
        {greeting}
        {firstName ? `, ${firstName}` : ""}!
      </h2>
      <p className="text-slate-400 text-sm">
        Please select a menu from the sidebar to manage your account, orders, rewards,
        and addresses.
      </p>
    </div>
  )
}
