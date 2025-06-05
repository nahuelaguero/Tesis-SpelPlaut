import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

export interface JWTPayload {
  userId: string;
  email: string;
  rol: "usuario" | "admin";
  iat: number;
  exp: number;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error("Error verificando token:", error);
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  // Intentar obtener el token de las cookies
  const tokenFromCookie = request.cookies.get("auth-token")?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // Intentar obtener el token del header Authorization
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function requireAuth(request: NextRequest): JWTPayload | null {
  const user = getUserFromRequest(request);
  if (!user) {
    return null;
  }
  return user;
}

export function requireAdmin(request: NextRequest): JWTPayload | null {
  const user = requireAuth(request);
  if (!user || user.rol !== "admin") {
    return null;
  }
  return user;
}

export function isValidObjectId(id: string): boolean {
  try {
    new ObjectId(id);
    return true;
  } catch {
    return false;
  }
}
