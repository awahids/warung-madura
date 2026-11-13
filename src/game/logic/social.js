import { SFX } from '../audio.js';
import { BY } from '../data.js';
import { G } from '../state.js';
import { clamp, pick, rnd } from '../util.js';
import { toast } from '../widgets.js';
import { REGULARS } from '../story/regulars.js';
import { isRain } from './day.js';
import { itemOn, typeOn, addXp } from './level.js';
import { bond, employedIds, favItems, regById, regTier } from './regulars.js';
import { applyFx } from './story.js';

/* ============================================================
   SOSIALISASI DENGAN WARGA
   Warga (pelanggan tetap) kadang mampir lalu duduk di bangku depan warung. Pemain bisa mengajak ngobrol:
   tiap kunjungan ada 2 kesempatan ngobrol (tiap topik sekali). Ngobrol memperdekat hubungan, memulihkan kewarasan,
   memberi kabar kampung/bocoran cuaca, dan "dari mulut ke mulut" yang menaikkan peminat satu barang hari itu.
   ============================================================ */
export const SEATS = 2;
export const TALKS = 2;
const state = () => G.social || (G.social = { v: [], nid: 1, chats: 0 });
export const visitors = () => state().v;
export const visitorById = id => visitors().find(v => v.vid === id) || null;
export const chatsToday = () => state().chats;

const KABAR = [
  'Katanya jalan depan mau diaspal bulan depan, Nak.', 'Pak RT mau bikin kerja bakti hari Minggu, jangan lupa ya.',
  'Di ujung gang ada warung baru, tapi sepi. Pelanggannya tetap ke sini.', 'Anak tetangga baru lulus ujian, warga mau syukuran kecil.',
  'Harga beras katanya mau naik, hati-hati stok ya.', 'Semalam ada pertunjukan wayang di balai desa, rame sekali.',
  'Warung ini sekarang jadi tempat ngumpul, lho. Enak suasananya.', 'Jaga kesehatan ya, jangan begadang terus.',
  'Pasar pagi tadi ramai. Telur dan minyak lagi murah.', 'Ada yang nanya, warungmu buka sampai jam berapa?',
];
const CURHAT = [
  'Akhir-akhir ini capek mikirin biaya sekolah anak... tapi cerita ke sini bikin lega.', 'Aku lagi bingung mau mulai usaha kecil-kecilan. Doain ya.',
  'Dulu aku juga pernah jaga warung malam-malam. Capeknya sama, tapi seru.', 'Terima kasih sudah mau dengerin, Nak. Jarang ada yang sabar begini.',
];

/** Topik obrolan. fn(r, v) → { text, lines? } menerapkan efek; ok() menentukan bisa dipilih. */
export const TOPICS = [
  { id: 'kabar', label: 'Tanya kabar', hint: '+kedekatan, +8 kewarasan, kabar kampung',
    ok: () => true,
    fn(r) {
      bond(r.id, 3); G.energy = clamp(G.energy + 8, 0, 100); addXp(3);
      let t = pick(KABAR);
      if (G.rain && G.h < G.rain.from) t = `Katanya hari ini bakal hujan sekitar jam ${Math.round(G.rain.from)}. Siapkan barang yang laku saat hujan, Nak.`;
      else if (isRain()) t = 'Hujannya awet ya... pembeli ojol pasti banyak yang mampir.';
      return { text: t, gain: '+3 kedekatan · +8 kewarasan' };
    } },
  { id: 'traktir', label: 'Traktir kopi', hint: 'pakai 1 kopi sachet · +6 kedekatan',
    ok: () => (G.stock.kopi || 0) > 0, why: 'Kopi sachet habis',
    fn(r) {
      G.stock.kopi--; bond(r.id, 6); G.energy = clamp(G.energy + 4, 0, 100); G.rep = clamp(G.rep + 1, 0, 100); addXp(4); SFX.gulp();
      return { text: `${r.name} menyeruput kopinya. "Nikmat sekali, makasih ya, Nak. Kapan-kapan gantian saya yang traktir."`, gain: '+6 kedekatan · +4 kewarasan · reputasi +1' };
    } },
  { id: 'saran', label: 'Minta saran belanja', hint: 'warga ikut mempromosikan 1 barang hari ini',
    ok: () => true,
    fn(r) {
      const favs = favItems(r).filter(itemOn), id = favs.length ? pick(favs.slice(0, 3)) : 'kopi';
      bond(r.id, 2); G.buzz = { id, day: G.day, who: r.name }; addXp(3);
      return { text: `"Kalau saya sih, ${BY[id].name} paling sering dicari tetangga. Nanti saya bilangin ke mereka."`, gain: `+2 kedekatan · ${BY[id].name} lebih diminati hari ini` };
    } },
  { id: 'curhat', label: 'Dengarkan curhat', hint: '+kedekatan, +kepercayaan warga, kadang dapat tip',
    ok: () => true,
    fn(r) {
      bond(r.id, 4); applyFx({ trust: 1 }); addXp(5);
      let gain = '+4 kedekatan · kepercayaan +1';
      if (Math.random() < .3 + .1 * regTier(r.id)) { const tip = (Math.random() < .5 ? 5 : 10) * 1000; G.money += tip; if (G.stats) G.stats.tips += tip; gain += ` · tip Rp ${tip / 1000}.000`; }
      return { text: `${r.name}: "${pick(CURHAT)}"`, gain };
    } },
];

/** Dipanggil tiap frame saat warung buka: warga datang & pergi. */
export function socialTick(dt) {
  const s = state(), now = G.abs;
  const stay = s.v.filter(v => now < v.until);
  if (stay.length !== s.v.length) {
    for (const v of s.v) if (now >= v.until) { const r = regById(v.id); if (r && !v.talked) toast(`${r.name} pamit pulang.`, '#e8e0d0'); }
    s.v = stay;
  }
  if (!G.running || G.h > 22.5 || s.v.length >= SEATS) return;
  if (Math.random() > dt * .028 * (isRain() ? .3 : 1) * (G.h >= 20 ? .6 : 1)) return;
  const busy = new Set([...G.cust, ...G.leaving].map(c => c.reg).filter(Boolean)), staff = new Set(employedIds()), here = new Set(s.v.map(v => v.id));
  const pool = REGULARS.filter(r => typeOn(r.type) && !busy.has(r.id) && !staff.has(r.id) && !here.has(r.id));
  if (!pool.length) return;
  const weights = pool.map(r => 1 + regTier(r.id) * 1.2); let t = Math.random() * weights.reduce((a, b) => a + b, 0), r = pool[0];
  for (let i = 0; i < pool.length; i++) { if ((t -= weights[i]) <= 0) { r = pool[i]; break; } }
  const seats = new Set(s.v.map(v => v.seat)); let seat = 0; while (seats.has(seat)) seat++;
  s.v.push({ vid: s.nid++, id: r.id, seat, until: now + rnd(100, 180), talks: TALKS, used: {}, log: null, talked: false });
  SFX.bell(); toast(`${r.name} duduk di bangku depan. Ajak ngobrol!`, '#cfe8ff');
}

/** Lakukan satu topik dengan pengunjung; mengembalikan hasil (atau null bila tidak bisa). */
export function chat(vid, topicId) {
  const v = visitorById(vid), tp = TOPICS.find(t => t.id === topicId), r = v && regById(v.id); if (!v || !tp || !r) return null;
  if (v.talks <= 0 || v.used[topicId] || !tp.ok(r, v)) { SFX.err(); return null; }
  const res = tp.fn(r, v); v.used[topicId] = true; v.talks--; v.talked = true; state().chats++; v.log = res; markSpeech(v); SFX.good();
  if (v.talks <= 0) v.until = Math.min(v.until, G.abs + 25);      // sudah puas ngobrol → pamit tak lama lagi
  return res;
}
export const canChat = v => !!v && v.talks > 0;

/* ---- ucapan yang "diketik" (dasar animasi bicara 3D & efek ketik di dialog) ---- */
export const TYPE_CPS = 38;                                         // karakter per detik
const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
/** Teks yang sedang diucapkan warga: hasil topik terakhir, atau sapaan awal. */
export function speechOf(v) { const r = v && regById(v.id); if (!r) return ''; return v.log ? v.log.text : (regTier(r.id) >= 2 ? r.akrab[0] : r.say[0]); }
export const markSpeech = v => { v.speechAt = nowMs(); };           // mulai berbicara (dipanggil saat dialog dibuka / topik dipilih)
/** Jumlah karakter yang sudah terucap. */
export const typedChars = (v, t = nowMs()) => { const n = speechOf(v).length; return v && v.speechAt != null ? Math.max(0, Math.min(n, Math.floor((t - v.speechAt) / 1000 * TYPE_CPS))) : n; };
/** Sedang berbicara = teks belum selesai terucap. */
export const isTalking = (v, t = nowMs()) => !!v && typedChars(v, t) < speechOf(v).length;
export function clearVisitors() { const s = state(); s.v = []; }
