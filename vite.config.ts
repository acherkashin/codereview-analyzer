import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  base: '/codereview-analyzer/',
  build: {
    outDir: 'build',
  },
  plugins: [react(), svgr()],
});
