import { Router } from "express";

import type { AuthController } from "../controllers/auth.controller.js";

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();
  router.get("/status", controller.status);

  return router;
}
