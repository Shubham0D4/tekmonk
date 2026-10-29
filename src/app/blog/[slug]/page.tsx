import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleActions } from "@/components/public/article-actions";
import { Comments } from "@/components/public/comments";
import { RichContent } from "@/components/public/rich-content";
import { getPublishedPost } from "@/lib/content";
import { siteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);
  if (!post) return {};
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: post.featuredImage ? [{ url: post.featuredImage.publicUrl }] : undefined
    }
  };
}

export default async function ArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);
  if (!post) notFound();

  const published = post.publishedAt
    ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(post.publishedAt)
    : "";
  const words = JSON.stringify(post.content).split(/\s+/).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedAt?.toISOString(),
    author: { "@type": "Person", name: post.author.name },
    mainEntityOfPage: siteUrl(`/blog/${post.slug}`)
  };
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  // Construct map of relative filenames -> public URLs
  const mediaMap: Record<string, string> = {};
  post.media?.forEach((m) => {
    mediaMap[m.fileName] = m.publicUrl;
  });
  post.folder?.media?.forEach((m) => {
    mediaMap[m.fileName] = m.publicUrl;
  });
  post.folder?.children?.forEach((sub) => {
    sub.media?.forEach((m) => {
      mediaMap[m.fileName] = m.publicUrl;
      mediaMap[`${sub.name}/${m.fileName}`] = m.publicUrl;
    });
  });

  return (
    <main className="pb-8">
      <article className="mx-auto w-[min(100%-40px,720px)] pt-14">
        <div className="flex flex-wrap gap-2">
          {post.tags.map(({ tag }) => (
            <span key={tag.id} className="tag">
              {tag.name}
            </span>
          ))}
        </div>
        <h1 className="serif mt-5 text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-5 text-xl leading-8 text-zinc-600">{post.excerpt}</p>
        )}
        <div className="mt-8 flex items-center gap-3 border-b border-zinc-200 pb-6 text-sm text-zinc-500">
          <span className="font-medium text-zinc-800">{post.author.name}</span>
          <span>{published}</span>
          <span>{Math.max(1, Math.ceil(words / 220))} min read</span>
        </div>
        <ArticleActions postId={post.id} initialLikes={post._count.likes} />
        <div className="mt-10">
          {post.featuredImage && (
            <Image
              className="mb-10 aspect-[16/9] w-full rounded-lg object-cover"
              src={post.featuredImage.publicUrl}
              alt={post.featuredImage.alt || ""}
              width={1280}
              height={720}
              sizes="(max-width: 720px) 100vw, 720px"
            />
          )}
          <RichContent content={post.content} mediaMap={mediaMap} />
        </div>
        <Comments postId={post.id} initialCount={post._count.comments} />
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd }}
      />
    </main>
  );
}
