"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LogIn, Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi.").email("Email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  uploadToken: z.string().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" /></div>}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      uploadToken: "",
    },
  })

  // Auto-fill token from localStorage on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem("mcu_upload_token")
      if (token) {
        setValue("uploadToken", token)
      }
    } catch {
      // localStorage may not be available
    }
  }, [setValue])

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true)
    setServerError("")

    try {
      const supabase = createClient()

      // 1. Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        setServerError(
          error.message === "Invalid login credentials"
            ? "Email atau password salah."
            : error.message
        )
        setIsSubmitting(false)
        return
      }

      // 2. If token present, claim the upload
      if (values.uploadToken && data.user) {
        try {
          await fetch("/api/mcu/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: values.uploadToken,
              userId: data.user.id,
            }),
          })
        } catch {
          // Non-blocking -- user can claim later
        }
      }

      // 3. Clear localStorage token
      try {
        localStorage.removeItem("mcu_upload_token")
      } catch {
        // ignore
      }

      // 4. Redirect to the intended destination or dashboard
      const redirectTo = searchParams.get("redirect") || "/dashboard"
      router.push(redirectTo)
      router.refresh()
    } catch {
      setServerError("Terjadi kesalahan. Silakan coba lagi.")
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Masuk ke Akun</CardTitle>
          <CardDescription>
            Masuk untuk melihat hasil medical check-up Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="#"
                  className="text-xs text-[#FF6B35] hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Upload Token (optional) */}
            <div className="space-y-2">
              <Label htmlFor="uploadToken">
                Token Upload MCU{" "}
                <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                id="uploadToken"
                placeholder="MCU-XXXX-XXXX"
                {...register("uploadToken")}
              />
              <p className="text-xs text-muted-foreground">
                Masukkan token jika Anda telah mengupload file MCU sebelumnya.
              </p>
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Memproses..." : "Masuk"}
            </Button>

            {/* Register link */}
            <p className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/mcu/register"
                className="font-medium text-[#FF6B35] hover:underline"
              >
                Daftar
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
