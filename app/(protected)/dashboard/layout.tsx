import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/layout/navbar"
import { Sidebar, MobileSidebarNav } from "@/components/layout/sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Fetch user profile for the navbar
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", session.user.id)
    .single()

  const navUser = profile
    ? {
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
      }
    : {
        full_name: session.user.email?.split("@")[0] ?? "User",
        email: session.user.email ?? "",
        avatar_url: null,
      }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar user={navUser} />

      <div className="flex">
        <Sidebar />

        <div className="flex-1">
          <MobileSidebarNav />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
