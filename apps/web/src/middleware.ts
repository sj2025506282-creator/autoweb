import { NextRequest, NextResponse } from "next/server";

const MAIN_DOMAIN = process.env.MAIN_DOMAIN || "autoweb.app";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Main domain → admin platform (no rewrite needed, handled by route group)
  if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}` || hostname === "localhost:3000") {
    return NextResponse.next();
  }

  // Subdomain or custom domain → restaurant site.
  // The Hono API handles slug/custom-domain resolution.
  url.pathname = `/site${url.pathname}`;
  url.searchParams.set("_host", hostname);

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|images/|favicon.ico|robots.txt|sitemap.xml).*)"],
};
