import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC transpiles the NestJS decorators (with metadata) that esbuild alone drops.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
  plugins: [swc.vite()],
});
