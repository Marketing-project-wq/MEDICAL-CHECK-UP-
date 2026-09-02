// UI strings + renderer labels for both languages. Dependency-free ESM.
// Default language is English — Indonesian is available at /id.

export const LANGS = ["id", "en"];
export const DEFAULT_LANG = "en";

export function normalizeLang(value) {
  return value === "id" ? "id" : "en";
}

const STRINGS = {
  id: {
    htmlLang: "id",
    brand: "20FIT",
    siteName: "Pahami Hasil MCU — 20FIT",
    metaTitle: "Cara Membaca & Memahami Hasil Medical Check-Up (MCU) | 20FIT",
    metaDescription:
      "Panduan memahami hasil medical check-up: arti penanda lab, rentang normal kolesterol, gula darah, tekanan darah, dan lainnya. Alat pemahaman, bukan diagnosis.",
    skipToContent: "Lompat ke konten",
    headerTagline: "Pahami hasil MCU",
    notFoundTitle: "404",
    notFoundBody: "Halaman tidak ditemukan.",
    notFoundBackHome: "Kembali ke beranda",
    serviceUnavailable: "Fitur scan belum dikonfigurasi di server ini.",
    themeToggleLabel: "Ganti tema terang/gelap",
    langToggleAriaLabel: "Bahasa",
    nav: { education: "Ekosistem", example: "FAQ", analyze: "Upload Sekarang", articles: "Artikel", home: "Cek MCU" },

    heroBadge: "Panduan MCU",
    heroKicker: "Pantau Kesehatan Berkelanjutan",
    heroTitle: "Scan MCU kamu, tiap kali kamu periksa",
    heroSubtitle:
      "Ini bukan cuma bacaan sekali selesai. Scan hasil MCU tiap kali kamu periksa — langsung kelihatan gambaran hasilnya. Bikin akun 20FIT untuk buka hasil lengkapnya dan pantau perubahannya dari waktu ke waktu.",
    heroPrimaryCta: "Scan hasil MCU sekarang",
    heroDownloadCta: "Download aplikasi",
    appStoreLine1: "Download di",
    appStoreLine2: "App Store",
    playStoreLine1: "Tersedia di",
    playStoreLine2: "Google Play",
    socialProofText: "Dipakai oleh komunitas 20FIT",
    heroNote: "Scan tanpa akun. Untuk lihat & simpan hasil lengkapnya, bikin akun setelahnya. Alat bantu MEMAHAMI, bukan diagnosis.",
    heroScanCta: "Aku Mau Scan Sekarang",
    heroMediaCaption: "Foto lembar hasil lab / konsultasi",
    heroDisclaimer:
      "Halaman ini alat bantu memahami hasil lab, bukan diagnosis. Rentang rujukan berbeda antar laboratorium. Untuk keputusan kesehatan, konsultasikan dengan dokter.",

    uploadHeading: "Upload Hasil Kamu",
    sampleHeading: "Contoh hasil analisa",
    sampleBadge: "CONTOH",
    sampleNote: "Ini data fiktif untuk menunjukkan tampilan hasil — bukan hasil MCU asli.",
    uploadCardTitle: "Upload hasil MCU kamu",
    uploadCardHint: "Foto atau PDF lembar hasil laboratorium",
    consentLabel:
      "Saya mengerti file ini akan diproses oleh AI untuk dianalisis. Hasilnya ditahan sampai 24 jam menunggu saya membuat akun — kalau tidak, otomatis dihapus.",
    errConsent: "Centang dulu kotak persetujuan di atas ya.",
    teaserHeading: "Hasil Scan Kamu",
    teaserParamsLabel: "Penanda terbaca",
    teaserLockedNote: "Buat akun 20FIT untuk buka nilai & penjelasan lengkapnya. Hasil ini ditahan sampai 24 jam — kalau tidak dibuka, otomatis terhapus.",
    teaserUnlockCta: "Buat Akun / Login untuk Buka Hasil",
    teaserUnlockedNote: "Hasil scan sebelumnya berhasil dibuka dan disimpan ke akunmu.",
    step1Title: "Upload lembar hasil",
    step1Desc: "Foto atau PDF dari laboratorium mana pun.",
    step2Title: "Penanda dikenali",
    step2Desc: "Sistem mencocokkan nama penanda, nilai, dan rentang rujukan.",
    step3Title: "Baca penjelasannya",
    step3Desc: "Tiap penanda dijelaskan dengan bahasa biasa, tanpa kesimpulan diagnosis.",

    testimonialsHeading: "Kata Pengguna 20FIT",
    testimonialsEmptyState: "Ulasan dari pengguna 20FIT akan segera hadir di sini.",

    ecosystemHeading: "Bagian dari Satu Ekosistem",
    ecosystemSubtitle: "Semua alat 20FIT berbagi satu akun. Apa pun yang kamu buka di sini bisa dilanjutkan di tempat lain.",
    ecosystemProducts: [
      { code: "K", name: "Scan Kalori", desc: "Foto makanan, dapat estimasi kalori dan makronutriennya.", url: "https://calories.20fit.id", current: false },
      { code: "M", name: "Menu Diet", desc: "Kumpulan menu dan resep dengan hitungan kalori per porsi.", url: "https://menu.20fit.id", current: false },
      { code: "C", name: "Panduan MCU", desc: "Upload hasil lab, baca penjelasan tiap penandanya.", url: "https://medicalcheckup.20fit.id", current: true },
      { code: "20", name: "My 20FIT", desc: "Akun, riwayat, meal plan, analytics.", url: "https://my.20fit.id", current: false },
    ],

    faqHeading: "Pertanyaan yang Sering Muncul",
    faq: [
      {
        q: "Apakah saya harus punya akun untuk menganalisa hasil MCU?",
        a: "Tidak. Penjelasan tiap penanda bisa dibaca tanpa akun. Akun cuma dibutuhkan untuk menyimpan riwayat dan melihat perbandingan antar periode.",
      },
      {
        q: "Apakah file hasil lab saya disimpan?",
        a: "Kalau kamu belum login, file dan hasil analisisnya tidak disimpan sama sekali. Kalau sudah login, hanya ringkasan hasilnya yang disimpan ke akunmu — bukan file aslinya.",
      },
      {
        q: "Apakah ini pengganti diagnosis dokter?",
        a: "Bukan. Panduan MCU 20FIT cuma alat bantu memahami istilah dan angka di hasil lab. Untuk keputusan kesehatan, tetap konsultasikan ke dokter.",
      },
      {
        q: "Format file apa saja yang didukung?",
        a: "Foto (JPG/PNG) atau PDF, maksimal 10MB.",
      },
    ],

    ctaBannerText: "Meal plan, diet plan, dan analytics jalan setelah ada riwayat yang tersimpan. Buat akun, atau pakai aplikasinya.",
    ctaBannerButton: "Buat akun di my.20fit.id",

    footerTagline: "Satu akun untuk scan kalori, menu diet, dan panduan medical check-up.",
    footerColApp: "Aplikasi",
    footerColBrand: "20FIT",
    footerColLegal: "Legal",
    footerAbout: "Tentang",
    footerStudioLocations: "Lokasi studio",
    footerContact: "Hubungi kami",
    footerPrivacy: "Kebijakan privasi",
    footerTerms: "Syarat layanan",
    footerHealthData: "Penanganan data kesehatan",

    memberHeading: "Analisa hasil MCU kamu",
    memberIntroAnon:
      "Untuk menganalisa hasil MCU milikmu sendiri, masuk dulu ke akun 20FIT. Filenya diproses aman dan tidak disimpan.",
    memberIntroMember:
      "Unggah foto atau PDF hasil MCU kamu. File diproses di browser lalu dianalisa — file aslinya tidak disimpan, hanya ringkasannya.",
    loginCta: "Masuk / Daftar untuk analisa",
    uploadCta: "Pilih file hasil MCU",
    uploadHint: "Foto (JPG/PNG) atau PDF, maks 10MB. File tidak disimpan.",
    analyzeButton: "Analisa sekarang",
    analyzing: "Menganalisa… ini bisa sampai ~1,5 menit.",
    historyHeading: "Riwayat & tren MCU kamu",
    historyEmpty: "Belum ada riwayat. Tiap kali kamu scan MCU, hasilnya akan muncul di sini supaya bisa kamu pantau dari waktu ke waktu.",
    signOut: "Keluar",
    signedInAs: "Masuk sebagai",

    errFile: "Pilih file dulu ya.",
    errTooLarge: "File terlalu besar (maks 10MB). Perkecil dulu ya.",
    errType: "Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF.",
    errPreprocess: "Gagal membaca file ini di browser. Coba file lain, atau foto langsung hasil labnya (JPG/PNG).",
    errNetwork: "Gagal terhubung. Cek koneksi lalu coba lagi.",
    errGeneric: "Terjadi kesalahan. Coba lagi ya.",
    errSave: "Hasil berhasil dianalisa tapi gagal disimpan ke riwayat.",
    errRateLimitedMember: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi ya.",
    errInvalidSession: "Sesi tidak valid. Muat ulang halaman lalu coba lagi.",
    errRateLimitedDevice: "Terlalu banyak percobaan dari perangkat ini. Coba lagi beberapa menit lagi ya.",
    errRateLimitedNetwork: "Terlalu banyak percobaan dari jaringan ini. Coba lagi besok, atau buat akun.",
    errScanLimitReached: "Kamu sudah mencapai batas scan gratis. Buat akun 20FIT untuk terus scan & simpan riwayatmu.",
    errSavePendingFailed: "Terjadi kesalahan menyimpan hasil sementara. Coba lagi ya.",
    errAuthRequired: "Masuk dulu ke akun 20FIT untuk menganalisa hasil MCU kamu.",
    errAuthSessionExpired: "Sesi kamu sudah habis. Silakan login lagi.",
    errIncompleteScanData: "Data scan tidak lengkap.",
    errPendingScanExpired: "Waktu penyimpanan hasil sudah habis atau tidak ditemukan. Silakan scan ulang — sekarang hasilnya langsung tersimpan ke akunmu.",
    errClaimSaveFailed: "Hasil ditemukan tapi gagal disimpan ke akunmu. Coba lagi ya.",
    errAnalyzeFailed: "Gagal menganalisa hasil MCU. Coba lagi.",
    errAnalyzeTimeout: "Analisa memakan waktu lebih lama dari biasanya. Coba lagi ya.",
    errNotMcu: "Dokumen ini sepertinya bukan hasil medical check-up. Coba upload lembar hasil lab dari klinik atau rumah sakit.",
    errIncompleteMcu: "Dokumen ini terbaca sebagai MCU, tapi beberapa data penting belum lengkap (nama pasien, tanggal periksa, atau nilai lab). Coba upload lembar yang lebih lengkap.",

    footerDisclaimer:
      "medicalcheckup.20fit.id membantu kamu MEMAHAMI hasil lab. Ini bukan diagnosis dan bukan pengganti nasihat dokter.",
    footerBackToApp: "Buka my.20fit.id",

    // Artikel kesehatan (Tahap 1) + komponen alat kesehatan bersama
    articlesHeading: "Artikel Kesehatan 20FIT",
    articlesIntro: "Insight kebugaran, EMS, HYROX, fisioterapi, dan gaya hidup sehat dari tim 20FIT.",
    articlesEmpty: "Belum ada artikel untuk ditampilkan.",
    articleReadMore: "Baca selengkapnya",
    articleBackToList: "← Semua artikel",
    articleSourcePrefix: "Artikel ini juga tayang di",
    healthDisclaimerTitle: "Catatan",
    healthDisclaimerText:
      "Konten & alat di sini bersifat edukasi dan awareness — BUKAN diagnosa resmi. Untuk kondisi kesehatanmu, konsultasikan ke dokter.",
    doctorCtaTitle: "Mau lebih pasti?",
    doctorCtaText: "Diskusikan kondisimu langsung dengan dokter 20FIT.",
    doctorCtaButton: "Konsultasi ke Dokter 20FIT",

    // Landing + Home hub (2-tier)
    heroSeeExample: "Lihat contoh hasil",
    howHeading: "Cara kerjanya",
    landingCtaText: "Siap pahami hasil MCU kamu? Masuk ke hub 20FIT MCU — scan hasil, ikut quiz, dan baca artikel kesehatan.",
    landingCtaButton: "Masuk — Cek MCU kamu",
    hubMetaTitle: "Hub Kesehatan 20FIT — Cek MCU, Quiz, Artikel | 20FIT",
    hubMetaDescription: "Satu tempat untuk scan & pahami hasil medical check-up kamu, ikut quiz kesehatan, dan baca artikel dari tim 20FIT.",
    hubHeading: "Selamat datang di Hub Kesehatan 20FIT",
    hubIntro: "Pilih apa yang mau kamu lakukan. Semua alat di sini bersifat edukasi — untuk keputusan kesehatan, ada jalur ke dokter 20FIT.",
    pillarScanTitle: "Cek & Scan MCU",
    pillarScanDesc: "Upload hasil lab kamu, biar tiap penanda dijelaskan dengan bahasa yang gampang.",
    pillarQuizTitle: "Quiz Kesehatan",
    pillarQuizDesc: "Cek BMI & gambaran kondisi tubuh kamu lewat kuis singkat.",
    pillarArticleTitle: "Artikel Kesehatan",
    pillarArticleDesc: "Insight kebugaran, EMS, HYROX, dan gaya hidup sehat dari tim 20FIT.",
    comingSoonBadge: "SEGERA HADIR",
    quizComingSoonText: "Quiz BMI & cek kondisi tubuh lagi disiapkan. Sebentar lagi kamu bisa dapat gambaran singkat di sini — tetap dengan catatan: bukan diagnosa, dan ada jalur ke dokter 20FIT.",
    viewAllArticles: "Lihat semua artikel",

    // Quiz BMI (Tahap 2) — ambang standar WHO, dengan konteks jujur
    quizIntro: "Masukkan tinggi & berat kamu untuk lihat BMI dan gambaran kondisi tubuh. Ini perkiraan kasar untuk awareness — bukan diagnosa.",
    quizHeightLabel: "Tinggi badan (cm)",
    quizWeightLabel: "Berat badan (kg)",
    quizWaistLabel: "Lingkar pinggang (cm)",
    quizOptional: "opsional",
    quizSubmit: "Hitung",
    quizErrInputs: "Isi tinggi & berat dengan angka yang wajar dulu ya.",
    quizResultHeading: "Hasil perkiraan kamu",
    bmiLabel: "BMI kamu",
    bmiCatUnder: "Berat kurang",
    bmiCatNormal: "Normal",
    bmiCatOver: "Berat berlebih",
    bmiCatObese: "Obesitas",
    bmiContext:
      "BMI cuma membandingkan berat dengan tinggi — nggak bisa bedain otot dan lemak. Orang berotot bisa BMI tinggi tapi tetap sehat; sebaliknya BMI 'normal' belum tentu bebas risiko. Anggap ini gambaran kasar, bukan penilaian medis.",
    bmiAsiaNote:
      "Untuk populasi Asia, ambangnya sering lebih rendah (mis. berlebih mulai BMI 23). Angka pastinya sebaiknya dibahas dengan dokter.",
    whtrLabel: "Rasio pinggang–tinggi",
    whtrOk: "Di bawah 0,5 — umumnya dianggap kisaran sehat.",
    whtrHigh: "0,5 atau lebih — sering dikaitkan dengan risiko lebih tinggi. Pertimbangkan diskusi dengan dokter.",
    quizDoctorLine: "Mau lebih pasti soal kondisimu?",
  },

  en: {
    htmlLang: "en",
    brand: "20FIT",
    siteName: "Understand Your MCU Results — 20FIT",
    metaTitle: "How to Read & Understand Medical Check-Up (MCU) Results | 20FIT",
    metaDescription:
      "A plain-language guide to understanding medical check-up results: what lab markers mean, normal ranges for cholesterol, blood sugar, blood pressure and more. An understanding tool, not a diagnosis.",
    skipToContent: "Skip to content",
    headerTagline: "Understand your MCU",
    notFoundTitle: "404",
    notFoundBody: "Page not found.",
    notFoundBackHome: "Back to home",
    serviceUnavailable: "Scanning isn't configured on this server yet.",
    themeToggleLabel: "Toggle light/dark theme",
    langToggleAriaLabel: "Language",
    nav: { education: "Ecosystem", example: "FAQ", analyze: "Upload Now", articles: "Articles", home: "Check MCU" },

    heroBadge: "MCU Guide",
    heroKicker: "Continuous Health Tracking",
    heroTitle: "Scan your MCU, every time you get checked",
    heroSubtitle:
      "This isn't a one-time read. Scan your MCU every time you get checked — you'll see a glimpse of the result right away. Create a 20FIT account to unlock the full result and track the change over time.",
    heroPrimaryCta: "Scan my MCU results now",
    heroDownloadCta: "Download the app",
    appStoreLine1: "Download on the",
    appStoreLine2: "App Store",
    playStoreLine1: "Get it on",
    playStoreLine2: "Google Play",
    socialProofText: "Used by the 20FIT community",
    heroNote: "Scan with no account needed. Create one afterward to see and save the full result. A tool to UNDERSTAND, not a diagnosis.",
    heroScanCta: "I Want To Scan Now",
    heroMediaCaption: "Photo of your lab report / consultation",
    heroDisclaimer:
      "This page is a tool to understand lab results, not a diagnosis. Reference ranges differ between labs. For health decisions, consult a doctor.",

    uploadHeading: "Upload Your Results",
    sampleHeading: "Example analysis result",
    sampleBadge: "EXAMPLE",
    sampleNote: "This is fictional data to show how a result looks — not a real MCU result.",
    uploadCardTitle: "Upload your MCU results",
    uploadCardHint: "Photo or PDF of your lab report",
    consentLabel:
      "I understand this file will be processed by AI for analysis. The result is held for up to 24 hours while I create an account — otherwise it's automatically deleted.",
    errConsent: "Please check the consent box above first.",
    teaserHeading: "Your Scan Result",
    teaserParamsLabel: "Markers detected",
    teaserLockedNote: "Create a 20FIT account to unlock the full values & explanations. This result is held for up to 24 hours — if it's not unlocked, it's automatically deleted.",
    teaserUnlockCta: "Create Account / Login to Unlock",
    teaserUnlockedNote: "Your previous scan was successfully unlocked and saved to your account.",
    step1Title: "Upload your report",
    step1Desc: "Photo or PDF from any laboratory.",
    step2Title: "Markers recognized",
    step2Desc: "The system matches marker names, values, and reference ranges.",
    step3Title: "Read the explanation",
    step3Desc: "Each marker is explained in plain language, with no diagnostic conclusion.",

    testimonialsHeading: "What 20FIT Users Say",
    testimonialsEmptyState: "Reviews from 20FIT users are coming soon.",

    ecosystemHeading: "Part of One Ecosystem",
    ecosystemSubtitle: "Every 20FIT tool shares one account. Whatever you start here can continue anywhere else.",
    ecosystemProducts: [
      { code: "K", name: "Calorie Scan", desc: "Photograph your food to get a calorie and macro estimate.", url: "https://calories.20fit.id", current: false },
      { code: "M", name: "Diet Menu", desc: "A collection of menus and recipes with per-serving calorie counts.", url: "https://menu.20fit.id", current: false },
      { code: "C", name: "MCU Guide", desc: "Upload your lab results and read the explanation for each marker.", url: "https://medicalcheckup.20fit.id", current: true },
      { code: "20", name: "My 20FIT", desc: "Account, history, meal plan, analytics.", url: "https://my.20fit.id", current: false },
    ],

    faqHeading: "Frequently Asked Questions",
    faq: [
      {
        q: "Do I need an account to analyze my MCU results?",
        a: "No. The explanation for each marker can be read without an account. An account is only needed to save your history and see period-over-period comparisons.",
      },
      {
        q: "Is my lab file stored?",
        a: "If you're not logged in, the file and its analysis are not stored at all. If you're logged in, only the result summary is saved to your account — not the original file.",
      },
      {
        q: "Is this a substitute for a doctor's diagnosis?",
        a: "No. 20FIT's MCU Guide is only a tool to help you understand the terms and numbers on your lab report. For health decisions, always consult a doctor.",
      },
      {
        q: "Which file formats are supported?",
        a: "Photo (JPG/PNG) or PDF, up to 10MB.",
      },
    ],

    ctaBannerText: "Meal plans, diet plans, and analytics run once you have saved history. Create an account, or use the app.",
    ctaBannerButton: "Create an account at my.20fit.id",

    footerTagline: "One account for calorie scanning, diet menus, and the medical check-up guide.",
    footerColApp: "Apps",
    footerColBrand: "20FIT",
    footerColLegal: "Legal",
    footerAbout: "About",
    footerStudioLocations: "Studio locations",
    footerContact: "Contact us",
    footerPrivacy: "Privacy policy",
    footerTerms: "Terms of service",
    footerHealthData: "Health data handling",

    memberHeading: "Analyze your MCU results",
    memberIntroAnon:
      "To analyze your own MCU results, sign in to your 20FIT account first. Your file is processed securely and never stored.",
    memberIntroMember:
      "Upload a photo or PDF of your MCU. It is processed in your browser then analyzed — the original file is not stored, only the summary.",
    loginCta: "Sign in / Register to analyze",
    uploadCta: "Choose your MCU file",
    uploadHint: "Photo (JPG/PNG) or PDF, max 10MB. Files are not stored.",
    analyzeButton: "Analyze now",
    analyzing: "Analyzing… this can take up to ~1.5 minutes.",
    historyHeading: "Your MCU history & trends",
    historyEmpty: "No history yet. Every time you scan an MCU, the result will appear here so you can track it over time.",
    signOut: "Sign out",
    signedInAs: "Signed in as",

    errFile: "Please choose a file first.",
    errTooLarge: "File is too large (max 10MB). Please shrink it first.",
    errType: "File type not supported. Use JPG, PNG, or PDF.",
    errPreprocess: "Couldn't read this file in the browser. Try another file, or take a direct photo of the lab result (JPG/PNG).",
    errNetwork: "Couldn't connect. Check your connection and try again.",
    errGeneric: "Something went wrong. Please try again.",
    errSave: "Analysis succeeded but couldn't be saved to your history.",
    errRateLimitedMember: "Too many attempts. Please try again in a few minutes.",
    errInvalidSession: "Invalid session. Reload the page and try again.",
    errRateLimitedDevice: "Too many attempts from this device. Please try again in a few minutes.",
    errRateLimitedNetwork: "Too many attempts from this network. Try again tomorrow, or create an account.",
    errScanLimitReached: "You've reached the free scan limit. Create a 20FIT account to keep scanning & save your history.",
    errSavePendingFailed: "Something went wrong saving your result temporarily. Please try again.",
    errAuthRequired: "Please sign in to your 20FIT account to analyze your MCU results.",
    errAuthSessionExpired: "Your session has expired. Please sign in again.",
    errIncompleteScanData: "Incomplete scan data.",
    errPendingScanExpired: "The held result has expired or wasn't found. Please scan again — it will now be saved to your account right away.",
    errClaimSaveFailed: "Result found but couldn't be saved to your account. Please try again.",
    errAnalyzeFailed: "Couldn't analyze your MCU results. Please try again.",
    errAnalyzeTimeout: "The analysis is taking longer than usual. Please try again.",
    errNotMcu: "This doesn't look like a medical check-up result. Try uploading the lab report from your clinic or hospital.",
    errIncompleteMcu: "This was read as an MCU, but some key details are missing (patient name, exam date, or lab values). Try uploading a more complete report.",

    footerDisclaimer:
      "medicalcheckup.20fit.id helps you UNDERSTAND lab results. It is not a diagnosis and not a substitute for a doctor's advice.",
    footerBackToApp: "Open my.20fit.id",

    // Health articles (Tahap 1) + shared health-tool components
    articlesHeading: "20FIT Health Articles",
    articlesIntro: "Fitness, EMS, HYROX, physiotherapy, and healthy-lifestyle insights from the 20FIT team.",
    articlesEmpty: "No articles to show yet.",
    articleReadMore: "Read more",
    articleBackToList: "← All articles",
    articleSourcePrefix: "This article is also published on",
    healthDisclaimerTitle: "Note",
    healthDisclaimerText:
      "Content & tools here are for education and awareness — NOT a formal diagnosis. For your health condition, consult a doctor.",
    doctorCtaTitle: "Want to be sure?",
    doctorCtaText: "Discuss your condition directly with a 20FIT doctor.",
    doctorCtaButton: "Consult a 20FIT Doctor",

    // Landing + Home hub (2-tier)
    heroSeeExample: "See an example result",
    howHeading: "How it works",
    landingCtaText: "Ready to understand your MCU results? Enter the 20FIT MCU hub — scan results, take a quiz, and read health articles.",
    landingCtaButton: "Enter — Check your MCU",
    hubMetaTitle: "20FIT Health Hub — Check MCU, Quiz, Articles | 20FIT",
    hubMetaDescription: "One place to scan & understand your medical check-up, take a health quiz, and read articles from the 20FIT team.",
    hubHeading: "Welcome to the 20FIT Health Hub",
    hubIntro: "Pick what you'd like to do. Every tool here is for education — for health decisions, there's a path to a 20FIT doctor.",
    pillarScanTitle: "Check & Scan MCU",
    pillarScanDesc: "Upload your lab results and get each marker explained in plain language.",
    pillarQuizTitle: "Health Quiz",
    pillarQuizDesc: "Check your BMI & a picture of your body condition with a short quiz.",
    pillarArticleTitle: "Health Articles",
    pillarArticleDesc: "Fitness, EMS, HYROX, and healthy-lifestyle insights from the 20FIT team.",
    comingSoonBadge: "COMING SOON",
    quizComingSoonText: "The BMI & body-condition quiz is on its way. Soon you'll get a quick picture here — still with the same note: not a diagnosis, and there's a path to a 20FIT doctor.",
    viewAllArticles: "View all articles",

    // BMI quiz (Tahap 2) — standard WHO thresholds, with honest context
    quizIntro: "Enter your height & weight to see your BMI and a picture of your body condition. This is a rough estimate for awareness — not a diagnosis.",
    quizHeightLabel: "Height (cm)",
    quizWeightLabel: "Weight (kg)",
    quizWaistLabel: "Waist circumference (cm)",
    quizOptional: "optional",
    quizSubmit: "Calculate",
    quizErrInputs: "Please enter a sensible height & weight first.",
    quizResultHeading: "Your estimate",
    bmiLabel: "Your BMI",
    bmiCatUnder: "Underweight",
    bmiCatNormal: "Normal",
    bmiCatOver: "Overweight",
    bmiCatObese: "Obese",
    bmiContext:
      "BMI only compares weight to height — it can't tell muscle from fat. A muscular person can have a high BMI yet be healthy; a 'normal' BMI isn't automatically risk-free. Treat this as a rough picture, not a medical assessment.",
    bmiAsiaNote:
      "For Asian populations the thresholds are often lower (e.g. overweight from BMI 23). Discuss the exact number with a doctor.",
    whtrLabel: "Waist-to-height ratio",
    whtrOk: "Below 0.5 — generally considered a healthy range.",
    whtrHigh: "0.5 or above — often linked to higher risk. Consider discussing it with a doctor.",
    quizDoctorLine: "Want to be sure about your condition?",
  },
};

// Labels used by the shared result renderer, matching the REAL
// my.20fit.id /api/analyze-mcu response shape (verified against its source —
// not the earlier aspirational spec shape). The disclaimer text lives here
// (fixed copy) because the backend does not return one.
const RENDER_LABELS = {
  id: {
    forPatient: "Untuk",
    resultTitle: "Hasil Analisa MCU",
    reviewedAt: "Ditinjau",
    gradeLabel: "Skor kesehatan",
    summary: "Ringkasan",
    metricsHeading: "Rincian penanda",
    colLabel: "Penanda",
    colValue: "Nilai",
    colStatus: "Status",
    colNote: "Catatan",
    statusOk: "Normal",
    statusHigh: "Tinggi",
    statusLow: "Rendah",
    statusWarning: "Perlu perhatian",
    statusUnknown: "Tidak diketahui",
    noMetrics: "Tidak ada penanda yang terbaca.",
    recommendationsHeading: "Rekomendasi",
    checklistHeading: "Rencana harian",
    priorityHigh: "Prioritas tinggi",
    priorityMed: "Prioritas sedang",
    priorityLow: "Prioritas rendah",
    locationGym: "Gym",
    locationHome: "Rumah",
    locationClinic: "Klinik",
    doctorNotesHeading: "Catatan medis",
    disclaimerTitle: "Penting",
    disclaimerText:
      "Alat ini membantu kamu MEMAHAMI hasil lab — bukan alat diagnosis dan bukan pengganti dokter. Untuk keputusan kesehatan, konsultasikan ke dokter.",
  },
  en: {
    forPatient: "For",
    resultTitle: "MCU Analysis Result",
    reviewedAt: "Reviewed",
    gradeLabel: "Health score",
    summary: "Summary",
    metricsHeading: "Marker details",
    colLabel: "Marker",
    colValue: "Value",
    colStatus: "Status",
    colNote: "Note",
    statusOk: "Normal",
    statusHigh: "High",
    statusLow: "Low",
    statusWarning: "Needs attention",
    statusUnknown: "Unknown",
    noMetrics: "No readable markers.",
    recommendationsHeading: "Recommendations",
    checklistHeading: "Daily plan",
    priorityHigh: "High priority",
    priorityMed: "Medium priority",
    priorityLow: "Low priority",
    locationGym: "Gym",
    locationHome: "Home",
    locationClinic: "Clinic",
    doctorNotesHeading: "Medical notes",
    disclaimerTitle: "Important",
    disclaimerText:
      "This tool helps you UNDERSTAND your lab results — it is not a diagnosis and not a substitute for a doctor. For any health decision, consult a doctor.",
  },
};

export function getStrings(lang) {
  return STRINGS[normalizeLang(lang)];
}

export function getRenderLabels(lang) {
  return RENDER_LABELS[normalizeLang(lang)];
}

// Maps a stable server error `code` (see src/server/scanHandlers.js and
// mcuAnalyze.js) to a fully-localized i18n key. The server never sends
// user-facing text directly — only a code — so a language switch always
// translates every error too, including ones for requests already in
// flight, and an unrecognized code never falls back to raw server text.
const ERROR_CODE_KEYS = {
  file_too_large: "errTooLarge",
  invalid_body: "errGeneric",
  invalid_request: "errGeneric",
  no_file: "errFile",
  unsupported_type: "errType",
  rate_limited_member: "errRateLimitedMember",
  auth_required: "errAuthRequired",
  invalid_session: "errInvalidSession",
  rate_limited_device: "errRateLimitedDevice",
  rate_limited_network: "errRateLimitedNetwork",
  generic_error: "errGeneric",
  scan_limit_reached: "errScanLimitReached",
  save_pending_failed: "errSavePendingFailed",
  auth_session_expired: "errAuthSessionExpired",
  incomplete_scan_data: "errIncompleteScanData",
  pending_scan_expired: "errPendingScanExpired",
  claim_save_failed: "errClaimSaveFailed",
  analyze_failed: "errAnalyzeFailed",
  analyze_timeout: "errAnalyzeTimeout",
  not_mcu: "errNotMcu",
  incomplete_mcu: "errIncompleteMcu",
  service_unavailable: "serviceUnavailable",
};

export function getErrorMessage(lang, code) {
  const s = getStrings(lang);
  const key = ERROR_CODE_KEYS[code];
  return (key && s[key]) || s.errGeneric;
}
