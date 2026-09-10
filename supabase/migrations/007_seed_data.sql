-- 007_seed_data.sql
-- Seed data: articles and quizzes with questions

-- ============================================================
-- ARTICLES
-- ============================================================

INSERT INTO articles (id, title, slug, excerpt, content, cover_image_url, category, tags, is_premium, read_time_minutes, author, published_at) VALUES

-- Article 1: Nutrition
(
  gen_random_uuid(),
  'Panduan Lengkap Nutrisi Seimbang untuk Hidup Lebih Sehat',
  'panduan-nutrisi-seimbang',
  'Pelajari cara menyusun pola makan seimbang yang mendukung kesehatan optimal setiap hari.',
  '## Mengapa Nutrisi Seimbang Itu Penting?

Nutrisi seimbang adalah fondasi utama dari kesehatan yang baik. Tubuh kita membutuhkan berbagai macam zat gizi untuk menjalankan fungsi-fungsi vital, mulai dari metabolisme energi hingga perbaikan sel-sel yang rusak. Tanpa asupan nutrisi yang tepat, tubuh menjadi rentan terhadap berbagai penyakit kronis seperti diabetes, hipertensi, dan penyakit jantung. Menurut data Kementerian Kesehatan RI, lebih dari 30% penduduk Indonesia masih mengalami masalah gizi, baik kekurangan maupun kelebihan.

## Komponen Piring Makan Sehat

Konsep "Isi Piringku" yang direkomendasikan oleh Kemenkes membagi porsi makan menjadi beberapa bagian penting. Separuh piring sebaiknya diisi dengan sayuran dan buah-buahan, seperempat dengan sumber karbohidrat kompleks (nasi merah, kentang, atau ubi), dan seperempat lagi dengan sumber protein (ikan, ayam, tempe, atau tahu). Jangan lupa untuk menambahkan lemak sehat dari alpukat, kacang-kacangan, atau minyak zaitun. Variasi warna makanan di piring Anda biasanya menandakan keberagaman nutrisi yang baik.

## Tips Praktis Sehari-hari

Mulailah hari dengan sarapan yang mengandung protein dan serat, seperti telur dengan roti gandum dan buah. Siapkan bekal makan siang dari rumah agar Anda bisa mengontrol bahan dan porsinya. Perbanyak minum air putih minimal 8 gelas per hari dan kurangi minuman manis. Ganti camilan tidak sehat dengan kacang almond, yogurt, atau potongan buah segar. Yang terpenting, makanlah dengan penuh kesadaran -- nikmati setiap suapan dan berhenti makan sebelum kenyang. Perubahan kecil yang konsisten akan memberikan dampak besar bagi kesehatan jangka panjang.',
  NULL,
  'nutrition',
  ARRAY['nutrisi', 'pola-makan', 'kesehatan', 'diet-sehat'],
  false,
  6,
  '20fit Team',
  now() - INTERVAL '10 days'
),

-- Article 2: Exercise
(
  gen_random_uuid(),
  'Olahraga untuk Pemula: Mulai dari Mana dan Bagaimana',
  'olahraga-untuk-pemula',
  'Panduan lengkap memulai rutinitas olahraga bagi Anda yang baru ingin memulai gaya hidup aktif.',
  '## Langkah Pertama yang Tepat

Memulai rutinitas olahraga bisa terasa menakutkan, terutama jika Anda sudah lama tidak aktif bergerak. Kabar baiknya, Anda tidak perlu langsung berlari maraton atau mengangkat beban berat. Mulailah dengan aktivitas ringan seperti jalan kaki selama 20-30 menit setiap hari. Penelitian menunjukkan bahwa jalan kaki teratur dapat menurunkan risiko penyakit jantung hingga 30% dan meningkatkan mood secara signifikan. Kuncinya adalah konsistensi, bukan intensitas di awal.

## Jenis Olahraga yang Bisa Dicoba

Ada empat kategori utama olahraga yang idealnya Anda kombinasikan setiap minggu. Pertama, latihan kardio seperti jalan cepat, bersepeda, atau berenang yang memperkuat jantung dan paru-paru. Kedua, latihan kekuatan menggunakan beban tubuh (push-up, squat, plank) atau dumbbell ringan untuk membangun massa otot. Ketiga, latihan fleksibilitas seperti yoga atau stretching untuk menjaga kelenturan sendi. Keempat, latihan keseimbangan yang penting terutama seiring bertambahnya usia. Cobalah masing-masing dan temukan kombinasi yang paling Anda nikmati.

## Membuat Jadwal yang Realistis

Target ideal menurut WHO adalah 150 menit aktivitas fisik intensitas sedang per minggu, atau sekitar 30 menit selama 5 hari. Namun, jika itu terasa berat, mulailah dengan 10 menit per hari dan tingkatkan secara bertahap. Pilih waktu yang paling nyaman buat Anda -- pagi hari sebelum beraktivitas atau sore hari setelah bekerja. Catat progres Anda di jurnal atau aplikasi kebugaran untuk melihat perkembangan. Ingat, olahraga terbaik adalah olahraga yang Anda lakukan secara rutin, bukan yang paling berat.',
  NULL,
  'exercise',
  ARRAY['olahraga', 'pemula', 'fitness', 'kardio'],
  false,
  7,
  '20fit Team',
  now() - INTERVAL '8 days'
),

-- Article 3: Mental Health
(
  gen_random_uuid(),
  'Mengelola Stres di Era Digital: Strategi untuk Kesehatan Mental',
  'mengelola-stres-era-digital',
  'Temukan cara efektif mengatasi tekanan hidup modern dan menjaga kesehatan mental Anda.',
  '## Stres di Zaman Modern

Hidup di era digital membawa banyak kemudahan, tetapi juga tekanan baru yang belum pernah dialami generasi sebelumnya. Notifikasi yang tak henti, tekanan media sosial, dan batasan antara waktu kerja dan pribadi yang semakin kabur menjadi pemicu stres kronis. Data Riset Kesehatan Dasar menunjukkan bahwa prevalensi gangguan mental emosional di Indonesia terus meningkat, terutama di kalangan usia produktif 20-40 tahun. Stres yang tidak dikelola dengan baik dapat berdampak serius pada kesehatan fisik, mulai dari gangguan tidur hingga melemahnya sistem kekebalan tubuh.

## Teknik Mengelola Stres Sehari-hari

Salah satu teknik paling efektif adalah mindfulness atau meditasi kesadaran penuh. Luangkan 5-10 menit setiap hari untuk duduk tenang, fokus pada napas, dan mengamati pikiran tanpa menghakimi. Teknik pernapasan 4-7-8 juga terbukti ampuh: tarik napas selama 4 detik, tahan 7 detik, dan hembuskan perlahan selama 8 detik. Selain itu, batasi waktu layar (screen time) Anda, terutama satu jam sebelum tidur. Coba terapkan "digital detox" selama beberapa jam di akhir pekan untuk memberikan otak Anda waktu istirahat dari stimulasi digital yang berlebihan.

## Kapan Harus Mencari Bantuan Profesional

Penting untuk mengenali tanda-tanda bahwa stres Anda sudah melampaui batas yang bisa dikelola sendiri. Jika Anda mengalami kesulitan tidur yang berkepanjangan, kehilangan minat pada aktivitas yang biasanya menyenangkan, perubahan nafsu makan yang drastis, atau perasaan putus asa yang terus-menerus selama lebih dari dua minggu, pertimbangkan untuk berkonsultasi dengan psikolog atau psikiater. Mencari bantuan profesional bukanlah tanda kelemahan, melainkan langkah berani untuk merawat diri sendiri. Banyak platform konsultasi online yang memudahkan akses ke layanan kesehatan mental saat ini.',
  NULL,
  'mental-health',
  ARRAY['stres', 'kesehatan-mental', 'mindfulness', 'digital-detox'],
  false,
  8,
  '20fit Team',
  now() - INTERVAL '6 days'
),

-- Article 4: Sleep
(
  gen_random_uuid(),
  'Rahasia Tidur Berkualitas: Bangun Segar Setiap Pagi',
  'rahasia-tidur-berkualitas',
  'Ketahui tips dan kebiasaan tidur yang membantu Anda mendapat istirahat optimal setiap malam.',
  '## Pentingnya Tidur yang Cukup

Tidur bukan sekadar istirahat pasif -- ini adalah proses biologis aktif di mana tubuh melakukan perbaikan sel, konsolidasi memori, dan regulasi hormon. Orang dewasa membutuhkan 7-9 jam tidur berkualitas setiap malam, namun survei menunjukkan bahwa rata-rata orang Indonesia hanya tidur 6,5 jam per malam. Kurang tidur kronis dikaitkan dengan peningkatan risiko obesitas (karena gangguan hormon leptin dan ghrelin), penurunan fungsi kognitif, melemahnya sistem imun, dan bahkan peningkatan risiko penyakit kardiovaskular.

## Membangun Sleep Hygiene yang Baik

Sleep hygiene atau kebersihan tidur adalah serangkaian kebiasaan yang mendukung tidur berkualitas. Pertama, tetapkan jadwal tidur dan bangun yang konsisten, termasuk di akhir pekan -- ini membantu mengatur ritme sirkadian tubuh. Kedua, ciptakan lingkungan tidur yang optimal: kamar gelap, suhu sejuk (sekitar 18-22 derajat Celsius), dan sunyi. Gunakan kasur dan bantal yang nyaman. Ketiga, hindari kafein setelah pukul 14.00 dan hindari alkohol menjelang tidur -- meskipun alkohol membuat mengantuk, ia justru mengganggu kualitas tidur di paruh malam kedua.

## Rutinitas Sebelum Tidur

Bangun rutinitas "wind-down" selama 30-60 menit sebelum tidur. Matikan semua layar elektronik karena cahaya biru dari gadget menekan produksi melatonin, hormon yang mengatur siklus tidur. Sebagai gantinya, cobalah membaca buku fisik, mendengarkan musik yang menenangkan, melakukan peregangan ringan, atau menulis jurnal gratitude. Mandi air hangat 1-2 jam sebelum tidur juga terbukti membantu karena penurunan suhu tubuh setelahnya memberi sinyal pada otak bahwa waktunya tidur. Jika Anda tidak bisa tidur setelah 20 menit berbaring, bangunlah dan lakukan aktivitas tenang di ruangan lain hingga merasa mengantuk.',
  NULL,
  'sleep',
  ARRAY['tidur', 'sleep-hygiene', 'istirahat', 'insomnia'],
  false,
  7,
  '20fit Team',
  now() - INTERVAL '4 days'
),

-- Article 5: Nutrition (Premium)
(
  gen_random_uuid(),
  'Meal Prep 101: Cara Menyiapkan Makanan Sehat Selama Seminggu',
  'meal-prep-101',
  'Hemat waktu dan uang dengan teknik meal prep yang praktis dan tetap bernutrisi.',
  '## Apa Itu Meal Prep dan Mengapa Harus Dicoba?

Meal prep atau persiapan makanan adalah praktik menyiapkan beberapa porsi makanan sekaligus untuk dikonsumsi selama beberapa hari ke depan. Teknik ini populer karena menghemat waktu memasak di hari sibuk, membantu mengontrol porsi dan kalori, mengurangi godaan membeli makanan cepat saji, serta menghemat pengeluaran untuk makan. Bagi Anda yang ingin menjaga pola makan sehat tapi merasa tidak punya waktu memasak setiap hari, meal prep adalah solusi ideal yang bisa disesuaikan dengan selera dan kebutuhan nutrisi masing-masing.

## Langkah-langkah Memulai Meal Prep

Mulailah dengan merencanakan menu untuk 3-5 hari ke depan. Pilih resep yang menggunakan bahan-bahan serupa agar efisien saat belanja. Siapkan protein dasar seperti ayam panggang, telur rebus, atau tempe bacem yang bisa dikombinasikan dengan berbagai saus. Masak karbohidrat dalam jumlah besar: nasi merah, quinoa, atau kentang rebus. Cuci dan potong sayuran segar, lalu simpan dalam wadah kedap udara di kulkas. Investasikan di wadah kaca berkualitas dengan ukuran yang sesuai porsi makan Anda. Labeli setiap wadah dengan nama menu dan tanggal pembuatan untuk menjaga kesegaran.

## Resep Meal Prep Favorit

Berikut beberapa kombinasi yang bisa Anda coba minggu ini. Menu pertama: ayam panggang bumbu kecap dengan brokoli kukus dan nasi merah. Menu kedua: tumis tempe kacang panjang dengan telur dadar dan ubi cilembu. Menu ketiga: ikan salmon panggang dengan salad sayuran dan kentang rebus. Untuk camilan, siapkan overnight oats dengan buah-buahan, energy balls dari kurma dan kacang, atau hummus dengan potongan wortel dan timun. Simpan makanan matang di kulkas maksimal 4 hari, atau bekukan untuk penyimpanan lebih lama hingga 3 bulan. Panaskan di microwave atau kukusan sebelum disajikan.',
  NULL,
  'nutrition',
  ARRAY['meal-prep', 'nutrisi', 'masakan-sehat', 'hemat-waktu'],
  true,
  8,
  '20fit Team',
  now() - INTERVAL '2 days'
),

-- Article 6: Exercise
(
  gen_random_uuid(),
  'Workout dari Rumah: Latihan Efektif Tanpa Alat Gym',
  'workout-dari-rumah',
  'Tidak perlu gym mahal -- latihan di rumah bisa sama efektifnya untuk membentuk tubuh ideal.',
  '## Kelebihan Latihan di Rumah

Berolahraga di rumah memiliki banyak keunggulan yang sering diremehkan. Anda menghemat waktu perjalanan ke gym, tidak perlu membayar biaya membership bulanan, dan bisa berlatih kapan saja sesuai jadwal Anda. Dengan memanfaatkan berat tubuh sendiri (bodyweight training), Anda sudah bisa mendapatkan latihan yang komprehensif untuk seluruh tubuh. Penelitian dari Journal of Strength and Conditioning menunjukkan bahwa latihan bodyweight sama efektifnya dengan latihan beban untuk membangun kekuatan dan massa otot pada tingkat pemula hingga menengah.

## Program Latihan Bodyweight Sederhana

Berikut adalah program latihan yang bisa dilakukan 3-4 kali seminggu. Untuk tubuh bagian atas: push-up (3 set x 10-15 rep), pike push-up untuk bahu (3 set x 8-12 rep), dan dips menggunakan kursi (3 set x 10 rep). Untuk tubuh bagian bawah: squat (3 set x 15-20 rep), lunges (3 set x 12 rep per kaki), dan glute bridge (3 set x 15 rep). Untuk core: plank (3 set x 30-60 detik), mountain climbers (3 set x 20 rep), dan bicycle crunches (3 set x 15 rep per sisi). Mulai setiap sesi dengan pemanasan 5 menit dan akhiri dengan pendinginan dan stretching selama 5-10 menit.

## Tips Agar Tetap Konsisten

Tantangan terbesar latihan di rumah adalah menjaga motivasi tanpa suasana gym dan komunitas. Beberapa strategi yang bisa membantu: siapkan ruang khusus untuk latihan meskipun kecil, pakai baju olahraga agar merasa lebih siap, ikuti video workout online untuk variasi dan panduan, dan ajak anggota keluarga atau teman untuk berlatih bersama secara virtual. Catat setiap latihan di jurnal atau aplikasi -- melihat progres secara visual sangat memotivasi. Tingkatkan intensitas secara bertahap setiap 2 minggu, misalnya menambah repetisi, mengurangi waktu istirahat, atau mencoba variasi gerakan yang lebih menantang.',
  NULL,
  'exercise',
  ARRAY['workout', 'home-workout', 'bodyweight', 'tanpa-alat'],
  false,
  6,
  '20fit Team',
  now() - INTERVAL '1 day'
);


-- ============================================================
-- QUIZZES
-- ============================================================

-- Quiz 1: Buat Rencana Olahraga Personal
INSERT INTO quizzes (id, title, slug, description, cover_image_url, category, quiz_type, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
  'Buat Rencana Olahraga Personal',
  'personalized-plan',
  'Jawab beberapa pertanyaan singkat dan dapatkan rencana olahraga yang disesuaikan dengan kondisi dan tujuan kamu.',
  NULL,
  'exercise',
  'personalized-plan',
  true
);

INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, options, order_index, is_required) VALUES
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Apa tujuan utama olahraga kamu?', 'single_choice',
  '[
    {"id": "goal_1", "label": "Menurunkan berat badan", "value": "weight_loss", "score": 1},
    {"id": "goal_2", "label": "Menambah massa otot", "value": "muscle_gain", "score": 2},
    {"id": "goal_3", "label": "Meningkatkan stamina & kebugaran", "value": "endurance", "score": 3},
    {"id": "goal_4", "label": "Menjaga kesehatan secara umum", "value": "general_health", "score": 4}
  ]'::jsonb, 1, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Berapa kali seminggu kamu bisa berolahraga?', 'single_choice',
  '[
    {"id": "freq_1", "label": "1-2 kali", "value": "1-2", "score": 1},
    {"id": "freq_2", "label": "3-4 kali", "value": "3-4", "score": 2},
    {"id": "freq_3", "label": "5-6 kali", "value": "5-6", "score": 3},
    {"id": "freq_4", "label": "Setiap hari", "value": "7", "score": 4}
  ]'::jsonb, 2, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Berapa lama durasi olahraga yang kamu inginkan per sesi?', 'single_choice',
  '[
    {"id": "dur_1", "label": "15-30 menit", "value": "15-30", "score": 1},
    {"id": "dur_2", "label": "30-45 menit", "value": "30-45", "score": 2},
    {"id": "dur_3", "label": "45-60 menit", "value": "45-60", "score": 3},
    {"id": "dur_4", "label": "Lebih dari 60 menit", "value": "60+", "score": 4}
  ]'::jsonb, 3, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Bagaimana level kebugaran kamu saat ini?', 'single_choice',
  '[
    {"id": "lvl_1", "label": "Pemula (jarang olahraga)", "value": "beginner", "score": 1},
    {"id": "lvl_2", "label": "Menengah (olahraga 1-2x/minggu)", "value": "intermediate", "score": 2},
    {"id": "lvl_3", "label": "Lanjutan (rutin olahraga 3x+/minggu)", "value": "advanced", "score": 3},
    {"id": "lvl_4", "label": "Atlet / sangat aktif", "value": "athlete", "score": 4}
  ]'::jsonb, 4, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Peralatan apa yang kamu miliki?', 'multiple_choice',
  '[
    {"id": "eq_1", "label": "Tidak ada (bodyweight saja)", "value": "none", "score": 1},
    {"id": "eq_2", "label": "Dumbbell / barbel", "value": "weights", "score": 2},
    {"id": "eq_3", "label": "Resistance band", "value": "band", "score": 2},
    {"id": "eq_4", "label": "Matras yoga", "value": "mat", "score": 1},
    {"id": "eq_5", "label": "Akses ke gym lengkap", "value": "gym", "score": 3}
  ]'::jsonb, 5, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Apakah kamu memiliki cedera atau kondisi khusus?', 'multiple_choice',
  '[
    {"id": "inj_1", "label": "Tidak ada", "value": "none", "score": 0},
    {"id": "inj_2", "label": "Cedera lutut", "value": "knee", "score": 1},
    {"id": "inj_3", "label": "Sakit punggung / pinggang", "value": "back", "score": 1},
    {"id": "inj_4", "label": "Cedera bahu", "value": "shoulder", "score": 1},
    {"id": "inj_5", "label": "Kondisi jantung", "value": "heart", "score": 2}
  ]'::jsonb, 6, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Kapan waktu terbaik kamu untuk berolahraga?', 'single_choice',
  '[
    {"id": "time_1", "label": "Pagi hari (sebelum kerja)", "value": "morning", "score": 1},
    {"id": "time_2", "label": "Siang hari (istirahat makan siang)", "value": "midday", "score": 2},
    {"id": "time_3", "label": "Sore/malam hari (setelah kerja)", "value": "evening", "score": 3},
    {"id": "time_4", "label": "Fleksibel / kapan saja", "value": "flexible", "score": 4}
  ]'::jsonb, 7, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'Jenis olahraga apa yang paling kamu sukai?', 'multiple_choice',
  '[
    {"id": "type_1", "label": "Kardio (lari, sepeda, renang)", "value": "cardio", "score": 1},
    {"id": "type_2", "label": "Angkat beban / strength training", "value": "strength", "score": 2},
    {"id": "type_3", "label": "Yoga / pilates", "value": "yoga", "score": 3},
    {"id": "type_4", "label": "HIIT / circuit training", "value": "hiit", "score": 4},
    {"id": "type_5", "label": "Olahraga tim (futsal, basket, dll)", "value": "team_sport", "score": 5}
  ]'::jsonb, 8, true);


-- Quiz 2: Seberapa Sehat Pola Makan Kamu?
INSERT INTO quizzes (id, title, slug, description, cover_image_url, category, quiz_type, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
  'Seberapa Sehat Pola Makan Kamu?',
  'assessment-nutrition',
  'Evaluasi kebiasaan makan harian kamu dan dapatkan saran perbaikan dari ahli nutrisi kami.',
  NULL,
  'nutrition',
  'assessment',
  true
);

INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, options, order_index, is_required) VALUES
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Bagaimana kebiasaan makan harian kamu?', 'single_choice',
  '[
    {"id": "eat_1", "label": "Makan teratur 3x sehari + snack sehat", "value": "regular_healthy", "score": 4},
    {"id": "eat_2", "label": "Makan 3x sehari tapi tidak selalu sehat", "value": "regular_mixed", "score": 3},
    {"id": "eat_3", "label": "Sering skip makan, tidak teratur", "value": "irregular", "score": 2},
    {"id": "eat_4", "label": "Makan hanya 1-2x sehari", "value": "minimal", "score": 1}
  ]'::jsonb, 1, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Seberapa sering kamu mengonsumsi sayuran?', 'single_choice',
  '[
    {"id": "veg_1", "label": "Setiap kali makan", "value": "every_meal", "score": 4},
    {"id": "veg_2", "label": "1-2 kali sehari", "value": "once_twice", "score": 3},
    {"id": "veg_3", "label": "Beberapa kali seminggu", "value": "few_weekly", "score": 2},
    {"id": "veg_4", "label": "Jarang sekali", "value": "rarely", "score": 1}
  ]'::jsonb, 2, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Berapa banyak air putih yang kamu minum per hari?', 'single_choice',
  '[
    {"id": "water_1", "label": "8 gelas atau lebih", "value": "8+", "score": 4},
    {"id": "water_2", "label": "5-7 gelas", "value": "5-7", "score": 3},
    {"id": "water_3", "label": "3-4 gelas", "value": "3-4", "score": 2},
    {"id": "water_4", "label": "Kurang dari 3 gelas", "value": "<3", "score": 1}
  ]'::jsonb, 3, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Seberapa sering kamu makan fast food atau junk food?', 'single_choice',
  '[
    {"id": "ff_1", "label": "Hampir tidak pernah", "value": "never", "score": 4},
    {"id": "ff_2", "label": "1-2 kali sebulan", "value": "monthly", "score": 3},
    {"id": "ff_3", "label": "1-2 kali seminggu", "value": "weekly", "score": 2},
    {"id": "ff_4", "label": "Hampir setiap hari", "value": "daily", "score": 1}
  ]'::jsonb, 4, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Apakah kamu rutin sarapan?', 'single_choice',
  '[
    {"id": "bf_1", "label": "Ya, selalu sarapan sehat", "value": "always_healthy", "score": 4},
    {"id": "bf_2", "label": "Ya, tapi sering asal makan", "value": "always_any", "score": 3},
    {"id": "bf_3", "label": "Kadang-kadang saja", "value": "sometimes", "score": 2},
    {"id": "bf_4", "label": "Hampir tidak pernah sarapan", "value": "never", "score": 1}
  ]'::jsonb, 5, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Apa jenis camilan yang biasa kamu konsumsi?', 'single_choice',
  '[
    {"id": "snk_1", "label": "Buah, kacang, yogurt", "value": "healthy", "score": 4},
    {"id": "snk_2", "label": "Campuran sehat dan tidak sehat", "value": "mixed", "score": 3},
    {"id": "snk_3", "label": "Keripik, biskuit, cokelat", "value": "processed", "score": 2},
    {"id": "snk_4", "label": "Tidak pernah ngemil", "value": "none", "score": 1}
  ]'::jsonb, 6, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Apakah kamu membaca label nutrisi saat membeli makanan kemasan?', 'single_choice',
  '[
    {"id": "lbl_1", "label": "Selalu membaca dan memperhatikan", "value": "always", "score": 4},
    {"id": "lbl_2", "label": "Kadang-kadang saja", "value": "sometimes", "score": 3},
    {"id": "lbl_3", "label": "Jarang, hanya saat tertarik", "value": "rarely", "score": 2},
    {"id": "lbl_4", "label": "Tidak pernah", "value": "never", "score": 1}
  ]'::jsonb, 7, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'Seberapa sering kamu mengonsumsi buah segar?', 'single_choice',
  '[
    {"id": "fruit_1", "label": "Setiap hari, 2+ porsi", "value": "daily_plenty", "score": 4},
    {"id": "fruit_2", "label": "Setiap hari, 1 porsi", "value": "daily_one", "score": 3},
    {"id": "fruit_3", "label": "Beberapa kali seminggu", "value": "few_weekly", "score": 2},
    {"id": "fruit_4", "label": "Jarang sekali", "value": "rarely", "score": 1}
  ]'::jsonb, 8, true);


-- Quiz 3: Cek Kualitas Tidur Kamu
INSERT INTO quizzes (id, title, slug, description, cover_image_url, category, quiz_type, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567803',
  'Cek Kualitas Tidur Kamu',
  'assessment-sleep',
  'Evaluasi kebiasaan tidur kamu dan temukan cara untuk mendapatkan istirahat yang lebih baik.',
  NULL,
  'sleep',
  'assessment',
  true
);

INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, options, order_index, is_required) VALUES
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Jam berapa biasanya kamu tidur malam?', 'single_choice',
  '[
    {"id": "bed_1", "label": "Sebelum jam 22.00", "value": "before_22", "score": 4},
    {"id": "bed_2", "label": "Jam 22.00 - 23.00", "value": "22-23", "score": 3},
    {"id": "bed_3", "label": "Jam 23.00 - 00.00", "value": "23-00", "score": 2},
    {"id": "bed_4", "label": "Setelah tengah malam", "value": "after_00", "score": 1}
  ]'::jsonb, 1, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Berapa jam rata-rata kamu tidur per malam?', 'single_choice',
  '[
    {"id": "hrs_1", "label": "7-9 jam (ideal)", "value": "7-9", "score": 4},
    {"id": "hrs_2", "label": "6-7 jam", "value": "6-7", "score": 3},
    {"id": "hrs_3", "label": "5-6 jam", "value": "5-6", "score": 2},
    {"id": "hrs_4", "label": "Kurang dari 5 jam", "value": "<5", "score": 1}
  ]'::jsonb, 2, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Seberapa sering kamu terbangun di tengah malam?', 'single_choice',
  '[
    {"id": "wake_1", "label": "Tidak pernah / sangat jarang", "value": "never", "score": 4},
    {"id": "wake_2", "label": "1 kali, bisa langsung tidur lagi", "value": "once", "score": 3},
    {"id": "wake_3", "label": "2-3 kali, kadang susah tidur lagi", "value": "few_times", "score": 2},
    {"id": "wake_4", "label": "Sering banget, sulit tidur kembali", "value": "frequent", "score": 1}
  ]'::jsonb, 3, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Apakah kamu menggunakan gadget di tempat tidur sebelum tidur?', 'single_choice',
  '[
    {"id": "gadget_1", "label": "Tidak, saya hindari 1 jam sebelum tidur", "value": "no_1hr", "score": 4},
    {"id": "gadget_2", "label": "Kadang-kadang, sebentar saja", "value": "sometimes", "score": 3},
    {"id": "gadget_3", "label": "Ya, biasanya 30-60 menit", "value": "30-60min", "score": 2},
    {"id": "gadget_4", "label": "Ya, bisa lebih dari 1 jam", "value": "1hr+", "score": 1}
  ]'::jsonb, 4, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Bagaimana perasaan kamu saat bangun pagi?', 'single_choice',
  '[
    {"id": "fresh_1", "label": "Segar dan berenergi", "value": "fresh", "score": 4},
    {"id": "fresh_2", "label": "Cukup baik setelah beberapa menit", "value": "ok", "score": 3},
    {"id": "fresh_3", "label": "Masih mengantuk dan lemas", "value": "tired", "score": 2},
    {"id": "fresh_4", "label": "Sangat lelah, butuh usaha keras untuk bangun", "value": "exhausted", "score": 1}
  ]'::jsonb, 5, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Seberapa sering kamu tidur siang?', 'single_choice',
  '[
    {"id": "nap_1", "label": "Tidak pernah / tidak perlu", "value": "never", "score": 4},
    {"id": "nap_2", "label": "Kadang, power nap 15-20 menit", "value": "power_nap", "score": 3},
    {"id": "nap_3", "label": "Sering, 30-60 menit", "value": "regular", "score": 2},
    {"id": "nap_4", "label": "Hampir setiap hari, lebih dari 1 jam", "value": "daily_long", "score": 1}
  ]'::jsonb, 6, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Apakah kamu punya rutinitas sebelum tidur?', 'single_choice',
  '[
    {"id": "rout_1", "label": "Ya, konsisten setiap malam (baca, stretching, dll)", "value": "consistent", "score": 4},
    {"id": "rout_2", "label": "Kadang-kadang saja", "value": "sometimes", "score": 3},
    {"id": "rout_3", "label": "Tidak teratur", "value": "irregular", "score": 2},
    {"id": "rout_4", "label": "Tidak ada sama sekali", "value": "none", "score": 1}
  ]'::jsonb, 7, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'Apakah kamu mengonsumsi kafein (kopi/teh) di sore atau malam hari?', 'single_choice',
  '[
    {"id": "caf_1", "label": "Tidak, saya stop kafein setelah jam 14.00", "value": "no_after_14", "score": 4},
    {"id": "caf_2", "label": "Kadang-kadang di sore hari", "value": "sometimes_afternoon", "score": 3},
    {"id": "caf_3", "label": "Sering minum kopi/teh sore hari", "value": "often_afternoon", "score": 2},
    {"id": "caf_4", "label": "Ya, bahkan malam hari juga", "value": "evening_too", "score": 1}
  ]'::jsonb, 8, true);


-- Quiz 4: Tingkat Stres & Mental Health Check
INSERT INTO quizzes (id, title, slug, description, cover_image_url, category, quiz_type, is_active)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567804',
  'Tingkat Stres & Mental Health Check',
  'assessment-mental-health',
  'Cek kondisi kesehatan mental kamu dan dapatkan rekomendasi untuk mengelola stres lebih baik.',
  NULL,
  'mental-health',
  'assessment',
  true
);

INSERT INTO quiz_questions (id, quiz_id, question_text, question_type, options, order_index, is_required) VALUES
(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Seberapa sering kamu merasa overwhelmed atau kewalahan?', 'single_choice',
  '[
    {"id": "ovr_1", "label": "Sangat jarang", "value": "rarely", "score": 4},
    {"id": "ovr_2", "label": "Kadang-kadang saja", "value": "sometimes", "score": 3},
    {"id": "ovr_3", "label": "Cukup sering", "value": "often", "score": 2},
    {"id": "ovr_4", "label": "Hampir setiap hari", "value": "daily", "score": 1}
  ]'::jsonb, 1, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Apakah kamu masih menikmati hobi atau aktivitas yang biasa kamu sukai?', 'single_choice',
  '[
    {"id": "hob_1", "label": "Ya, sangat menikmati seperti biasa", "value": "fully", "score": 4},
    {"id": "hob_2", "label": "Masih menikmati tapi tidak seintens dulu", "value": "somewhat", "score": 3},
    {"id": "hob_3", "label": "Kadang merasa malas melakukannya", "value": "reduced", "score": 2},
    {"id": "hob_4", "label": "Sudah kehilangan minat hampir sepenuhnya", "value": "lost", "score": 1}
  ]'::jsonb, 2, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Bagaimana hubungan sosial kamu belakangan ini?', 'single_choice',
  '[
    {"id": "soc_1", "label": "Baik, aktif bersosialisasi dan merasa terhubung", "value": "active", "score": 4},
    {"id": "soc_2", "label": "Cukup baik, sesekali bertemu teman/keluarga", "value": "moderate", "score": 3},
    {"id": "soc_3", "label": "Cenderung menarik diri, jarang bertemu orang", "value": "withdrawn", "score": 2},
    {"id": "soc_4", "label": "Sangat terisolasi, hampir tidak ada interaksi sosial", "value": "isolated", "score": 1}
  ]'::jsonb, 3, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Seberapa sering kamu berolahraga atau melakukan aktivitas fisik?', 'single_choice',
  '[
    {"id": "ex_1", "label": "3x atau lebih per minggu", "value": "3+_weekly", "score": 4},
    {"id": "ex_2", "label": "1-2x per minggu", "value": "1-2_weekly", "score": 3},
    {"id": "ex_3", "label": "Sesekali saja (beberapa kali sebulan)", "value": "monthly", "score": 2},
    {"id": "ex_4", "label": "Hampir tidak pernah", "value": "never", "score": 1}
  ]'::jsonb, 4, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Bagaimana cara kamu mengatasi tekanan atau masalah?', 'single_choice',
  '[
    {"id": "cop_1", "label": "Bicara dengan orang terdekat / journaling / meditasi", "value": "healthy", "score": 4},
    {"id": "cop_2", "label": "Olahraga atau melakukan hobi", "value": "active", "score": 3},
    {"id": "cop_3", "label": "Mendiamkan dan menahan sendiri", "value": "suppress", "score": 2},
    {"id": "cop_4", "label": "Melampiaskan ke hal negatif (makan berlebihan, begadang, dll)", "value": "unhealthy", "score": 1}
  ]'::jsonb, 5, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Seberapa sering kamu merasakan kecemasan tanpa alasan yang jelas?', 'single_choice',
  '[
    {"id": "anx_1", "label": "Hampir tidak pernah", "value": "rarely", "score": 4},
    {"id": "anx_2", "label": "Sesekali, tapi bisa saya atasi", "value": "sometimes", "score": 3},
    {"id": "anx_3", "label": "Cukup sering dan mengganggu aktivitas", "value": "often", "score": 2},
    {"id": "anx_4", "label": "Sangat sering, sulit dikontrol", "value": "constant", "score": 1}
  ]'::jsonb, 6, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Apakah stres memengaruhi kualitas tidur kamu?', 'single_choice',
  '[
    {"id": "slp_1", "label": "Tidak, tidur saya tetap nyenyak", "value": "no_impact", "score": 4},
    {"id": "slp_2", "label": "Kadang-kadang sulit tidur saat stres", "value": "sometimes", "score": 3},
    {"id": "slp_3", "label": "Sering terjaga malam karena pikiran", "value": "often", "score": 2},
    {"id": "slp_4", "label": "Ya, insomnia sudah jadi hal biasa", "value": "chronic", "score": 1}
  ]'::jsonb, 7, true),

(gen_random_uuid(), 'a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'Bagaimana keseimbangan kerja dan kehidupan pribadi kamu?', 'single_choice',
  '[
    {"id": "wlb_1", "label": "Sangat seimbang, punya waktu untuk diri sendiri", "value": "balanced", "score": 4},
    {"id": "wlb_2", "label": "Cukup seimbang meski kadang sibuk", "value": "mostly_balanced", "score": 3},
    {"id": "wlb_3", "label": "Kurang seimbang, kerja sering mendominasi", "value": "unbalanced", "score": 2},
    {"id": "wlb_4", "label": "Tidak seimbang sama sekali, selalu kerja", "value": "no_balance", "score": 1}
  ]'::jsonb, 8, true);
