import type { EntityLike } from "telegram/define.js";

import type { sendMessageDto } from "../routes/schemes/schemes.js";
import { AppError, ErrorCode } from "../shared/error.js";

import type { TelegramService } from "./telegram.service.js";

export class MessageService {
  constructor(private readonly telegramService: TelegramService) {}

  async send(input: sendMessageDto): Promise<{ success: true; sentTo: string }> {
    const authorized = await this.telegramService.isAuthorized();

    if (!authorized) {
      throw new AppError({
        statusCode: 401,
        code: ErrorCode.TelegramNotAuthorized,
        message: "Telegram client is not authorized",
      });
    }

    const contact = input.phone ?? this.normalizeUsername(input.username);

    let entity: EntityLike;
    if (input.phone) {
      entity = await this.telegramService.importContact(input.phone);
    } else {
      entity = await this.telegramService.getEntityByUsername(contact);
    }

    await this.telegramService.sendMessage(entity, input.message);
    return {
      success: true,
      sentTo: contact,
    };
  }

  private normalizeUsername(username?: string): string {
    if (!username) {
      throw new AppError({
        statusCode: 400,
        code: ErrorCode.InvalidUsername,
        message: "Username is required",
      });
    }

    return username.startsWith("@") ? username : `@${username}`;
  }
}
