import type { Server } from "node:http";

import { createApp } from "../app.js";
import { TelegramService } from "../services/telegram.service.js";
import config from "../shared/config.js";
import { logger } from "../shared/logger.js";

async function bootstrap(): Promise<void> {
  /*
	Вынес telegramService вне createApp, потому что он имеет свой жизненный цикл: читает сессию, создает подключение и
	клиент. По сути, это стоит воспринимать как ресурс приложения, поэтому передаю его извне.
	 */
  const telegramService = new TelegramService();

  await telegramService.init();

  const app = createApp(telegramService);
  const server = app.listen(config.port, () => {
    logger.info("Server started", { port: config.port });
  });

  registerShutdown(server, telegramService);
}

function registerShutdown(server: Server, telegramService: TelegramService): void {
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    logger.info("Graceful shutdown started", { signal });

    server.close(async (error) => {
      if (error) {
        logger.error("HTTP server shutdown failed", { message: error.message });
        process.exitCode = 1;
      }

      try {
        await telegramService.disconnect();
      } catch (disconnectError) {
        logger.error("Telegram disconnect failed", {
          message:
            disconnectError instanceof Error ? disconnectError.message : String(disconnectError),
        });
        process.exitCode = 1;
      }

      process.exit();
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.error("Application startup failed", {
    message: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
