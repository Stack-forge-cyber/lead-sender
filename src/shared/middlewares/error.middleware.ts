import type { NextFunction, Request, Response } from "express";

import { AppError, ErrorCode } from "../error.js";
import { logger } from "../logger.js";

type BodyParserError = SyntaxError & {
  status?: number;
  statusCode?: number;
  type?: string;
  body?: string;
};

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isJsonSyntaxError(error)) {
    res.status(400).json({
      success: false,
      error: ErrorCode.InvalidJson,
    });
    return;
  }

  if (error instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      error: error.code,
    };

    if (error.details !== undefined) {
      response.details = error.details;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  logger.error("Unhandled error", {
    message: error instanceof Error ? error.message : String(error),
  });

  res.status(500).json({
    success: false,
    error: ErrorCode.InternalError,
  });
};

function isJsonSyntaxError(error: unknown): error is BodyParserError {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const parserError = error as BodyParserError;

  return (
    parserError.type === "entity.parse.failed" ||
    parserError.status === 400 ||
    parserError.statusCode === 400
  );
}
