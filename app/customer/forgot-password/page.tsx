"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"

/* ── Motion variants ─────────────────────────────────────────── */
const formVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
}

const inputVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

/* ── Error banner ───���─────────────────────────────────────────── */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-5 flex items-start gap-3 p-3 rounded-lg
                 bg-red-500/10 border border-red-500/20"
      role="alert"
    >
      <svg
        className="w-4 h-4 text-red-400 shrink-0 mt-px"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
      <p className="text-[13px] text-red-400 leading-relaxed">{message}</p>
    </div>
  )
}

/* ── Success view ─────────────────────────────────────────────── */
function SuccessView({
  email,
  onBack,
}: {
  email: string
  onBack: () => void
}) {
  return (
    <motion.div
      className="w-full max-w-sm sm:max-w-[380px] flex flex-col items-center text-center"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30
                        flex items-center justify-center mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-1.5">Periksa Email Anda</h1>
        <p className="text-sm text-white/50 leading-relaxed max-w-xs">
          Kami telah mengirim link reset password ke{" "}
          <span className="text-white font-medium">{email}</span>.
          <br />
          Silakan cek inbox (dan folder spam) Anda.
        </p>
      </div>
      <button
        onClick={onBack}
        className="w-full h-11 rounded-xl
                   bg-white/[0.06] border border-white/10
                   text-white/70 text-[14px] font-medium
                   hover:bg-white/[0.10] hover:text-white
                   transition-all active:scale-[0.98]"
      >
         Back to Login
      </button>
    </motion.div>
  )
}

/* ── main page ───────────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const inputCls = `
    h-12 bg-white/[0.06] border border-amber-200/25
    text-white text-[15px] placeholder:text-white/40
    rounded-xl outline-none
    focus:bg-white/[0.08] focus:border-amber-200/50 focus:ring-2 focus:ring-amber-200/20
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

  return (
    <div className="min-h-[100dvh] bg-[#0B1120] text-white flex flex-col lg:flex-row">

      {/* ════════════════════════════════════════════════════
          LEFT — Branding panel  (hidden on mobile)
      ════════════════════════════════════════════════════ */}
      <div
        className="relative hidden lg:flex flex-col items-center justify-center
                   w-[44%] shrink-0
                   bg-[url('/images/bg.png')] bg-cover bg-center
                   border-r border-black/[0.06] overflow-hidden
                   p-16"
      >
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <motion.p
            className="text-sm leading-relaxed text-[#6b6b6b]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════���
          RIGHT — Form panel
      ════════════════════════════════════════════════════ */}
      <div
        className="flex-1 relative flex items-center justify-center p-5 sm:p-8 lg:p-12
                   bg-[url('/images/warm.png')] bg-cover bg-center"
      >
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="success" exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.3 }}>
              <SuccessView email={email} onBack={() => router.push("/customer/login")} />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="w-full max-w-sm sm:max-w-[380px]"
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back to login */}
              <button
                onClick={() => router.push("/customer/login")}
                className="relative z-10 flex items-center gap-2 text-[13px] text-white/60 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Login
              </button>

              {/* Desktop heading */}
              <div className="hidden lg:block mb-10">
                <p className="text-sm text-white/60">
                Forgot your password? Enter your email and we will send you a reset link.
                  {/* Lupa password? Masukkan email Anda dan kami akan mengirim link reset. */}
                </p>
              </div>

              {error && <ErrorBanner message={error} />}

              {/* Form */}
              <motion.form
                onSubmit={handleRequest}
                variants={formVariants}
                initial="hidden"
                animate="visible"
                className="space-y-5"
              >
                <motion.div
                  className="space-y-1.5"
                  variants={inputVariants}
                  custom={0}
                  initial="hidden"
                  animate="visible"
                >
                  <Label htmlFor="email" className="text-[13px] font-medium text-white/85">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
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
                </motion.div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-[#B5764A] via-[#C68A52] to-[#A85F38]
                               hover:from-[#C2824F] hover:via-[#D2965C] hover:to-[#B56A40]
                               text-white font-medium text-[15px] font-serif tracking-wide
                               rounded-xl shadow-lg shadow-black/30
                               active:scale-[0.98] transition-all
                               disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengirim…
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
