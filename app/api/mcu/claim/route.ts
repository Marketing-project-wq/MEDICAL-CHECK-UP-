import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userId } = body as { token?: string; userId?: string }

    if (!token || !userId) {
      return NextResponse.json(
        { error: "Token dan userId wajib diisi." },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Check that the token exists and has not been claimed
    const { data: upload, error: fetchError } = await supabase
      .from("mcu_uploads")
      .select("id, is_claimed")
      .eq("upload_token", token)
      .single()

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: "Token tidak ditemukan." },
        { status: 404 }
      )
    }

    if (upload.is_claimed) {
      return NextResponse.json(
        { error: "Token sudah diklaim." },
        { status: 409 }
      )
    }

    // Claim the upload
    const { data: updated, error: updateError } = await supabase
      .from("mcu_uploads")
      .update({
        user_id: userId,
        is_claimed: true,
        claimed_at: new Date().toISOString(),
      })
      .eq("id", upload.id)
      .eq("is_claimed", false)
      .select()
      .single()

    if (updateError || !updated) {
      console.error("Claim update error:", updateError)
      return NextResponse.json(
        { error: "Gagal mengklaim token. Silakan coba lagi." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, upload: updated })
  } catch (err) {
    console.error("Claim handler error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    )
  }
}
