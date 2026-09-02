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
  {
    title: "Kenapa Medical Check-Up Rutin Itu Penting",
    slug: "kenapa-medical-check-up-rutin-itu-penting",
    category: "edukasi",
    author_name: "Tim 20FIT",
    published_at: "2026-09-02T09:00:00Z",
    published_url: null,
    excerpt:
      "MCU bukan cuma buat yang sudah sakit. Ini alasan pemeriksaan rutin berguna, dan bagaimana menyikapinya secara sehat.",
    meta_description:
      "Kenapa medical check-up (MCU) rutin penting: memantau tren kesehatan, membaca hasil dari waktu ke waktu, dan kapan berkonsultasi dengan dokter.",
    body_html: `<p>Banyak orang baru memeriksakan kesehatan saat sudah merasa ada yang tidak beres. Medical check-up (MCU) rutin punya sudut pandang berbeda: memberi <em>gambaran berkala</em> tentang tubuhmu, bahkan saat kamu merasa baik-baik saja. Artikel ini menjelaskan mengapa itu berguna — tanpa menakut-nakuti, dan tanpa menggantikan penilaian dokter.</p>

<h2>Tren lebih berbicara daripada satu angka</h2>
<p>Nilai kesehatan bisa berubah perlahan dari tahun ke tahun. Dengan memeriksa secara berkala, kamu dan dokter bisa melihat <strong>arah perubahan</strong> — apakah suatu angka cenderung naik, turun, atau stabil. Satu hasil tunggal hanya potret sesaat; rangkaian hasil dari waktu ke waktu memberi konteks yang jauh lebih berarti.</p>

<h2>Membantu percakapan dengan dokter</h2>
<p>Hasil MCU yang tercatat rapi memudahkan dokter memahami kondisimu: apa yang biasa untukmu, apa yang berubah, dan apa yang perlu diperhatikan. Ini bukan soal mendiagnosis diri sendiri, melainkan menyediakan bahan yang baik untuk <strong>dibicarakan bersama tenaga medis</strong>.</p>

<h2>Seberapa sering perlu MCU?</h2>
<p>Tidak ada satu jawaban yang cocok untuk semua orang. Frekuensi yang tepat bergantung pada usia, riwayat kesehatan, gaya hidup, dan faktor risiko masing-masing. Karena itu, <strong>jadwal yang sesuai untukmu sebaiknya ditentukan bersama dokter</strong>, bukan mengikuti angka umum dari internet.</p>

<h2>Menyikapi hasil dengan tenang</h2>
<p>MCU rutin bukan alat untuk membuat cemas. Hasil yang di luar rentang belum tentu berarti penyakit, dan hasil "normal" bukan jaminan mutlak. Tujuannya adalah <strong>kesadaran</strong> — mengenali tubuhmu lebih baik dan tahu kapan perlu bertindak.</p>

<h2>Langkah sederhana</h2>
<ul>
<li>Simpan hasil MCU-mu supaya bisa dibandingkan dari waktu ke waktu.</li>
<li>Catat hal yang ingin kamu tanyakan sebelum bertemu dokter.</li>
<li>Jangan tunggu sampai ada keluhan untuk mulai memantau kesehatan.</li>
<li>Kalau ada hasil yang membuatmu ragu, <strong>tanyakan ke dokter</strong> daripada menebak sendiri.</li>
</ul>

<p>Alat di 20FIT dibuat untuk membantumu <em>memahami dan memantau</em> hasil MCU dari waktu ke waktu — sebagai bahan edukasi, bukan diagnosis. Untuk keputusan kesehatan, dokter tetap sumber yang tepat.</p>`,
  },
  {
    title: "Cara Menyiapkan Diri Sebelum Medical Check-Up",
    slug: "cara-menyiapkan-diri-sebelum-medical-check-up",
    category: "edukasi",
    author_name: "Tim 20FIT",
    published_at: "2026-08-20T09:00:00Z",
    published_url: null,
    excerpt:
      "Persiapan sederhana sebelum MCU bisa membuat hasilnya lebih menggambarkan kondisimu. Ini hal-hal yang umum diperhatikan.",
    meta_description:
      "Persiapan sebelum medical check-up (MCU): soal puasa, istirahat, obat rutin, dan dokumen — plus kenapa instruksi dari penyelenggara tetap yang utama.",
    body_html: `<p>Sedikit persiapan sebelum medical check-up (MCU) bisa membantu hasilnya lebih mencerminkan kondisimu sehari-hari. Yang perlu diingat: <strong>instruksi resmi dari penyelenggara MCU atau doktermu selalu yang utama</strong> — poin di bawah hanyalah gambaran umum, bukan aturan pasti yang berlaku untuk semua paket pemeriksaan.</p>

<h2>Soal puasa</h2>
<p>Beberapa pemeriksaan (misalnya gula darah atau profil lemak) kadang meminta puasa selama beberapa jam sebelumnya. Namun ketentuannya berbeda-beda antar paket dan laboratorium. Jadi <strong>ikuti petunjuk yang diberikan penyelenggara</strong>; kalau tidak ada petunjuk, tanyakan lebih dulu apakah kamu perlu puasa dan berapa lama.</p>

<h2>Istirahat yang cukup</h2>
<p>Tidur yang cukup dan menghindari aktivitas yang terlalu berat tepat sebelum pemeriksaan bisa membantu beberapa pengukuran (seperti tekanan darah) lebih menggambarkan kondisi biasamu. Rasa lelah, begadang, atau stres berlebihan kadang memengaruhi hasil sesaat.</p>

<h2>Obat dan kondisi rutin</h2>
<p>Kalau kamu rutin minum obat atau punya kondisi kesehatan tertentu, <strong>jangan menghentikan obat sendiri</strong> hanya karena akan MCU. Tanyakan lebih dulu ke dokter atau penyelenggara apakah ada yang perlu disesuaikan. Sampaikan juga riwayat kesehatanmu agar hasil bisa ditafsirkan dengan konteks yang benar.</p>

<h2>Hal praktis yang berguna</h2>
<ul>
<li>Bawa <strong>hasil MCU sebelumnya</strong> bila ada, supaya bisa dibandingkan.</li>
<li>Catat keluhan atau pertanyaan yang ingin kamu sampaikan ke dokter.</li>
<li>Kenakan pakaian yang nyaman dan mudah untuk pemeriksaan fisik.</li>
<li>Minum air secukupnya sesuai anjuran — sebagian pemeriksaan lebih mudah bila kamu cukup terhidrasi, kecuali diminta lain.</li>
</ul>

<h2>Setelah pemeriksaan</h2>
<p>Simpan hasilmu dengan rapi dan baca bagian kesimpulannya. Kalau ada yang belum jelas atau membuatmu khawatir, itulah saat yang tepat untuk <strong>berkonsultasi dengan dokter</strong> — bukan menyimpulkan sendiri dari satu angka.</p>

<p>Ingat, persiapan yang baik membantu kualitas hasil, tapi penilaian akhir tetap milik tenaga medis. Alat 20FIT hadir untuk membantumu memahami hasilnya, sebagai edukasi, bukan pengganti pemeriksaan dokter.</p>`,
  },
];
