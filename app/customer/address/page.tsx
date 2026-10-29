"use client"

import { useEffect, useState } from "react"
import {
  MapPin,
  Plus,
  X,
  Pencil,
  Trash2,
  Loader2,
  Copy,
  Truck,
  CreditCard,
} from "lucide-react"
import { customerFetch } from "@/lib/auth"

type AddressText = {
  id: string
  address: string
  note?: string | null
  status: "active" | "inactive"
}

/* ── Toggle switch ────────────────────────────────────────────── */
function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={label}
      className="relative shrink-0"
      style={{ width: "40px", height: "22px" }}
    >
      <div
        className={`absolute inset-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-amber-600" : "bg-slate-300"
        }`}
      />
      <div
        className="absolute rounded-full bg-white shadow-sm"
        style={{
          width: "18px",
          height: "18px",
          top: "2px",
          left: "2px",
          transform: checked ? "translateX(18px)" : "translateX(0)",
          transition: "transform 0.2s ease",
        }}
      />
    </button>
  )
}

export default function CustomerAddressPage() {
  const [addresses, setAddresses] = useState<AddressText[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ address: "", note: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function fetchAddresses() {
    setLoading(true)
    try {
      const { ok, data } = await customerFetch("get-address-texts")
      if (!ok) throw new Error()
      setAddresses(data.data || [])
    } catch {
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.address.trim()) return
    setSubmitting(true)
    try {
      if (editingId) {
        await customerFetch("update-address-text", {
          method: "POST",
          body: JSON.stringify({ id: editingId, ...form }),
        })
      } else {
        await customerFetch("create-address-text", {
          method: "POST",
          body: JSON.stringify(form),
        })
      }
      setForm({ address: "", note: "" })
      setEditingId(null)
      setShowForm(false)
      await fetchAddresses()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(id: string) {
    const current = addresses.find((a) => a.id === id)
    if (!current) return

    const nextActive = current.status === "inactive"

    // Optimistic update: flip this one; deactivate others locally if activating
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        status: a.id === id
          ? (nextActive ? "active" : "inactive")
          : nextActive ? "inactive" : a.status,
      }))
    )

    try {
      // Single request — backend should handle mutual exclusion;
      // sending parallel deactivate calls triggers 429 rate limit.
      const { ok, data } = await customerFetch("toggle-address-text-status", {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      if (!ok && data.status !== 429) {
        throw new Error("toggle failed")
      }
      // Refresh from server to get authoritative state
      await fetchAddresses()
    } catch {
      // rollback
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          status: a.id === id
            ? (nextActive ? "inactive" : "active")
            : nextActive ? "active" : a.status,
        }))
      )
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this address?")) return
    try {
      await customerFetch("delete-address-text", {
        method: "POST",
        body: JSON.stringify({ id }),
      })
      await fetchAddresses()
    } catch {}
  }

  async function handleDuplicate(addr: AddressText) {
    try {
      await customerFetch("create-address-text", {
        method: "POST",
        body: JSON.stringify({ address: addr.address, note: addr.note || "" }),
      })
      await fetchAddresses()
    } catch {}
  }

  function openEdit(addr: AddressText) {
    setForm({ address: addr.address, note: addr.note || "" })
    setEditingId(addr.id)
    setShowForm(true)
  }

  /* ── Label helpers ─────────────────────────────────────────── */
  function addrLabel(addr: AddressText) {
    return addr.note?.trim() || "Address"
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Addresses</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your shipping addresses.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ address: "", note: "" }) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-800 hover:bg-amber-700
                     text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {/* ── Form ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-xl bg-white border border-amber-800/15 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              {editingId ? "Edit Address" : "New Address"}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">
                Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
                rows={3}
                placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                className="w-full rounded-lg bg-slate-50 border border-amber-800/10 px-3 py-2.5
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:border-amber-600/50 resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">
                Note <span className="normal-case text-slate-400">(optional)</span>
              </label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="e.g. Rumah, Kantor, Kos"
                className="w-full rounded-lg bg-slate-50 border border-amber-800/10 px-3 py-2.5
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:border-amber-600/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !form.address.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-amber-800 hover:bg-amber-700
                           disabled:opacity-40 px-4 py-2 text-xs font-medium text-white
                           transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {editingId ? "Save" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-500
                           hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Address list ───────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-xl bg-white border border-amber-800/10 p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl bg-white border border-amber-800/10 p-8 text-center">
          <MapPin className="w-10 h-10 mx-auto text-amber-600/40 mb-3" />
          <p className="text-slate-600 text-sm font-medium">Belum ada alamat tersimpan.</p>
          <p className="text-slate-400 text-xs mt-1">
            Tambahkan alamat untuk memudahkan transaksi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => {
            const label = addrLabel(addr)
            const isActive = addr.status === "active"

            return (
              <div
                key={addr.id}
                className={`rounded-xl border transition-colors ${
                  isActive
                    ? "bg-white border-amber-600/25"
                    : "bg-white border-amber-800/10"
                }`}
              >
                {/* Row */}
                <div className="flex items-stretch">
                  {/* ── Left: icon + address ───────────────────── */}
                  <div className="flex items-center gap-3.5 px-5 py-4 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                  ${isActive
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-400"}`}
                    >
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                        {isActive && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
                                           bg-amber-100 text-amber-700 border border-amber-200">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-3">
                        {addr.address}
                      </p>
                    </div>
                  </div>

                  {/* ── Divider ────────────────────────────────── */}
                  <div className="w-px bg-amber-800/10 self-stretch my-4" />

                  {/* ── Middle: toggles ────────────────────────── */}
                  <div className="flex flex-col justify-center gap-2.5 px-5 py-4 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        Default Shipping
                      </span>
                      <Toggle
                        checked={isActive}
                        onChange={() => handleToggle(addr.id)}
                        label="Toggle default shipping"
                      />
                    </div>
                  </div>

                  {/* ── Divider ────────────────────────────────── */}
                  <div className="w-px bg-amber-800/10 self-stretch my-4" />

                  {/* ── Right: actions ─────────────────────────── */}
                  <div className="flex flex-col justify-center gap-1 px-5 py-4 shrink-0">
                    <button
                      onClick={() => openEdit(addr)}
                      className="flex items-center gap-2 text-[13px] text-slate-600
                                 hover:text-slate-900 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(addr)}
                      className="flex items-center gap-2 text-[13px] text-slate-600
                                 hover:text-slate-900 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="flex items-center gap-2 text-[13px] text-red-400
                                 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
