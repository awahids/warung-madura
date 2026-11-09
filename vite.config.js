import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' supaya build bisa dibuka dari sub-path GitHub Pages (/<repo>/)
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', chunkSizeWarningLimit: 800 },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
