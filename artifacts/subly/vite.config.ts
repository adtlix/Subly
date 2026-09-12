import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT || '3000';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || '/';

function sublyApiPlugin() {
  return {
    name: 'subly-api-middleware',
    async configureServer(server: any) {
      try {
        const { default: app } = await import('../api-server/dist/app.mjs');
        server.middlewares.use((req: any, res: any, next: any) => {
          // Only pass /api and /healthz requests to express backend so Vite handles all frontend routes & assets
          if (req.url && (req.url.startsWith('/api') || req.url.startsWith('/healthz'))) {
            return app(req, res, next);
          }
          next();
        });
        console.log('[subly] ✅ Cloud API mounted in-process into Vite dev server');
      } catch (err) {
        console.error('[subly] ❌ Failed to mount api-server in Vite:', err);
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    sublyApiPlugin(),
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
