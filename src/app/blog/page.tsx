import type { Metadata } from "next";
import { ArticleCard, type ArticleCardPost } from "@/components/public/article-card";
import { listPublishedPosts } from "@/lib/content";

export const metadata: Metadata = { title: "Stories", description: "All stories from TekMonk." };
export const dynamic = "force-dynamic";
export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) { const { page } = await searchParams; const result = await listPublishedPosts({ page: Number(page) || 1 }).catch(() => ({ posts: [], page:1, total:0, pageSize:12, totalPages:1 })); return <main className="shell py-14"><p className="eyebrow">The archive</p><h1 className="serif mt-3 text-5xl font-bold">All stories</h1><p className="mt-3 max-w-xl text-zinc-600">A growing library of essays, tutorials, and field notes.</p><div className="mt-10">{result.posts.length ? result.posts.map((post) => <ArticleCard key={post.id} post={post as ArticleCardPost}/>) : <p className="rounded-lg bg-zinc-50 p-7 text-zinc-600">Nothing published yet.</p>}</div>{result.totalPages > 1 && <nav className="mt-8 flex gap-2" aria-label="Pagination">{Array.from({length:result.totalPages},(_,index)=><a key={index} className={`button ${index + 1 === result.page ? "" : "secondary"}`} href={`/blog?page=${index+1}`}>{index+1}</a>)}</nav>}</main>; }
