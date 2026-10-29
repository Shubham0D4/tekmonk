import { z } from "zod";
import { apiError, requireUser } from "@/lib/auth-guards";
import { publishedPostWhere } from "@/lib/content";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const user = await requireUser();
    const { postId } = z.object({ postId: z.string().cuid() }).parse(await context.params);
    const body = z.object({ durationSeconds: z.coerce.number().int().min(0).max(1800) }).parse(await request.json());
    const prisma = getPrisma();
    if (!(await prisma.post.findFirst({ where: { id: postId, ...publishedPostWhere }, select: { id: true } }))) {
      return Response.json({ error: "This article is not available." }, { status: 404 });
    }
    const event = await prisma.readEvent.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      create: { userId: user.id, postId, durationSeconds: body.durationSeconds },
      update: { durationSeconds: { increment: body.durationSeconds }, lastReadAt: new Date() }
    });
    return Response.json({ durationSeconds: event.durationSeconds });
  } catch (error) {
    return apiError(error);
  }
}
