import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_KEY = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "qlmt-lienchieu-super-secret-key-12345!@#");
const key = new TextEncoder().encode(JWT_SECRET_KEY);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths that do not require authentication
  const isPublicPath =
    path === '/login' ||
    path === '/test-login' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/agent') ||
    path.startsWith('/_next') ||
    path === '/favicon.ico';

  if (isPublicPath) {
    return NextResponse.next();
  }
  if (!JWT_SECRET_KEY) return new NextResponse("Server authentication is not configured", { status: 503 });

  // Get token from cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Redirect to login page if no token
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the token
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch (error) {
    // Token is invalid or expired
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Config to specify which routes should be processed by the middleware
export const config = {
  matcher: ['/((?!api/auth|api/agent|_next/static|_next/image|favicon.ico).*)'],
};
