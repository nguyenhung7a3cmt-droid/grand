import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscatorPlugin from 'vite-plugin-javascript-obfuscator';
import { stripePlugin } from './src/server/stripeServerPlugin.js';
import { authPlugin } from './src/server/authServerPlugin.js';
import { catalogPlugin } from './src/server/catalogServerPlugin.js';
import { securityRateLimiter } from './src/server/securityMiddleware.js';

function securityPlugin() {
  return {
    name: 'security-rate-limiter-plugin',
    configureServer(server) {
      server.middlewares.use(securityRateLimiter());
    },
    configurePreviewServer(server) {
      server.middlewares.use(securityRateLimiter());
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    securityPlugin(),
    stripePlugin(),
    authPlugin(),
    catalogPlugin()
  ],
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion', 'lucide-react']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: false,
    host: true,
    allowedHosts: ['localhost', 'grandstock.net', '.trycloudflare.com'],
    proxy: {
      '/api/roblox-users': {
        target: 'https://users.roblox.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/roblox-users/, '')
      },
      '/api/roblox-thumbnails': {
        target: 'https://thumbnails.roblox.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/roblox-thumbnails/, '')
      }
    }
  },
});
