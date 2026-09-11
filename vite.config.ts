import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubActions = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
    plugins: [react()],
    base: './',
    resolve: githubActions ? {
        alias: {
            '@appdeploy/client': new URL('./src/appdeploy-ci-client.ts', import.meta.url).pathname,
        },
    } : undefined,
    build: {
        outDir: process.env.APPDEPLOY_VITE_OUT_DIR || 'dist',
        sourcemap: process.env.APPDEPLOY_VITE_SOURCEMAP === 'hidden' ? 'hidden' : false,
        rollupOptions: {
            maxParallelFileOps: 128,
        },
    },
});
