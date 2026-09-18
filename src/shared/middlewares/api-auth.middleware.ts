import type { NextFunction, Request, Response } from "express";

import config from "../config.js";
import { AppError, ErrorCode } from "../error.js";

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  const expected = `Bearer ${config.apiToken}`;

  if (!header || header !== expected) {
    next(
      new AppError({
        statusCode: 401,
        code: ErrorCode.Unauthorized,
        message: "Missing or invalid API token",
      }),
    );
    return;
  }

  next();
};
