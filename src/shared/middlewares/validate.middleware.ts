import type { NextFunction, Request, Response } from "express";
import { ZodError, z } from "zod";

import { AppError, ErrorCode } from "../error.js";

export const validateBody = <T extends z.ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      const details = error instanceof ZodError ? z.flattenError(error) : undefined;
      console.log(details);
      next(
        new AppError({
          statusCode: 400,
          code: ErrorCode.ValidationError,
          message: "Invalid request body",
          details,
        }),
      );
    }
  };
};
