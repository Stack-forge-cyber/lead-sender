import type { Request, Response } from "express";

import { MessageService } from "../services/message.service.js";

export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  public send = async (req: Request, res: Response): Promise<void> => {
    const result = await this.messageService.send(req.body);
    res.json(result);
  };
}
