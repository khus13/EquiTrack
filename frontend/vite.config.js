import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Development: the browser talks to Vite (port 5173) and Vite forwards every /api
// request to the PHP server (port 8000).  Because the browser only ever sees ONE
// origin, the session cookie and CSRF token "just work" (no CORS needed).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: false },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
});
