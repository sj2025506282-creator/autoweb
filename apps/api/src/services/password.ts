// Cloudflare Workers Web Crypto currently caps PBKDF2 at 100,000 iterations.
const PBKDF2_ITERATIONS = 100_000

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    keyMaterial,
    256,
  )
  return bytesToHex(new Uint8Array(bits))
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2$')) {
    const [, iterationsText, saltHex, expectedHash] = stored.split('$')
    const iterations = Number.parseInt(iterationsText, 10)
    const salt = hexToBytes(saltHex)
    if (!salt || !Number.isSafeInteger(iterations) || iterations < 100_000 || !expectedHash) {
      return false
    }
    const computedHash = await derivePbkdf2(password, salt, iterations)
    return timingSafeEqual(computedHash, expectedHash)
  }

  // Backward compatibility for the original salt:sha256 format.
  const [saltHex, expectedHash] = stored.split(':')
  if (!saltHex || !expectedHash) return false
  const data = new TextEncoder().encode(saltHex + password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return timingSafeEqual(bytesToHex(new Uint8Array(hash)), expectedHash)
}
