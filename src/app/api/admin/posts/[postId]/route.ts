import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { apiError, requireAdmin } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";
import { postSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export async function PATCH(request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const admin = await requireAdmin(); const { postId }=z.object({postId:z.string().cuid()}).parse(await context.params); const input=postSchema.parse(await request.json()); const prisma=getPrisma();
    const existing=await prisma.post.findFirst({where:{id:postId,authorId:admin.id},select:{id:true,slug:true,publishedAt:true}}); if(!existing) return Response.json({error:"Post not found."},{status:404});
    const post=await prisma.post.update({where:{id:postId},data:{title:input.title,slug:input.slug,excerpt:input.excerpt??null,content:input.content as Prisma.InputJsonValue,seoTitle:input.seoTitle??null,seoDescription:input.seoDescription??null,folderId:input.folderId??null,featuredImageId:input.featuredImageId??null,status:input.status,publishedAt:input.status==="PUBLISHED"?(existing.publishedAt??new Date()):null,scheduledFor:input.status==="SCHEDULED"?input.scheduledFor:null,tags:{deleteMany:{},create:input.tagIds.map(tagId=>({tagId}))},categories:{deleteMany:{},create:input.categoryIds.map(categoryId=>({categoryId}))}}});

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    if (existing.slug !== post.slug) revalidatePath(`/blog/${existing.slug}`);
    revalidatePath("/feed.xml");
    revalidatePath("/sitemap.xml");

    return Response.json({post});
  } catch(error){return apiError(error);}
}
export async function DELETE(_request: Request, context: { params: Promise<{ postId: string }> }) {
  try {
    const admin=await requireAdmin(); const {postId}=z.object({postId:z.string().cuid()}).parse(await context.params); const result=await getPrisma().post.deleteMany({where:{id:postId,authorId:admin.id}});
    if(!result.count)return Response.json({error:"Post not found."},{status:404});
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/feed.xml");
    revalidatePath("/sitemap.xml");
    return Response.json({ok:true});
  } catch(error){return apiError(error);}
}
