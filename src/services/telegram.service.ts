import fs from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { Api, TelegramClient } from "telegram";
import { generateRandomBytes, readBigIntFromBuffer } from "telegram/Helpers.js";
import type { EntityLike } from "telegram/define.js";
import { StringSession } from "telegram/sessions/index.js";

import config from "../shared/config.js";
import { AppError, ErrorCode, mapTelegramError } from "../shared/error.js";
import { logger } from "../shared/logger.js";

export class TelegramService {
  private client?: TelegramClient;
  private stringSession?: StringSession;
  private authorized = false;

  async init() {
    const savedSession = await this.readSession();

    this.createClient(savedSession);

    if (savedSession) {
      await this.authWithSavedSession();
      return;
    } else {
      logger.info("No session file found, starting terminal authorization");
    }
    await this.authInTerminal();
  }

  private async readSession() {
    try {
      const session = await fs.readFile(config.sessionFile, "utf-8");
      return session.trim();
    } catch (error) {
      const systemError = error as NodeJS.ErrnoException;
      if (systemError.code === "ENOENT") {
        return "";
      }
      throw error;
    }
  }

  private createClient(session: string) {
    this.stringSession = new StringSession(session);
    this.client = new TelegramClient(this.stringSession, config.apiId, config.apiHash, {
      connectionRetries: 5,
    });
  }

  private async authWithSavedSession() {
    const client = this.getClient();

    logger.info("Connecting to Telegram with saved session");
    await client.connect();
    this.authorized = await client.isUserAuthorized();

    if (this.authorized) {
      logger.info("Telegram saved session is authorized");
      return;
    }
    logger.warn("Saved Telegram session is not authorized, starting terminal authorization");
  }

  private async authInTerminal() {
    const client = this.getClient();
    const rl = readline.createInterface({ input, output });

    try {
      await client.start({
        phoneNumber: async () => {
          const phoneNumber = (await rl.question("Telegram phone number: ")).trim();
          logger.info("Telegram phone number received, requesting login code");
          return phoneNumber;
        },
        phoneCode: async () => rl.question("Telegram code: "),
        password: async () => rl.question("Telegram 2FA password, if enabled: "),
        onError: async (error) => {
          logger.error("Telegram authorization error", {
            message: error.message,
          });
          return true;
        },
      });

      this.authorized = await client.isUserAuthorized();

      if (!this.authorized) {
        throw new AppError({
          statusCode: 401,
          code: ErrorCode.TelegramNotAuthorized,
          message: "Telegram authorization failed",
        });
      }

      await fs.writeFile(config.sessionFile, this.stringSession?.save() ?? "", "utf8");
      logger.info("Telegram session saved", { sessionFile: config.sessionFile });
    } finally {
      rl.close();
    }
  }

  async isAuthorized(): Promise<boolean> {
    const client = this.getClient();

    try {
      this.authorized = await client.isUserAuthorized();
      return this.authorized;
    } catch (error) {
      logger.warn("Telegram authorization status check failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      this.authorized = false;
      return false;
    }
  }

  async importContact(phone: string): Promise<EntityLike> {
    this.ensureAuthorized();

    try {
      const clientId = readBigIntFromBuffer(generateRandomBytes(8));
      const result = await this.getClient().invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId,
              phone,
              firstName: "Telegram",
              lastName: "Contacts",
            }),
          ],
        }),
      );

      return this.extractUser(result, clientId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw mapTelegramError(error);
    }
  }

  async getEntityByUsername(username: string): Promise<EntityLike> {
    this.ensureAuthorized();

    try {
      return await this.getClient().getEntity(username);
    } catch (error) {
      throw mapTelegramError(error);
    }
  }

  async sendMessage(entity: EntityLike, message: string): Promise<void> {
    this.ensureAuthorized();

    try {
      await this.getClient().sendMessage(entity, { message });
    } catch (error) {
      throw mapTelegramError(error);
    }
  }

  private extractUser(contacts: Api.contacts.ImportedContacts, clientId: bigInt.BigInteger) {
    const importedContact = contacts.imported.find((contact) => contact.clientId.equals(clientId));

    if (!importedContact) {
      throw new AppError({
        statusCode: 404,
        code: ErrorCode.UserNotFound,
        message: "Telegram user was not found by phone number",
      });
    }

    const user = contacts.users.find(
      (candidate) => "id" in candidate && candidate.id.equals(importedContact.userId),
    );

    if (!user) {
      throw new AppError({
        statusCode: 404,
        code: ErrorCode.UserNotFound,
        message: "Imported Telegram user was not returned by API",
      });
    }

    return user;
  }

  private getClient() {
    if (!this.client) {
      throw new AppError({
        statusCode: 503,
        code: ErrorCode.TelegramNotAuthorized,
        message: "Telegram client is not initialized",
      });
    }

    return this.client;
  }

  private ensureAuthorized(): void {
    if (!this.authorized) {
      throw new AppError({
        statusCode: 401,
        code: ErrorCode.TelegramNotAuthorized,
        message: "Telegram client is not authorized",
      });
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.disconnect();
    logger.info("Telegram client disconnected");
  }
}
