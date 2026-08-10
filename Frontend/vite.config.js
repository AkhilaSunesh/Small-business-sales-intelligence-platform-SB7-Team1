import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwind()],
  server: {
    // Proxy `/api` requests to the backend during development.
    // Configure VITE_API_BASE_URL in .env to change the target.
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:6000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          // Listen to proxy errors to handle backend offline scenarios gracefully
          proxy.on('error', (err, req, res) => {
            // Log a clean single-line warning instead of a massive stack trace
            console.warn(`⚠️ [Proxy Warning] Backend offline or unreachable: ${req.method} ${req.url} (${err.message})`);
            
            // Send a clean 502 response to the client
            if (res && typeof res.writeHead === 'function') {
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
              }
              res.end(JSON.stringify({ error: 'Gateway Error', message: 'Backend is offline or unreachable.' }));
            }
          });

          // Monkey-patch proxy.on and proxy.addListener to prevent Vite's default error logger
          // from registering its listener and logging the full AggregateError stack trace
          const originalOn = proxy.on;
          const originalAddListener = proxy.addListener;
          
          proxy.on = proxy.addListener = function (event, listener) {
            if (event === 'error') {
              return this;
            }
            return originalOn.call(this, event, listener);
          };
        },
      },
    },
  },
});