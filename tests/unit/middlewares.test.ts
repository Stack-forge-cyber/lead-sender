import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { AppError, ErrorCode } from "../../src/shared/error.js";
import { authMiddleware } from "../../src/shared/middlewares/api-auth.middleware.js";
import { errorMiddleware } from "../../src/shared/middlewares/error.middleware.js";
import { validateBody } from "../../src/shared/middlewares/validate.middleware.js";

function createResponseMock() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe("authMiddleware", () => {
  it("passes request with a valid bearer token", () => {
    const req = {
      header: vi.fn().mockReturnValue("Bearer test_api_token"),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, createResponseMock(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it("rejects request without a valid bearer token", () => {
    const req = {
      header: vi.fn().mockReturnValue("Bearer wrong_token"),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, createResponseMock(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.Unauthorized,
        statusCode: 401,
      }),
    );
  });
});

describe("validateBody", () => {
  it("replaces request body with parsed data", () => {
    const schema = z.object({
      message: z.string().trim(),
    });
    const req = {
      body: {
        message: " Test ",
      },
    } as Request;
    const next = vi.fn() as NextFunction;

    validateBody(schema)(req, createResponseMock(), next);

    expect(req.body).toEqual({ message: "Test" });
    expect(next).toHaveBeenCalledWith();
  });

  it("passes AppError to next when body is invalid", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const schema = z.object({
      message: z.string(),
    });
    const req = {
      body: {},
    } as Request;
    const next = vi.fn() as NextFunction;

    validateBody(schema)(req, createResponseMock(), next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ErrorCode.ValidationError,
        statusCode: 400,
      }),
    );
    consoleSpy.mockRestore();
  });
});

describe("errorMiddleware", () => {
  it("returns INVALID_JSON for body parser syntax errors", () => {
    const error = Object.assign(new SyntaxError("Unexpected token"), {
      type: "entity.parse.failed",
      status: 400,
    });
    const res = createResponseMock();

    errorMiddleware(error, {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: ErrorCode.InvalidJson,
    });
  });

  it("serializes AppError", () => {
    const res = createResponseMock();
    const details = {
      fieldErrors: {
        message: ["Required"],
      },
    };

    errorMiddleware(
      new AppError({
        statusCode: 400,
        code: ErrorCode.ValidationError,
        message: "Invalid request body",
        details,
      }),
      {} as Request,
      res,
      vi.fn() as NextFunction,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: ErrorCode.ValidationError,
      details,
    });
  });

  it("returns INTERNAL_ERROR for unknown errors", () => {
    const res = createResponseMock();

    errorMiddleware(new Error("Boom"), {} as Request, res, vi.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: ErrorCode.InternalError,
    });
  });
});
