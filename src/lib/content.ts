import "server-only";
import { PostStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export function getPublishedPostWhere() {
  return {
    status: PostStatus.PUBLISHED,
    publishedAt: { lte: new Date() }
  };
}

// Object with dynamic getters so spreading `{ ...publishedPostWhere }` evaluates `new Date()` at call time
export const publishedPostWhere = {
  get status() {
    return PostStatus.PUBLISHED;
  },
  get publishedAt() {
    return { lte: new Date() };
  }
};

export async function listPublishedPosts(input?: { query?: string; tag?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(24, Math.max(1, input?.pageSize ?? 12));
  const where = {
    ...getPublishedPostWhere(),
    ...(input?.query
      ? { OR: [{ title: { contains: input.query, mode: "insensitive" as const } }, { excerpt: { contains: input.query, mode: "insensitive" as const } }] }
      : {}),
    ...(input?.tag ? { tags: { some: { tag: { slug: input.tag } } } } : {})
  };
  const prisma = getPrisma();
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { author: { select: { name: true, image: true } }, tags: { include: { tag: true } }, categories: { include: { category: true } }, featuredImage: true, _count: { select: { likes: true, comments: true } } }
    }),
    prisma.post.count({ where })
  ]);
  return { posts, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getPublishedPost(slug: string) {
  return getPrisma().post.findFirst({
    where: { slug, ...getPublishedPostWhere() },
    include: {
      author: { select: { name: true, image: true } },
      tags: { include: { tag: true } },
      categories: { include: { category: true } },
      featuredImage: true,
      media: true,
      folder: {
        include: {
          media: true,
          children: {
            include: { media: true }
          }
        }
      },
      _count: { select: { likes: true, comments: true } }
    }
  });
}

export async function listTags() {
  return getPrisma().tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: { where: { post: getPublishedPostWhere() } } } } }
  });
}
