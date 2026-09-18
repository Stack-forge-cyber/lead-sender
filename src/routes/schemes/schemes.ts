import z from "zod";

const phoneRegex = /^\+[1-9]\d{7,14}$/;
const usernameRegex = /^@?[A-Za-z0-9_]{5,32}$/;

export const sendMessageSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, "Phone must be in international format, for example +79993332211")
      .optional(),
    username: z
      .string()
      .trim()
      .regex(usernameRegex, "Username must be a valid Telegram username")
      .optional(),
    message: z.string().trim().min(1).max(4096),
  })
  .refine((value) => Boolean(value.phone) !== Boolean(value.username), {
    error: "Pass exactly one of phone or username",
  });

export type sendMessageDto = z.infer<typeof sendMessageSchema>;
