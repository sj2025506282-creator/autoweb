import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(
        new URL('./migrations', import.meta.url).pathname,
      )
      return {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          d1Databases: ['DB'],
          r2Buckets: ['IMAGES'],
          bindings: {
            JWT_SECRET: 'test-jwt-secret-at-least-32-characters',
            RESEND_API_KEY: 're_test',
            GOOGLE_PLACES_API_KEY: 'google-test-key',
            TEST_MIGRATIONS: migrations,
          },
        },
      }
    }),
  ],
  test: {
    setupFiles: ['./test/setup.ts'],
    testTimeout: 10_000,
  },
})
