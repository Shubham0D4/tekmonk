import Link from "next/link";

export type ArticleCardPost = {
  slug: string; title: string; excerpt: string | null; publishedAt: Date | null;
  author: { name: string; image: string | null }; tags: Array<{ tag: { name: string; slug: string } }>;
  _count: { likes: number; comments: number };
};

export function ArticleCard({ post, priority = false }: { post: ArticleCardPost; priority?: boolean }) {
  const date = post.publishedAt ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(post.publishedAt) : "Unpublished";
  const minutes = Math.max(1, Math.ceil(((post.excerpt?.split(/\s+/).length ?? 200) + 450) / 220));
  return <article className="article-card grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:gap-8">
    <div><div className="mb-3 flex flex-wrap gap-2">{post.tags.slice(0, 3).map(({ tag }) => <Link href={`/topics/${tag.slug}`} className="tag" key={tag.slug}>{tag.name}</Link>)}</div>
      <Link href={`/blog/${post.slug}`}><h2 className="serif text-2xl font-bold leading-tight text-zinc-900 sm:text-3xl">{post.title}</h2></Link>
      {post.excerpt && <p className="mt-2 max-w-2xl text-[.98rem] leading-6 text-zinc-600">{post.excerpt}</p>}
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500"><span>{post.author.name}</span><span>{date}</span><span>{minutes} min read</span><span>{post._count.likes} likes</span><span>{post._count.comments} comments</span></div>
    </div><div aria-hidden="true" className={`order-first aspect-[4/3] rounded-md bg-[linear-gradient(135deg,#dcefe2,#f2e9d9)] sm:order-none ${priority ? "" : ""}`} /></article>;
}
