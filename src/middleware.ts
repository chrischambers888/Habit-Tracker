import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const username = process.env.BASIC_AUTH_USER;
const password = process.env.BASIC_AUTH_PASSWORD ?? process.env.BASIC_AUTH_PASS;

export function middleware(request: NextRequest) {
  if (!username || !password) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');

    if (scheme?.toLowerCase() === 'basic' && encoded) {
      try {
        const decoded = globalThis.atob(encoded);
        const separatorIndex = decoded.indexOf(':');
        const providedUser = decoded.substring(0, Math.max(separatorIndex, 0));
        const providedPassword =
          separatorIndex >= 0 ? decoded.substring(separatorIndex + 1) : '';

        if (providedUser === username && providedPassword === password) {
          return NextResponse.next();
        }
      } catch {
        // no-op: fall through to unauthorized response
      }
    }
  }

  const response = new NextResponse('Authentication required', {
    status: 401,
  });

  response.headers.set('WWW-Authenticate', 'Basic realm="Secure Area"');

  return response;
}

const publicFileRegex = /\.(.*)$/;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|sitemap.xml).*)',
  ],
};

