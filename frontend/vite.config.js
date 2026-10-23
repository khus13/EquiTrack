import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy API + uploaded images to the PHP server so cookies are same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
    },
  },
});
