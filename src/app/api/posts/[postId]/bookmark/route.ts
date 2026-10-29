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
    if (!(await prisma.post.findFirst({ where: { id: postId, ...publishedPostWhere }, select: { id: true } }))) {
      return Response.json({ error: "This article is not available." }, { status: 404 });
    }

    const key = { userId_postId: { userId: user.id, postId } };
    let bookmarked = false;
    const existing = await prisma.bookmark.findUnique({ where: key });

    if (existing) {
      await prisma.bookmark.deleteMany({ where: { userId: user.id, postId } });
      bookmarked = false;
    } else {
      try {
        await prisma.bookmark.create({ data: { userId: user.id, postId } });
        bookmarked = true;
      } catch {
        const check = await prisma.bookmark.findUnique({ where: key });
        if (check) {
          bookmarked = true;
        } else {
          await prisma.bookmark.create({ data: { userId: user.id, postId } }).catch(() => {});
          bookmarked = true;
        }
      }
    }

    return Response.json({ bookmarked });
  } catch (error) {
    return apiError(error);
  }
}
