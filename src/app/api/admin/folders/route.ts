import { z } from "zod";
import { apiError, requireAdmin } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";
import { folderSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    const prisma = getPrisma();
    const [folders, posts, media] = await Promise.all([
      prisma.folder.findMany({
        where: { ownerId: admin.id },
        orderBy: { name: "asc" },
        include: { _count: { select: { children: true, posts: true, media: true } } }
      }),
      prisma.post.findMany({
        where: { authorId: admin.id },
        select: { id: true, title: true, slug: true, status: true, folderId: true, updatedAt: true },
        orderBy: { updatedAt: "desc" }
      }),
      prisma.mediaAsset.findMany({
        where: { ownerId: admin.id },
        select: { id: true, fileName: true, publicUrl: true, folderId: true, postId: true, mimeType: true, sizeBytes: true, createdAt: true },
        orderBy: { createdAt: "asc" }
      })
    ]);
    return Response.json({ folders, posts, media });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = folderSchema.parse(await request.json());
    if (input.parentId && !(await getPrisma().folder.findFirst({ where: { id: input.parentId, ownerId: admin.id } }))) {
      return Response.json({ error: "Parent folder not found." }, { status: 422 });
    }
    const folder = await getPrisma().folder.create({
      data: { name: input.name, parentId: input.parentId, ownerId: admin.id }
    });
    return Response.json({ folder }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const input = z.object({ id: z.string().cuid(), name: folderSchema.shape.name }).parse(await request.json());
    const folder = await getPrisma().folder.updateMany({
      where: { id: input.id, ownerId: admin.id },
      data: { name: input.name }
    });
    if (!folder.count) return Response.json({ error: "Folder not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const id = z.object({ id: z.string().cuid() }).parse(Object.fromEntries(new URL(request.url).searchParams)).id;
    const prisma = getPrisma();
    const folder = await prisma.folder.findFirst({
      where: { id, ownerId: admin.id }
    });
    if (!folder) return Response.json({ error: "Folder not found." }, { status: 404 });

    // Gracefully reassign files in this folder to root (null) so user doesn't lose work
    await prisma.post.updateMany({ where: { folderId: id }, data: { folderId: null } });
    await prisma.mediaAsset.updateMany({ where: { folderId: id }, data: { folderId: null } });
    // Reassign direct child folders to parent or null
    await prisma.folder.updateMany({ where: { parentId: id }, data: { parentId: folder.parentId } });
    await prisma.folder.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
