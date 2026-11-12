# Juragan Warung — Desain Cerita & Tanggung Jawab (DRAFT untuk ditinjau)

> Status: **draft, belum diimplementasikan.** Dokumen ini untuk disetujui/diubah dulu sebelum kode ditulis.
> Semua angka adalah titik awal dan akan disetel lewat uji main.

## 1. Premis

Pak Haji, pemilik warung tempat pemain tumbuh, sakit dan pulang kampung. Pemain (keponakannya) dititipi warung **bukan sebagai hadiah, tapi sebagai amanah**:

- Warung berdiri dengan **modal pinjaman** dari juragan grosir (Koh Awi) yang harus dicicil.
- Banyak warga sekitar **bergantung** pada warung ini: kasbon, titip bayar listrik, beli eceran saat tanggal tua.
- Pak Haji hanya berpesan satu hal: *"Warung itu bukan cuma jualan. Kalau ia kosong, kampung ikut kosong."*

**Tema:** tanggung jawab. Pemain boleh memilih jadi pedagang yang untung besar atau pedagang yang dipercaya, tapi setiap pilihan meninggalkan jejak yang terlihat di hari-hari berikutnya.

**Nada:** hangat, sehari-hari, sedikit humor. Tidak menggurui, tidak ada "game over" moral. Akibat berupa angka dan cerita lanjutan, bukan hukuman mendadak.

## 2. Tokoh tetap

Semua memakai tipe pembeli yang sudah ada (tampilan 3D sudah ada), sekarang diberi **nama, riwayat, dan alur kecil**.

| Tokoh | Tipe di game | Peran |
|---|---|---|
| **Pak Haji** | juragan | Mentor. Datang tiap akhir bab membawa kabar dan nasihat. |
| **Bu Sri** | ibu | Pelanggan setia, sering kasbon. Anaknya (Adik Pelajar) butuh biaya sekolah. |
| **Adik Rani** | pelajar | Anak Bu Sri. Jajan murah, menabung untuk buku. |
| **Bang Jaka** | ojol | Sahabat. Sering butuh bensin dan kopi cepat; cerita tentang penghasilan yang tidak menentu. |
| **Mas Dimas** | pemuda | Mahasiswa begadang; menawarkan ide (promo, catatan digital). |
| **Bang Rizky** | cowok | Pembeli biasa yang menyimpan masalah; muncul di kejadian pilihan sulit. |
| **Pak Tukang (Pak Darto)** | tukang | Proyek bangunan di ujung gang. Pelanggan besar dan rutin, kadang bayar telat. |
| **Koh Awi** | (tidak tampil sebagai pembeli) | Juragan grosir pemberi pinjaman. Suaranya lewat HP (GrosirKu). |
| **Tamu bertudung** | hoodie | Misteri malam hari. Jawabannya di Bab 4. |
| **Mister Tom** | turis | Penggembira. Memberi tip besar, mengenalkan kampung ke dunia luar. |

## 3. Sistem tanggung jawab (inti, harus ada sebelum naskah penuh)

### 3.1 Utang cicilan (gaya Recettear)
- Saldo awal Rp 150.000 sekarang tetap. Tambahan: **utang modal ke Koh Awi Rp 1.200.000**.
- **Cicilan tiap 3 hari** (jatuh tempo di rekap malam), awalnya Rp 150.000, naik tiap bab.
- Bila saldo tidak cukup: **tunggakan** menumpuk + bunga kecil (5%). Tunggakan 2× berturut-turut → Koh Awi menahan pesanan stok sehari (peringatan, bukan game over). Tunggakan 3× → "Hari Berat": hanya setengah stok boleh dipesan besok.
- Lunas = akhir Bab 3 (melepas tekanan utama, membuka Bab 4–5).

### 3.2 Kepercayaan warga (nilai 0–100, terpisah dari Reputasi)
- **Reputasi** = seberapa ramai warung (sudah ada). **Kepercayaan** = seberapa warga *mengandalkan* dan *menghormati* warung.
- Naik: melunasi/menagih kasbon dengan baik, kembalian jujur, membantu saat sulit, tidak menimbun.
- Turun: salah kembalian, menolak orang kesusahan tanpa alasan, menimbun stok, menaikkan harga saat hujan/langka.
- Efek: kepercayaan tinggi → pelanggan tetap lebih sabar (+patience), kasbon lebih sering dilunasi, kejadian bantuan dari warga. Rendah → pembeli lebih mudah pergi, kasbon macet lebih banyak.
- Ditampilkan di HUD (ikon rumah/hati) dan rekap malam.

### 3.3 Kejadian harian dengan pilihan
- Tiap hari ada **1 kejadian cerita** (sudah ada slot kasbon/tamu misterius; ini memperluasnya). Muncul sebagai pembeli bernama atau pesan di HP.
- Dialog ringkas 2–4 kalimat + **2–3 pilihan**, masing-masing punya akibat jangka pendek (uang, stok, energi) dan jangka panjang (kepercayaan, bendera cerita).
- Pilihan tidak berlabel benar/salah; akibat selalu jelas setelah dipilih (di rekap malam).

### 3.4 Rekap malam dengan akibat
- Tambahan di rekap hari: **"Kabar kampung"** — 1–3 baris akibat pilihan kemarin/hari-hari lalu (misal: "Bu Sri melunasi kasbon dan membawakan kue.").
- Menutup hari dengan **catatan Pak Haji** (satu kalimat, berganti tiap bab).

## 4. Struktur bab

Bab tersambung ke level yang sudah ada (lihat `FEATURE_LVL` / `TYPE_LVL`). Tiap bab ±4–6 hari, berakhir dengan **adegan penutup** (Pak Haji datang) dan **tujuan bab**.

### Bab 1 — Warisan (Lv 1–2) · hari 1–4
- **Tujuan:** buka warung 3 hari berturut-turut, bayar cicilan pertama.
- **Mekanik baru:** dasar-dasar; tutorial lewat cerita (Pak Haji menelepon lewat HP memberi arahan).
- **Kejadian kunci:**
  1. *Hari 1:* Bang Jaka datang, kopi pertama gratis atau ditagih? (pilihan kecil, membangun hubungan)
  2. *Hari 2:* Kembalian salah; pembeli tidak sadar. Beri tahu atau diam? (kepercayaan vs untung kecil)
  3. *Hari 3:* Koh Awi menelepon: "cicilan pertama minggu depan."
  4. *Hari 4 (penutup):* Pak Haji menelepon: "kau tidak sendirian."

### Bab 2 — Kasbon (Lv 3–4) · hari 5–9
- **Tujuan:** kasbon macet di bawah Rp 100.000 dan dua cicilan terbayar.
- **Mekanik baru:** kasbon bernama (riwayat tiap orang), nilai Kepercayaan muncul di HUD.
- **Kejadian kunci:**
  1. Bu Sri minta kasbon karena anaknya sakit. Beri / beri sebagian / tolak.
  2. Adik Rani beli jajan, uangnya kurang Rp 1.000. Relakan atau minta lunas besok.
  3. Pak Darto (tukang) memesan banyak tapi bayar akhir minggu. Terima (untung besar, risiko) atau minta uang muka.
  4. Rizky minta kasbon rokok (tidak ada alasan jelas). Beri atau tolak.
  5. *Penutup:* kasbon yang dibayar muncul sebagai "Kabar kampung".

### Bab 3 — Musim Hujan (Lv 5–6) · hari 10–15
- **Tujuan:** lunasi utang ke Koh Awi.
- **Mekanik baru:** Pesan Ulang, Kembalian Otomatis; stok langka & harga naik (hanya cerita, bukan sistem baru).
- **Kejadian kunci:**
  1. Hujan 2 hari, kurir telat. Harga gas/galon di grosir naik 20%. Naikkan harga jual atau tahan harga untuk warga?
  2. Banjir kecil; tetangga minta tolong menaruh barang di warung. Terima (repot) atau tolak.
  3. Pak Darto batal proyek, utangnya macet. Tagih keras / beri waktu.
  4. Mister Tom dan teman turis datang saat hujan, beli banyak; tapi ada pelanggan tetap menunggu lama. Layani siapa dulu?
  5. *Penutup:* lunas / belum — Pak Haji merespons berbeda.

### Bab 4 — Tamu Bertudung (Lv 6–7) · hari 16–20
- **Tujuan:** menyelesaikan kisah tamu misterius.
- **Cerita:** tamu itu ternyata **anak buah Pak Haji yang dulu dipecat** karena menggelapkan; kini kembali meminta kesempatan atau menawarkan "tambahan untung" yang melanggar aturan (rokok tanpa cukai, barang kedaluwarsa).
- **Kejadian kunci:** tiga kali kunjungan tengah malam, masing-masing satu pilihan (dengarkan, bantu, laporkan, atau ambil tawaran). Akibat berkaitan Kepercayaan dan satu akhir kecil.

### Bab 5 — Pusat Kampung (Lv 8+) · hari 21+
- **Tujuan:** memilih arah warung.
- **Mekanik baru:** Kurir Ekspres; keputusan akhir.
- **Pilihan besar (satu kali):** (a) buka cabang di jalan besar (untung besar, perhatian terbagi); (b) tetap satu warung tapi jadi titik pelayanan kampung (pulsa, listrik, titip paket); (c) menyerahkan warung ke warga/koperasi.
- Akibat menentukan epilog.

## 5. Epilog (3 akhir kecil)

Ditentukan oleh **Kepercayaan**, **utang**, dan **pilihan Bab 5**:
- **Juragan Dipercaya:** kepercayaan tinggi, utang lunas. Kampung menjuluki warungmu "warung kita".
- **Juragan Untung:** uang besar, kepercayaan rendah. Warung ramai tapi sepi hubungan; Pak Haji pulang dengan raut campur.
- **Bertahan:** pas-pasan. Warung tetap hidup, kisah terus berlanjut (mode bebas).

Setelah epilog, pemain bisa terus main (mode bebas) seperti sekarang.

## 6. Daftar kejadian harian (kolam acak di luar kejadian bab)

Dipakai di hari tanpa kejadian bab, memilih yang sesuai level dan kepercayaan.

| # | Kejadian | Pilihan → akibat |
|---|---|---|
| 1 | Anak kecil beli rokok untuk bapaknya | Layani (+uang, −kepercayaan) / Tolak sopan (+kepercayaan) |
| 2 | Barang hampir kedaluwarsa di stok | Jual diskon / Buang (rugi) / Jual normal (risiko pembeli kecewa) |
| 3 | Pembeli lupa dompet | Relakan (−uang kecil, +kepercayaan) / Tahan barang |
| 4 | Tetangga titip bayar listrik/pulsa | Terima (+uang jasa kecil, repot) / Tolak |
| 5 | Pembeli menawar keras | Turunkan harga / Tetap / Beri bonus kecil |
| 6 | Mas Dimas menawarkan ide promo gratis | Coba (energi −, laris sehari) / Tolak |
| 7 | Uang palsu dicurigai | Terima / Tolak / Periksa (butuh waktu) |
| 8 | Bang Jaka butuh bensin tapi saldo habis | Kasbon / Tolak |
| 9 | Pemadaman listrik | Nyalakan lilin (suasana, pelanggan sabar) / Tutup lebih awal |
| 10 | Tetangga bertengkar di depan warung | Tengahi (energi −, +kepercayaan) / Abaikan |
| 11 | Kucing warung sakit | Beli obat (−uang) / Biarkan |
| 12 | Pembeli menunggu lama dan minta ganti rugi | Beri bonus kecil / Minta maaf saja |
| 13 | Rombongan pengajian pesan konsumsi | Terima (stok terkuras, untung) / Tolak |
| 14 | Petugas pasar meminta "uang keamanan" | Bayar / Tolak / Lapor |
| 15 | Pembeli menukar barang rusak | Tukar (rugi) / Tolak |

## 7. Rencana implementasi (bertahap, setiap tahap bisa dirilis)

| Tahap | Isi | Perkiraan sentuhan kode |
|---|---|---|
| **A — Fondasi tanggung jawab** | Utang & cicilan, Kepercayaan, rekap "Kabar kampung", modal kejadian dengan pilihan, simpan ke save | `logic/story.js`, state `G.story`, modal `event`, HUD, `persist.js`, tes |
| **B — Konten Bab 1–2** | Data kejadian dan dialog, nama pelanggan, kasbon bernama | `src/game/story/chapters.js` (data murni), pemetaan pelanggan → tokoh |
| **C — Bab 3–5 + epilog** | Sisa bab, pilihan besar, tiga epilog | data + layar epilog |
| **D — Kolam kejadian harian** | 15+ kejadian acak | data + pemilih bobot |
| **E — Penyempurnaan** | Suara, animasi, penyetelan angka, pencapaian | — |

**Prinsip teknis:** cerita sebagai **data** (bab, kejadian, pilihan, akibat) yang dibaca satu mesin kecil, jadi menambah konten tidak perlu mengubah logika. Pilihan memakai kumpulan akibat tetap (`uang`, `kepercayaan`, `stok`, `energi`, `bendera`). Semua teks Bahasa Indonesia.

## 8. Risiko & catatan

- **Keseimbangan ekonomi:** cicilan harus terasa menekan tapi bisa dipenuhi; perlu uji main (ada tes bot 3 hari yang bisa diperluas).
- **Panjang dialog:** layar kecil/HP, jadi dialog dibatasi 2–4 kalimat per kejadian.
- **Konten sensitif** (uang keamanan, pelanggaran barang): ditangani ringan dan tidak menggurui, tanpa adegan kekerasan.
- **Kepekaan budaya:** warung Madura dan warga digambarkan hangat dan beragam, tanpa stereotip.
- **Save lama:** pemain lama mulai dari Bab 1 dengan utang yang dikonversi/di-reset (perlu diputuskan).
- **2D:** adegan cerita berupa modal teks, jadi tetap berjalan di mode 2D.

## 9. Pertanyaan terbuka untuk Anda

1. Setuju premis **warisan dari Pak Haji + utang ke grosir**, atau mau latar lain?
2. Nada: cukup hangat/ringan seperti di atas, atau ingin lebih dramatis?
3. **Utang** dan **Kepercayaan** dijadikan sistem wajib, atau ada mode santai tanpa cicilan?
4. Pemain lama (save lama): mulai Bab 1 dari awal, atau dilanjutkan di bab sesuai level?
5. Pilihan Bab 5 (cabang / titik layanan kampung / koperasi): mana yang paling Anda sukai?
6. Ada tokoh atau cerita dari lingkungan Anda yang ingin dimasukkan (nama, kejadian nyata)?
