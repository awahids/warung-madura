import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Menyuntik daftar precache & id build ke dist/sw.js setelah build selesai
function swManifest() {
  const walk = (dir, base = '') => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? walk(path.join(dir, d.name), `${base}${d.name}/`) : [`${base}${d.name}`]);
  return {
    name: 'sw-manifest',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve('dist'), swPath = path.join(dist, 'sw.js');
      if (!fs.existsSync(swPath)) return;
      const files = walk(dist).filter(f => f !== 'sw.js' && !f.endsWith('.map'));
      const list = ['./', ...files.map(f => `./${f}`)];
      const sw = fs.readFileSync(swPath, 'utf8').replace('__BUILD__', Date.now().toString(36)).replace('__PRECACHE__', JSON.stringify(list));
      fs.writeFileSync(swPath, sw);
    },
  };
}

// base './' supaya build bisa dibuka dari sub-path GitHub Pages (/<repo>/)
export default defineConfig({
  base: './',
  plugins: [react(), swManifest()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 800 },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
