declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    IMAGES: R2Bucket
    JWT_SECRET: string
    RESEND_API_KEY: string
    GOOGLE_PLACES_API_KEY: string
    TEST_MIGRATIONS: D1Migration[]
  }
}
