import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    strictPort: true,
    open: false
  },
  build: {
    outDir: 'dist'
  }
});
