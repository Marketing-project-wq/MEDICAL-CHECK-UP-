// Fictional sample MCU result, in the SAME shape returned by the real
// my.20fit.id /api/analyze-mcu endpoint. Rendered by the SAME renderer used
// for real results, so the example is faithful to the real thing.
// The patient name is deliberately a placeholder, not a real-sounding person.
// All numbers are invented for illustration only.

const SAMPLE = {
  id: {
    patient_name: "Contoh Pasien",
    reviewed_at: "12 Agustus 2026",
    grade: "B",
    summary:
      "Sebagian besar penanda dalam rentang normal, dengan kolesterol total dan gula darah puasa sedikit di atas rentang rujukan. Ini contoh untuk ilustrasi, bukan penilaian medis.",
    metrics: [
      { label: "Kolesterol Total", value: "228 mg/dL", status: "high", note: "Di atas rentang < 200 mg/dL." },
      { label: "HDL", value: "52 mg/dL", status: "ok", note: "Kolesterol “baik”, di atas 40 mg/dL." },
      { label: "LDL", value: "150 mg/dL", status: "high", note: "Di atas rentang optimal < 100 mg/dL." },
      { label: "Gula Darah Puasa", value: "108 mg/dL", status: "warning", note: "Sedikit di atas 70–100 mg/dL." },
      { label: "Tekanan Darah", value: "118/78 mmHg", status: "ok", note: "Dalam rentang sehat." },
      { label: "Hemoglobin", value: "14,6 g/dL", status: "ok", note: "Dalam rentang 13–17 g/dL." },
    ],
    recommendations: [
      "Kurangi gorengan, santan kental, dan minuman manis.",
      "Perbanyak sayur dan buah berserat setiap kali makan.",
      "Batasi minuman manis; tanyakan pemeriksaan lanjutan ke dokter soal gula darah.",
    ],
    checklist: [
      { icon: "🥗", title: "Perbanyak serat harian", reason: "Membantu menurunkan kolesterol total secara bertahap.", priority: "high", duration: null, location: null },
      { icon: "🚶", title: "Jalan cepat 30 menit", reason: "Latihan kardio ringan yang aman untuk profil lab ini.", priority: "med", duration: "30 menit", location: "gym" },
      { icon: "💧", title: "Kurangi minuman manis", reason: "Berkontribusi pada gula darah puasa yang sedikit tinggi.", priority: "med", duration: null, location: "home" },
      { icon: "🩺", title: "Cek ulang gula darah 3 bulan lagi", reason: "Memantau apakah sudah masuk kisaran prediabetes.", priority: "low", duration: null, location: "clinic" },
    ],
    doctor_notes:
      "Profil lipid dan gula darah puasa perlu dipantau. Tidak ada temuan yang mengkhawatirkan secara akut.",
  },
  en: {
    patient_name: "Sample Patient",
    reviewed_at: "12 August 2026",
    grade: "B",
    summary:
      "Most markers are within the normal range, with total cholesterol and fasting blood sugar slightly above the reference range. This is an illustrative example, not a medical assessment.",
    metrics: [
      { label: "Total Cholesterol", value: "228 mg/dL", status: "high", note: "Above the < 200 mg/dL range." },
      { label: "HDL", value: "52 mg/dL", status: "ok", note: "The “good” cholesterol, above 40 mg/dL." },
      { label: "LDL", value: "150 mg/dL", status: "high", note: "Above the optimal < 100 mg/dL range." },
      { label: "Fasting Blood Sugar", value: "108 mg/dL", status: "warning", note: "Slightly above 70–100 mg/dL." },
      { label: "Blood Pressure", value: "118/78 mmHg", status: "ok", note: "Within a healthy range." },
      { label: "Hemoglobin", value: "14.6 g/dL", status: "ok", note: "Within the 13–17 g/dL range." },
    ],
    recommendations: [
      "Cut fried food, rich coconut milk, and sugary drinks.",
      "Add fibrous vegetables and fruit to every meal.",
      "Limit sugary drinks; ask a doctor about follow-up blood sugar testing.",
    ],
    checklist: [
      { icon: "🥗", title: "Add more daily fiber", reason: "Helps gradually lower total cholesterol.", priority: "high", duration: null, location: null },
      { icon: "🚶", title: "Brisk walk 30 minutes", reason: "A light cardio routine that's safe for this lab profile.", priority: "med", duration: "30 minutes", location: "gym" },
      { icon: "💧", title: "Cut sugary drinks", reason: "A contributor to the slightly elevated fasting blood sugar.", priority: "med", duration: null, location: "home" },
      { icon: "🩺", title: "Re-test blood sugar in 3 months", reason: "To monitor whether it's moving into the prediabetes range.", priority: "low", duration: null, location: "clinic" },
    ],
    doctor_notes:
      "Lipid profile and fasting blood sugar warrant monitoring. No acutely concerning findings.",
  },
};

export function getSample(lang) {
  return SAMPLE[lang === "en" ? "en" : "id"];
}
