import { createHash } from "crypto";
import { apiError } from "@/lib/auth-guards";
import { sendContactAlert } from "@/lib/email";
import { getPrisma } from "@/lib/prisma";
import { rateLimit, requestAddress } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(`contact:${requestAddress(request.headers)}`, 4, 60 * 60 * 1000);
    if (!limit.allowed) return Response.json({ error: "Please wait before sending another message." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const input = contactSchema.parse(await request.json());
    // Honeypot bots receive a neutral success response without a database write.
    if (input.website) return Response.json({ ok: true });
    const submission = await getPrisma().contactSubmission.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        subject: input.subject,
        message: input.message,
        ipHash: createHash("sha256").update(requestAddress(request.headers)).digest("hex")
      }
    });
    await sendContactAlert(input);
    return Response.json({ ok: true, id: submission.id }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
