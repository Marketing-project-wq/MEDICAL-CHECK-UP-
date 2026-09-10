import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function generateToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `MCU-${segment()}-${segment()}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "File tidak ditemukan." },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan PDF, JPG, atau PNG." },
        { status: 400 }
      )
    }

    // Validate file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File terlalu besar. Maksimal 10MB." },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const uploadToken = generateToken()

    // Build a unique file path
    const ext = file.name.split(".").pop() || "bin"
    const storagePath = `uploads/${uploadToken}.${ext}`

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("mcu-files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (storageError) {
      console.error("Storage upload error:", storageError)
      return NextResponse.json(
        { error: "Gagal mengupload file. Silakan coba lagi." },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("mcu-files")
      .getPublicUrl(storagePath)

    const fileUrl = urlData.publicUrl

    // Insert record into mcu_uploads
    const { error: dbError } = await supabase.from("mcu_uploads").insert({
      user_id: null,
      upload_token: uploadToken,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      status: "pending",
      is_claimed: false,
    })

    if (dbError) {
      console.error("Database insert error:", dbError)
      // Clean up the uploaded file
      await supabase.storage.from("mcu-files").remove([storagePath])
      return NextResponse.json(
        { error: "Gagal menyimpan data upload. Silakan coba lagi." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      token: uploadToken,
      fileUrl,
    })
  } catch (err) {
    console.error("Upload handler error:", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    )
  }
}
