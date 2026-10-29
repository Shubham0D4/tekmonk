import { notFound } from "next/navigation";
import { ArticleCard, type ArticleCardPost } from "@/components/public/article-card";
import { listPublishedPosts } from "@/lib/content";

export const dynamic = "force-dynamic";
export default async function TopicPage({ params }: { params: Promise<{ slug:string }> }) { const {slug}=await params; const result=await listPublishedPosts({tag:slug}).catch(()=>null); if(!result || !result.posts.length) notFound(); const title=result.posts[0].tags.find(({tag})=>tag.slug===slug)?.tag.name || slug; return <main className="shell py-14"><p className="eyebrow">Topic</p><h1 className="serif mt-3 text-5xl font-bold">{title}</h1><div className="mt-10">{result.posts.map((post)=><ArticleCard key={post.id} post={post as ArticleCardPost}/>)}</div></main>; }
