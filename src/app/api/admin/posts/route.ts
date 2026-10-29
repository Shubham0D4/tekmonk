import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { apiError, requireAdmin } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = postSchema.parse(await request.json());
    const now = new Date();
    const publishedAt = input.status === "PUBLISHED" ? now : null;
    const post = await getPrisma().post.create({
      data: {
        title: input.title, slug: input.slug, excerpt: input.excerpt ?? null, content: input.content as Prisma.InputJsonValue,
        seoTitle: input.seoTitle ?? null, seoDescription: input.seoDescription ?? null, folderId: input.folderId ?? null, featuredImageId: input.featuredImageId ?? null,
        authorId: admin.id, status: input.status, publishedAt, scheduledFor: input.status === "SCHEDULED" ? input.scheduledFor : null,
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) }, categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) }
      }
    });

    if (input.status === "PUBLISHED") {
      revalidatePath("/");
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
      revalidatePath("/feed.xml");
      revalidatePath("/sitemap.xml");
    }

    return Response.json({ post }, { status: 201 });
  } catch (error) { return apiError(error); }
}
