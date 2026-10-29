import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { getPrisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export default async function TaxonomyPage(){const [tags,categories]=await Promise.all([getPrisma().tag.findMany({orderBy:{name:"asc"}}),getPrisma().category.findMany({orderBy:{name:"asc"}})]);return <><p className="eyebrow">Publishing structure</p><h1 className="serif mt-2 text-4xl font-bold">Taxonomy</h1><p className="mt-2 max-w-xl text-zinc-600">Give readers understandable paths through your writing, and give the recommendation feed useful signals.</p><div className="mt-8"><TaxonomyManager initialTags={tags} initialCategories={categories}/></div></>}
