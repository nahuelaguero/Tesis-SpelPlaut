import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";

interface TokenPayload {
  userId: string;
  rol: "usuario" | "propietario_cancha" | "admin";
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.userId === "string" && typeof payload.rol === "string") {
      return payload as unknown as TokenPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  // If no token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);

  // Invalid or expired token
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  // Admin routes: only admin role
  if (pathname.startsWith("/admin") && payload.rol !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Propietario routes: admin or propietario_cancha
  if (
    pathname.startsWith("/mi-cancha") &&
    payload.rol !== "propietario_cancha" &&
    payload.rol !== "admin"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /mis-reservas: any authenticated role is OK (already checked above)

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/mi-cancha/:path*", "/mis-reservas/:path*"],
};
