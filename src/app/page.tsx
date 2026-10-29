import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard, type ArticleCardPost } from "@/components/public/article-card";
import { recommendedPosts } from "@/lib/recommendations";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  const posts = await recommendedPosts(undefined, 7).catch(() => []);
  const [lead, ...rest] = posts;
  return <main><section className="border-b border-zinc-200 bg-[#f8f8f5] py-18 sm:py-24"><div className="shell grid items-end gap-10 md:grid-cols-[1.3fr_.7fr]"><div><p className="eyebrow">Independent publishing</p><h1 className="serif mt-4 max-w-3xl text-5xl font-bold leading-[.98] tracking-tight sm:text-7xl">Notes for thoughtful builders.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">Longer ideas about tools, systems, and the small decisions that make good work endure.</p><Link href="/blog" className="button mt-7">Explore all stories <ArrowRight size={16}/></Link></div><div className="border-l-0 border-zinc-200 pb-1 md:border-l md:pl-8"><p className="serif text-2xl leading-8">No noise. Just considered writing and useful arguments worth sitting with.</p><p className="mt-5 text-sm text-zinc-500">A personal publication from TekMonk.</p></div></div></section>
  <section className="shell py-14">{lead ? <><p className="eyebrow">Read this first</p><div className="mt-2"><ArticleCard post={lead as ArticleCardPost} priority/></div></> : <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center"><h2 className="serif text-3xl font-bold">The shelf is waiting.</h2><p className="mt-2 text-zinc-500">Publish the first story from the owner workspace to begin your feed.</p></div>}
  {rest.length > 0 && <div className="mt-12"><div className="flex items-baseline justify-between"><h2 className="serif text-3xl font-bold">More to consider</h2><Link className="text-sm text-emerald-800 underline" href="/blog">All stories</Link></div><div className="mt-5">{rest.map((post) => <ArticleCard key={post.id} post={post as ArticleCardPost}/>)}</div></div>}</section></main>;
}
