import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function activitiesApiPlugin() {
  return {
    name: 'activities-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        try {
          const url = new URL(req.url, 'http://localhost');
          if (
            url.pathname.startsWith('/api/activities') ||
            url.pathname.startsWith('/api/admin/') ||
            url.pathname.startsWith('/api/collaborators') ||
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
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      publicDir: 'public',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), activitiesApiPlugin()],
      build: {
        outDir: 'build'
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
