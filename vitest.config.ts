import path from 'node:path'

import { defineConfig } from 'vitest/config'

/**
 * Test runner for the dashboard.
 *
 * The repo already had a vitest-flavoured test (`normalizeProductPayload.test.ts`,
 * with a "run with npx vitest" header) and no runner installed to execute it —
 * this config is that missing half, not a new choice of framework.
 *
 * Two environments, chosen per file by the `environment` docblock comment
 * vitest reads, so pure logic does not pay for a jsdom boot:
 *   - default `node` for the state machine and geometry;
 *   - `jsdom` opted into by the component tests.
 */
export default defineConfig({
  // No @vitejs/plugin-react: it exists for Fast Refresh, which tests do not
  // use, and its Vite 7 peer disagrees with the one vitest bundles badly enough
  // to break `tsc` on this very file. esbuild does the JSX transform instead.
  //
  // `jsx: 'automatic'` is not optional here. tsconfig says `jsx: "preserve"`
  // because Next owns the real build, so without this every component that does
  // not import React — the normal thing in this codebase — throws "React is not
  // defined" the moment it renders.
  esbuild: { jsx: 'automatic' },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
})
