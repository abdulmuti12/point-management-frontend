"use client"

import { useEffect, useState } from "react"
import { User, Mail, Phone, ShieldCheck, Shield, Crown, Info } from "lucide-react"
import { customerFetch } from "@/lib/auth"

const STORAGE_BASE_URL = "/api/bff/storage/"

function resolveImageUrl(url: string | null | undefined) {
  if (!url) return ""
  const m = url.match(/\/storage\/(.+)$/)
  if (m) return `${STORAGE_BASE_URL}${m[1]}`
  return url
}

function formatExpiry(dateStr: string | null | undefined) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

type MeData = {
  name: string
  full_name: string
  email: string
  phone_number: string
  avatar: string | null
  provider: string
  email_verified_at: string | null
  status: string
}

type MemberLevelData = {
  current_level: {
    id: number
    name: string
    image_url: string | null
    min_points: number | null
    max_points: number | null
  } | null
  current_points: number
  points_expiry_date: string | null
}

export default function CustomerAccountPage() {
  const [customer, setCustomer] = useState<MeData>({
    name: "",
    full_name: "",
    email: "",
    phone_number: "",
    avatar: null,
    provider: "",
    email_verified_at: null,
    status: "",
  })
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState<MemberLevelData | null>(null)

  useEffect(() => {
    customerFetch("member-level").then(({ ok, data }) => {
      if (ok) setLevel((data.data || data) as MemberLevelData)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const fallback = (): MeData => ({
      name: localStorage.getItem("customer_name") || "",
      full_name: "",
      email: localStorage.getItem("customer_email") || "",
      phone_number: "",
      avatar: null,
      provider: "",
      email_verified_at: null,
      status: "",
    })

    const fetchMe = async () => {
      try {
        const { ok, data } = await customerFetch("me")
        if (ok) {
          const me = data.data || data
          setCustomer({
            name: me.name || localStorage.getItem("customer_name") || "",
            full_name: me.full_name || "",
            email: me.email || localStorage.getItem("customer_email") || "",
            phone_number: me.phone_number || "",
            avatar: me.avatar || null,
            provider: me.provider || "",
            email_verified_at: me.email_verified_at || null,
            status: me.status || "",
          })
        } else {
          setCustomer(fallback())
        }
      } catch {
        setCustomer(fallback())
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-amber-600 animate-spin" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  const activeLevel = level?.current_level || null
  const points = level?.current_points ?? 0
  const expiryDate = level?.points_expiry_date || null

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* ── Member Level Image ─────────────────────────────────────────────── */}
      {activeLevel && (
        <div className="space-y-4">
          <div className="relative w-full rounded-xl overflow-hidden bg-slate-100">
            <div className="w-full aspect-[16/9] flex items-center justify-center">
              {activeLevel.image_url ? (
                <img
                  src={resolveImageUrl(activeLevel.image_url)}
                  alt={activeLevel.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <Crown className="w-12 h-12 text-amber-400/50" />
                </div>
              )}
            </div>
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5
                            bg-slate-900/70 backdrop-blur text-amber-300 text-[10px] uppercase tracking-widest
                            px-2.5 py-1 rounded-full font-semibold">
              <Crown className="w-3 h-3" />
              {activeLevel.name}
            </div>
          </div>

          <div className="flex items-stretch gap-4">
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Points</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{points} pts</p>
            </div>
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Points Expiry</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{formatExpiry(expiryDate)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Account Info ────────────────────────��──────────────────────────── */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-600/[0.08] border border-amber-600/[0.15]
                          flex items-center justify-center text-amber-700 font-bold text-base shrink-0">
            {customer.name
              ? customer.name.trim().charAt(0).toUpperCase() +
                (customer.name.trim().split(/\s+/).slice(1).join("").charAt(0).toUpperCase()
                  || customer.name.trim().charAt(1).toUpperCase())
              : "?"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-slate-900 font-semibold truncate max-w-[200px]">
                {customer.name || "—"}
              </p>
              {activeLevel && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5
                                 rounded-full bg-amber-600/10 text-amber-700 border border-amber-600/20">
                  <Crown className="w-3 h-3" /> {activeLevel.name}
                </span>
              )}
              {customer.status && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  {customer.status}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm truncate max-w-[240px]">{customer.email}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <InfoRow icon={<User className="w-4 h-4 shrink-0" />} label="Full Name">
            {customer.full_name || customer.name || "Name not available"}
          </InfoRow>
          <InfoRow icon={<Mail className="w-4 h-4 shrink-0" />} label="Email">
            {customer.email || "Email not available"}
          </InfoRow>
          <InfoRow icon={<Phone className="w-4 h-4 shrink-0" />} label="Phone Number">
            {customer.phone_number || "—"}
          </InfoRow>
          <InfoRow icon={<Shield className="w-4 h-4 shrink-0" />} label="Source">
            {customer.provider
              ? customer.provider.charAt(0).toUpperCase() + customer.provider.slice(1)
              : "—"}
          </InfoRow>
          <InfoRow
            icon={
              customer.email_verified_at ? (
                <ShieldCheck className="w-4 h-4 shrink-0" />
              ) : (
                <Shield className="w-4 h-4 shrink-0" />
              )
            }
            label="Email Verification"
          >
            {customer.email_verified_at ? (
              <span className="text-emerald-600 font-medium">Verified</span>
            ) : (
              <span className="text-slate-500">Not verified</span>
            )}
          </InfoRow>
        </div>
      </div>

      {/* ── More Info ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm">
        <Info className="w-4 h-4 text-slate-400" />
        <span className="text-slate-500 underline decoration-slate-300 underline-offset-2 cursor-pointer hover:text-slate-700">
          More Info
        </span>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-amber-600/[0.06] flex items-center justify-center text-amber-700 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm text-slate-800 truncate">{children}</p>
      </div>
    </div>
  )
}
