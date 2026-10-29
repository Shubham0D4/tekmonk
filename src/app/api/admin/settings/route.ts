import { z } from "zod";
import { apiError, requireAdmin } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
const schema=z.object({siteName:z.string().trim().min(1).max(80),siteDescription:z.string().trim().min(1).max(240)});
export async function GET(){try{await requireAdmin();const values=await getPrisma().siteSetting.findMany({where:{key:{in:["site_name","site_description"]}}});return Response.json({siteName:values.find(x=>x.key==="site_name")?.value??"TekMonk",siteDescription:values.find(x=>x.key==="site_description")?.value??"Notes for thoughtful builders."});}catch(error){return apiError(error);}}
export async function PUT(request:Request){try{await requireAdmin();const input=schema.parse(await request.json());await getPrisma().$transaction([getPrisma().siteSetting.upsert({where:{key:"site_name"},create:{key:"site_name",value:input.siteName},update:{value:input.siteName}}),getPrisma().siteSetting.upsert({where:{key:"site_description"},create:{key:"site_description",value:input.siteDescription},update:{value:input.siteDescription}})]);return Response.json({ok:true});}catch(error){return apiError(error);}}
