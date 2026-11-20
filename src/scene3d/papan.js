import * as THREE from 'three';

/* ============================================================
   PAPAN NAMA, PAPAN KENANGAN, dan BALIHO KAMPANYE warung 3D.
   Tampilannya mengikuti cerita (lihat warungLook() di logic/kota.js):
   - papan nama: "WARUNG MADURA" klasik, "WARUNG KITA" (koperasi warga), atau pudar (setelah ditangkap);
   - papan kenangan di samping warung: foto pelantikan, piagam, kliping koran, surat Rani, foto Pak Haji;
   - baliho kampanye saat masa pemilihan.
   ============================================================ */
const STYLE = {
  klasik: { bg: '#ffd23a', border: '#8a1b10', title: '#c0281a', stroke: '#fff3b0', sub: '#5a1a0a' },
  kita: { bg: '#3f9e58', border: '#1f5a2a', title: '#ffffff', stroke: '#1f5a2a', sub: '#eaffd8' },
  pudar: { bg: '#cdbf94', border: '#7a6a50', title: '#8a5a4a', stroke: '#e8dcc0', sub: '#6a5a4a' },
};
const tex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { c, g: c.getContext('2d'), t }; };
const fit = (g, text, max, size, weight = 900) => { let s = size; do { g.font = `${weight} ${s}px "Trebuchet MS",Arial,sans-serif`; s -= 2; } while (g.measureText(text).width > max && s > 10); };

export function drawBanner(B, { title = 'WARUNG MADURA', sub = 'Sembako · Minuman · Rokok · Pulsa', style = 'klasik' } = {}) {
  const { g, c, t } = B, w = c.width, h = c.height, S = STYLE[style] || STYLE.klasik;
  g.clearRect(0, 0, w, h); g.fillStyle = S.bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = S.border; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  fit(g, title, w - 80, 100); g.lineWidth = 8; g.strokeStyle = S.stroke; g.strokeText(title, w / 2, 100); g.fillStyle = S.title; g.fillText(title, w / 2, 100);
  fit(g, sub, w - 80, 46, 700); g.fillStyle = S.sub; g.fillText(sub, w / 2, 198);
  if (style === 'pudar') { let s = 7; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(240,230,205,${.3 + r() * .5})`; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 26, 3 + r() * 10, r() * 3, 0, 7); g.fill(); } }   // cat mengelupas
  t.needsUpdate = true;
}

/* ---------- papan kenangan ---------- */
function photo(g, x, y, w, h, kind) {
  g.fillStyle = '#fbfbf5'; g.fillRect(x, y, w, h + 22); const ix = x + 8, iy = y + 8, iw = w - 16, ih = h - 8;
  if (kind === 'lantik') {
    g.fillStyle = '#9fc7ea'; g.fillRect(ix, iy, iw, ih); g.fillStyle = '#e8312f'; g.fillRect(ix + 8, iy + 8, 26, 9); g.fillStyle = '#fff'; g.fillRect(ix + 8, iy + 17, 26, 9);
    g.fillStyle = '#2a2a3a'; g.fillRect(ix + iw / 2 - 14, iy + ih - 50, 28, 50); g.fillStyle = '#e8c39a'; g.beginPath(); g.arc(ix + iw / 2, iy + ih - 60, 12, 0, 7); g.fill();
    g.strokeStyle = '#ffd23a'; g.lineWidth = 5; g.beginPath(); g.moveTo(ix + iw / 2 - 14, iy + ih - 48); g.lineTo(ix + iw / 2 + 14, iy + ih - 20); g.stroke();
  } else {   // Pak Haji di bangku teras
    g.fillStyle = '#e8d6a8'; g.fillRect(ix, iy, iw, ih); g.fillStyle = '#8a5424'; g.fillRect(ix + 6, iy + ih - 22, iw - 12, 8);
    g.fillStyle = '#f4f4ef'; g.fillRect(ix + iw / 2 - 13, iy + ih - 58, 26, 38); g.fillStyle = '#d9b48a'; g.beginPath(); g.arc(ix + iw / 2, iy + ih - 68, 11, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.fillRect(ix + iw / 2 - 11, iy + ih - 82, 22, 7);   // peci putih
  }
  g.fillStyle = '#3a2a1a'; g.font = '700 13px sans-serif'; g.textAlign = 'center'; g.fillText(kind === 'lantik' ? 'Pelantikan' : 'Pak Haji', x + w / 2, y + h + 15);
}
function paper(g, x, y, w, h, bg, lines, { size = 14, color = '#2a2a2a', head = null, border = null } = {}) {
  g.fillStyle = bg; g.fillRect(x, y, w, h); if (border) { g.strokeStyle = border; g.lineWidth = 4; g.strokeRect(x + 4, y + 4, w - 8, h - 8); }
  g.textAlign = 'center'; let yy = y + 26;
  if (head) { g.fillStyle = color; g.font = `900 ${size + 4}px serif`; g.fillText(head, x + w / 2, yy); yy += size + 10; }
  g.font = `700 ${size}px sans-serif`; g.fillStyle = color; lines.forEach(l => { g.fillText(l, x + w / 2, yy); yy += size + 5; });
}
const wrap = (g, text, max, size) => { g.font = `700 ${size}px sans-serif`; const out = []; let cur = ''; for (const wd of text.split(' ')) { const t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > max && cur) { out.push(cur); cur = wd; } else cur = t; } if (cur) out.push(cur); return out.slice(0, 4); };
export function drawBoard(B, items = []) {
  const { g, c, t } = B, w = c.width, h = c.height;
  g.fillStyle = '#b8875a'; g.fillRect(0, 0, w, h); let s = 3; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${90 + r() * 60},${50 + r() * 40},20,.35)`; g.fillRect(r() * w, r() * h, 3, 3); }   // gabus
  g.strokeStyle = '#6b4020'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  const slots = [[24, 24], [192, 24], [360, 24], [24, 210], [192, 210], [360, 210]];
  items.slice(0, 6).forEach((it, i) => {
    const [x, y] = slots[i], rot = (i % 2 ? 1 : -1) * .05; g.save(); g.translate(x + 64, y + 80); g.rotate(rot); g.translate(-(x + 64), -(y + 80));
    if (it.kind === 'lantik' || it.kind === 'haji') photo(g, x, y, 128, 130, it.kind);
    else if (it.kind === 'piagam') paper(g, x, y, 136, 150, '#fff6d8', ['Bapak', 'Pembangunan'], { head: 'PIAGAM', color: '#8a5a14', border: '#d4a82a', size: 15 });
    else if (it.kind === 'koran') paper(g, x, y, 136, 150, '#ecebe4', wrap(g, it.text || '', 120, 13), { head: 'KORAN KOTA', color: '#1a1a1a', size: 13 });
    else if (it.kind === 'skandal') paper(g, x, y, 136, 150, '#e6e2d8', wrap(g, it.text || 'Wali Kota Dijemput KPK', 120, 14), { head: 'KORAN KOTA', color: '#8a1a1a', size: 14 });
    else if (it.kind === 'rani') paper(g, x, y, 136, 150, '#ffffff', ['Terima kasih,', 'Kak!', '', '- Rani'], { color: '#2a4a8a', size: 15 });
    g.fillStyle = '#d6302a'; g.beginPath(); g.arc(x + 64, y + 6, 6, 0, 7); g.fill();   // paku payung
    g.restore();
  });
  t.needsUpdate = true;
}
export function drawBaliho(B, { title = 'PILIH ANAK WARUNG', sub = 'Jujur Melayani Kota' } = {}) {
  const { g, c, t } = B, w = c.width, h = c.height;
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#d62f2f'); gr.addColorStop(1, '#8a1b10'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(120, h / 2, 86, 0, 7); g.fill(); g.fillStyle = '#e8c39a'; g.beginPath(); g.arc(120, h / 2 - 14, 40, 0, 7); g.fill();
  g.fillStyle = '#2a2a3a'; g.fillRect(84, h / 2 + 24, 72, 60); g.fillStyle = '#fff'; g.font = '900 34px sans-serif'; g.textAlign = 'center'; g.fillText('1', 120, h / 2 + 70);
  g.textAlign = 'left'; g.fillStyle = '#fff'; fit(g, title, w - 260, 64); g.fillText(title, 230, h / 2 - 10); g.fillStyle = '#ffe9a0'; fit(g, sub, w - 260, 38, 700); g.fillText(sub, 230, h / 2 + 50);
  t.needsUpdate = true;
}

/** Bangun semua objek dan kembalikan pengatur tampilannya. */
export function createPapan(scene, { banner, std }) {
  const BN = tex(1024, 256); banner.material.map = BN.t; banner.material.needsUpdate = true; drawBanner(BN);
  const wood = std('#6b4020', { roughness: .9 });
  // papan kenangan menempel di dinding depan bangunan sebelah kanan, di atas bangku warga (terlihat dari kamera Luar & Pembeli)
  const board = new THREE.Group(); board.position.set(3.5, .6, .23); board.scale.setScalar(.9); scene.add(board);
  const BD = tex(512, 400);
  const frameB = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.0, .04), wood); frameB.position.set(0, 1.65, 0); board.add(frameB);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.16, .92), new THREE.MeshStandardMaterial({ map: BD.t, roughness: .85 })); face.position.set(0, 1.65, .025); board.add(face);
  const BH = tex(1024, 400), baliho = new THREE.Group(); baliho.position.set(5.5, 0, 1.25); baliho.rotation.y = -.2; baliho.scale.setScalar(1.2); scene.add(baliho);   // di trotoar, menghadap jalan
  [-.9, .9].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 2.6, 8), std('#8a8a90', { metalness: .5 })); p.position.set(x, 1.3, 0); baliho.add(p); });
  const bf = new THREE.Mesh(new THREE.PlaneGeometry(2.1, .82), new THREE.MeshStandardMaterial({ map: BH.t, roughness: .6, side: THREE.DoubleSide })); bf.position.set(0, 2.15, .04); baliho.add(bf);
  board.visible = false; baliho.visible = false;
  let key = '';
  return {
    set(look = {}) {
      const k = JSON.stringify(look); if (k === key) return; key = k;
      drawBanner(BN, look.sign || {});
      board.visible = !!(look.board && look.board.length); if (board.visible) drawBoard(BD, look.board);
      baliho.visible = !!look.baliho; if (baliho.visible) drawBaliho(BH, look.baliho);
    },
    get key() { return key; }, board, baliho,
  };
}
