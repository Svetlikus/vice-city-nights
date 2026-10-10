import { defineConfig } from 'vite';
export default defineConfig({ base: './', server: { host: '127.0.0.1', watch: { usePolling: true } }, build: { target: 'es2022', assetsInlineLimit: 0 } });
