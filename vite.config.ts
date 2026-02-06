
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures assets are loaded correctly on sub-paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    port: 3000,
    open: true,
  },
});
