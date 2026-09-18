import { Router } from "express";

import type { MessageController } from "../controllers/message.controller.js";
import { authMiddleware } from "../shared/middlewares/api-auth.middleware.js";
import { validateBody } from "../shared/middlewares/validate.middleware.js";

import { sendMessageSchema } from "./schemes/schemes.js";

export function createMessageRoutes(controller: MessageController): Router {
  const router = Router();

  router.post("/send", authMiddleware, validateBody(sendMessageSchema), controller.send);

  return router;
}
