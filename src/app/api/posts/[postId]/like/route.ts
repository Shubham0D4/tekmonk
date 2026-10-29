import { z } from "zod";
import { apiError, requireUser } from "@/lib/auth-guards";
import { publishedPostWhere } from "@/lib/content";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const user = await requireUser();
    const { postId } = z.object({ postId: z.string().cuid() }).parse(await context.params);
    const prisma = getPrisma();
    const post = await prisma.post.findFirst({ where: { id: postId, ...publishedPostWhere }, select: { id: true } });
    if (!post) return Response.json({ error: "This article is not available." }, { status: 404 });

    const key = { userId_postId: { userId: user.id, postId } };
    let liked = false;
    const existing = await prisma.postLike.findUnique({ where: key });

    if (existing) {
      await prisma.postLike.deleteMany({ where: { userId: user.id, postId } });
      liked = false;
    } else {
      try {
        await prisma.postLike.create({ data: { userId: user.id, postId } });
        liked = true;
      } catch {
        // In case of a race condition with a concurrent request, ensure it is toggled properly
        const check = await prisma.postLike.findUnique({ where: key });
        if (check) {
          liked = true;
        } else {
          await prisma.postLike.create({ data: { userId: user.id, postId } }).catch(() => {});
          liked = true;
        }
      }
    }

    const count = await prisma.postLike.count({ where: { postId } });
    return Response.json({ liked, count });
  } catch (error) {
    return apiError(error);
  }
}
