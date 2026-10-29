import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { apiError, requireAdmin } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/publish-scheduled
 *
 * Finds every SCHEDULED post whose scheduledFor date has passed and flips it
 * to PUBLISHED, preserving scheduledFor as the canonical publishedAt timestamp.
 *
 * Auth: session-based admin OR x-cron-secret header (for external cron services
 * like Vercel Cron). If CRON_SECRET is not configured, only session auth works.
 */
export async function GET(request: Request) {
  try {
    // Allow an external cron service to authenticate via a shared secret header
    // instead of a browser session.
    const cronSecret = process.env.CRON_SECRET;
    const incomingSecret = (await headers()).get("x-cron-secret");

    const authenticatedViaCron =
      cronSecret && incomingSecret && incomingSecret === cronSecret;

    if (!authenticatedViaCron) {
      // Fall back to normal session-based admin auth
      await requireAdmin();
    }

    const now = new Date();
    const prisma = getPrisma();

    // Find all posts that are scheduled and whose publish time has arrived
    const due = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: now },
      },
      select: { id: true, scheduledFor: true },
    });

    if (due.length === 0) {
      return Response.json({ published: 0, postIds: [] });
    }

    // Promote each post: SCHEDULED → PUBLISHED, publishedAt = scheduledFor
    await prisma.$transaction(
      due.map((post) =>
        prisma.post.update({
          where: { id: post.id },
          data: {
            status: "PUBLISHED",
            // Preserve the scheduled time as the canonical publish timestamp
            publishedAt: post.scheduledFor,
          },
        })
      )
    );

    const postIds = due.map((p) => p.id);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/feed.xml");
    revalidatePath("/sitemap.xml");
    return Response.json({ published: postIds.length, postIds });
  } catch (error) {
    return apiError(error);
  }
}
