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
    // On Vercel, /api/* is handled by serverless functions in the /api folder
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
