import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy API + uploaded images to the PHP server so cookies are same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 127.0.0.1 avoids IPv6 'localhost' resolution problems on Windows/Node 18+.
      '/api': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
    },
  },
});
