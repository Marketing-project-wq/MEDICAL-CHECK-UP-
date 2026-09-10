import Link from "next/link"
import {
  Upload,
  FileSearch,
  BookOpen,
  Activity,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-32"
        style={{
          background: "linear-gradient(135deg, #FF6B35 0%, #1E3A5F 100%)",
        }}
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Medical Check-Up Digital untuk Hidup Lebih Sehat
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
            Platform my.20fit untuk menganalisis, memahami, dan mengelola hasil
            Medical Check-Up Anda dengan mudah dan terpercaya.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard/upload"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-[#FF6B35] shadow-lg transition-colors hover:bg-white/90"
            >
              Upload MCU Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-lg border-2 border-white/30 px-8 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
            >
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Fitur Unggulan
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Kelola kesehatan Anda dengan fitur-fitur yang dirancang khusus
              untuk memudahkan pemantauan Medical Check-Up.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Upload className="h-6 w-6" />}
              title="Upload & Analisis MCU"
              description="Upload dokumen MCU Anda dan dapatkan analisis otomatis dengan interpretasi yang mudah dipahami."
              color="bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
            />
            <FeatureCard
              icon={<Activity className="h-6 w-6" />}
              title="Quiz Kesehatan Personal"
              description="Ikuti quiz kesehatan untuk mengetahui kondisi dan mendapatkan rekomendasi yang tepat."
              color="bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Artikel & Tips Kesehatan"
              description="Akses artikel dan tips kesehatan terpercaya yang ditulis oleh para ahli."
              color="bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400"
            />
            <FeatureCard
              icon={<FileSearch className="h-6 w-6" />}
              title="Tracking Progress Kesehatan"
              description="Pantau perkembangan hasil MCU dari waktu ke waktu dengan visualisasi yang informatif."
              color="bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Cara Kerja
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tiga langkah mudah untuk mulai mengelola kesehatan Anda.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <StepCard
              step={1}
              title="Upload"
              description="Unggah dokumen hasil Medical Check-Up Anda dalam format PDF atau gambar."
            />
            <StepCard
              step={2}
              title="Analisis"
              description="Sistem kami menganalisis dan mengekstrak data dari dokumen MCU Anda secara otomatis."
            />
            <StepCard
              step={3}
              title="Hasil & Rekomendasi"
              description="Dapatkan hasil yang mudah dipahami beserta rekomendasi kesehatan yang personal."
            />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Mulai Pantau Kesehatan Anda Sekarang
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Bergabung dengan ribuan pengguna yang sudah mempercayakan pengelolaan
            Medical Check-Up mereka kepada my.20fit.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Daftar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-base font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} my.20fit. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className={`inline-flex rounded-lg p-3 ${color}`}>{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description: string
}) {
  return (
    <div className="relative text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
        {step}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {step < 3 && (
        <div className="absolute right-0 top-6 hidden w-full translate-x-1/2 sm:block">
          <ArrowRight className="mx-auto h-5 w-5 text-muted-foreground/50" />
        </div>
      )}
    </div>
  )
}
