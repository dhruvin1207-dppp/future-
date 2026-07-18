import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fork } from 'child_process';

export default defineConfig({
  plugins: [
    react(),
    // Start the local Express backend only during development (not used on Vercel)
    {
      name: 'start-backend',
      configureServer(server) {
        const child = fork('./server.js');
        child.on('error', (err) => console.error('Backend process error:', err));
        server.httpServer.on('close', () => {
          child.kill();
        });
      },
    },
  ],
  server: {
    allowedHosts: ['nell-pukka-kody.ngrok-free.dev'],
    // LOCAL DEV ONLY: proxy /api calls to the local Express server on port 5000
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('xlsx')) {
              return 'vendor-excel';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            return 'vendor-libs';
          }
        },
      },
    },
  },
});
