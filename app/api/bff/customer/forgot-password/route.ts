import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json(
      { success: false, message: "Email wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_BASE_URL}/customers/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Gagal mengirim link reset password." },
        { status: res.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Link reset password telah dikirim ke email Anda.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan jaringan. Coba lagi." },
      { status: 500 },
    );
  }
}
