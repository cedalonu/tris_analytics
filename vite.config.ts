import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' → los assets se resuelven en relativo y funciona igual en la
// raíz de un servidor o en un subpath (p. ej. GitHub Pages /tris_analytics/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
