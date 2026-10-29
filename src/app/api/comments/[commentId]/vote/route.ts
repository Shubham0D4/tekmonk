import { z } from "zod";
import { apiError, requireUser } from "@/lib/auth-guards";
import { publishedPostWhere } from "@/lib/content";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ commentId: string }> }) {
  try {
    const user = await requireUser();
    const { commentId } = z.object({ commentId: z.string().cuid() }).parse(await context.params);
    const { value } = z.object({ value: z.union([z.literal(1), z.literal(-1)]) }).parse(await request.json());
    const prisma = getPrisma();
    const comment = await prisma.comment.findFirst({ where: { id: commentId, post: publishedPostWhere }, select: { id: true } });
    if (!comment) return Response.json({ error: "This comment is not available." }, { status: 404 });
    const key = { userId_commentId: { userId: user.id, commentId } };
    const existing = await prisma.commentVote.findUnique({ where: key });
    if (existing?.value === value) await prisma.commentVote.delete({ where: key });
    else await prisma.commentVote.upsert({ where: key, create: { userId: user.id, commentId, value }, update: { value } });
    const votes = await prisma.commentVote.aggregate({ where: { commentId }, _sum: { value: true } });
    const current = await prisma.commentVote.findUnique({ where: key });
    return Response.json({ score: votes._sum.value ?? 0, viewerVote: current?.value ?? null });
  } catch (error) {
    return apiError(error);
  }
}
