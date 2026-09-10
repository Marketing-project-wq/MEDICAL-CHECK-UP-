import { createServerClient, createServiceClient } from "@/lib/supabase"

/**
 * Get the current session from the server.
 * Returns null if the user is not authenticated.
 */
export async function getSession() {
  const supabase = await createServerClient()
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

/**
 * Get the current user from the server.
 * Uses getUser() which validates the JWT against the auth server.
 * Returns null if the user is not authenticated.
 */
export async function getUser() {
  const supabase = await createServerClient()
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

/**
 * Sign up a new user with email and password.
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: { full_name?: string; phone?: string }
) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  return { data, error }
}

/**
 * Sign in a user with email and password.
 */
export async function signIn(email: string, password: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.signOut()

  return { error }
}

/**
 * Claim an MCU upload by token, setting user_id and is_claimed.
 * Uses the service client to bypass RLS (the upload may not
 * have a user_id yet, so the user's RLS policy wouldn't match).
 */
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
