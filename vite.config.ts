// vite.config.ts
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const NGROK_HOST = '7e32c76732c1.ngrok-free.app';

  return {
    define: {
      // Giúp tránh lỗi nếu có thư viện node_modules dùng process.env
      'process.env': env,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',

      // ✅ Cho phép host ngrok truy cập Vite dev server
      allowedHosts: [NGROK_HOST],
      // Hoặc nếu ngrok thay đổi host liên tục, dùng:
      // allowedHosts: ['.ngrok-free.app', '.ngrok.io'],

      // ✅ (Khuyên dùng khi truy cập qua ngrok để HMR không bị lỗi)
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
