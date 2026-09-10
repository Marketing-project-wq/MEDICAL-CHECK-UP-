"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UserPlus, Loader2 } from "lucide-react"

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Nama lengkap minimal 2 karakter."),
    email: z.string().email("Email tidak valid."),
    password: z.string().min(6, "Password minimal 6 karakter."),
    confirmPassword: z.string(),
    dateOfBirth: z.string().min(1, "Tanggal lahir wajib diisi."),
    gender: z.enum(["male", "female"], {
      required_error: "Jenis kelamin wajib dipilih.",
    }),
    phone: z
      .string()
      .min(8, "Nomor telepon minimal 8 digit.")
      .regex(/^[0-9+\-\s]+$/, "Nomor telepon tidak valid."),
    uploadToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      gender: undefined,
      phone: "",
      uploadToken: "",
    },
  })

  // Auto-fill token from localStorage
  useEffect(() => {
    try {
      const token = localStorage.getItem("mcu_upload_token")
      if (token) {
        setValue("uploadToken", token)
      }
    } catch {
      // ignore
    }
  }, [setValue])

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true)
    setServerError("")

    try {
      const supabase = createClient()

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            phone: values.phone,
          },
        },
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          setServerError("Email sudah terdaftar. Silakan login.")
        } else {
          setServerError(authError.message)
        }
        setIsSubmitting(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        setServerError("Gagal membuat akun. Silakan coba lagi.")
        setIsSubmitting(false)
        return
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        date_of_birth: values.dateOfBirth,
        gender: values.gender,
      })

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Continue -- auth user exists, profile can be created later
      }

      // Claim token if provided
      if (values.uploadToken) {
        try {
          await fetch("/api/mcu/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: values.uploadToken,
              userId,
            }),
          })
          localStorage.removeItem("mcu_upload_token")
        } catch {
          // Non-blocking
        }
      }

      // Redirect
      router.push("/dashboard")
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
          <CardTitle className="text-2xl">
            Daftar Akun <span className="text-[#FF6B35]">MCU</span>
          </CardTitle>
          <CardDescription>
            Buat akun untuk menyimpan dan melihat hasil medical check-up Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nama Lengkap */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Tanggal Lahir</Label>
              <Input
                id="dateOfBirth"
                type="date"
                {...register("dateOfBirth")}
              />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div className="space-y-2">
              <Label>Jenis Kelamin</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="male"
                    {...register("gender")}
                    className="h-4 w-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm">Laki-laki</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="female"
                    {...register("gender")}
                    className="h-4 w-4 accent-[#FF6B35]"
                  />
                  <span className="text-sm">Perempuan</span>
                </label>
              </div>
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender.message}</p>
              )}
            </div>

            {/* No. Telepon */}
            <div className="space-y-2">
              <Label htmlFor="phone">No. Telepon</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
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
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Mendaftar..." : "Daftar"}
            </Button>

            {/* Login link */}
            <p className="text-center text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/mcu/login"
                className="font-medium text-[#FF6B35] hover:underline"
              >
                Login di sini
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
