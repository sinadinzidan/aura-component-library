import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['vitest.setup.ts'],
    exclude: [...configDefaults.exclude, '.claude/**', '.agents/**'],
    // Aura reads `import.meta.env.VITEST` as its modules load. Inline the
    // package so Vitest transforms it and defines that value.
    server: {
      deps: {
        inline: [/@cognite\/aura/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '.claude/', '.agents/', 'vitest.setup.ts', '**/*.config.ts', '**/*.d.ts'],
    },
  },
});
