// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const NGROK_HOST = '1e43d8c9ec3f.ngrok-free.app';

  return {
    define: {
      'process.env': env,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [NGROK_HOST],
      hmr: {
        host: NGROK_HOST,
        protocol: 'wss',
        clientPort: 443,
      },
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, 'src') },
    },
  };
});
