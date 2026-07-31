const API_BASE_URL = (
  process.env.API_BASE_URL || 'http://localhost:8787'
).replace(/\/$/, '')

type ProxyContext = {
  params: Promise<{ path: string[] }>
}

async function proxyRequest(
  request: Request,
  context: ProxyContext,
): Promise<Response> {
  const { path } = await context.params
  const incomingUrl = new URL(request.url)
  const targetUrl = new URL(`/api/${path.join('/')}`, API_BASE_URL)
  targetUrl.search = incomingUrl.search

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')

  return fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD'
      ? undefined
      : request.body,
    redirect: 'manual',
  })
}

export const dynamic = 'force-dynamic'

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const HEAD = proxyRequest
export const OPTIONS = proxyRequest
