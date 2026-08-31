// Educational content: common lab markers explained (spec §7 angle —
// UNDERSTANDING results, not "where to get an MCU"). Dependency-free ESM.
// General information with typical reference ranges; NOT a diagnosis.

const MARKERS = {
  id: [
    {
      name: "Kolesterol Total",
      range: "< 200 mg/dL",
      meaning:
        "Gambaran keseluruhan lemak kolesterol dalam darah. Nilai tinggi berkaitan dengan risiko penyakit jantung dalam jangka panjang, tapi perlu dilihat bersama LDL dan HDL, bukan berdiri sendiri.",
    },
    {
      name: "LDL (kolesterol “jahat”)",
      range: "< 100 mg/dL (optimal)",
      meaning:
        "LDL yang tinggi cenderung menumpuk di dinding pembuluh darah. Target idealnya berbeda-beda tergantung faktor risiko masing-masing orang.",
    },
    {
      name: "HDL (kolesterol “baik”)",
      range: "> 40 mg/dL (pria), > 50 mg/dL (wanita)",
      meaning:
        "HDL membantu membawa kolesterol kembali ke hati. Di sini justru nilai yang lebih tinggi umumnya lebih baik.",
    },
    {
      name: "Trigliserida",
      range: "< 150 mg/dL",
      meaning:
        "Bentuk lemak lain dalam darah, dipengaruhi pola makan (gula & karbohidrat), alkohol, dan aktivitas fisik.",
    },
    {
      name: "Gula Darah Puasa",
      range: "70–100 mg/dL",
      meaning:
        "Kadar gula setelah puasa. Nilai 100–125 sering disebut prediabetes; di atasnya perlu dibahas dengan dokter untuk pemeriksaan lanjutan.",
    },
    {
      name: "HbA1c",
      range: "< 5,7%",
      meaning:
        "Rata-rata gula darah sekitar 3 bulan terakhir. Berguna melihat tren, bukan sekadar satu titik waktu.",
    },
    {
      name: "Tekanan Darah",
      range: "sekitar 120/80 mmHg",
      meaning:
        "Angka atas (sistolik) dan bawah (diastolik). Konsisten tinggi berkaitan dengan beban kerja jantung; satu kali tinggi belum tentu berarti hipertensi.",
    },
    {
      name: "Hemoglobin (Hb)",
      range: "13–17 g/dL (pria), 12–15 g/dL (wanita)",
      meaning:
        "Protein pembawa oksigen di sel darah merah. Rendah bisa berkaitan dengan anemia; tinggi punya penyebab lain yang perlu ditelusuri.",
    },
    {
      name: "Asam Urat",
      range: "3,4–7,0 mg/dL (pria), 2,4–6,0 mg/dL (wanita)",
      meaning:
        "Hasil pemecahan purin. Tinggi berkaitan dengan risiko nyeri sendi (gout) pada sebagian orang.",
    },
    {
      name: "SGOT / SGPT (enzim hati)",
      range: "kira-kira < 40 U/L",
      meaning:
        "Enzim yang bocor ke darah saat sel hati terganggu. Sedikit di atas normal bisa punya banyak sebab; interpretasinya oleh dokter.",
    },
  ],
  en: [
    {
      name: "Total Cholesterol",
      range: "< 200 mg/dL",
      meaning:
        "An overall picture of cholesterol in the blood. A high value relates to long-term heart-disease risk, but it should be read together with LDL and HDL, not on its own.",
    },
    {
      name: "LDL (“bad” cholesterol)",
      range: "< 100 mg/dL (optimal)",
      meaning:
        "High LDL tends to build up in blood-vessel walls. The ideal target varies with each person's risk factors.",
    },
    {
      name: "HDL (“good” cholesterol)",
      range: "> 40 mg/dL (men), > 50 mg/dL (women)",
      meaning:
        "HDL helps carry cholesterol back to the liver. Here, a higher value is generally better.",
    },
    {
      name: "Triglycerides",
      range: "< 150 mg/dL",
      meaning:
        "Another form of fat in the blood, influenced by diet (sugar & carbs), alcohol, and physical activity.",
    },
    {
      name: "Fasting Blood Sugar",
      range: "70–100 mg/dL",
      meaning:
        "Sugar level after fasting. 100–125 is often called prediabetes; above that is worth discussing with a doctor for follow-up.",
    },
    {
      name: "HbA1c",
      range: "< 5.7%",
      meaning:
        "Your average blood sugar over roughly the last 3 months. Useful for seeing a trend rather than a single point in time.",
    },
    {
      name: "Blood Pressure",
      range: "around 120/80 mmHg",
      meaning:
        "The top (systolic) and bottom (diastolic) numbers. Consistently high relates to heart workload; one high reading isn't necessarily hypertension.",
    },
    {
      name: "Hemoglobin (Hb)",
      range: "13–17 g/dL (men), 12–15 g/dL (women)",
      meaning:
        "The oxygen-carrying protein in red blood cells. Low can relate to anemia; high has other causes worth investigating.",
    },
    {
      name: "Uric Acid",
      range: "3.4–7.0 mg/dL (men), 2.4–6.0 mg/dL (women)",
      meaning:
        "A product of purine breakdown. High relates to joint-pain (gout) risk in some people.",
    },
    {
      name: "SGOT / SGPT (liver enzymes)",
      range: "roughly < 40 U/L",
      meaning:
        "Enzymes that leak into the blood when liver cells are stressed. Slightly high can have many causes; interpretation is for a doctor.",
    },
  ],
};

export function getMarkers(lang) {
  return MARKERS[lang === "en" ? "en" : "id"];
}
