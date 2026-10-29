/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowUpRight, Clock, MessageSquare, Sparkles, ThumbsUp } from "lucide-react";
import type { NewsArticle } from "@/lib/news";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

export function BentoGrid({ articles }: { articles: NewsArticle[] }) {
  if (!articles || articles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center">
        <h3 className="serif text-2xl font-bold">No news available right now.</h3>
        <p className="mt-2 text-sm text-zinc-500">Check back shortly for live dispatches.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[220px]">
      {articles.map((item, index) => {
        const image = item.coverImage || item.socialImage || DEFAULT_IMAGE;
        const mainTag = item.tags[0] || "Dispatch";

        // Layout pattern for Bento Grid variation
        const isHero = index === 0;
        const isTall = index === 1;
        const isWide = index === 2 || index === 5;

        let colSpan = "col-span-1 row-span-1";
        if (isHero) colSpan = "md:col-span-2 md:row-span-2";
        else if (isTall) colSpan = "md:col-span-1 md:row-span-2";
        else if (isWide) colSpan = "md:col-span-2 md:row-span-1";

        if (isHero) {
          return (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className={`${colSpan} group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 p-6 sm:p-8 text-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-zinc-400`}
            >
              {/* Background cover image with gradient */}
              <img
                src={image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

              <div className="relative z-10 flex flex-col justify-end">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
                    <Sparkles size={12} />
                    Top Story
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md">
                    #{mainTag}
                  </span>
                </div>

                <h2 className="serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-white group-hover:text-emerald-200 transition-colors">
                  {item.title}
                </h2>

                <p className="mt-3 line-clamp-2 text-sm text-zinc-300 max-w-xl">
                  {item.description}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    {item.author.profileImage ? (
                      <img
                        src={item.author.profileImage}
                        alt={item.author.name}
                        className="h-6 w-6 rounded-full object-cover ring-1 ring-white/20"
                      />
                    ) : (
                      <span className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-white text-[10px]">
                        {item.author.name[0]}
                      </span>
                    )}
                    <span className="font-medium text-white">{item.author.name}</span>
                    <span>·</span>
                    <span>{item.readableDate}</span>
                  </div>

                  <span className="flex items-center gap-1 font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                    Read story <ArrowUpRight size={15} />
                  </span>
                </div>
              </div>
            </Link>
          );
        }

        if (isTall) {
          return (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className={`${colSpan} group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-zinc-300`}
            >
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 mb-4">
                  <img
                    src={image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 rounded-md bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                    #{mainTag}
                  </span>
                </div>

                <h3 className="serif text-lg font-bold leading-snug text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-3">
                  {item.title}
                </h3>

                <p className="mt-2 text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {item.readingTimeMinutes} min read
                </span>
                <span className="font-medium text-emerald-700 flex items-center gap-0.5">
                  View <ArrowUpRight size={13} />
                </span>
              </div>
            </Link>
          );
        }

        if (isWide) {
          return (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className={`${colSpan} group flex flex-col sm:flex-row items-center justify-between gap-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-zinc-300`}
            >
              <div className="flex flex-col justify-between h-full flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                      #{mainTag}
                    </span>
                    <span className="text-[11px] text-zinc-400">{item.readableDate}</span>
                  </div>

                  <h3 className="serif text-xl font-bold leading-snug text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
                  <span className="font-medium text-zinc-700">{item.author.name}</span>
                  {item.reactionsCount > 0 && (
                    <span className="flex items-center gap-1 text-emerald-700">
                      <ThumbsUp size={12} /> {item.reactionsCount}
                    </span>
                  )}
                  {item.commentsCount > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} /> {item.commentsCount}
                    </span>
                  )}
                </div>
              </div>

              <div className="relative aspect-[4/3] w-full sm:w-44 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                <img
                  src={image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          );
        }

        // Standard compact card
        return (
          <Link
            key={item.id}
            href={`/news/${item.id}`}
            className={`${colSpan} group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition-all duration-300 hover:shadow-md hover:border-zinc-300`}
          >
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-700">
                  #{mainTag}
                </span>
                <span>{item.readableDate}</span>
              </div>

              <h3 className="serif text-base font-bold leading-snug text-zinc-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                {item.title}
              </h3>

              <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2">
                {item.description}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-50 pt-2">
              <span className="truncate max-w-[120px]">{item.author.name}</span>
              <span className="text-emerald-700 font-medium flex items-center gap-0.5">
                Read <ArrowUpRight size={13} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

