import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit } from '../src/services/rate-limiter'

const key = (name: string) => `${name}:${crypto.randomUUID()}`

describe('feature: in-isolate request rate limiting', () => {
  afterEach(() => vi.useRealTimers())

  it('01 allows attempts through the configured maximum', () => {
    const id = key('maximum')
    expect(checkRateLimit(id, 2, 1_000).allowed).toBe(true)
    expect(checkRateLimit(id, 2, 1_000).allowed).toBe(true)
  })

  it('02 blocks the first attempt above the maximum', () => {
    const id = key('blocked')
    checkRateLimit(id, 2, 1_000)
    checkRateLimit(id, 2, 1_000)
    expect(checkRateLimit(id, 2, 1_000).allowed).toBe(false)
  })

  it('03 reports decreasing remaining capacity', () => {
    const id = key('remaining')
    expect(checkRateLimit(id, 3, 1_000).remaining).toBe(2)
    expect(checkRateLimit(id, 3, 1_000).remaining).toBe(1)
    expect(checkRateLimit(id, 3, 1_000).remaining).toBe(0)
  })

  it('04 isolates counters for different keys', () => {
    const first = key('first')
    const second = key('second')
    checkRateLimit(first, 1, 1_000)
    expect(checkRateLimit(first, 1, 1_000).allowed).toBe(false)
    expect(checkRateLimit(second, 1, 1_000).allowed).toBe(true)
  })

  it('05 resets an expired window', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'))
    const id = key('reset')
    checkRateLimit(id, 1, 1_000)
    vi.advanceTimersByTime(1_001)
    expect(checkRateLimit(id, 1, 1_000).allowed).toBe(true)
  })

  it('06 keeps the original reset time within a window', () => {
    const id = key('stable-reset')
    const first = checkRateLimit(id, 3, 10_000)
    const second = checkRateLimit(id, 3, 10_000)
    expect(second.resetAt).toBe(first.resetAt)
  })

  it('07 reports zero remaining while blocked', () => {
    const id = key('zero')
    checkRateLimit(id, 1, 1_000)
    expect(checkRateLimit(id, 1, 1_000).remaining).toBe(0)
  })

  it('08 continues blocking repeated excess attempts', () => {
    const id = key('repeat')
    checkRateLimit(id, 1, 1_000)
    expect(checkRateLimit(id, 1, 1_000).allowed).toBe(false)
    expect(checkRateLimit(id, 1, 1_000).allowed).toBe(false)
  })

  it('09 supports a one-attempt limit', () => {
    const id = key('single')
    expect(checkRateLimit(id, 1, 1_000)).toMatchObject({ allowed: true, remaining: 0 })
    expect(checkRateLimit(id, 1, 1_000)).toMatchObject({ allowed: false, remaining: 0 })
  })

  it('10 uses the documented five-attempt default', () => {
    const id = key('default')
    for (let attempt = 0; attempt < 5; attempt++) {
      expect(checkRateLimit(id).allowed).toBe(true)
    }
    expect(checkRateLimit(id).allowed).toBe(false)
  })
})
