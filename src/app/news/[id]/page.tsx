/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ExternalLink, MessageSquare, ThumbsUp } from "lucide-react";
import { getNewsArticle, getNewsArticles } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await getNewsArticle(id);
  if (!article) return { title: "News Story | TekMonk" };

  return {
    title: `${article.title} | TekMonk News`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: article.coverImage ? [{ url: article.coverImage }] : undefined
    }
  };
}

export default async function NewsDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getNewsArticle(id);

  if (!article) notFound();

  // Fetch more news for the bottom section
  const moreNews = (await getNewsArticles(undefined, 4)).filter((a) => a.id !== article.id).slice(0, 3);

  const heroImage = article.coverImage || article.socialImage;

  return (
    <main className="pb-16 pt-8">
      <article className="mx-auto w-[min(100%-40px,760px)]">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to News</span>
          </Link>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="tag">
              #{tag}
            </span>
          ))}
        </div>

        {/* Headline */}
        <h1 className="serif mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-zinc-950">
          {article.title}
        </h1>

        {/* Excerpt / Lead */}
        {article.description && (
          <p className="mt-5 text-xl leading-relaxed text-zinc-600 font-normal">
            {article.description}
          </p>
        )}

        {/* Author & Publish Metadata */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-zinc-200 py-4 text-sm text-zinc-500">
          <div className="flex items-center gap-3">
            {article.author.profileImage ? (
              <img
                src={article.author.profileImage}
                alt={article.author.name}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-200"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                {article.author.name[0]}
              </div>
            )}
            <div>
              <p className="font-semibold text-zinc-900 leading-tight">
                {article.author.name}
              </p>
              <p className="text-xs text-zinc-400">
                @{article.author.username} · {article.readableDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-zinc-500">
              <Clock size={14} />
              {article.readingTimeMinutes} min read
            </span>

            {article.reactionsCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <ThumbsUp size={14} />
                {article.reactionsCount} reactions
              </span>
            )}

            {article.commentsCount > 0 && (
              <span className="flex items-center gap-1 text-zinc-500">
                <MessageSquare size={14} />
                {article.commentsCount}
              </span>
            )}

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-800 underline hover:text-emerald-950"
              >
                <span>Original source</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Featured Cover Image */}
        {heroImage && (
          <div className="mt-8 overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-200">
            <img
              src={heroImage}
              alt={article.title}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        {/* Full News Content: Images & Text */}
        <div className="mt-10 article-prose">
          {article.bodyHtml ? (
            <div
              className="prose-content space-y-4"
              dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
            />
          ) : (
            <p className="text-zinc-600 leading-relaxed">{article.description}</p>
          )}
        </div>

        {/* Source Footer Attribution */}
        {article.url && (
          <div className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Live dispatch via DEV Community Public Feed
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Original author: {article.author.name} (@{article.author.username})
              </p>
            </div>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary shrink-0"
            >
              <span>View full thread</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}
      </article>

      {/* More News Bento Strip */}
      {moreNews.length > 0 && (
        <section className="shell mt-20 border-t border-zinc-200 pt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="eyebrow">Continue reading</p>
              <h2 className="serif text-2xl font-bold mt-1 text-zinc-950">More Tech Signals</h2>
            </div>
            <Link href="/news" className="text-sm font-medium text-emerald-800 underline">
              View all news
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {moreNews.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-zinc-300"
              >
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    #{item.tags[0] || "news"}
                  </span>
                  <h3 className="serif mt-3 text-lg font-bold leading-snug text-zinc-900 group-hover:text-emerald-700 transition line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{item.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                  <span>{item.author.name}</span>
                  <span className="text-emerald-700 font-medium">Read →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

