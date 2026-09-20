import fs from 'node:fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

try {
  if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
} catch (e) {
  // Ignora se não for suportado ou não existir
}

function activitiesApiPlugin() {
  return {
    name: 'activities-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          if (
            url.pathname.startsWith('/api/shop/') ||
            url.pathname.startsWith('/api/admin/shop/') ||
            url.pathname === '/api/webhooks/ifthenpay'
          ) {
            const { handleShopApi } = await import('./server/shopApi.js');
            const handled = await handleShopApi(req, res, url.pathname, url.searchParams);
            if (handled !== false) return;
          }

          if (
            url.pathname.startsWith('/api/activities') ||
            url.pathname.startsWith('/api/admin/') ||
            url.pathname.startsWith('/api/collaborators') ||
            url.pathname.startsWith('/api/jobs') ||
            url.pathname === '/api/config'
          ) {
            const { handleActivitiesApi } = await import('./server/api.js');
            const handled = await handleActivitiesApi(req, res, url.pathname);
            if (handled !== false) return;
          }
        } catch (e) {
          console.error('[API Middleware Error]:', e);
        }
        next();
      });
    },
  };
}

export default defineConfig({
  publicDir: 'public',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), activitiesApiPlugin()],
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
          qr: ['qr-code-styling', 'jszip', 'canvas-confetti'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
