import express, { type Express } from "express";
import helmet from "helmet";

import { AuthController } from "./controllers/auth.controller.js";
import { MessageController } from "./controllers/message.controller.js";
import { createAuthRoutes } from "./routes/auth.routes.js";
import { createHealthRoutes } from "./routes/health.routes.js";
import { createMessageRoutes } from "./routes/message.routes.js";
import { MessageService } from "./services/message.service.js";
import { TelegramService } from "./services/telegram.service.js";
import { errorMiddleware } from "./shared/middlewares/error.middleware.js";
import { loggerMiddleware } from "./shared/middlewares/logger.middleware.js";

export function createApp(telegramService: TelegramService): express.Express {
  const messageService = new MessageService(telegramService);
  const app: Express = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(loggerMiddleware);
  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: false }));

  app.use("/", createHealthRoutes());
  app.use("/auth", createAuthRoutes(new AuthController(telegramService)));
  app.use("/messages", createMessageRoutes(new MessageController(messageService)));

  app.use(errorMiddleware);
  return app;
}
