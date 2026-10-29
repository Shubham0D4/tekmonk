import Link from "next/link";
import { listTags } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function TopicsPage() { const tags = await listTags().catch(() => []); return <main className="shell py-14"><p className="eyebrow">Find a thread</p><h1 className="serif mt-3 text-5xl font-bold">Topics</h1><p className="mt-3 text-zinc-600">Browse the ideas that recur across the publication.</p><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{tags.length ? tags.map((tag)=><Link key={tag.id} href={`/topics/${tag.slug}`} className="rounded-lg border border-zinc-200 p-5 transition hover:border-emerald-600 hover:bg-emerald-50"><h2 className="serif text-xl font-bold">{tag.name}</h2><p className="mt-2 text-sm text-zinc-500">{tag._count.posts} published {tag._count.posts === 1 ? "story" : "stories"}</p></Link>) : <p className="text-zinc-500">Topics will appear as stories are tagged.</p>}</div></main>; }
