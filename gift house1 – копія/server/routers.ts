import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  payments: router({
    createStarsInvoice: publicProcedure
      .input(z.object({
        stars: z.number().int().min(1).max(100000),
        payload: z.string().min(1).max(128),
      }))
      .mutation(async ({ input }) => {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
          throw new Error("Telegram Payments API не настроен: добавьте секрет TELEGRAM_BOT_TOKEN.");
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: "Пополнение Gift House",
            description: `Пополнение баланса Gift House на ${input.stars} Telegram Stars`,
            payload: input.payload,
            currency: "XTR",
            prices: [{ label: "Gift House Stars", amount: input.stars }],
            provider_token: "",
          }),
        });

        const data = await response.json() as { ok?: boolean; result?: string; description?: string };
        if (!response.ok || !data.ok || !data.result) {
          throw new Error(data.description || "Telegram не смог создать счёт Stars.");
        }

        return { invoiceUrl: data.result, currency: "XTR" as const, amount: input.stars };
      }),
  }),
});

export type AppRouter = typeof appRouter;
