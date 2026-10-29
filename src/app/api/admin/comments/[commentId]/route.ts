import { z } from "zod";
import { apiError, requireAdmin } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function PATCH(request:Request,context:{params:Promise<{commentId:string}>}){try{await requireAdmin();const {commentId}=z.object({commentId:z.string().cuid()}).parse(await context.params);const {isPinned}=z.object({isPinned:z.boolean()}).parse(await request.json());await getPrisma().comment.update({where:{id:commentId},data:{isPinned}});return Response.json({ok:true});}catch(error){return apiError(error);}}
export async function DELETE(_request:Request,context:{params:Promise<{commentId:string}>}){try{await requireAdmin();const {commentId}=z.object({commentId:z.string().cuid()}).parse(await context.params);await getPrisma().comment.delete({where:{id:commentId}});return Response.json({ok:true});}catch(error){return apiError(error);}}
