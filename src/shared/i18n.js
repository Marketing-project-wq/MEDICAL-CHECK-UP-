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
    nav: { education: "Pahami Hasil", example: "Contoh Analisa", analyze: "Analisa Punyaku" },

    heroKicker: "Literasi Kesehatan",
    heroTitle: "Pahami hasil medical check-up kamu",
    heroSubtitle:
      "Bingung baca angka-angka di hasil lab? Di sini kamu belajar arti tiap penanda, rentang normalnya, dan apa yang biasanya disarankan — dengan bahasa yang mudah.",
    heroPrimaryCta: "Analisa hasil punya saya",
    heroSecondaryCta: "Lihat contoh analisa",
    heroNote: "Alat bantu MEMAHAMI, bukan diagnosis. Keputusan kesehatan tetap ke dokter.",

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
    reanalyze: "Analisa file lain",
    translateButton: "Lihat dalam English",
    translateBack: "Lihat dalam Bahasa Indonesia",
    translating: "Menerjemahkan…",
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
    nav: { education: "Understand", example: "Example", analyze: "Analyze Mine" },

    heroKicker: "Health Literacy",
    heroTitle: "Understand your medical check-up",
    heroSubtitle:
      "Confused by the numbers on your lab report? Here you learn what each marker means, its normal range, and what is generally advised — in plain language.",
    heroPrimaryCta: "Analyze my results",
    heroSecondaryCta: "See an example",
    heroNote: "A tool to UNDERSTAND, not a diagnosis. Health decisions stay with your doctor.",

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
    reanalyze: "Analyze another file",
    translateButton: "View in Bahasa Indonesia",
    translateBack: "View in English",
    translating: "Translating…",
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

// Labels used by the shared result renderer (§4 shape).
const RENDER_LABELS = {
  id: {
    forPatient: "Untuk",
    examDate: "Tanggal periksa",
    documentType: "Jenis dokumen",
    summary: "Ringkasan",
    parameters: "Rincian penanda",
    colParameter: "Penanda",
    colValue: "Nilai",
    colRange: "Rentang normal",
    colStatus: "Status",
    statusNormal: "Normal",
    statusAttention: "Perlu perhatian",
    statusUnknown: "Tidak diketahui",
    dirHigh: "tinggi",
    dirLow: "rendah",
    dirNormal: "normal",
    abnormal: "Yang perlu perhatian",
    severityRingan: "Ringan",
    severitySedang: "Sedang",
    severityTinggi: "Tinggi",
    whyItMatters: "Kenapa penting",
    whatToDo: "Yang bisa dilakukan",
    eating: "Saran pola makan",
    exercise: "Saran olahraga",
    lifestyle: "Saran gaya hidup",
    unreadable: "Bagian yang tidak terbaca",
    disclaimerTitle: "Penting",
    noParameters: "Tidak ada penanda yang terbaca.",
  },
  en: {
    forPatient: "For",
    examDate: "Exam date",
    documentType: "Document type",
    summary: "Summary",
    parameters: "Marker details",
    colParameter: "Marker",
    colValue: "Value",
    colRange: "Normal range",
    colStatus: "Status",
    statusNormal: "Normal",
    statusAttention: "Needs attention",
    statusUnknown: "Unknown",
    dirHigh: "high",
    dirLow: "low",
    dirNormal: "normal",
    abnormal: "Things to pay attention to",
    severityRingan: "Mild",
    severitySedang: "Moderate",
    severityTinggi: "High",
    whyItMatters: "Why it matters",
    whatToDo: "What you can do",
    eating: "Eating suggestions",
    exercise: "Exercise suggestions",
    lifestyle: "Lifestyle suggestions",
    unreadable: "Parts that couldn't be read",
    disclaimerTitle: "Important",
    noParameters: "No readable markers.",
  },
};

export function getStrings(lang) {
  return STRINGS[normalizeLang(lang)];
}

export function getRenderLabels(lang) {
  return RENDER_LABELS[normalizeLang(lang)];
}
