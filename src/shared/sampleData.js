// Fictional MCU analysis used ONLY as an on-page example, so an anonymous
// visitor can see what a real result looks like WITHOUT uploading anything
// (spec §0.1: no anonymous health data is ever processed — the example is
// invented, not derived from a real document). It is rendered by the exact
// same renderResult() the real member flow uses, so the example and a real
// analysis look identical.
//
// Shape matches my.20fit.id's POST /api/analyze-mcu response (verified
// against the my20fit-dashboard source). The patient name is obviously
// fictional and the UI marks the whole block as an example ("CONTOH" /
// "EXAMPLE"), so it can never be mistaken for a real person's result.
// Dependency-free ESM.

export function getSampleResult(lang) {
  const en = lang === "en";
  return {
    patient_name: en ? "Sample Patient" : "Contoh Pasien",
    reviewed_at: "2026-08-15",
    grade: "B",
    summary: en
      ? "Most markers are within normal range. Cholesterol and fasting blood sugar are slightly above the reference range and are worth keeping an eye on."
      : "Sebagian besar penanda dalam rentang normal. Kolesterol dan gula darah puasa sedikit di atas rentang rujukan dan sebaiknya dipantau.",
    metrics: [
      {
        label: en ? "Total Cholesterol" : "Kolesterol Total",
        value: "223 mg/dL",
        status: "high",
        note: en ? "Above the reference range (<200)." : "Di atas rentang rujukan (<200).",
      },
      {
        label: "HDL",
        value: "58 mg/dL",
        status: "ok",
        note: en ? "Good — a protective level." : "Baik — kadar yang protektif.",
      },
      {
        label: en ? "Fasting Blood Sugar" : "Gula Darah Puasa",
        value: "106 mg/dL",
        status: "warning",
        note: en ? "Slightly high (normal <100)." : "Sedikit tinggi (normal <100).",
      },
      {
        label: en ? "Blood Pressure" : "Tekanan Darah",
        value: "118/76 mmHg",
        status: "ok",
        note: en ? "Within the normal range." : "Dalam rentang normal.",
      },
      {
        label: "Hemoglobin",
        value: "14.2 g/dL",
        status: "ok",
        note: en ? "Within the normal range." : "Dalam rentang normal.",
      },
    ],
    recommendations: en
      ? [
          "Cut back on fried food and added sugar for the next few weeks.",
          "Aim for 30 minutes of movement most days.",
          "Recheck cholesterol and blood sugar in about 3 months.",
        ]
      : [
          "Kurangi gorengan dan gula tambahan beberapa minggu ke depan.",
          "Targetkan gerak 30 menit hampir setiap hari.",
          "Cek ulang kolesterol dan gula darah sekitar 3 bulan lagi.",
        ],
    checklist: [
      {
        icon: "diet",
        title: en ? "Swap one fried meal a day" : "Ganti satu menu gorengan per hari",
        reason: en ? "Helps bring cholesterol down gradually." : "Membantu menurunkan kolesterol perlahan.",
        priority: "high",
        duration: en ? "daily" : "harian",
        location: "home",
      },
      {
        icon: "walk",
        title: en ? "Brisk 30-minute walk" : "Jalan cepat 30 menit",
        reason: en ? "Supports blood sugar and heart health." : "Membantu gula darah dan kesehatan jantung.",
        priority: "med",
        duration: "30m",
        location: "gym",
      },
      {
        icon: "clinic",
        title: en ? "Follow-up lab in 3 months" : "Kontrol lab dalam 3 bulan",
        reason: en ? "Confirm the numbers are trending the right way." : "Memastikan angka bergerak ke arah yang benar.",
        priority: "low",
        location: "clinic",
      },
    ],
    doctor_notes: en
      ? "No urgent concerns. Small diet and activity changes should improve the two borderline markers before the next check-up."
      : "Tidak ada hal mendesak. Perubahan kecil pada pola makan dan aktivitas sebaiknya memperbaiki dua penanda batas sebelum pemeriksaan berikutnya.",
  };
}
