import { z } from "zod";
import { apiError, requireAdmin } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const item=z.object({type:z.enum(["tag","category"]),name:z.string().trim().min(1).max(60),slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),description:z.string().trim().max(300).optional()});
export async function GET(){try{await requireAdmin();const prisma=getPrisma();const [tags,categories]=await Promise.all([prisma.tag.findMany({orderBy:{name:"asc"}}),prisma.category.findMany({orderBy:{name:"asc"}})]);return Response.json({tags,categories});}catch(error){return apiError(error);}}
export async function POST(request:Request){try{await requireAdmin();const input=item.parse(await request.json());const record=input.type==="tag"?await getPrisma().tag.create({data:{name:input.name,slug:input.slug}}):await getPrisma().category.create({data:{name:input.name,slug:input.slug,description:input.description}});return Response.json({record},{status:201});}catch(error){return apiError(error);}}
