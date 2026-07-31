import { env } from 'cloudflare:workers'
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it } from 'vitest'
import { signToken, verifyToken } from '../src/middleware/auth'
import { hashPassword, verifyPassword } from '../src/services/password'
import { ADMIN, apiRequest, jsonRequest, resetDatabase } from './helpers'

const encoder = new TextEncoder()

async function insertUser(password = 'LegacyPass123', role = 'admin') {
  const salt = '0123456789abcdef'
  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(salt + password),
  )
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  await env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
  ).bind(ADMIN.id, ADMIN.email, `${salt}:${hash}`, role).run()
}

async function login(email = ADMIN.email, password = 'LegacyPass123') {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': crypto.randomUUID(),
    },
    body: JSON.stringify({ email, password }),
  })
}

describe('feature: authentication and password lifecycle', () => {
  beforeEach(resetDatabase)

  it('00 does not provision a default administrator from migrations', async () => {
    const row = await env.DB.prepare(
      'SELECT COUNT(*) AS count FROM users',
    ).first<{ count: number }>()
    expect(row?.count).toBe(0)
  })

  it('01 signs and verifies a production JWT', async () => {
    const token = await signToken(ADMIN, env.JWT_SECRET)
    await expect(verifyToken(token, env.JWT_SECRET)).resolves.toEqual(ADMIN)
  })

  it('02 rejects a malformed JWT', async () => {
    await expect(verifyToken('not-a-jwt', env.JWT_SECRET)).resolves.toBeNull()
  })

  it('03 rejects a JWT signed with another secret', async () => {
    const token = await signToken(ADMIN, 'another-secret')
    await expect(verifyToken(token, env.JWT_SECRET)).resolves.toBeNull()
  })

  it('04 rejects an expired JWT', async () => {
    const token = await new SignJWT({
      email: ADMIN.email,
      role: ADMIN.role,
    })
      .setSubject(ADMIN.id)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1 second ago')
      .sign(encoder.encode(env.JWT_SECRET))
    await expect(verifyToken(token, env.JWT_SECRET)).resolves.toBeNull()
  })

  it('05 protects the current-user endpoint without a cookie', async () => {
    expect((await apiRequest('/api/auth/me')).status).toBe(401)
  })

  it('06 accepts the legacy password format and sets a local cookie', async () => {
    await insertUser()
    const response = await login()
    expect(response.status).toBe(200)
    expect(response.headers.get('Set-Cookie')).toContain('HttpOnly')
    expect(response.headers.get('Set-Cookie')).not.toContain('Secure')
  })

  it('07 rejects an incorrect password', async () => {
    await insertUser()
    expect((await login(ADMIN.email, 'WrongPass123')).status).toBe(401)
  })

  it('08 validates malformed login email addresses', async () => {
    expect((await login('invalid-email')).status).toBe(400)
  })

  it('09 rejects a signed JWT with an unsupported role', async () => {
    const token = await new SignJWT({
      email: ADMIN.email,
      role: 'auditor',
    })
      .setSubject(ADMIN.id)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1 hour')
      .sign(encoder.encode(env.JWT_SECRET))
    await expect(verifyToken(token, env.JWT_SECRET)).resolves.toBeNull()
  })

  it('10 rejects password changes with a wrong current password', async () => {
    await insertUser()
    const token = await signToken(ADMIN, env.JWT_SECRET)
    const response = await jsonRequest('/api/auth/change-password', 'POST', {
      currentPassword: 'WrongPass123',
      newPassword: 'NewStrongPass123',
    }, `auth_token=${token}`)
    expect(response.status).toBe(401)
  })

  it('11 rejects weak replacement passwords', async () => {
    await insertUser()
    const token = await signToken(ADMIN, env.JWT_SECRET)
    const response = await jsonRequest('/api/auth/change-password', 'POST', {
      currentPassword: 'LegacyPass123',
      newPassword: 'alllowercase',
    }, `auth_token=${token}`)
    expect(response.status).toBe(400)
  })

  it('12 upgrades a legacy password to PBKDF2 and permits the new login', async () => {
    await insertUser()
    const token = await signToken(ADMIN, env.JWT_SECRET)
    const response = await jsonRequest('/api/auth/change-password', 'POST', {
      currentPassword: 'LegacyPass123',
      newPassword: 'NewStrongPass123',
    }, `auth_token=${token}`)
    expect(response.status).toBe(200)
    const row = await env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?',
    ).bind(ADMIN.id).first<{ password_hash: string }>()
    expect(row?.password_hash).toMatch(/^pbkdf2\$100000\$/)
    await expect(verifyPassword('NewStrongPass123', row!.password_hash)).resolves.toBe(true)
    expect((await login(ADMIN.email, 'NewStrongPass123')).status).toBe(200)
  })

  it('13 clears the authentication cookie on logout', async () => {
    const response = await apiRequest('/api/auth/logout', { method: 'POST' })
    expect(response.status).toBe(200)
    expect(response.headers.get('Set-Cookie')).toContain('Max-Age=0')
  })

  it('14 produces independently salted PBKDF2 hashes', async () => {
    const first = await hashPassword('SameStrongPass123')
    const second = await hashPassword('SameStrongPass123')
    expect(first).not.toBe(second)
    await expect(verifyPassword('SameStrongPass123', first)).resolves.toBe(true)
  })

  it('15 matches an independently derived Web Crypto PBKDF2 value', async () => {
    const password = 'IndependentPass123'
    const stored = await hashPassword(password)
    const [, iterationsText, saltHex, expected] = stored.split('$')
    const salt = Uint8Array.from(saltHex.match(/.{2}/g)!, (hex) => Number.parseInt(hex, 16))
    const material = await crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'],
    )
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: Number(iterationsText),
    }, material, 256)
    const independentlyDerived = Array.from(new Uint8Array(bits))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
    expect(independentlyDerived).toBe(expected)
  })

  it('16 rejects a tampered PBKDF2 digest', async () => {
    const stored = await hashPassword('TamperProofPass123')
    const tampered = `${stored.slice(0, -1)}${stored.endsWith('0') ? '1' : '0'}`
    await expect(verifyPassword('TamperProofPass123', tampered)).resolves.toBe(false)
  })
})
