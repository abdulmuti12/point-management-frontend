"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const t = params.get("token") || ""
    const e = params.get("email") || ""
    setToken(t)
    setEmail(e)
    if (!t || !e) {
      setError("Link reset tidak lengkap. Silakan minta link reset ulang dari halaman forgot password.")
    } else {
      setReady(true)
    }
  }, [])

  const inputCls = `
    h-12 bg-white/[0.04] border border-white/10
    text-white text-[15px] placeholder:text-slate-600
    rounded-xl outline-none
    focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
    transition-colors disabled:opacity-50
  `

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/bff/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: confirmPassword,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        router.push("/customer/login")
      } else {
        setError(data.message || "Gagal reset password. Link mungkin sudah kadaluarsa, silakan minta link reset ulang.")
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.")
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-xl font-bold text-white mb-1">Reset Password</h1>
        <p className="text-sm text-slate-500 mb-6">
          Buat password baru untuk akun <span className="text-slate-300">{email}</span>.
        </p>

        {error && !ready && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[13px] mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && ready && (
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
                value={email}
                disabled
                className={`${inputCls} pl-10 opacity-60`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new_password" className="text-[13px] font-medium text-slate-400">
              Password Baru
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="new_password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`${inputCls} pl-10 pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password" className="text-[13px] font-medium text-slate-400">
              Konfirmasi Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                id="confirm_password"
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!ready || loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[15px] rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </span>
            ) : (
              "Simpan Password Baru"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
