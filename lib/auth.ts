import { createClient as createServerSupabaseClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function getSession() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("Error getting session:", error.message)
    return null
  }

  return session
}

export async function getUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error("Error getting user:", error.message)
    return null
  }

  return user
}

export async function signUp(
  email: string,
  password: string,
  metadata?: { full_name?: string; phone?: string }
) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signOut()

  return { error }
}

function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function claimUpload(userId: string, token: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("mcu_uploads")
    .update({
      user_id: userId,
      is_claimed: true,
      claimed_at: new Date().toISOString(),
    })
    .eq("upload_token", token)
    .eq("is_claimed", false)
    .select()
    .single()

  return { data, error }
}
