import { cookies } from 'next/headers'
import { fetchApi } from './api-transport'

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8787'

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join('; ')

  const res = await fetchApi(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(res.status, error.error || 'Request failed')
  }

  return res.json() as T
}
