import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AB Investment — Vite config.
// React plugin enables JSX + fast refresh during `npm run dev`.
// Build output goes to `dist/` (matches netlify.toml publish dir).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true, // auto-opens browser on `npm run dev`
  },
});
