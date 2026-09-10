"use client"

import { useState } from "react"
import { UploadDropzone } from "@/components/mcu/upload-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Copy, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"

export function UploadMCUClient() {
  const [uploadResult, setUploadResult] = useState<{
    fileUrl: string
    fileName: string
    fileType: string
    token: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleUploadComplete = (fileUrl: string, fileName: string, fileType: string) => {
    // Retrieve token from localStorage (saved by UploadDropzone)
    let token = ""
    try {
      token = localStorage.getItem("mcu_upload_token") || ""
    } catch {
      // ignore
    }
    setUploadResult({ fileUrl, fileName, fileType, token })
  }

  const handleCopyToken = async () => {
    if (!uploadResult?.token) return
    try {
      await navigator.clipboard.writeText(uploadResult.token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback -- select text
    }
  }

  if (uploadResult) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <div>
            <h2 className="text-xl font-semibold">Upload Berhasil!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Simpan token di bawah ini untuk mengklaim hasil MCU Anda.
            </p>
          </div>

          {/* Token display */}
          <div className="w-full rounded-lg border bg-muted/50 p-4">
            <p className="mb-1 text-xs text-muted-foreground">Token Upload</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-lg font-bold tracking-wider text-[#FF6B35]">
                {uploadResult.token}
              </code>
              <button
                onClick={handleCopyToken}
                className="rounded p-1 hover:bg-muted"
                aria-label="Salin token"
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {copied && (
              <p className="mt-1 text-xs text-green-600">Token disalin!</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            File: {uploadResult.fileName}
          </p>

          {/* CTA buttons */}
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1 bg-[#FF6B35] hover:bg-[#FF6B35]/90">
              <Link href="/mcu/register">
                <UserPlus className="mr-2 h-4 w-4" />
                Daftar Akun
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/mcu/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <UploadDropzone onUploadComplete={handleUploadComplete} />
      </CardContent>
    </Card>
  )
}
