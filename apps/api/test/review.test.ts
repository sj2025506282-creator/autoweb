import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  OWNER,
  apiRequest,
  authCookie,
  insertRestaurant,
  jsonRequest,
  resetDatabase,
} from './helpers'

async function review(id: string, body: unknown, cookie?: string) {
  return jsonRequest(`/api/outreach/${id}`, 'PUT', body, cookie)
}

function mockResend(payload: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function restaurantStatus(id = 'restaurant-1') {
  return env.DB.prepare(
    'SELECT status, outreach_sent_at FROM restaurants WHERE id = ?'
  ).bind(id).first<{ status: string; outreach_sent_at: string | null }>()
}

describe('feature: demo review and outreach email transaction', () => {
  beforeEach(async () => {
    vi.unstubAllGlobals()
    await resetDatabase()
  })

  it('01 rejects unauthenticated review actions', async () => {
    await insertRestaurant()
    expect((await review('restaurant-1', { status: 'draft' })).status).toBe(401)
  })

  it('02 rejects owner review actions', async () => {
    await insertRestaurant()
    const response = await review(
      'restaurant-1',
      { status: 'draft' },
      await authCookie(OWNER),
    )
    expect(response.status).toBe(403)
  })

  it('03 returns 404 for a missing demo', async () => {
    const response = await review(
      'missing',
      { status: 'draft' },
      await authCookie(),
    )
    expect(response.status).toBe(404)
  })

  it('04 rejects approval with email sending when no email exists', async () => {
    await insertRestaurant({ email: '' })
    const response = await review(
      'restaurant-1',
      { status: 'active', sendEmail: true },
      await authCookie(),
    )
    expect(response.status).toBe(422)
    expect((await restaurantStatus())?.status).toBe('demo')
  })

  it('05 rejects a demo into draft without sending email', async () => {
    await insertRestaurant()
    const response = await review(
      'restaurant-1',
      { status: 'draft' },
      await authCookie(),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'draft', emailSent: false })
    expect((await restaurantStatus())?.status).toBe('draft')
  })

  it('06 activates without email when explicitly requested', async () => {
    await insertRestaurant({ email: '' })
    const response = await review(
      'restaurant-1',
      { status: 'active', sendEmail: false },
      await authCookie(),
    )
    expect(response.status).toBe(200)
    expect((await restaurantStatus())?.status).toBe('active')
  })

  it('07 sends email before activating and records delivery time', async () => {
    await insertRestaurant()
    const fetchMock = mockResend({ id: 'email-1' })
    const response = await review(
      'restaurant-1',
      { status: 'active', sendEmail: true },
      await authCookie(),
    )
    const row = await restaurantStatus()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ status: 'active', emailSent: true })
    expect(row?.status).toBe('active')
    expect(row?.outreach_sent_at).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('08 leaves the demo unchanged when Resend rejects the email', async () => {
    await insertRestaurant()
    mockResend({ message: 'Invalid recipient', name: 'validation_error' }, 422)
    const response = await review(
      'restaurant-1',
      { status: 'active', sendEmail: true },
      await authCookie(),
    )
    expect(response.status).toBe(502)
    expect((await restaurantStatus())?.status).toBe('demo')
  })

  it('09 leaves the demo unchanged when the email network throws', async () => {
    await insertRestaurant()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const response = await review(
      'restaurant-1',
      { status: 'active', sendEmail: true },
      await authCookie(),
    )
    expect(response.status).toBe(502)
    expect((await restaurantStatus())?.status).toBe('demo')
  })

  it('10 prevents repeating review actions on a non-demo', async () => {
    await insertRestaurant({ status: 'active' })
    const response = await review(
      'restaurant-1',
      { status: 'draft' },
      await authCookie(),
    )
    expect(response.status).toBe(404)
    expect((await restaurantStatus())?.status).toBe('active')
  })

  it('11 generates the expected demo URL in the email payload', async () => {
    await insertRestaurant({ slug: 'expected-slug' })
    const fetchMock = mockResend({ id: 'email-2' })
    await review(
      'restaurant-1',
      { status: 'active', sendEmail: true },
      await authCookie(),
    )
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const payload = JSON.parse(String(init.body)) as { html: string }
    expect(payload.html).toContain('https://expected-slug.autoweb.app')
  })

  it('12 does not send email when sendEmail is omitted', async () => {
    await insertRestaurant()
    const fetchMock = mockResend({ id: 'should-not-send' })
    const response = await review(
      'restaurant-1',
      { status: 'active' },
      await authCookie(),
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ emailSent: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('13 stores outreach delivery time in SQLite datetime format', async () => {
    await insertRestaurant()
    mockResend({ id: 'email-time' })
    await review(
      'restaurant-1',
      { status: 'active', sendEmail: true },
      await authCookie(),
    )
    expect((await restaurantStatus())?.outreach_sent_at)
      .toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('14 prevents concurrent approval from sending duplicate email', async () => {
    await insertRestaurant()
    let releaseEmail!: () => void
    const waiting = new Promise<void>((resolve) => { releaseEmail = resolve })
    const fetchMock = vi.fn().mockImplementation(async () => {
      await waiting
      return new Response(JSON.stringify({ id: 'single-email' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const cookie = await authCookie()
    const first = review('restaurant-1', { status: 'active', sendEmail: true }, cookie)
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const second = await review('restaurant-1', { status: 'active', sendEmail: true }, cookie)
    releaseEmail()
    const firstResponse = await first
    expect(firstResponse.status).toBe(200)
    expect(second.status).toBe(409)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect((await restaurantStatus())?.status).toBe('active')
  })
})
