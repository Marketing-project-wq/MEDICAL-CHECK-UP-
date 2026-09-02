// mcu.20fit.id-ORIGINAL health articles (drafts).
//
// These are AI-drafted, GENERAL health-literacy articles written for this
// subdomain's mission ("help laypeople understand their MCU results"). They
// are NOT medical advice and NOT diagnostic — every article page already
// renders the shared "not a diagnosis" disclaimer + the doctor escalation.
//
// They are separate from public.media_articles (the real WordPress pipeline):
// `published_url` is null, so each renders SELF-canonical on mcu (mcu-original,
// no SEO cannibalization). The article store lists these FIRST, then the
// media_articles rows.
//
// ⚠️ REVIEW BEFORE PUBLISHING: a human (ideally the 20FIT medical team) should
// read/edit these for accuracy and tone before they go live. Content is kept
// general and hedged on purpose; no statistics, studies, or quotes are
// invented.

export const LOCAL_ARTICLES = [
  {
    title: "Cara Membaca Hasil Medical Check-Up (MCU) untuk Pemula",
    slug: "cara-membaca-hasil-mcu-untuk-pemula",
    category: "edukasi",
    author_name: "Tim 20FIT",
    published_at: "2026-09-01T09:00:00Z",
    published_url: null,
    excerpt:
      "Bingung lihat lembar hasil MCU yang penuh angka? Ini panduan sederhana memahami bagian-bagiannya tanpa panik.",
    meta_description:
      "Panduan pemula membaca hasil medical check-up (MCU): bagian laporan, arti nilai rujukan, dan kapan harus ke dokter.",
    body_html: `<p>Menerima lembar hasil medical check-up (MCU) yang penuh angka dan istilah bisa terasa membingungkan. Kabar baiknya, kamu tidak perlu jadi dokter untuk memahami gambaran besarnya. Artikel ini membantu kamu membaca hasil MCU dengan lebih tenang — dengan catatan penting: ini alat bantu memahami, bukan pengganti penjelasan dokter.</p>

<h2>Kenali bagian-bagian laporan</h2>
<p>Sebagian besar laporan MCU terdiri dari beberapa bagian yang mirip di banyak laboratorium:</p>
<ul>
<li><strong>Data diri &amp; tanggal periksa</strong> — pastikan nama dan tanggalnya benar.</li>
<li><strong>Hasil pemeriksaan laboratorium</strong> — misalnya darah dan urin (gula darah, kolesterol, fungsi hati, fungsi ginjal, dan lain-lain).</li>
<li><strong>Pemeriksaan fisik</strong> — tekanan darah, berat &amp; tinggi badan, kadang penglihatan atau pendengaran.</li>
<li><strong>Kesimpulan &amp; saran</strong> — ringkasan dari dokter pemeriksa.</li>
</ul>

<h2>Perhatikan kolom "nilai rujukan"</h2>
<p>Di sebelah tiap hasil biasanya ada kolom <em>nilai rujukan</em> (reference range) — kisaran yang dianggap umum untuk kebanyakan orang. Bandingkan hasilmu dengan kisaran itu. Sebagian lab menandai nilai yang berada di luar kisaran dengan huruf <strong>H</strong> (tinggi) atau <strong>L</strong> (rendah), atau menyorotnya dengan warna.</p>
<p>Satu hal yang sering bikin salah paham: <strong>rentang rujukan bisa sedikit berbeda antar laboratorium</strong> (karena metode dan alat yang berbeda). Jadi selalu baca angka rujukan yang tercetak di lembarmu sendiri, bukan angka dari sumber lain.</p>

<h2>Nilai di luar rentang ≠ langsung sakit</h2>
<p>Nilai yang sedikit di luar rentang belum tentu berarti ada penyakit — bisa dipengaruhi banyak hal seperti puasa/tidak, aktivitas, obat, atau kondisi sesaat. Sebaliknya, hasil yang "normal" pun bukan jaminan bebas risiko. Yang penting adalah <strong>pola dan konteks</strong>, dan itu paling tepat dinilai oleh dokter yang tahu riwayat kesehatanmu.</p>

<h2>Langkah praktis</h2>
<ul>
<li>Baca bagian <strong>kesimpulan/saran</strong> lebih dulu untuk gambaran umum.</li>
<li>Tandai hasil yang di luar rentang untuk ditanyakan.</li>
<li>Simpan hasilmu supaya bisa dibandingkan dari waktu ke waktu — tren sering lebih berarti daripada satu angka.</li>
<li>Kalau ada yang membuatmu khawatir, <strong>konsultasikan ke dokter</strong> — jangan mendiagnosis diri sendiri dari internet.</li>
</ul>

<p>Alat di 20FIT dibuat untuk membantumu <em>memahami</em> hasil MCU dengan bahasa yang lebih mudah — bukan untuk memberi diagnosis. Untuk keputusan kesehatan, dokter tetap sumber yang tepat.</p>`,
  },
  {
    title: "Apa Itu BMI, dan Kenapa Angka Ini Bukan Segalanya",
    slug: "apa-itu-bmi-dan-kenapa-bukan-segalanya",
    category: "edukasi",
    author_name: "Tim 20FIT",
    published_at: "2026-08-28T09:00:00Z",
    published_url: null,
    excerpt:
      "BMI sering dipakai untuk menilai berat badan, tapi angka ini punya keterbatasan penting. Ini cara menyikapinya.",
    meta_description:
      "Penjelasan BMI: rumus, kategori WHO, keterbatasannya (otot vs lemak), dan indikator pelengkap seperti lingkar pinggang.",
    body_html: `<p>BMI (Body Mass Index) atau Indeks Massa Tubuh adalah salah satu angka yang paling sering muncul saat bicara berat badan. Angkanya mudah dihitung, tapi memahami <em>apa yang bisa dan tidak bisa</em> dikatakannya sama pentingnya dengan angka itu sendiri.</p>

<h2>Bagaimana BMI dihitung</h2>
<p>BMI adalah berat badan (kilogram) dibagi tinggi badan (meter) kuadrat. Contoh: berat 65 kg dan tinggi 1,70 m → 65 ÷ (1,70 × 1,70) ≈ 22,5.</p>
<p>Kategori umum menurut WHO (internasional): kurang dari 18,5 = berat kurang; 18,5–24,9 = normal; 25–29,9 = berlebih; 30 ke atas = obesitas. Untuk populasi Asia, banyak pedoman memakai ambang yang sedikit lebih rendah (misalnya "berlebih" mulai sekitar BMI 23), sehingga angka pastinya sebaiknya dibicarakan dengan dokter.</p>

<h2>Kenapa BMI bukan segalanya</h2>
<p>BMI hanya membandingkan berat dengan tinggi — ia <strong>tidak bisa membedakan otot dari lemak</strong>, dan tidak melihat di mana lemak tersimpan. Akibatnya:</p>
<ul>
<li>Orang yang sangat berotot (misalnya atlet) bisa punya BMI "tinggi" padahal lemak tubuhnya rendah.</li>
<li>Sebaliknya, seseorang dengan BMI "normal" belum tentu bebas risiko jika lemak perutnya banyak.</li>
<li>Pada lansia, komposisi tubuh berubah sehingga BMI bisa kurang menggambarkan kondisi sebenarnya.</li>
</ul>

<h2>Indikator pelengkap yang sederhana</h2>
<p>Salah satu pelengkap yang mudah adalah <strong>rasio lingkar pinggang terhadap tinggi badan</strong>: usahakan lingkar pinggang kurang dari setengah tinggi badanmu (rasio di bawah 0,5). Ini memberi gambaran tambahan tentang lemak di area perut, yang tidak terlihat dari BMI saja.</p>

<h2>Cara menyikapinya</h2>
<p>Anggap BMI sebagai <strong>titik awal</strong>, bukan vonis. Ia berguna untuk melihat tren dari waktu ke waktu, tapi tidak menggantikan pemeriksaan menyeluruh. Kalau kamu ingin menilai kondisi tubuh dengan lebih tepat — termasuk komposisi otot dan lemak, atau rencana latihan yang sesuai — bicarakan dengan dokter atau pelatih yang berkompeten.</p>

<p>Kamu bisa mencoba perkiraan BMI di halaman utama 20FIT sebagai alat awareness. Ingat, itu gambaran kasar untuk edukasi, bukan diagnosa.</p>`,
  },
  {
    title: "Mengenal Penanda Umum di Hasil Lab MCU",
    slug: "mengenal-penanda-umum-di-hasil-lab-mcu",
    category: "edukasi",
    author_name: "Tim 20FIT",
    published_at: "2026-08-25T09:00:00Z",
    published_url: null,
    excerpt:
      "Gula darah, kolesterol, tekanan darah, fungsi hati &amp; ginjal — apa arti kasar penanda yang sering muncul di MCU.",
    meta_description:
      "Penjelasan umum penanda lab yang sering ada di MCU: gula darah, kolesterol, tekanan darah, fungsi hati, ginjal, asam urat.",
    body_html: `<p>Hasil MCU biasanya memuat sejumlah "penanda" (parameter) yang mengukur aspek kesehatan berbeda. Berikut gambaran <em>umum</em> beberapa yang paling sering muncul. Tujuannya membantu kamu mengenali istilahnya — bukan untuk menilai kondisimu sendiri. Angka pastinya, dan artinya untukmu, tetap perlu dibaca bersama dokter karena rentang rujukan berbeda antar laboratorium.</p>

<h2>Gula darah (glukosa)</h2>
<p>Sering diperiksa dalam kondisi puasa. Memberi gambaran kasar bagaimana tubuh mengelola gula. Nilai yang konsisten tinggi biasanya jadi alasan untuk pemeriksaan lanjutan terkait risiko diabetes — namun satu hasil saja tidak cukup untuk menyimpulkan apa pun.</p>

<h2>Profil lipid (kolesterol)</h2>
<p>Biasanya mencakup beberapa angka:</p>
<ul>
<li><strong>Kolesterol total</strong> — jumlah keseluruhan.</li>
<li><strong>LDL</strong> — sering disebut kolesterol "jahat" karena kadar tinggi dikaitkan dengan risiko penyumbatan pembuluh darah.</li>
<li><strong>HDL</strong> — kolesterol "baik" yang bersifat lebih protektif.</li>
<li><strong>Trigliserida</strong> — jenis lemak lain dalam darah.</li>
</ul>
<p>Profil lipid berkaitan dengan kesehatan jantung dan pembuluh darah, dan sebaiknya dinilai secara keseluruhan, bukan satu angka saja.</p>

<h2>Tekanan darah</h2>
<p>Ditulis sebagai dua angka (sistolik/diastolik), misalnya 120/80 mmHg. Tekanan darah bisa naik-turun karena aktivitas, stres, atau kafein, sehingga penilaian yang baik biasanya butuh lebih dari satu pengukuran.</p>

<h2>Fungsi hati dan ginjal</h2>
<p>Penanda seperti <strong>SGOT/SGPT</strong> memberi gambaran tentang hati, sementara <strong>ureum</strong> dan <strong>kreatinin</strong> berkaitan dengan ginjal. Nilai di luar rentang bisa dipengaruhi banyak faktor sementara dan perlu konteks klinis untuk ditafsirkan.</p>

<h2>Penanda umum lain</h2>
<ul>
<li><strong>Asam urat</strong> — kadar tinggi kadang dikaitkan dengan keluhan nyeri sendi pada sebagian orang.</li>
<li><strong>Hemoglobin</strong> — bagian dari pemeriksaan darah yang berkaitan dengan kemampuan darah membawa oksigen.</li>
</ul>

<h2>Intinya</h2>
<p>Setiap penanda hanyalah satu potong gambaran. Yang penting adalah <strong>keseluruhan pola</strong>, riwayat kesehatanmu, dan interpretasi dari tenaga medis. Kalau ada hasil yang membuatmu khawatir, jangan menyimpulkan sendiri — <strong>konsultasikan ke dokter 20FIT</strong> untuk penjelasan yang sesuai dengan kondisimu.</p>`,
  },
];
