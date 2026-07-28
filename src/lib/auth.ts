import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  role: "admin" | "owner";
  restaurantId?: string;
}

export interface SessionData {
  user?: SessionUser;
}

function getSessionOptions() {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return {
    password: process.env.SESSION_SECRET,
    cookieName: "autoweb-session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      httpOnly: true,
    },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function createSession(user: SessionUser): Promise<void> {
  const session = await getSession();
  session.user = user;
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

/**
 * Generate a random hex string of the given byte length using Web Crypto API.
 */
function generateSalt(bytesLength: number = 16): string {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hash a password with a random salt using SHA-256.
 * Returns the hash in the format: hex(salt):hex(hash)
 * where hash = SHA-256(salt + password).
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt(16);
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${salt}:${hashHex}`;
}

/**
 * Constant-time comparison of two Uint8Arrays.
 * Uses XOR-accumulate to avoid early-exit timing side-channels.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Verify a password against a stored salted hash.
 * The hash parameter should be in the format produced by hashPassword(): salt:hexhash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const separatorIndex = hash.indexOf(":");
  if (separatorIndex === -1) {
    // Legacy unsalted hash — verify with raw SHA-256 for backward compatibility
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashed = await crypto.subtle.digest("SHA-256", data);
    const hashedHex = Array.from(new Uint8Array(hashed))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const a = new TextEncoder().encode(hashedHex);
    const b = new TextEncoder().encode(hash);
    return timingSafeEqual(a, b);
  }

  const salt = hash.substring(0, separatorIndex);
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashed = await crypto.subtle.digest("SHA-256", data);
  const hashedHex = Array.from(new Uint8Array(hashed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const expectedFull = `${salt}:${hashedHex}`;
  const a = new TextEncoder().encode(expectedFull);
  const b = new TextEncoder().encode(hash);
  return timingSafeEqual(a, b);
}
