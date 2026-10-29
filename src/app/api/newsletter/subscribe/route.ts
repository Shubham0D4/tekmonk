import { z } from "zod";
import { apiError } from "@/lib/auth-guards";
import { sendNewsletterConfirmation } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { rateLimit, requestAddress } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().email().max(254)
});

export async function POST(request: Request) {
  try {
    // Rate-limit by IP: 3 attempts per hour.
    const ip = requestAddress(request.headers);
    const limit = rateLimit(`newsletter:${ip}`, 3, 60 * 60 * 1000);
    if (!limit.allowed) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const { email } = subscribeSchema.parse(await request.json());
    const normalised = email.toLowerCase();

    // Upsert — never reveal whether the address was already in the database.
    await getPrisma().newsletterSubscriber.upsert({
      where: { email: normalised },
      create: { email: normalised, confirmed: false },
      // Leave confirmed status unchanged on re-subscribe so confirmed readers
      // don't accidentally lose their confirmed state.
      update: { updatedAt: new Date() }
    });

    // Build a simple confirmation token: base64-encoded email address.
    const token = Buffer.from(normalised).toString("base64url");
    const confirmUrl = `${env.NEXT_PUBLIC_SITE_URL}/api/newsletter/confirm?token=${token}`;

    // Attempt to send the confirmation email.  If SMTP is not configured we
    // silently swallow the error — the subscriber record is already saved.
    try {
      await sendNewsletterConfirmation({ to: normalised, confirmUrl });
    } catch {
      // SMTP failure: subscriber persisted, email will need to be retried externally.
    }

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
