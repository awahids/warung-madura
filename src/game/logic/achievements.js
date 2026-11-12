import { SFX } from '../audio.js';
import { G } from '../state.js';
import { toast } from '../widgets.js';
import { addXp, level } from './level.js';
import { giftCount, regularsAtLeast } from './regulars.js';
import { story } from './story.js';

/* Pencapaian: dicek tiap akhir hari, setelah pilihan cerita, dan saat membayar utang. Hadiah +25 XP. */
export const ACH = [
  { id: 'pertama', name: 'Pembeli Pertama', desc: 'Layani pembeli pertamamu.', test: () => (G.stats && G.stats.served) >= 1 },
  { id: 'sibuk', name: 'Hari Sibuk', desc: 'Layani 20 pembeli dalam satu hari.', test: () => (G.stats && G.stats.served) >= 20 },
  { id: 'omzet', name: 'Omzet Besar', desc: 'Omzet Rp 250.000 dalam satu hari.', test: () => (G.stats && G.stats.revenue) >= 250000 },
  { id: 'lv5', name: 'Pedagang Handal', desc: 'Capai Level 5.', test: () => level() >= 5 },
  { id: 'lv10', name: 'Juragan Besar', desc: 'Capai Level 10.', test: () => level() >= 10 },
  { id: 'cicilan', name: 'Cicilan Lancar', desc: 'Bayar cicilan tiga kali tanpa menunggak.', test: () => story().paidCount >= 3 },
  { id: 'lunas', name: 'Bebas Utang', desc: 'Lunasi utang ke Koh Awi.', test: () => story().lunas },
  { id: 'penagih', name: 'Penagih Santun', desc: 'Tagih 5 kasbon dengan baik-baik sampai dibayar.', test: () => (story().collectCount || 0) >= 5 },
  { id: 'segar', name: 'Stok Selalu Segar', desc: 'Tujuh hari berturut-turut tanpa barang kedaluwarsa.', test: () => (story().freshStreak || 0) >= 7 },
  { id: 'bos', name: 'Juragan Beneran', desc: 'Rekrut karyawan pertamamu.', test: () => !!story().flags.hired },
  { id: 'majikan', name: 'Majikan Baik', desc: 'Kesetiaan seorang karyawan mencapai 90.', test: () => (story().staff || []).some(e => e.loyalty >= 90) },
  { id: 'sahabat', name: 'Sahabat Warung', desc: 'Jadi Sahabat bagi satu pelanggan tetap.', test: () => giftCount() >= 1 },
  { id: 'banyak_teman', name: 'Banyak Teman', desc: 'Akrab dengan 4 pelanggan tetap.', test: () => regularsAtLeast(2) >= 4 },
  { id: 'dipercaya', name: 'Dipercaya Warga', desc: 'Kepercayaan warga mencapai 80.', test: () => story().trust >= 80 },
  { id: 'jujur', name: 'Jujur Sampai Receh', desc: 'Kembalikan kembalian yang kurang.', test: () => !!story().flags.jujur_kembalian },
  { id: 'tamu_jujur', name: 'Tidak Tergoda', desc: 'Tolak tawaran barang gelap si tamu bertudung.', test: () => !!story().flags.tamu_jujur },
  { id: 'tamu_dengar', name: 'Mau Mendengar', desc: 'Dengarkan cerita si tamu bertudung.', test: () => !!(story().flags.tamu_cerita || story().flags.tamu_telpon) },
  { id: 'besar', name: 'Pilihan Besar', desc: 'Tentukan arah warung di Bab 5.', test: () => !!(story().flags.cabang || story().flags.layanan || story().flags.koperasi) },
  { id: 'tamat', name: 'Tamat', desc: 'Selesaikan cerita utama.', test: () => !!story().ending },
];
let busy = false;
export const unlocked = id => !!story().ach[id];
export const unlockedCount = () => ACH.filter(a => unlocked(a.id)).length;
export function checkAchievements() {
  if (busy) return; busy = true;
  try {
    const s = story();
    for (const a of ACH) if (!s.ach[a.id] && a.test()) { s.ach[a.id] = G.day || 1; SFX.ach(); toast(`Pencapaian: ${a.name} (+25 XP)`, '#ffe45c'); addXp(25); }
  } finally { busy = false; }
}
