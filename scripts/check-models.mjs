#!/usr/bin/env node
// Cek berkas GLB di public/models: ukuran, jumlah segitiga, tinggi, tekstur — terhadap anggaran untuk HP.
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('public/models');
const EXPECTED = ['galon', 'gas', 'toples', 'bensin', 'rakBensin', 'kardus', 'beras'];
const BUDGET = { kb: 600, tris: 12000 }; // per prop; rak bensin boleh 2x
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.endsWith('.glb')) : [];

function inspect(file) {
  const b = fs.readFileSync(file);
  if (b.toString('utf8', 0, 4) !== 'glTF') return { error: 'bukan berkas GLB' };
  const jsonLen = b.readUInt32LE(12);
  if (b.toString('utf8', 16, 20) !== 'JSON') return { error: 'chunk JSON tidak ditemukan' };
  const j = JSON.parse(b.toString('utf8', 20, 20 + jsonLen));
  let tris = 0, min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const m of j.meshes || []) for (const p of m.primitives || []) {
    const mode = p.mode ?? 4;
    if (mode === 4) tris += (p.indices !== undefined ? j.accessors[p.indices].count : j.accessors[p.attributes.POSITION].count) / 3;
    const a = j.accessors[p.attributes.POSITION];
    if (a.min && a.max) for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], a.min[i]); max[i] = Math.max(max[i], a.max[i]); }
  }
  const size = min.map((v, i) => max[i] - v);
  return { tris: Math.round(tris), size, textures: (j.images || []).length, draco: (j.extensionsUsed || []).includes('KHR_draco_mesh_compression') };
}

let bad = 0;
console.log(`Model di ${path.relative('.', DIR)}/ (${files.length} berkas)\n`);
for (const id of EXPECTED) {
  const f = path.join(DIR, `${id}.glb`);
  if (!fs.existsSync(f)) { console.log(`  –  ${id}.glb  (belum ada → pakai prop prosedural)`); continue; }
  const kb = Math.round(fs.statSync(f).size / 1024), r = inspect(f);
  if (r.error) { console.log(`  ✗  ${id}.glb  ${r.error}`); bad++; continue; }
  const k = id === 'rakBensin' ? 2 : 1, warn = [];
  if (kb > BUDGET.kb * k) warn.push(`ukuran ${kb} KB > ${BUDGET.kb * k}`);
  if (r.tris > BUDGET.tris * k && !r.draco) warn.push(`${r.tris} segitiga > ${BUDGET.tris * k}`);
  if (r.size.some(v => !isFinite(v) || v <= 0)) warn.push('dimensi tidak valid');
  console.log(`  ${warn.length ? '!' : '✓'}  ${id}.glb  ${kb} KB · ${r.tris} segitiga · ${r.size.map(v => v.toFixed(2)).join('×')} · ${r.textures} tekstur${warn.length ? '  ⚠ ' + warn.join('; ') : ''}`);
  if (warn.length) bad++;
}
const extra = files.filter(f => !EXPECTED.includes(f.replace(/\.glb$/, '')));
if (extra.length) console.log(`\nBerkas tak dikenal (diabaikan game): ${extra.join(', ')}`);
console.log(bad ? `\n${bad} berkas perlu perhatian — lihat panduan di public/models/README.md` : '\nSemua sesuai anggaran.');
process.exit(bad ? 1 : 0);
