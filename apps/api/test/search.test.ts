import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ADMIN, OWNER, apiRequest, authCookie, resetDatabase } from './helpers'

const placesPayload = {
  places: [
    {
      id: 'place-no-site',
      displayName: { text: 'No Site Cafe' },
      formattedAddress: '1 Main Street',
      internationalPhoneNumber: '+1 555 0101',
      googleMapsUri: 'https://maps.google.com/no-site',
      location: { latitude: 30.1, longitude: -97.7 },
      rating: 4.6,
      userRatingCount: 42,
      businessStatus: 'OPERATIONAL',
    },
    {
      id: 'place-with-site',
      displayName: { text: 'Has Site Cafe' },
      formattedAddress: '2 Main Street',
      websiteUri: 'https://restaurant.example',
    },
  ],
}

function mockPlaces(payload: unknown = placesPayload, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('feature: Google Places lead search', () => {
  beforeEach(async () => {
    vi.unstubAllGlobals()
    await resetDatabase()
  })

  it('01 rejects unauthenticated searches', async () => {
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin')
    expect(response.status).toBe(401)
  })

  it('02 rejects owner searches', async () => {
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie(OWNER) },
    })
    expect(response.status).toBe(403)
  })

  it('03 rejects queries shorter than three characters', async () => {
    const response = await apiRequest('/api/outreach/search?q=ab', {
      headers: { Cookie: await authCookie(ADMIN) },
    })
    expect(response.status).toBe(400)
  })

  it('04 rejects limits above twenty', async () => {
    const response = await apiRequest('/api/outreach/search?q=restaurants&limit=21', {
      headers: { Cookie: await authCookie() },
    })
    expect(response.status).toBe(400)
  })

  it('05 reports a missing server-side Google key', async () => {
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie() },
    }, { GOOGLE_PLACES_API_KEY: '' })
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ error: expect.stringContaining('not configured') })
  })

  it('06 maps Google place fields into lead fields', async () => {
    mockPlaces()
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie() },
    })
    const body = await response.json() as { places: Array<Record<string, unknown>> }
    expect(response.status).toBe(200)
    expect(body.places[0]).toMatchObject({
      placeId: 'place-no-site',
      name: 'No Site Cafe',
      phone: '+1 555 0101',
      hasWebsite: false,
      rating: 4.6,
      reviewCount: 42,
    })
  })

  it('07 counts only leads without a listed website', async () => {
    mockPlaces()
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie() },
    })
    expect(await response.json()).toMatchObject({ withoutWebsite: 1 })
  })

  it('08 sends a restaurant-only strict text search request', async () => {
    const fetchMock = mockPlaces()
    await apiRequest('/api/outreach/search?q=italian+food&limit=7', {
      headers: { Cookie: await authCookie() },
    })
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toMatchObject({
      textQuery: 'italian food',
      includedType: 'restaurant',
      strictTypeFiltering: true,
      pageSize: 7,
    })
  })

  it('09 maps Google client errors to a safe 400 response', async () => {
    mockPlaces({ error: { message: 'Invalid query' } }, 400)
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie() },
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid query' })
  })

  it('10 maps Google server errors to a 502 response', async () => {
    mockPlaces({ error: { message: 'Unavailable' } }, 503)
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie() },
    })
    expect(response.status).toBe(502)
  })

  it('11 ignores incomplete Google records without an id or name', async () => {
    mockPlaces({ places: [{ formattedAddress: 'No identity' }, { id: 'missing-name' }] })
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie() },
    })
    expect(await response.json()).toMatchObject({ places: [], withoutWebsite: 0 })
  })

  it('12 treats malformed website values as no valid website', async () => {
    mockPlaces({
      places: [{
        id: 'bad-website',
        displayName: { text: 'Bad Website Cafe' },
        websiteUri: 'not-a-url',
      }],
    })
    const response = await apiRequest('/api/outreach/search?q=restaurants+austin', {
      headers: { Cookie: await authCookie() },
    })
    expect(await response.json()).toMatchObject({
      places: [{ website: '', hasWebsite: false }],
      withoutWebsite: 1,
    })
  })
})
