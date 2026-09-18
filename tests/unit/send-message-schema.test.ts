import { describe, expect, it } from "vitest";

import { sendMessageSchema } from "../../src/routes/schemes/schemes.js";

describe("sendMessageSchema", () => {
  it("accepts a phone recipient and trims the message", () => {
    const result = sendMessageSchema.parse({
      phone: "+79998887766",
      message: " Test ",
    });

    expect(result).toEqual({
      phone: "+79998887766",
      message: "Test",
    });
  });

  it("accepts a username recipient", () => {
    const result = sendMessageSchema.parse({
      username: "@some_user",
      message: "Test",
    });

    expect(result).toEqual({
      username: "@some_user",
      message: "Test",
    });
  });

  it("rejects a request without a message", () => {
    const result = sendMessageSchema.safeParse({
      phone: "+79998887766",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a request with both phone and username", () => {
    const result = sendMessageSchema.safeParse({
      phone: "+79998887766",
      username: "@some_user",
      message: "Test",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a request without a recipient", () => {
    const result = sendMessageSchema.safeParse({
      message: "Test",
    });

    expect(result.success).toBe(false);
  });
});
