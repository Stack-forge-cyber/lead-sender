export enum ErrorCode {
  Unauthorized = "UNAUTHORIZED",
  InvalidJson = "INVALID_JSON",
  TelegramNotAuthorized = "TELEGRAM_NOT_AUTHORIZED",
  ValidationError = "VALIDATION_ERROR",
  InvalidPhone = "INVALID_PHONE",
  InvalidUsername = "INVALID_USERNAME",
  UserNotFound = "USER_NOT_FOUND",
  FloodWait = "FLOOD_WAIT",
  TelegramApiError = "TELEGRAM_API_ERROR",
  NetworkError = "NETWORK_ERROR",
  InternalError = "INTERNAL_ERROR",
}

interface AppErrorOptions {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.message = options.message;
    this.details = options.details;
  }
}

export function mapTelegramError(error: unknown): AppError {
  const original = error as {
    message?: string;
    errorMessage?: string;
    code?: string;
    seconds?: number;
  };
  const text = String(original.errorMessage ?? original.message ?? original.code ?? "");
  const upper = text.toUpperCase();
  const floodMatch = upper.match(/FLOOD_WAIT_?(\d+)?/);

  if (floodMatch || typeof original.seconds === "number") {
    return new AppError({
      statusCode: 429,
      code: ErrorCode.FloodWait,
      message: "Telegram flood wait limit reached",
      details: {
        retryAfter: original.seconds ?? (floodMatch?.[1] ? Number(floodMatch[1]) : undefined),
      },
    });
  }

  if (upper.includes("NETWORK") || upper.includes("TIMEOUT") || upper.includes("ECONN")) {
    return new AppError({
      statusCode: 503,
      code: ErrorCode.NetworkError,
      message: "Telegram network error",
    });
  }

  return new AppError({
    statusCode: 502,
    code: ErrorCode.TelegramApiError,
    message: "Telegram API error",
    details: text || undefined,
  });
}
