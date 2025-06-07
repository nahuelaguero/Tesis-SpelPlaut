export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      message,
      400,
      true,
      field ? `VALIDATION_${field.toUpperCase()}` : "VALIDATION_ERROR"
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "No autorizado") {
    super(message, 401, true, "AUTH_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Permisos insuficientes") {
    super(message, 403, true, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Recurso") {
    super(`${resource} no encontrado`, 404, true, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, "CONFLICT_ERROR");
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(`Error de base de datos: ${message}`, 500, true, "DATABASE_ERROR");
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    validation?: Record<string, string>;
  };
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export function createErrorResponse(
  error: AppError | Error,
  path?: string
): ErrorResponse {
  const isAppError = error instanceof AppError;

  return {
    success: false,
    error: {
      message: error.message,
      code: isAppError ? error.code : "INTERNAL_ERROR",
      statusCode: isAppError ? error.statusCode : 500,
      timestamp: new Date().toISOString(),
      path,
    },
  };
}

export function createSuccessResponse<T>(
  data: T,
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  if (process.env.NODE_ENV === "production") {
    // En producción, enviar a servicio de logging (ej: Sentry, LogRocket)
    console.error("🚨 ERROR:", JSON.stringify(errorLog, null, 2));
  } else {
    console.error("🚨 ERROR:", errorLog);
  }
}

export function handleAsyncError<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, { args });
      throw error;
    }
  };
}
