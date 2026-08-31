// UI strings + renderer labels for both languages. Dependency-free ESM.
// Default language is Bahasa Indonesia (spec §7).

export const LANGS = ["id", "en"];
export const DEFAULT_LANG = "id";

export function normalizeLang(value) {
  return value === "en" ? "en" : "id";
}

const STRINGS = {
  id: {
    htmlLang: "id",
    brand: "20FIT",
    siteName: "Pahami Hasil MCU — 20FIT",
    metaTitle: "Cara Membaca & Memahami Hasil Medical Check-Up (MCU) | 20FIT",
    metaDescription:
      "Panduan memahami hasil medical check-up: arti penanda lab, rentang normal kolesterol, gula darah, tekanan darah, dan lainnya. Alat pemahaman, bukan diagnosis.",
    otherLangLabel: "English",
    otherLangHref: "/en",
    nav: { education: "Fitur", example: "Panduan Penanda", analyze: "Upload Sekarang" },

    heroBadge: "Panduan MCU",
    heroKicker: "Literasi Kesehatan",
    heroTitle: "Upload hasil MCU, lihat penjelasannya",
    heroSubtitle:
      "Penjelasan tiap penanda terbuka penuh, tanpa akun. Yang butuh akun adalah rencana lanjutannya dan perbandingan antar periode.",
    heroPrimaryCta: "Analisis hasil MCU",
    heroSecondaryCta: "Lihat contoh analisa",
    heroDownloadCta: "Download aplikasi",
    appStoreLine1: "Download di",
    appStoreLine2: "App Store",
    playStoreLine1: "Tersedia di",
    playStoreLine2: "Google Play",
    socialProofText: "Dipakai oleh komunitas 20FIT",
    heroNote: "Tanpa akun. Hasil analisisnya terbuka penuh. Alat bantu MEMAHAMI, bukan diagnosis.",
    heroMediaCaption: "Foto lembar hasil lab / konsultasi",
    heroDisclaimer:
      "Halaman ini alat bantu memahami hasil lab, bukan diagnosis. Rentang rujukan berbeda antar laboratorium. Untuk keputusan kesehatan, konsultasikan dengan dokter.",

    uploadHeading: "Upload Hasil Kamu",
    uploadCardTitle: "Upload hasil MCU kamu",
    uploadCardHint: "Foto atau PDF lembar hasil laboratorium",
    uploadSampleLink: "Atau pakai hasil lab contoh",
    consentLabel:
      "Saya mengerti file ini akan diproses oleh AI untuk analisis, dan hasilnya tidak disimpan di mana pun.",
    errConsent: "Centang dulu kotak persetujuan di atas ya.",
    ephemeralNote: "Hasil ini ditampilkan sekali dan tidak disimpan. Untuk menyimpan riwayat, buat akun 20FIT.",
    step1Title: "Upload lembar hasil",
    step1Desc: "Foto atau PDF dari laboratorium mana pun.",
    step2Title: "Penanda dikenali",
    step2Desc: "Sistem mencocokkan nama penanda, nilai, dan rentang rujukan.",
    step3Title: "Baca penjelasannya",
    step3Desc: "Tiap penanda dijelaskan dengan bahasa biasa, tanpa kesimpulan diagnosis.",

    whyHeading: "Kenapa Pakai Panduan MCU 20FIT",
    whySubtitle: "Yang bisa dibaca tanpa akun, dan yang butuh akun karena memerlukan riwayat.",
    whyMediaCaption: "Foto layar hasil analisis MCU",
    lockedBadge: "Perlu akun",
    callouts: [
      {
        title: "Baca penanda lab tanpa kamus",
        desc: "Upload lembar hasil, tiap penanda dijelaskan dengan bahasa biasa beserta rentang rujukan dari lab kamu sendiri.",
        locked: false,
      },
      {
        title: "Perbandingan antar periode",
        desc: "Hasil MCU tahun ini dibandingkan dengan sebelumnya, sehingga arah perubahannya terlihat, bukan cuma angka hari ini.",
        locked: true,
      },
      {
        title: "Rencana makan dari hasil lab",
        desc: "Penyesuaian pola makan yang menimbang penanda mana yang di atas rentang.",
        locked: false,
      },
      {
        title: "Riwayat kesehatan satu tempat",
        desc: "Hasil MCU, data latihan, dan catatan makan berada di akun yang sama.",
        locked: true,
      },
    ],

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
        a: "Foto (JPG/PNG) atau PDF, maksimal 8MB.",
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

    eduHeading: "Arti penanda lab yang umum",
    eduIntro:
      "Setiap hasil MCU biasanya menampilkan nilai kamu di samping rentang normal. Berikut penjelasan singkat penanda yang sering muncul. Ini edukasi umum — bukan penilaian atas hasil kamu.",
    rangeLabel: "Rentang rujukan umum",
    meaningLabel: "Apa artinya",

    exampleHeading: "Contoh analisa (data sampel)",
    exampleIntro:
      "Beginilah tampilan hasil analisa. Angka di bawah ini FIKTIF — hanya untuk contoh.",
    sampleBadge: "Ini contoh — bukan data Anda",

    memberHeading: "Analisa hasil MCU kamu",
    memberIntroAnon:
      "Untuk menganalisa hasil MCU milikmu sendiri, masuk dulu ke akun 20FIT. Filenya diproses aman dan tidak disimpan.",
    memberIntroMember:
      "Unggah foto atau PDF hasil MCU kamu. File diproses di browser lalu dianalisa — file aslinya tidak disimpan, hanya ringkasannya.",
    loginCta: "Masuk / Daftar untuk analisa",
    uploadCta: "Pilih file hasil MCU",
    uploadHint: "Foto (JPG/PNG) atau PDF, maks 8MB. File tidak disimpan.",
    analyzeButton: "Analisa sekarang",
    analyzing: "Menganalisa… ini bisa sampai ~1,5 menit.",
    historyHeading: "Riwayat analisa kamu",
    historyEmpty: "Belum ada riwayat. Hasil analisa kamu akan muncul di sini.",
    signOut: "Keluar",
    signedInAs: "Masuk sebagai",

    errFile: "Pilih file dulu ya.",
    errTooLarge: "File terlalu besar (maks 8MB). Perkecil dulu ya.",
    errType: "Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF.",
    errNetwork: "Gagal terhubung. Cek koneksi lalu coba lagi.",
    errGeneric: "Terjadi kesalahan. Coba lagi ya.",
    errSave: "Hasil berhasil dianalisa tapi gagal disimpan ke riwayat.",

    footerDisclaimer:
      "medicalcheckup.20fit.id membantu kamu MEMAHAMI hasil lab. Ini bukan diagnosis dan bukan pengganti nasihat dokter.",
    footerBackToApp: "Buka my.20fit.id",
  },

  en: {
    htmlLang: "en",
    brand: "20FIT",
    siteName: "Understand Your MCU Results — 20FIT",
    metaTitle: "How to Read & Understand Medical Check-Up (MCU) Results | 20FIT",
    metaDescription:
      "A plain-language guide to understanding medical check-up results: what lab markers mean, normal ranges for cholesterol, blood sugar, blood pressure and more. An understanding tool, not a diagnosis.",
    otherLangLabel: "Bahasa Indonesia",
    otherLangHref: "/",
    nav: { education: "Features", example: "Marker Guide", analyze: "Upload Now" },

    heroBadge: "MCU Guide",
    heroKicker: "Health Literacy",
    heroTitle: "Upload your MCU results, see the explanation",
    heroSubtitle:
      "Every marker's explanation is fully open, no account needed. An account is only needed for the follow-up plan and period-over-period comparison.",
    heroPrimaryCta: "Analyze my MCU results",
    heroSecondaryCta: "See an example",
    heroDownloadCta: "Download the app",
    appStoreLine1: "Download on the",
    appStoreLine2: "App Store",
    playStoreLine1: "Get it on",
    playStoreLine2: "Google Play",
    socialProofText: "Used by the 20FIT community",
    heroNote: "No account needed. The analysis is fully open. A tool to UNDERSTAND, not a diagnosis.",
    heroMediaCaption: "Photo of your lab report / consultation",
    heroDisclaimer:
      "This page is a tool to understand lab results, not a diagnosis. Reference ranges differ between labs. For health decisions, consult a doctor.",

    uploadHeading: "Upload Your Results",
    uploadCardTitle: "Upload your MCU results",
    uploadCardHint: "Photo or PDF of your lab report",
    uploadSampleLink: "Or use a sample lab result",
    consentLabel:
      "I understand this file will be processed by AI for analysis, and the result is not stored anywhere.",
    errConsent: "Please check the consent box above first.",
    ephemeralNote: "This result is shown once and is not stored. Create a 20FIT account to save your history.",
    step1Title: "Upload your report",
    step1Desc: "Photo or PDF from any laboratory.",
    step2Title: "Markers recognized",
    step2Desc: "The system matches marker names, values, and reference ranges.",
    step3Title: "Read the explanation",
    step3Desc: "Each marker is explained in plain language, with no diagnostic conclusion.",

    whyHeading: "Why Use 20FIT's MCU Guide",
    whySubtitle: "What you can read without an account, and what needs one because it requires history.",
    whyMediaCaption: "Screenshot of an MCU analysis result",
    lockedBadge: "Account needed",
    callouts: [
      {
        title: "Read lab markers without a dictionary",
        desc: "Upload your report and each marker is explained in plain language, along with your own lab's reference range.",
        locked: false,
      },
      {
        title: "Period-over-period comparison",
        desc: "This year's MCU is compared with previous ones, so you see the direction of change, not just today's number.",
        locked: true,
      },
      {
        title: "Eating plan from your lab results",
        desc: "A diet adjustment that weighs which markers are above range.",
        locked: false,
      },
      {
        title: "Health history in one place",
        desc: "MCU results, workout data, and food logs live in the same account.",
        locked: true,
      },
    ],

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
        a: "Photo (JPG/PNG) or PDF, up to 8MB.",
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

    eduHeading: "What common lab markers mean",
    eduIntro:
      "An MCU report usually shows your value next to a normal range. Here is a short explanation of markers you'll often see. This is general education — not an assessment of your results.",
    rangeLabel: "Typical reference range",
    meaningLabel: "What it means",

    exampleHeading: "Example analysis (sample data)",
    exampleIntro: "This is what an analysis looks like. The numbers below are FICTIONAL — an example only.",
    sampleBadge: "This is an example — not your data",

    memberHeading: "Analyze your MCU results",
    memberIntroAnon:
      "To analyze your own MCU results, sign in to your 20FIT account first. Your file is processed securely and never stored.",
    memberIntroMember:
      "Upload a photo or PDF of your MCU. It is processed in your browser then analyzed — the original file is not stored, only the summary.",
    loginCta: "Sign in / Register to analyze",
    uploadCta: "Choose your MCU file",
    uploadHint: "Photo (JPG/PNG) or PDF, max 8MB. Files are not stored.",
    analyzeButton: "Analyze now",
    analyzing: "Analyzing… this can take up to ~1.5 minutes.",
    historyHeading: "Your analysis history",
    historyEmpty: "No history yet. Your analyses will appear here.",
    signOut: "Sign out",
    signedInAs: "Signed in as",

    errFile: "Please choose a file first.",
    errTooLarge: "File is too large (max 8MB). Please shrink it first.",
    errType: "File type not supported. Use JPG, PNG, or PDF.",
    errNetwork: "Couldn't connect. Check your connection and try again.",
    errGeneric: "Something went wrong. Please try again.",
    errSave: "Analysis succeeded but couldn't be saved to your history.",

    footerDisclaimer:
      "medicalcheckup.20fit.id helps you UNDERSTAND lab results. It is not a diagnosis and not a substitute for a doctor's advice.",
    footerBackToApp: "Open my.20fit.id",
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
