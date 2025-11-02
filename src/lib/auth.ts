import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { AuthenticationError, AuthorizationError } from "./error-handler";
import type { StringValue } from "ms";
import type { Usuario } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  rol: "usuario" | "propietario_cancha" | "admin";
  cancha_id?: string;
  tokenId?: string;
  family?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenData {
  userId: string;
  tokenId: string;
  family?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// Rate limiting por IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  ip: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

export function clearRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

// Generación de tokens seguros
export function generateTokenPair(payload: JWTPayload): TokenPair {
  const tokenId = generateSecureId();
  const family = generateSecureId();

  const accessTokenPayload = {
    ...payload,
    tokenId,
    family,
  };

  const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRES_IN as StringValue,
    issuer: "spelplaut",
    audience: "spelplaut-users",
  });

  const refreshTokenPayload: RefreshTokenData = {
    userId: payload.userId,
    tokenId,
    family,
  };

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    JWT_REFRESH_SECRET as string,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN as StringValue,
      issuer: "spelplaut",
      audience: "spelplaut-refresh",
    }
  );

  const expiresIn = getTokenExpirationTime();

  return { accessToken, refreshToken, expiresIn };
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET as string, {
      issuer: "spelplaut",
      audience: "spelplaut-users",
    }) as JWTPayload;

    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError("Token expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError("Token inválido");
    }
    throw new AuthenticationError("Error de autenticación");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenData {
  try {
    const payload = jwt.verify(token, JWT_REFRESH_SECRET as string, {
      issuer: "spelplaut",
      audience: "spelplaut-refresh",
    }) as RefreshTokenData;

    return payload;
  } catch {
    throw new AuthenticationError("Refresh token inválido");
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getTokenExpirationTime(): number {
  const expiresIn = JWT_EXPIRES_IN;
  const timeValue = parseInt(expiresIn.slice(0, -1));
  const timeUnit = expiresIn.slice(-1);

  const multiplier =
    {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    }[timeUnit] || 60 * 1000;

  return Date.now() + timeValue * multiplier;
}

// Validación de roles y permisos
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

export function requireRole(userRole: string, allowedRoles: string[]): void {
  if (!hasRole(userRole, allowedRoles)) {
    throw new AuthorizationError(
      `Acceso denegado. Roles requeridos: ${allowedRoles.join(", ")}`
    );
  }
}

export function requireOwnership(userId: string, resourceUserId: string): void {
  if (userId !== resourceUserId) {
    throw new AuthorizationError("Solo puedes acceder a tus propios recursos");
  }
}

// Headers de seguridad
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), microphone=(), camera=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
} as const;

// Sanitización de datos
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Prevenir XSS básico
    .substring(0, 1000); // Limitar longitud
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }
  if (password.length > 128) {
    errors.push("La contraseña no puede tener más de 128 caracteres");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe tener al menos una letra minúscula");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe tener al menos una letra mayúscula");
  }
  if (!/\d/.test(password)) {
    errors.push("La contraseña debe tener al menos un número");
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push(
      "La contraseña debe tener al menos un símbolo especial (@$!%*?&)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Extracción de IP de manera segura
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  const cloudflare = request.headers.get("cf-connecting-ip");

  if (cloudflare) return cloudflare;
  if (real) return real;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload;

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

export async function validate2FACode(
  user: Usuario,
  code: string
): Promise<boolean> {
  if (!user.autenticacion_2FA) return false;
  if (!user.codigo_2fa_email || !user.codigo_2fa_expira) return false;
  if (user.codigo_2fa_email !== code) return false;
  if (user.codigo_2fa_expira.getTime() < Date.now()) return false;
  // Limpiar el código tras validación exitosa
  user.codigo_2fa_email = undefined;
  user.codigo_2fa_expira = undefined;
  await (user as unknown as { save?: () => Promise<void> }).save?.();
  return true;
}

export async function require2FAIfEnabled(
  request: NextRequest
): Promise<Usuario | null> {
  const userPayload = getUserFromRequest(request);
  if (!userPayload) return null;
  const UsuarioModel = (await import("@/models/Usuario")).default;
  const user = await UsuarioModel.findById(userPayload.userId);
  if (!user) return null;
  if (!user.autenticacion_2FA) return user;

  // Obtener código 2FA del body o header
  let code: string | undefined;
  if (request.headers.get("x-2fa-code")) {
    code = request.headers.get("x-2fa-code") || undefined;
  } else {
    try {
      const body = await request.json();
      code = body["codigo_2fa"];
    } catch {
      // No body o no JSON
    }
  }
  if (!code) return null;
  const valid = await validate2FACode(user, code);
  return valid ? user : null;
}
