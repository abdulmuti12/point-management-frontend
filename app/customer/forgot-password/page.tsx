"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const inputCls = `
    h-12 bg-white/[0.04] border border-white/10
    text-white text-[15px] placeholder:text-slate-600
    rounded-xl outline-none
    focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
    transition-colors disabled:opacity-50
  `

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/bff/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSent(true)
      } else {
        setError(data.message || "Gagal mengirim link reset password.")
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-[100dvh] bg-[#0B1120] flex items-center justify-center p-5">
        <div className="w-full max-w-[380px]">
          <div className="flex flex-col items-center text-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500/80 mb-3" />
            <h1 className="text-lg font-bold text-white mb-1">Periksa Email Anda</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              Kami telah mengirim link reset password ke{" "}
              <span className="text-slate-300">{email}</span>.
              Silakan cek inbox (dan folder spam) Anda.
            </p>
          </div>
          <Button
            onClick={() => router.push("/customer/login")}
            className="w-full h-11 text-white text-[14px] font-medium rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Kembali ke Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#0B1120] flex items-center justify-center p-5">
      <div className="w-full max-w-[380px]">
        <button
          onClick={() => router.push("/customer/login")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Login
        </button>
        <h1 className="text-xl font-bold text-white mb-1">Lupa Password</h1>
        <p className="text-sm text-slate-500 mb-6">
          Masukkan email terdaftar Anda. Link reset password akan dikirim ke email tersebut.
        </p>
        <form onSubmit={handleRequest} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] font-medium text-slate-400">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="email"
                type="email"
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[15px] rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Mengirim…
              </span>
            ) : (
              "Kirim Link Reset"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
