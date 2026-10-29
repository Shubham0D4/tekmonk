import { z } from "zod";
import { apiError, currentUser, requireUser } from "@/lib/auth-guards";
import { publishedPostWhere } from "@/lib/content";
import { getPrisma } from "@/lib/prisma";
import { commentSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type CommentNode = {
  id: string;
  parentId: string | null;
  body: string;
  paragraphAnchor: string | null;
  isPinned: boolean;
  createdAt: Date;
  author: { name: string; image: string | null };
  score: number;
  viewerVote: number | null;
  replies: CommentNode[];
};

function threadComments(rows: Array<Omit<CommentNode, "replies">>) {
  const nodes = new Map(rows.map((row) => [row.id, { ...row, replies: [] as CommentNode[] }]));
  const roots: CommentNode[] = [];
  nodes.forEach((node) => {
    if (node.parentId && nodes.has(node.parentId)) nodes.get(node.parentId)?.replies.push(node);
    else roots.push(node);
  });
  const sort = (items: CommentNode[]) => {
    items.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.score - a.score || a.createdAt.getTime() - b.createdAt.getTime());
    items.forEach((item) => sort(item.replies));
  };
  sort(roots);
  return roots;
}

export async function GET(request: Request) {
  try {
    const postId = z.string().cuid().parse(new URL(request.url).searchParams.get("postId"));
    const prisma = getPrisma();
    if (!(await prisma.post.findFirst({ where: { id: postId, ...publishedPostWhere }, select: { id: true } }))) {
      return Response.json({ error: "This article is not available." }, { status: 404 });
    }
    const viewer = await currentUser();
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { name: true, image: true } }, votes: { select: { value: true, userId: true } } }
    });
    const rows = comments.map((comment) => ({
      id: comment.id,
      parentId: comment.parentId,
      body: comment.body,
      paragraphAnchor: comment.paragraphAnchor,
      isPinned: comment.isPinned,
      createdAt: comment.createdAt,
      author: comment.author,
      score: comment.votes.reduce((sum, vote) => sum + vote.value, 0),
      viewerVote: viewer ? comment.votes.find((vote) => vote.userId === viewer.id)?.value ?? null : null
    }));
    return Response.json({ comments: threadComments(rows) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = commentSchema.parse(await request.json());
    const prisma = getPrisma();
    if (!(await prisma.post.findFirst({ where: { id: input.postId, ...publishedPostWhere }, select: { id: true } }))) {
      return Response.json({ error: "This article is not available." }, { status: 404 });
    }
    if (input.parentId) {
      const parent = await prisma.comment.findFirst({ where: { id: input.parentId, postId: input.postId }, select: { id: true } });
      if (!parent) return Response.json({ error: "The comment you are replying to no longer exists." }, { status: 422 });
    }
    const comment = await prisma.comment.create({
      data: { postId: input.postId, authorId: user.id, parentId: input.parentId, paragraphAnchor: input.paragraphAnchor, body: input.body },
      include: { author: { select: { name: true, image: true } } }
    });
    return Response.json({ comment: { ...comment, score: 0, viewerVote: null, replies: [] } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
