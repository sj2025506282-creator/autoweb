import { env } from 'cloudflare:workers'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, insertRestaurant, resetDatabase } from './helpers'

const validReservation = {
  restaurantId: 'restaurant-1',
  customerName: 'Ada Lovelace',
  phone: '+1 555 0199',
  email: 'ada@example.test',
  partySize: 4,
  reservationTime: '2099-08-20T19:30:00',
  note: 'Window seat',
}

let requestNumber = 0

async function reserve(body: unknown, bindings: Record<string, unknown> = {}) {
  requestNumber += 1
  return apiRequest('/api/reserve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': `192.0.2.${requestNumber}`,
    },
    body: JSON.stringify(body),
  }, bindings)
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

describe('feature: public reservation submission', () => {
  beforeEach(async () => {
    vi.unstubAllGlobals()
    await resetDatabase()
  })

  it('01 accepts a valid reservation without authentication', async () => {
    await insertRestaurant({ status: 'active', email: '' })
    const response = await reserve(validReservation)
    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ success: true, notificationSent: false })
  })

  it('02 rejects reservations for a missing restaurant', async () => {
    const response = await reserve(validReservation)
    expect(response.status).toBe(404)
  })

  it('03 rejects reservations for a draft restaurant', async () => {
    await insertRestaurant({ status: 'draft' })
    const response = await reserve(validReservation)
    expect(response.status).toBe(404)
  })

  it('04 rejects a blank customer name', async () => {
    const response = await reserve({ ...validReservation, customerName: ' ' })
    expect(response.status).toBe(400)
  })

  it('05 rejects an invalid phone value', async () => {
    const response = await reserve({ ...validReservation, phone: '1' })
    expect(response.status).toBe(400)
  })

  it('06 rejects an invalid email address', async () => {
    const response = await reserve({ ...validReservation, email: 'invalid' })
    expect(response.status).toBe(400)
  })

  it('07 rejects party sizes above twenty', async () => {
    const response = await reserve({ ...validReservation, partySize: 21 })
    expect(response.status).toBe(400)
  })

  it('08 rejects reservation times in the past', async () => {
    const response = await reserve({
      ...validReservation,
      reservationTime: '2020-01-01T12:00:00',
    })
    expect(response.status).toBe(400)
  })

  it('09 persists all accepted reservation details', async () => {
    await insertRestaurant({ status: 'active', email: '' })
    const response = await reserve(validReservation)
    const { id } = await response.json() as { id: string }
    const row = await env.DB.prepare(
      'SELECT * FROM reservations WHERE id = ?'
    ).bind(id).first<Record<string, unknown>>()
    expect(row).toMatchObject({
      customer_name: 'Ada Lovelace',
      email: 'ada@example.test',
      party_size: 4,
      note: 'Window seat',
    })
  })

  it('10 sends an owner notification when email is configured', async () => {
    await insertRestaurant({ status: 'active' })
    const fetchMock = mockResend({ id: 'reservation-email' })
    const response = await reserve(validReservation)
    expect(await response.json()).toMatchObject({ notificationSent: true })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('11 keeps the saved reservation when notification delivery fails', async () => {
    await insertRestaurant({ status: 'active' })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('email unavailable')))
    const response = await reserve(validReservation)
    const body = await response.json() as { id: string; notificationSent: boolean }
    const saved = await env.DB.prepare(
      'SELECT id FROM reservations WHERE id = ?'
    ).bind(body.id).first()
    expect(response.status).toBe(201)
    expect(body.notificationSent).toBe(false)
    expect(saved).not.toBeNull()
  })

  it('12 rejects a reservation thirty seconds in the past', async () => {
    await insertRestaurant({ status: 'active', email: '' })
    const thirtySecondsAgo = new Date(Date.now() - 30_000).toISOString()
    const response = await reserve({
      ...validReservation,
      reservationTime: thirtySecondsAgo,
    })
    expect(response.status).toBe(400)
  })

  it('13 accepts a reservation thirty seconds in the future', async () => {
    await insertRestaurant({ status: 'active', email: '' })
    const thirtySecondsAhead = new Date(Date.now() + 30_000).toISOString()
    const response = await reserve({
      ...validReservation,
      reservationTime: thirtySecondsAhead,
    })
    expect(response.status).toBe(201)
  })
})
