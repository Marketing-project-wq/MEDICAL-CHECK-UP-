// A CLEARLY-FICTIONAL Medical Check-Up result, in the REAL result shape
// (parameters / abnormal_findings / eating_plan / exercise_plan …), used ONLY for
// the landing-page preview so a guest can see what a real analysis looks like
// BEFORE signing up. It is rendered by the SAME renderMedical.buildResultHTML the
// signed-in member view uses, so the preview matches the product exactly.
//
// Nothing here is real patient data or a real reference threshold — the numbers,
// ranges and text are illustrative and labelled as an example (jangan ngarang:
// this is never presented as a real person's result).

/**
 * @param {"en"|"id"} lang
 * @returns {object} a result object in the real my20fit_mcu_result shape
 */
export function getSampleMedical(lang) {
  const id = lang === "id";
  return {
    _lang: id ? "id" : "en",
    document_type: id ? "Contoh Hasil Lab" : "Sample Lab Result",
    patient_name: id ? "Contoh Pasien" : "Sample Patient",
    date: "2026-01-01",
    summary: id
      ? "Sebagian besar nilai berada dalam rentang normal; ada beberapa yang perlu diperhatikan."
      : "Most values are within the normal range; a few are worth keeping an eye on.",
    parameters: [
      {
        label: id ? "Kolesterol Total" : "Total Cholesterol",
        value: "245 mg/dL",
        normal_range: "< 200 mg/dL",
        status: "attention",
        direction: "high",
        explanation: id
          ? "Nilai ini berada di atas rentang normal yang tercetak pada dokumen."
          : "This value is above the normal range printed on the document.",
      },
      {
        label: id ? "Gula Darah Puasa" : "Fasting Blood Sugar",
        value: "92 mg/dL",
        normal_range: "70-100 mg/dL",
        status: "normal",
        direction: "normal",
        explanation: id ? "Berada dalam rentang normal." : "Within the normal range.",
      },
      {
        label: "Hemoglobin",
        value: "14.2 g/dL",
        normal_range: "13-17 g/dL",
        status: "normal",
        direction: "normal",
        explanation: id ? "Berada dalam rentang normal." : "Within the normal range.",
      },
    ],
    abnormal_findings: [
      {
        label: id ? "Kolesterol Total" : "Total Cholesterol",
        value: "245 mg/dL",
        severity: "sedang",
        why_it_matters: id
          ? "Secara umum, kolesterol yang tinggi dapat berkaitan dengan berbagai faktor kesehatan."
          : "In general, a high cholesterol value can be related to various health factors.",
        what_to_do: id
          ? "Konsultasikan dengan dokter Anda untuk interpretasi yang sesuai dengan kondisi Anda."
          : "Consult your doctor for an interpretation suited to your condition.",
      },
    ],
    eating_plan: id
      ? ["Perbanyak sayur, buah, dan serat.", "Kurangi gorengan dan makanan tinggi lemak jenuh."]
      : ["Add more vegetables, fruit and fibre.", "Cut back on fried and high-saturated-fat foods."],
    exercise_plan: id
      ? ["Aktivitas aerobik ringan-sedang secara rutin.", "Konsultasikan dulu dengan dokter/trainer 20FIT sebelum latihan berat."]
      : ["Regular light-to-moderate aerobic activity.", "Check with a 20FIT doctor/trainer before intense exercise."],
    unreadable: [],
    disclaimer: id
      ? "Ini contoh. Hasil pembacaan bukan diagnosis medis; konsultasikan ke dokter untuk interpretasi yang tepat."
      : "This is an example. The reading is not a medical diagnosis; consult a doctor for a proper interpretation.",
  };
}
