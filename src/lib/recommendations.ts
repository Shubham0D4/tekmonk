import "server-only";
import { PostStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export async function recommendedPosts(userId?: string, take = 8) {
  const prisma = getPrisma();
  const published = { status: PostStatus.PUBLISHED, publishedAt: { lte: new Date() } };
  const affinity = userId
    ? await prisma.readEvent.findMany({
        where: { userId, OR: [{ durationSeconds: { gt: 30 } }, { post: { likes: { some: { userId } } } }, { post: { comments: { some: { authorId: userId } } } }] },
        select: { post: { select: { tags: { select: { tagId: true } } } } }
      })
    : [];
  const tagWeights = new Map<string, number>();
  affinity.forEach((event) => event.post.tags.forEach(({ tagId }) => tagWeights.set(tagId, (tagWeights.get(tagId) ?? 0) + 1)));
  const posts = await prisma.post.findMany({
    where: published,
    take: 40,
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true, image: true } }, tags: { include: { tag: true } }, featuredImage: true, _count: { select: { likes: true, comments: true } } }
  });
  const now = Date.now();
  return posts
    .map((post) => {
      const hours = Math.max(0, (now - (post.publishedAt?.getTime() ?? now)) / 3_600_000);
      const coldScore = (post._count.likes * 3 + post._count.comments * 5) / Math.pow(hours + 2, 1.5);
      const preference = post.tags.reduce((score, { tagId }) => score + (tagWeights.get(tagId) ?? 0), 0);
      return { ...post, recommendationScore: coldScore + preference * 3 };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, take);
}
