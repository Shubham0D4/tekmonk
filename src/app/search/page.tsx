import Link from "next/link";
import { Search } from "lucide-react";
import { ArticleCard, type ArticleCardPost } from "@/components/public/article-card";
import { listPublishedPosts } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?:string }> }) { const {q=""}=await searchParams; const result=q.trim()?await listPublishedPosts({query:q.trim()}).catch(()=>({posts:[],total:0,page:1,pageSize:12,totalPages:1})):null; return <main className="shell py-14"><h1 className="serif text-5xl font-bold">Search stories</h1><form className="mt-7 flex max-w-2xl gap-2" action="/search"><label className="sr-only" htmlFor="q">Search stories</label><input id="q" name="q" defaultValue={q} className="input" placeholder="Search titles and summaries"/><button className="button"><Search size={17}/>Search</button></form>{result && <div className="mt-10"><p className="text-sm text-zinc-500">{result.total} result{result.total===1?"":"s"} for “{q}”</p><div className="mt-4">{result.posts.length?result.posts.map((post)=><ArticleCard key={post.id} post={post as ArticleCardPost}/>):<div className="rounded-lg bg-zinc-50 p-7"><p>No stories matched that search.</p><Link className="mt-2 inline-block text-sm text-emerald-800 underline" href="/news">Browse tech news instead</Link></div>}</div></div>}</main>; }
