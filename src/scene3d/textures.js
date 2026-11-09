import * as THREE from 'three';

/** Tekstur kanvas prosedural untuk adegan warung 3D. */
function canvasTex(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

export const woodTex = (base = '#b97a3e', repeat = [2, 2]) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(80,40,15,.16)' : 'rgba(255,225,175,.10)'; g.fillRect(0, i * 32, w, 32); g.fillStyle = 'rgba(50,25,8,.55)'; g.fillRect(0, i * 32, w, 2); }
  for (let i = 0; i < 180; i++) { g.strokeStyle = `rgba(60,30,10,${rnd(0, .13)})`; g.beginPath(); const y = rnd(0, h); g.moveTo(0, y); g.lineTo(w, y + rnd(-2, 2)); g.stroke(); }
}, { repeat });

export const roofTex = () => canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#3c78b8'; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) { const gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(.5, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(255,255,255,.28)'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); }
}, { repeat: [6, 3] });

export const slatTex = () => canvasTex(128, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#8e979f'); gr.addColorStop(.5, '#bcc5cc'); gr.addColorStop(1, '#8e979f');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 8) { g.fillStyle = 'rgba(30,40,50,.5)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y + 2, w, 2); }
}, { repeat: [8, 4] });

export const asphaltTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4b4c51'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${rnd(0, 255) > 128 ? 255 : 0},${rnd(0, 255) > 128 ? 255 : 0},255,${rnd(0, .05)})`; g.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
}, { repeat: [10, 4] });

export const concreteTex = () => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#a7a59d'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(0,0,0,${rnd(0, .05)})`; g.fillRect(rnd(0, w), rnd(0, h), 3, 3); }
  g.strokeStyle = 'rgba(60,60,55,.5)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
}, { repeat: [5, 4] });

export const bannerTex = () => canvasTex(1024, 256, (g, w, h) => {
  g.fillStyle = '#ffd23a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#8a1b10'; g.lineWidth = 12; g.strokeRect(8, 8, w - 16, h - 16);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 100px "Trebuchet MS",Arial,sans-serif'; g.lineWidth = 8; g.strokeStyle = '#fff3b0'; g.strokeText('WARUNG MADURA', w / 2, 100); g.fillStyle = '#c0281a'; g.fillText('WARUNG MADURA', w / 2, 100);
  g.font = '700 46px "Trebuchet MS",Arial,sans-serif'; g.fillStyle = '#5a1a0a'; g.fillText('Sembako · Minuman · Rokok · Pulsa', w / 2, 198);
}, { srgb: true });

export const signTex = (text, bg = '#c0281a', fg = '#fff') => canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = fg; g.font = '900 52px "Trebuchet MS",Arial,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 3);
});

/** Untaian sachet (renteng): kolom persegi panjang warna-warni, latar transparan. */
export const rentengTex = () => canvasTex(64, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = '#6b6b6b'; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
  const cols = ['#d63b2f', '#f6c744', '#2f80d6', '#3f9e58', '#8a55b8', '#f08a2c', '#e8e8e8'];
  for (let y = 4; y < h - 10; y += 34) {
    const c = cols[Math.floor(rnd(0, cols.length))]; g.fillStyle = c; g.fillRect(8, y, w - 16, 30);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(14, y + 6, w - 28, 8); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(8, y + 26, w - 16, 4);
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let k = 0; k < 6; k++) g.fillRect(8 + k * 8, y, 4, 3);
  }
});

export const packTex = () => canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#d63b2f'; g.fillRect(0, 0, w, 40); g.fillStyle = '#2f80d6'; g.fillRect(0, h - 36, w, 36);
  g.fillStyle = '#f6c744'; g.beginPath(); g.arc(w / 2, h / 2, 24, 0, 7); g.fill();
});
