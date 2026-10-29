import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  const { token, email, password, password_confirmation } = await req.json();

  if (!token || !email || !password) {
    return NextResponse.json(
      { success: false, message: "Token, email, dan password wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(`${API_BASE_URL}/customers/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        email,
        password,
        password_confirmation: password_confirmation || password,
      }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Gagal reset password." },
        { status: res.status },
      );
    }

    return NextResponse.json({
      success: true,
      message: data.message || "Password berhasil direset. Silakan login.",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan jaringan. Coba lagi." },
      { status: 500 },
    );
  }
}
