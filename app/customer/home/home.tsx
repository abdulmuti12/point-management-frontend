"use client"

import { useState, useEffect } from "react"
import {
  Loader2,
  Sparkles,
  Crown,
  ArrowRight,
  Clock,
  CheckCircle2,
  X,
  Gift,
  Coins,
  User,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { customerFetch } from "@/lib/auth"
import {
  RewardHeroCard,
  type Gift as GiftType,
  type MemberLevelData,
} from "../reward/panel"

interface UserData {
  id: number
  name: string
  full_name: string
  email: string
  phone_number: string | null
  avatar: string | null
}

interface ClaimsPreview {
  total_points: number
  claims: Array<{
    id: string
    gift_name: string | null
    gift_image: string | null
    status: "waiting" | "approved" | "rejected" | "completed"
    required_point: number
  }>
}

const CLAIM_FILTER_LABELS: Record<string, string> = {
  waiting: "Waiting",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
}

export function CustomerHome() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [memberLevel, setMemberLevel] = useState<MemberLevelData | null>(null)
  const [gifts, setGifts] = useState<GiftType[]>([])
  const [activePoints, setActivePoints] = useState(0)
  const [claims, setClaims] = useState<ClaimsPreview["claims"]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: userData }, { data: levelData }, { data: giftsData }, { data: claimsData }] =
          await Promise.all([
            customerFetch("me"),
            customerFetch("member-level"),
            customerFetch("gifts"),
            customerFetch("gifts/claims"),
          ])

        if (userData.success && userData.data) setUser(userData.data as UserData)
        if (levelData.success && levelData.data) setMemberLevel(levelData.data as MemberLevelData)
        if (giftsData.success && giftsData.data) {
          const gd = giftsData.data as { gifts: GiftType[]; total_points: number }
          setGifts(gd.gifts)
          setActivePoints(gd.total_points)
        }
        if (claimsData.success && claimsData.data) {
          setClaims((claimsData.data as ClaimsPreview).claims || [])
        }
      } catch (err) {
        console.error("Home load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const featured = gifts.filter((g) => g.is_featured).slice(0, 2)
  const claimsPreview = claims.slice(0, 3)
  const currentLevel = memberLevel?.current_level?.name ?? null
  const progress = memberLevel?.progress

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          {user?.full_name || user?.name || "Customer"}
        </h1>
        <p className="text-slate-500 text-sm">Welcome back. Here&apos;s your loyalty overview.</p>
      </div>

      {/* Welcome / summary cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Member level card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Member Level
              </span>
              {currentLevel && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                  <Crown className="w-3.5 h-3.5" />
                  {currentLevel}
                </span>
              )}
            </div>
            {progress ? (
              <>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Progress to {memberLevel?.next_level?.name ?? "Next Level"}</span>
                    <span className="font-medium text-amber-600">{progress.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No level data yet.</p>
            )}
          </div>

          {/* Points card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                <Coins className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Active Points
              </span>
            </div>
            <p className="text-2xl font-semibold text-slate-900">
              {activePoints.toLocaleString("id-ID")}
              <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
            </p>
            {memberLevel && (
              <p className="text-[11px] text-slate-400 mt-1">
                Total earned: {memberLevel.total_points.toLocaleString("id-ID")} pts
              </p>
            )}
          </div>

          {/* CTA card */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 flex flex-col gap-2 text-white">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-100" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-100">
                Reward Catalog
              </span>
            </div>
            <p className="text-sm text-amber-50/90 leading-relaxed">
              Browse all {gifts.length} rewards and redeem with your points.
            </p>
            <Link
              href="/customer/reward"
              className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-white hover:text-amber-100 transition-colors"
            >
              Go to Reward Page
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Featured rewards preview */}
      {!loading && featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-slate-900">Featured Rewards</h2>
            </div>
            <Link
              href="/customer/reward"
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600 hover:text-amber-500 transition-colors"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((gift) => (
              <RewardHeroCard
                key={gift.id}
                gift={gift}
                activePoints={activePoints}
                isClaiming={false}
                onOpen={() => router.push("/customer/reward")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent claims */}
      {!loading && claimsPreview.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">Recent Claims</h2>
            </div>
            <Link
              href="/customer/reward"
              className="text-xs text-slate-500 hover:text-amber-600 transition-colors"
            >
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {claimsPreview.map((claim) => {
              const meta = {
                waiting: { label: "Waiting", color: "text-blue-600 bg-blue-50 border-blue-200" },
                approved: { label: "Approved", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                completed: { label: "Completed", color: "text-slate-600 bg-slate-100 border-slate-200" },
                rejected: { label: "Rejected", color: "text-red-600 bg-red-50 border-red-200" },
              }[claim.status] ?? { label: "Waiting", color: "text-blue-600 bg-blue-50 border-blue-200" }

              return (
                <div
                  key={claim.id}
                  className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {claim.gift_image ? (
                      <img
                        src={`/api/bff/storage/${claim.gift_image.replace(/^\/storage\//, "").replace(/^http[^/]*\/storage\//, "")}`}
                        alt={claim.gift_name || ""}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    ) : (
                      <Gift className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {claim.gift_name || "Reward"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {claim.required_point.toLocaleString("id-ID")} pts
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider border ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
