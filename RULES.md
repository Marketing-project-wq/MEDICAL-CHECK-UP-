# RULES — medicalscanner.20fit.id

Aturan resmi yang WAJIB diikuti semua developer dan AI yang bekerja di project ini
(medicalscanner.20fit.id — "Medical Record", klon dari my.20fit.id/medical).

---

## Aturan #1: DILARANG KERAS MENDIAGNOSA

Sistem ini HANYA membaca dan menjelaskan nilai yang tertera di hasil Medical Check-Up
user. Sistem ini BUKAN dokter, BUKAN pendiagnosa, BUKAN penasihat medis.

### DILARANG:
- Mendiagnosa kondisi medis apapun
- Bilang user "menderita", "mengidap", "terkena", "kemungkinan punya" penyakit/kondisi tertentu
- Meresepkan obat, suplemen, dosis, atau treatment
- Bilang "Anda harus/perlu [tindakan medis tertentu]"
- Membuat kesimpulan klinis dari gabungan beberapa nilai
- Memprediksi risiko penyakit spesifik berdasarkan hasil lab
- Bilang "hasil ini menandakan penyakit X"
- Mengaitkan gejala dengan diagnosis

### BOLEH:
- Membaca dan menampilkan nilai-nilai yang tertera di hasil MCU
- Menjelaskan arti setiap parameter lab dalam bahasa awam
  (contoh: "Hemoglobin adalah protein dalam sel darah merah yang membawa oksigen")
- Menandai nilai yang di atas, di bawah, atau dalam rentang normal
  (berdasarkan rentang referensi yang TERCETAK di hasil MCU itu sendiri)
- Menjelaskan secara UMUM apa arti nilai tinggi/rendah pada parameter tersebut
  (pengetahuan umum, bukan diagnosis)
- Menyarankan user untuk konsultasi ke dokter untuk interpretasi lebih lanjut
- Menerjemahkan istilah medis ke bahasa yang dipilih user

### Format kalimat yang AMAN:
- "Nilai ini berada di atas rentang normal."
- "Secara umum, [parameter] yang tinggi dapat berkaitan dengan berbagai faktor."
- "Konsultasikan dengan dokter Anda untuk interpretasi yang sesuai dengan kondisi Anda."
- "Nilai Anda berada dalam rentang normal."

### Format kalimat yang DILARANG:
- "Anda menderita diabetes."
- "Ini menandakan penyakit jantung."
- "Kemungkinan Anda terkena anemia."
- "Anda harus minum obat X."
- "Kolesterol tinggi dan gula tinggi berarti Anda berisiko serangan jantung."

### Bagaimana aturan ini ditegakkan di kode:
- Prompt AI (extraction + explanation) ada di edge function `my20fit-ai` (Supabase),
  DIPAKAI BERSAMA dengan my.20fit.id/medical dan sudah menerapkan aturan "no diagnosis,
  no disease name" di `MCU_SYS`. **JANGAN ubah prompt itu.** medicalscanner memanggil AI
  lewat `/api/mcu` → my.20fit.id/api/mcu → edge yang sama (prompt sama, hasil sama).
- Disclaimer selalu dirender di setiap hasil (lihat Aturan #4).

---

## Aturan #2: HANYA TERIMA FOTO MCU

Sistem hanya boleh memproses foto/PDF yang merupakan hasil Medical Check-Up atau hasil
laboratorium. Foto lain (selfie, makanan, dokumen non-medis, dll) harus DITOLAK.

### Bagaimana aturan ini ditegakkan di kode:
- **Validasi gambar sebelum extraction** (`src/server/mcuProxy.js` → `validateMcuImage`):
  gambar dicek oleh model vision murah; kalau `is_mcu:false` → `POST /api/mcu` balas
  `400 { error: "invalid_photo" }` SEBELUM memanggil extraction. Butuh env
  `OPENROUTER_API_KEY` (opsional). FAIL-OPEN: tanpa key / kalau validasi error, upload
  tetap lanjut — hasil sungguhan tidak pernah diblokir oleh guard-nya sendiri.
- **Jaring pengaman tanpa-key**: kalau extraction sukses tapi menghasilkan 0 parameter
  dan 0 abnormal_findings (bukan hasil lab yang terbaca), server balas
  `422 { error: "invalid_photo" }`.
- Client (`src/client/medical.js`) menampilkan kartu "Foto tidak valid" + daftar jenis
  file yang diterima + tombol "Coba Upload Lagi" saat menerima `invalid_photo`.

---

## Aturan #3: PRIVASI DATA

- Hasil MCU = data medis pribadi.
- File gambar/PDF TIDAK disimpan ke storage — hanya data JSON hasil ekstraksi yang
  ditulis ke tabel `my20fit_mcu_result` (kolom `result` jsonb). Gambar diproses
  (di-resize/di-render di browser) lalu dikirim untuk dibaca, tidak diarsipkan.
- Semua data dilindungi RLS di Supabase: policy `auth.uid() = auth_user_id` untuk
  SELECT/INSERT/UPDATE/DELETE — hanya pemilik yang bisa akses barisnya sendiri.
- Tidak ada admin view untuk lihat hasil MCU orang lain via API app ini.
- Tidak ada logging isi hasil MCU ke console/analytics/error tracking.
- Kredensial server-side (service-role key, dsb.) tidak pernah dikirim ke browser.
  medicalscanner bahkan tidak butuh service-role key untuk scan (auth diverifikasi
  oleh my.20fit.id lewat token member yang diteruskan).

---

## Aturan #4: DISCLAIMER WAJIB

Disclaimer berikut HARUS tampil di setiap tampilan hasil scan (dirender oleh
`src/shared/renderMedical.js` — selalu ada, tidak bisa dimatikan):

> Hasil pembacaan ini BUKAN diagnosis medis. Sistem ini hanya membantu Anda membaca
> dan memahami nilai-nilai yang tertera pada hasil MCU Anda. Untuk interpretasi klinis
> dan tindak lanjut, silakan konsultasikan dengan dokter Anda.

Di UI, disclaimer ini memakai ikon SVG + teks — TIDAK memakai emoji (aturan produk:
jangan pakai emoji; pakai ikon SVG / simbol tipografis minimalis saja).

---

## Aturan #5: SINKRON DENGAN my.20fit.id — SATU SUMBER DATA

- Pakai tabel Supabase yang SAMA (`my20fit_mcu_result`) dan bentuk `result` yang SAMA
  (`parameters` / `abnormal_findings` / `eating_plan` / `exercise_plan` / `document_type`
  / `patient_name` / `date` / `summary` / `disclaimer` / `unreadable`).
- JANGAN bikin tabel baru, JANGAN ubah bentuk `result`, JANGAN bikin prompt AI baru
  untuk extraction/explanation. Scan di medicalscanner harus muncul identik di
  my.20fit.id/medical, dan sebaliknya.
