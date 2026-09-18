import { describe, expect, it, vi } from "vitest";

import { MessageService } from "../../src/services/message.service.js";
import type { TelegramService } from "../../src/services/telegram.service.js";
import { AppError, ErrorCode } from "../../src/shared/error.js";

function createTelegramServiceMock(overrides: Partial<TelegramService> = {}) {
  return {
    isAuthorized: vi.fn().mockResolvedValue(true),
    importContact: vi.fn().mockResolvedValue("phone-entity"),
    getEntityByUsername: vi.fn().mockResolvedValue("username-entity"),
    sendMessage: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as TelegramService;
}

describe("MessageService", () => {
  it("sends a message by phone after importing the contact", async () => {
    const telegramService = createTelegramServiceMock();
    const service = new MessageService(telegramService);

    const result = await service.send({
      phone: "+79998887766",
      message: "Test",
    });

    expect(telegramService.isAuthorized).toHaveBeenCalledOnce();
    expect(telegramService.importContact).toHaveBeenCalledWith("+79998887766");
    expect(telegramService.getEntityByUsername).not.toHaveBeenCalled();
    expect(telegramService.sendMessage).toHaveBeenCalledWith("phone-entity", "Test");
    expect(result).toEqual({
      success: true,
      sentTo: "+79998887766",
    });
  });

  it("normalizes username before resolving entity", async () => {
    const telegramService = createTelegramServiceMock();
    const service = new MessageService(telegramService);

    const result = await service.send({
      username: "some_user",
      message: "Test",
    });

    expect(telegramService.getEntityByUsername).toHaveBeenCalledWith("@some_user");
    expect(telegramService.importContact).not.toHaveBeenCalled();
    expect(telegramService.sendMessage).toHaveBeenCalledWith("username-entity", "Test");
    expect(result).toEqual({
      success: true,
      sentTo: "@some_user",
    });
  });

  it("throws when Telegram client is not authorized", async () => {
    const telegramService = createTelegramServiceMock({
      isAuthorized: vi.fn().mockResolvedValue(false),
    });
    const service = new MessageService(telegramService);

    await expect(
      service.send({
        phone: "+79998887766",
        message: "Test",
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.TelegramNotAuthorized,
      statusCode: 401,
    });

    expect(telegramService.importContact).not.toHaveBeenCalled();
    expect(telegramService.sendMessage).not.toHaveBeenCalled();
  });

  it("throws when username is missing in direct service input", async () => {
    const telegramService = createTelegramServiceMock();
    const service = new MessageService(telegramService);
    const action = service.send({ message: "Test" });

    await expect(action).rejects.toBeInstanceOf(AppError);
    await expect(action).rejects.toMatchObject({
      code: ErrorCode.InvalidUsername,
      statusCode: 400,
    });
  });
});
