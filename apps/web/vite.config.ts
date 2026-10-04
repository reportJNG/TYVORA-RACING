import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@typerace/sim': path.resolve(__dirname, '../../packages/sim/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
