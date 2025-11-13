import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  AUTH_COOKIE_NAME,
  LOGIN_PATH,
  isAuthConfigured,
  verifySessionCookie,
} from "@/lib/auth"

export async function proxy(request: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.next()
  }

  const { pathname, search } = request.nextUrl

  if (pathname === LOGIN_PATH) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (await verifySessionCookie(sessionCookie)) {
    return NextResponse.next()
  }

  const loginUrl = new URL(LOGIN_PATH, request.url)

  if (pathname !== LOGIN_PATH) {
    const nextDestination = `${pathname}${search}`

    if (nextDestination && nextDestination !== LOGIN_PATH) {
      loginUrl.searchParams.set("next", nextDestination)
    }
  }

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|sitemap.xml).*)",
  ],
}

