import { getCloudflareContext } from '@opennextjs/cloudflare'

type ApiService = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>
}

async function getApiService(): Promise<ApiService | null> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    return (env as { API?: ApiService }).API ?? null
  } catch {
    return null
  }
}

export async function fetchApi(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const apiService = await getApiService()
  if (apiService) {
    return apiService.fetch(input, init)
  }
  return fetch(input, init)
}
