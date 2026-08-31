// Fictional sample MCU result in the spec §4 shape. Rendered by the SAME
// renderer used for real results, so the example is faithful to the real thing.
// The patient name is deliberately a placeholder, not a real-sounding person
// (spec §0.4). All numbers are invented for illustration only.

const SAMPLE = {
  id: {
    document_type: "Hasil Medical Check-Up (contoh)",
    patient_name: "Contoh Pasien",
    date: "12 Agustus 2026",
    summary:
      "Sebagian besar penanda dalam rentang normal, dengan kolesterol total dan gula darah puasa sedikit di atas rentang rujukan. Ini contoh untuk ilustrasi, bukan penilaian medis.",
    parameters: [
      { label: "Kolesterol Total", value: "228 mg/dL", normal_range: "< 200 mg/dL", status: "attention", direction: "high", explanation: "Gambaran keseluruhan lemak kolesterol dalam darah." },
      { label: "HDL", value: "52 mg/dL", normal_range: "> 40 mg/dL", status: "normal", direction: "normal", explanation: "Kolesterol “baik” yang membantu membersihkan pembuluh darah." },
      { label: "LDL", value: "150 mg/dL", normal_range: "< 100 mg/dL", status: "attention", direction: "high", explanation: "Kolesterol yang cenderung menumpuk bila terlalu tinggi." },
      { label: "Gula Darah Puasa", value: "108 mg/dL", normal_range: "70–100 mg/dL", status: "attention", direction: "high", explanation: "Kadar gula setelah puasa; sedikit di atas rentang." },
      { label: "Tekanan Darah", value: "118/78 mmHg", normal_range: "~120/80 mmHg", status: "normal", direction: "normal", explanation: "Beban kerja jantung saat memompa darah." },
      { label: "Hemoglobin", value: "14,6 g/dL", normal_range: "13–17 g/dL", status: "normal", direction: "normal", explanation: "Protein pembawa oksigen di sel darah merah." },
    ],
    abnormal_findings: [
      { label: "Kolesterol Total", value: "228 mg/dL", severity: "ringan", why_it_matters: "Nilai di atas rujukan berkaitan dengan risiko jantung jangka panjang.", what_to_do: "Kurangi gorengan & makanan berlemak jenuh, perbanyak serat." },
      { label: "Gula Darah Puasa", value: "108 mg/dL", severity: "ringan", why_it_matters: "Berada di kisaran yang sering disebut prediabetes.", what_to_do: "Batasi minuman manis; tanyakan pemeriksaan lanjutan ke dokter." },
    ],
    eating_plan: [
      "Perbanyak sayur dan buah berserat setiap kali makan.",
      "Pilih sumber protein tanpa lemak (ikan, ayam tanpa kulit, tahu/tempe).",
      "Kurangi gorengan, santan kental, dan minuman manis.",
      "Ganti nasi putih sebagian dengan biji-bijian utuh.",
    ],
    exercise_plan: [
      "Jalan cepat 30 menit, 5 kali seminggu.",
      "Latihan kekuatan 2 kali seminggu.",
      "Kurangi duduk lama — berdiri/gerak tiap 1 jam.",
    ],
    lifestyle_plan: [
      "Tidur 7–8 jam agar metabolisme lebih stabil.",
      "Kelola stres dengan latihan napas atau hobi.",
    ],
    unreadable: [],
    disclaimer:
      "Alat ini membantu kamu MEMAHAMI hasil lab — bukan alat diagnosis dan bukan pengganti dokter. Untuk keputusan kesehatan, konsultasikan ke dokter.",
  },
  en: {
    document_type: "Medical Check-Up result (example)",
    patient_name: "Sample Patient",
    date: "12 August 2026",
    summary:
      "Most markers are within the normal range, with total cholesterol and fasting blood sugar slightly above the reference range. This is an illustrative example, not a medical assessment.",
    parameters: [
      { label: "Total Cholesterol", value: "228 mg/dL", normal_range: "< 200 mg/dL", status: "attention", direction: "high", explanation: "An overall picture of cholesterol in the blood." },
      { label: "HDL", value: "52 mg/dL", normal_range: "> 40 mg/dL", status: "normal", direction: "normal", explanation: "The “good” cholesterol that helps clear blood vessels." },
      { label: "LDL", value: "150 mg/dL", normal_range: "< 100 mg/dL", status: "attention", direction: "high", explanation: "Cholesterol that tends to build up when too high." },
      { label: "Fasting Blood Sugar", value: "108 mg/dL", normal_range: "70–100 mg/dL", status: "attention", direction: "high", explanation: "Sugar level after fasting; slightly above range." },
      { label: "Blood Pressure", value: "118/78 mmHg", normal_range: "~120/80 mmHg", status: "normal", direction: "normal", explanation: "The heart's workload while pumping blood." },
      { label: "Hemoglobin", value: "14.6 g/dL", normal_range: "13–17 g/dL", status: "normal", direction: "normal", explanation: "The oxygen-carrying protein in red blood cells." },
    ],
    abnormal_findings: [
      { label: "Total Cholesterol", value: "228 mg/dL", severity: "ringan", why_it_matters: "Above the reference range relates to long-term heart risk.", what_to_do: "Cut fried & saturated-fat foods, add more fiber." },
      { label: "Fasting Blood Sugar", value: "108 mg/dL", severity: "ringan", why_it_matters: "In the range often called prediabetes.", what_to_do: "Limit sugary drinks; ask a doctor about follow-up testing." },
    ],
    eating_plan: [
      "Add fibrous vegetables and fruit to every meal.",
      "Choose lean protein (fish, skinless chicken, tofu/tempeh).",
      "Cut fried food, rich coconut milk, and sugary drinks.",
      "Swap some white rice for whole grains.",
    ],
    exercise_plan: [
      "Brisk walk 30 minutes, 5 times a week.",
      "Strength training twice a week.",
      "Sit less — stand/move every hour.",
    ],
    lifestyle_plan: [
      "Sleep 7–8 hours for steadier metabolism.",
      "Manage stress with breathing exercises or a hobby.",
    ],
    unreadable: [],
    disclaimer:
      "This tool helps you UNDERSTAND your lab results — it is not a diagnosis and not a substitute for a doctor. For any health decision, consult a doctor.",
  },
};

export function getSample(lang) {
  return SAMPLE[lang === "en" ? "en" : "id"];
}
