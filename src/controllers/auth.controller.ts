import type { Request, Response } from "express";

import type { TelegramService } from "../services/telegram.service.js";

export class AuthController {
  constructor(private readonly telegramService: TelegramService) {}

  status = async (_req: Request, res: Response) => {
    const authorized = await this.telegramService.isAuthorized();

    res.json({ authorized });
  };
}
