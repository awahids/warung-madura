/* ============================================================
   CERITA RUMAH (data murni — dipakai logic/home.js)
   Muncul setelah pemain pulang beristirahat. fx memakai sintaks efek cerita (applyFx): energy, trust, rep, xp, money, stock.
   when: { rain, night, chapterMin, trustMin, hutang (ada utang ke Koh Awi), noUtang }.
   ============================================================ */
export const HOME_STORIES = [
  { id: 'makan', title: 'Makan Siang Sederhana', text: 'Nasi hangat, tempe goreng, dan sambal buatan sendiri. Sederhana, tapi perut dan hati terasa penuh lagi.', fx: { energy: 8 } },
  { id: 'telepon_ibu', title: 'Telepon dari Ibu', text: 'Ibu di kampung menelepon. "Jangan lupa makan, Nak. Ibu bangga kamu mau kerja keras." Suaranya bikin hangat.', fx: { energy: 8, trust: 1 } },
  { id: 'foto_ayah', title: 'Foto Lama di Dinding', text: 'Kamu menatap foto warung ayahmu dulu. Rak yang sama, senyum yang sama. Kamu berjanji menjaga warung ini.', fx: { energy: 6, xp: 10 } },
  { id: 'radio', title: 'Siaran Radio Kampung', text: 'Radio tetangga memutar lagu lawas. Kamu ikut bersenandung sambil meluruskan punggung.', fx: { energy: 10, xp: 4 } },
  { id: 'kucing', title: 'Kucing Mampir', text: 'Kucing kampung tidur di pangkuanmu, mendengkur pelan. Pikiran jadi ringan.', fx: { energy: 7 } },
  { id: 'hujan_atap', title: 'Hujan di Atap Seng', text: 'Suara hujan di atap seng bikin kamu tertidur nyenyak.', fx: { energy: 16 }, when: { rain: true } },
  { id: 'doa_malam', title: 'Doa di Sajadah', text: 'Kamu shalat dan berdoa untuk warung, utang, dan warga kampung. Hati jadi tenang.', fx: { energy: 14, trust: 1 }, when: { night: true } },
  { id: 'mimpi_antre', title: 'Mimpi Pembeli Antre', text: 'Kamu tertidur dan bermimpi pembeli mengantre sampai ke ujung gang, semuanya membeli telur. Terbangun dengan senyum.', fx: { energy: 12, xp: 6 } },
  { id: 'catatan_utang', title: 'Mencatat Rencana Cicilan', text: 'Di meja makan kamu menulis rencana cicilan ke Koh Awi. Angkanya terlihat lebih ramah setelah ditulis rapi.', fx: { energy: 6, xp: 8, trust: 1 }, when: { hutang: true } },
  { id: 'surat_koh_awi', title: 'Titipan dari Koh Awi', text: 'Seorang anak mengantar bungkusan dari Koh Awi: sebungkus kopi sachet dan catatan, "Semangat, jangan menyerah."', fx: { energy: 5, trust: 2, stock: { kopi: 5 } }, when: { hutang: true, chapterMin: 2 } },
  { id: 'tetangga', title: 'Tetangga Bertamu', text: 'Tetangga membawa sepiring pisang goreng. "Warungmu bikin kampung hidup," katanya. Kamu titipkan sebagian di etalase.', fx: { energy: 8, rep: 2, stock: { snack: 4 } }, when: { trustMin: 55 } },
  { id: 'syukuran', title: 'Kabar Baik dari Warga', text: 'Warga mengundangmu syukuran kecil di ujung gang. Kamu pulang kenyang dan dapat doa banyak.', fx: { energy: 12, trust: 2 }, when: { trustMin: 65 } },
  { id: 'bebas_utang', title: 'Rumah yang Lebih Lega', text: 'Tanpa beban utang, malam terasa lebih lapang. Kamu tidur sambil merencanakan rak baru.', fx: { energy: 14, xp: 12 }, when: { noUtang: true } },

  // ---- cerita per bab (muncul dulu sebelum cerita umum; tiap cerita hanya sekali) ----
  { id: 'surat_haji', title: 'Surat Pak Haji di Laci', text: 'Di laci meja makan kamu menemukan surat Pak Haji: "Warung bukan sekadar jualan, Nak. Ia tempat orang kampung merasa punya rumah kedua."', fx: { energy: 8, trust: 1, xp: 8 }, when: { chapter: 1 } },
  { id: 'kunci_tua', title: 'Kunci Tua di Paku', text: 'Kunci gembok warung warisan Pak Haji kamu gantung di paku dekat pintu. Beratnya terasa seperti amanah.', fx: { energy: 6, xp: 6 }, when: { chapter: 1 } },
  { id: 'buku_kasbon', title: 'Membaca Buku Kasbon', text: 'Di meja makan kamu membaca ulang buku kasbon. Ada yang menunggak karena malas, tapi lebih banyak yang memang sedang sulit. Kamu mulai bisa membedakan.', fx: { energy: 6, trust: 1, xp: 8 }, when: { chapter: 2 } },
  { id: 'penunggak_datang', title: 'Penunggak yang Malu-malu', text: 'Seorang tetangga yang punya kasbon datang malam-malam membawa sebungkus nasi. "Belum bisa bayar, tapi ini sebisanya," katanya.', fx: { energy: 8, trust: 2 }, when: { chapter: 2 } },
  { id: 'atap_bocor', title: 'Ember di Bawah Atap Bocor', text: 'Hujan deras, atap seng bocor di dekat kasur. Kamu menaruh ember dan tertidur mendengar tetes air yang berirama.', fx: { energy: 12, xp: 6 }, when: { chapter: 3 } },
  { id: 'teh_jahe', title: 'Teh Jahe Hangat', text: 'Kamu merebus teh jahe sambil menatap hujan lewat jendela. Pundak yang kaku mulai mengendur.', fx: { energy: 15 }, when: { chapter: 3 } },
  { id: 'pintu_diketuk', title: 'Pintu Diketuk Tengah Malam', text: 'Tok-tok-tok. Jantungmu berdegup, tapi ternyata hanya kucing yang minta masuk. Kamu tertawa sendiri.', fx: { energy: 8, xp: 8 }, when: { chapter: 4 } },
  { id: 'kabar_bertudung', title: 'Kabar Orang Bertudung', text: 'Tetangga berbisik ada orang bertudung terlihat dekat warungmu malam-malam. Kamu mengunci pintu dan berdoa, lalu tidur lebih waspada.', fx: { energy: 6, xp: 10 }, when: { chapter: 4 } },
  { id: 'doa_bersama', title: 'Doa Bersama di Teras', text: 'Warga datang ke teras rumahmu membawa makanan dan doa bersama untuk kampung. Malam itu rumahmu terasa penuh.', fx: { energy: 14, trust: 2, rep: 2 }, when: { chapter: 5 } },
  { id: 'rencana_besar', title: 'Gambar Rencana Warung Baru', text: 'Kamu menggambar rak, kulkas, dan teras baru di kertas bekas. Warung kecil ini punya masa depan.', fx: { energy: 8, xp: 15 }, when: { chapter: 5 } },
];

/** Teks foto lama di dinding rumah menurut bab (dibaca di dalam rumah). */
export const FOTO = [
  'Foto Pak Haji muda berdiri di depan warung yang baru dibuka. "Warung ini titipan, bukan hadiah," katanya dulu.',
  'Di foto itu antrean kasbon mengular di warung Pak Haji. Ia tidak pernah menolak orang yang kesusahan.',
  'Foto warung saat banjir tahun lalu. Warga bergotong royong menyelamatkan dagangan. Kamu tersenyum.',
  'Di foto, bayangan seseorang bertudung samar di belakang. Ah, mungkin hanya bayangan. Mungkin.',
  'Foto bersama seluruh warga di depan warung. Kamu ada di tengah, tersenyum lebar. Warung ini sudah jadi pusat kampung.',
];
