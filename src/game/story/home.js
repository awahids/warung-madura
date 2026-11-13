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
];
