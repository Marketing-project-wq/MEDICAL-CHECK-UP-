import { UploadMCUClient } from "./upload-client"

export const metadata = {
  title: "Upload Hasil Medical Check-Up",
  description: "Upload file hasil medical check-up Anda untuk mendapatkan analisis kesehatan.",
}

export default function UploadMCUPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Upload Hasil <span className="text-[#FF6B35]">Medical Check-Up</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Upload file hasil MCU Anda (PDF atau gambar). Setelah upload berhasil,
            Anda akan mendapatkan token untuk mengklaim hasil di akun Anda.
          </p>
        </div>

        <UploadMCUClient />
      </div>
    </main>
  )
}
