"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { checkAuth } from "@/lib/auth"

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

/* ── helpers ─────────────────────────────────────────────────── */
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

/* ── Google button ───────────────────────────────────────────── */
function GoogleButton({
  onClick,
  loading,
}: {
  onClick: () => void
  loading: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="relative w-full h-12 rounded-xl
                 bg-white/60 border border-black/10
                 flex items-center justify-center gap-3
                 hover:bg-white/80 hover:border-black/20
                 active:scale-[0.98] transition-all
                 disabled:opacity-50 disabled:cursor-not-allowed
                 overflow-hidden"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.72.13-1.42.34-2.1V7.06H2.18A10.98 10.98 0 0 0 1 12c0 1.77.43 3.44 1.18 4.94l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
      )}
      <span className="text-[14px] font-medium text-[#1a1a1a]">
        {loading ? "Connecting to Google…" : "Log in with Google"}
      </span>
    </button>
  )
}

/* ── load Google Identity Services SDK ───────────────────────── */
function loadGoogleIdClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("google-oauth2-sdk")) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.id = "google-oauth2-sdk"
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google SDK"))
    document.head.appendChild(script)
  })
}

/* ── main page ───────────────────────────────────────────────── */
export default function CustomerLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  /* Auto-redirect if customer already authenticated */
  useEffect(() => {
    const verify = async () => {
      try {
        const result = await checkAuth()
        if (result.authenticated && result.role === "customer") router.push("/customer")
      } catch {}
    }
    verify()
  }, [router])

  /* ── store customer session ───────────────────────────────── */
  const storeSession = (data: {
    username?: string
    email?: string
  }) => {
    if (data.username) localStorage.setItem("customer_name", data.username)
    if (data.email) localStorage.setItem("customer_email", data.email)
    router.push("/customer")
  }

  /* ── manual login → POST /api/bff/customer/login ───
     Response:
       success: { success: true, data: { id, username, email } }
       401:     { success: false, message: "Invalid credentials" }
       403:     { success: false, needs_password_setup: true,
                 setup_token, email, message }
  ─────────────────────────────────────────────────────────────── */
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setManualLoading(true)
    setError("")

    try {
      const res = await fetch("/api/bff/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        storeSession({
          username: data.data?.username,
          email: data.data?.email,
        })
        return
      }

      // 403 — needs password setup
      if (data.needs_password_setup) {
        localStorage.setItem("setup_token", data.setup_token || "")
        localStorage.setItem("setup_email", data.email || email)
        router.push("/customer/set-password")
        return
      }

      setError(data.message || "Invalid email or password. Please check and try again.")
    } catch {
      setError("A network error occurred. Please contact support if the issue persists.")
    } finally {
      setManualLoading(false)
    }
  }

  /* ── Google login ────────────────────────────────────────────
     Flow:
       1. Load Google Identity SDK
       2. Show sign-in popup → user authorize
       3. SDK returns { credential: id_token }
       4. POST /api/bff/customer/social-login { provider: "google", id_token }
       5. If account not registered → POST /api/bff/customer/social-register-auth
       6. BFF sets HttpOnly cookie; store non-sensitive name/email in localStorage
  ─────────────────────────────────────────────────────────────── */
  const handleGoogleLogin = useCallback(async () => {
    setGoogleLoading(true)
    setError("")

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      setError(
        "Google login is not configured. Please contact the admin to set up Google OAuth."
      )
      setGoogleLoading(false)
      return
    }

    try {
      await loadGoogleIdClient()

      const idToken = await new Promise<string | null>((resolve) => {
        ;(window as any).google.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_auth: false, // suppresses FedCM AbortError in console
          callback: (response: any) => {
            resolve(response?.credential ?? null)
          },
        })
        ;(window as any).google.accounts.id.prompt()
      })

      if (!idToken) {
        setGoogleLoading(false)
        return
      }

      // Step 1 — try social login
      const loginRes = await fetch("/api/bff/customer/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ provider: "google", id_token: idToken }),
      })
      const loginData = await loginRes.json()

      if (loginRes.ok && loginData.success) {
        storeSession({
          username: loginData.data?.username,
          email: loginData.data?.email,
        })
        return
      }

      // Step 2 — not registered yet → social register
      const regRes = await fetch(
        "/api/bff/customer/social-register-auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            provider: "google",
            id_token: idToken,
          }),
        }
      )
      const regData = await regRes.json()

      if (regRes.ok && regData.success) {
        storeSession({
          username: regData.data?.username,
          email: regData.data?.email,
        })
        return
      }

      setError(regData.message || "Google login failed. Please try again.")
    } catch {
      setError("Failed to process Google login. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }, [router])

  /* ── shared form input class ──────────────────────────────── */
  const inputCls = `
    h-12 bg-white/[0.06] border border-amber-200/25
    text-white text-[15px] placeholder:text-white/40
    rounded-xl outline-none
    focus:bg-white/[0.08] focus:border-amber-200/50 focus:ring-2 focus:ring-amber-200/20
    transition-colors disabled:opacity-50
  `

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
          {/* <motion.div
            className="flex flex-col items-center mb-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <motion.span
              className="block whitespace-nowrap text-[1.95rem] leading-none font-serif font-light tracking-[0.02em] text-[#1a1a1a]"
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.4, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            >
              THE LUXURY ASIA
            </motion.span>
            <motion.span
              className="mt-2 whitespace-nowrap text-[1.05rem] font-light tracking-[0.55em] text-[#1a1a1a]"
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.4, delay: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            >
              LIVING
            </motion.span>
          </motion.div> */}

          <motion.p
            className="text-sm leading-relaxed text-[#6b6b6b]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {/* Customer portal to track your points, activity, and rewards */}
          </motion.p>

          {/* <motion.p
            className="mt-14 text-xs text-[#a0a0a0]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
          >
            &copy; {new Date().getFullYear()} The Luxury Asia Living
          </motion.p> */}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════
          RIGHT — Form panel
      ════════════════════════════════════════════════════ */}
      <div
        className="flex-1 relative flex items-center justify-center p-5 sm:p-8 lg:p-12
                   bg-[url('/images/warm.png')] bg-cover bg-center"
      >
        <div className="relative z-10 w-full max-w-sm sm:max-w-[380px]">

          <motion.div
            className="lg:hidden flex flex-col items-center mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <motion.span
              className="whitespace-nowrap text-[1.4rem] leading-none font-serif font-light tracking-[0.02em] text-[#1a1a1a]"
              initial={{ opacity: 0, y: 6, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            >
              THE LUXURY ASIA
            </motion.span>
            <motion.span
              className="mt-1.5 whitespace-nowrap text-[0.85rem] font-light tracking-[0.5em] text-[#1a1a1a]"
              initial={{ opacity: 0, y: 6, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
            >
              LIVING
            </motion.span>
          </motion.div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <p className="text-sm text-white">
              Please log in to the customer portal to continue.
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          {/* ── Google login button ─────────────────────────── */}
          <div className="mb-6">
            <GoogleButton onClick={handleGoogleLogin} loading={googleLoading} />
          </div>

          {/* ── Divider ──────────────────────────────────────── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-black/[0.10]" />
            <span className="text-[11px] text-[#8a8a8a] uppercase tracking-widest font-medium">
              or
            </span>
            <div className="flex-1 h-px bg-black/[0.10]" />
          </div>

          {/* ── Manual form ─────────────────────────────────── */}
          <motion.form
            onSubmit={handleManualSubmit}
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-5"
          >

            {/* Email */}
            <motion.div
              className="space-y-1.5"
              variants={inputVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-white/85"
              >
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
                  disabled={manualLoading}
                  className={`${inputCls} pl-10`}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              className="space-y-1.5"
              variants={inputVariants}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <Label
                htmlFor="password"
                className="text-[13px] font-medium text-white/85"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={manualLoading}
                  className={`${inputCls} pl-10 pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={manualLoading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2
                             text-white/50 hover:text-white/90 transition-colors
                             disabled:opacity-40"
                >
                  <AnimatePresence mode="wait">
                    {showPassword ? (
                      <motion.span
                        key="eye-open"
                        initial={{ opacity: 0, scale: 0.4, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.4, rotate: 30 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Eye className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="eye-closed"
                        initial={{ opacity: 0, scale: 0.4, rotate: 30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 0.4, rotate: -30 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <EyeOff className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </motion.div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={manualLoading}
                className="w-full h-12 bg-gradient-to-r from-[#B5764A] via-[#C68A52] to-[#A85F38]
                           hover:from-[#C2824F] hover:via-[#D2965C] hover:to-[#B56A40]
                           text-white font-medium text-[15px] font-serif tracking-wide
                           rounded-xl shadow-lg shadow-black/30
                           active:scale-[0.98] transition-all
                           disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {manualLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </span>
                ) : (
                  "Log In"
                )}
              </Button>
            </div>

            {/* Register hint */}
            <p className="text-center text-xs text-white/60 leading-relaxed">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/customer/register")}
                className="text-white underline underline-offset-2 hover:text-amber-200/80 transition-colors font-medium"
              >
                Register now
              </button>
            </p>
            <p className="text-center text-xs text-white/60 leading-relaxed">
              <button
                type="button"
                onClick={() => router.push("/customer/forgot-password")}
                className="text-white/80 underline underline-offset-2 hover:text-amber-200/80 transition-colors font-medium"
              >
                Lupa password?
              </button>
            </p>
          </motion.form>
        </div>
      </div>
    </div>
  )
}
