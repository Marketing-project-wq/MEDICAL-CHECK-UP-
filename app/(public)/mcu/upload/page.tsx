"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { CheckCircle, Copy, UserPlus, LogIn } from "lucide-react"
import { UploadDropzone } from "@/components/mcu/upload-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function UploadMCUPage() {
  const [uploadResult, setUploadResult] = useState<{
    fileUrl: string
    fileName: string
    fileType: string
    token: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string) => {
    let token = ""
    try {
      token = localStorage.getItem("mcu_upload_token") || ""
    } catch {
      // localStorage may not be available
    }
    setUploadResult({ fileUrl, fileName, fileType, token })
    toast.success("File MCU berhasil diupload!")
  }

  const handleCopyToken = async () => {
    if (!uploadResult?.token) return
    try {
      await navigator.clipboard.writeText(uploadResult.token)
      setCopied(true)
      toast.success("Token berhasil disalin!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Gagal menyalin token. Silakan salin secara manual.")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {uploadResult ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
                  {/* Green checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    className="rounded-full bg-green-100 p-4"
                  >
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </motion.div>

                  {/* Success message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-xl font-bold">
                      File MCU kamu berhasil diupload!
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Simpan token di bawah ini untuk mengklaim hasil MCU di akun kamu.
                    </p>
                  </motion.div>

                  {/* Copyable token box */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full rounded-lg border-2 border-dashed border-[#FF6B35]/30 bg-orange-50 p-4 dark:bg-orange-950/20"
                  >
                    <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Token Upload
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-xl font-bold tracking-widest text-[#FF6B35]">
                        {uploadResult.token}
                      </code>
                      <button
                        onClick={handleCopyToken}
                        className="rounded-md p-1.5 transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/30"
                        aria-label="Salin token"
                      >
                        <Copy className="h-4 w-4 text-[#FF6B35]" />
                      </button>
                    </div>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1 text-xs text-green-600"
                      >
                        Token disalin!
                      </motion.p>
                    )}
                  </motion.div>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex w-full flex-col gap-3 sm:flex-row"
                  >
                    <Button asChild className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90" size="lg">
                      <Link href="/mcu/register">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Buat Akun Sekarang
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1" size="lg">
                      <Link href="/mcu/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sudah Punya Akun? Login
                      </Link>
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-8 text-center">
                <motion.h1
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  Upload Hasil{" "}
                  <span className="text-[#FF6B35]">Medical Check-Up</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-sm text-muted-foreground sm:text-base"
                >
                  Kamu bisa upload file hasil MCU tanpa perlu login terlebih dahulu.
                  Setelah upload, kamu akan mendapatkan token untuk mengklaim hasilnya
                  di akun kamu.
                </motion.p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <UploadDropzone onUploadComplete={handleUploadComplete} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
