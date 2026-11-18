import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// In development the React app runs on :5173 and forwards /api calls to Rails on :3000.
// `npm run build` writes the finished app into Rails' public/ folder, so one Rails server serves everything.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } },
  build: {
    outDir: '../public',
    emptyOutDir: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          mui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'], globals: true, css: false },
});
