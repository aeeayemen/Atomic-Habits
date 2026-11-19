import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('docx') || id.includes('mammoth')) return 'vendor-docx';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('canvas-confetti')) return 'vendor-confetti';
            if (id.includes('@fortawesome')) return 'vendor-icons';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            return 'vendor-utils';
          }
        },
      },
    },
  },
});
