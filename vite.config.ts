import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      // Disable problematic HMR websocket behavior
      hmr: false,
      // Use polling instead of websocket where required
      watch: {
        usePolling: true,
        interval: 100,
      },
    },
  };
});
