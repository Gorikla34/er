import { describe, expect, it } from "vitest";

describe("Telegram Stars credentials", () => {
  it("accepts the configured bot token", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token, "TELEGRAM_BOT_TOKEN must be configured").toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json() as { ok?: boolean; result?: { is_bot?: boolean } };

    expect(response.ok).toBe(true);
    expect(data.ok).toBe(true);
    expect(data.result?.is_bot).toBe(true);
  }, 15000);
});
