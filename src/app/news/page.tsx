import type { Metadata } from "next";
import Link from "next/link";
import { BentoGrid } from "@/components/public/bento-grid";
import { getNewsArticles } from "@/lib/news";

export const metadata: Metadata = {
  title: "Tech News & Dispatches",
  description: "Live tech signals, software developments, and builder dispatches in an editorial bento grid."
};

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { label: "All News", slug: "all" },
  { label: "AI & ML", slug: "ai" },
  { label: "Web Development", slug: "webdev" },
  { label: "Open Source", slug: "opensource" },
  { label: "Architecture", slug: "architecture" },
  { label: "DevOps & Cloud", slug: "devops" }
];

export default async function NewsPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "all" } = await searchParams;
  const articles = await getNewsArticles(category, 18);

  return (
    <main className="shell py-12 sm:py-16">
      {/* Editorial Header */}
      <div className="max-w-3xl">
        <p className="eyebrow">Ecosystem signals</p>
        <h1 className="serif mt-3 text-5xl sm:text-6xl font-bold tracking-tight text-zinc-950">
          News & Dispatches
        </h1>
        <p className="mt-4 text-lg text-zinc-600 leading-relaxed">
          Curated industry signals, software breakthroughs, and community insights from across the tech landscape.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-6">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.slug;
          return (
            <Link
              key={cat.slug}
              href={cat.slug === "all" ? "/news" : `/news?category=${cat.slug}`}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Bento Grid */}
      <section className="mt-8">
        <BentoGrid articles={articles} />
      </section>
    </main>
  );
}

