import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fork } from 'child_process';

export default defineConfig({
  plugins: [
    react(),
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
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
// Trigger dev server restart for exam schedule append check
