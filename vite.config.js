import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/uber/api': 'http://127.0.0.1:8081',
      '/uber/lab': 'http://127.0.0.1:8081'
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
});
