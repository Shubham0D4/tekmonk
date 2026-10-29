import { notFound } from "next/navigation";
import { WorkspaceLayout } from "@/components/admin/workspace-layout";
import { requireAdminPage } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const empty = {
  title: "",
  slug: "",
  excerpt: "",
  content: { type: "doc", content: [{ type: "paragraph" }] },
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT" as const,
  tagIds: [],
  categoryIds: [],
  folderId: null
};

export default async function WorkspacePage({
  params,
  searchParams
}: {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<{ folderId?: string }>;
}) {
  const admin = await requireAdminPage();
  const { postId } = await params;
  const sp = searchParams ? await searchParams : {};
  const prisma = getPrisma();

  const [tags, categories, folders, post, mediaAssets] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.folder.findMany({
      where: { ownerId: admin.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    postId === "new"
      ? null
      : prisma.post.findFirst({
          where: { id: postId, authorId: admin.id },
          include: {
            tags: true,
            categories: true,
            media: true,
            folder: {
              include: {
                media: true,
                children: { include: { media: true } }
              }
            }
          }
        }),
    prisma.mediaAsset.findMany({
      where: { ownerId: admin.id },
      select: { fileName: true, publicUrl: true, folderId: true }
    })
  ]);

  if (postId !== "new" && !post) notFound();

  const initial = post
    ? {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content,
        seoTitle: post.seoTitle || "",
        seoDescription: post.seoDescription || "",
        status: post.status,
        scheduledFor: post.scheduledFor?.toISOString().slice(0, 16),
        folderId: post.folderId,
        featuredImageId: post.featuredImageId,
        tagIds: post.tags.map((item) => item.tagId),
        categoryIds: post.categories.map((item) => item.categoryId)
      }
    : {
        ...empty,
        folderId: sp.folderId || null
      };

  // Build mediaMap for relative path lookup
  const mediaMap: Record<string, string> = {};
  mediaAssets.forEach((m) => {
    mediaMap[m.fileName] = m.publicUrl;
  });
  if (post) {
    post.media?.forEach((m) => {
      mediaMap[m.fileName] = m.publicUrl;
    });
    post.folder?.media?.forEach((m) => {
      mediaMap[m.fileName] = m.publicUrl;
    });
    post.folder?.children?.forEach((sub) => {
      sub.media?.forEach((m) => {
        mediaMap[m.fileName] = m.publicUrl;
        mediaMap[`${sub.name}/${m.fileName}`] = m.publicUrl;
      });
    });
  }

  return (
    <>
      <div className="mb-6">
        <p className="eyebrow">Writer workspace</p>
        <h1 className="serif mt-2 text-3xl font-bold">
          {post ? post.title || "Untitled story" : "New .blg story"}
        </h1>
      </div>
      <WorkspaceLayout
        currentPostId={postId === "new" ? undefined : postId}
        initial={initial}
        tags={tags}
        categories={categories}
        folders={folders}
        mediaMap={mediaMap}
      />
    </>
  );
}
