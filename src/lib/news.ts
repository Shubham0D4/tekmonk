export type NewsArticle = {
  id: number;
  title: string;
  description: string;
  publishedAt: string;
  readableDate: string;
  url: string;
  coverImage: string | null;
  socialImage: string | null;
  readingTimeMinutes: number;
  tags: string[];
  author: {
    name: string;
    username: string;
    profileImage: string | null;
  };
  path: string;
  reactionsCount: number;
  commentsCount: number;
  bodyHtml?: string;
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80";

// Fallback curated articles in case of offline/network limits
const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: 101,
    title: "The Architecture of Enduring Software: Principles for the Next Decade",
    description:
      "A deep dive into modular design, fault tolerance, and why the small decisions around state shape long-term maintenance.",
    publishedAt: new Date().toISOString(),
    readableDate: "Just now",
    url: "https://tekmonk.dev/news/101",
    coverImage:
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    socialImage: null,
    readingTimeMinutes: 6,
    tags: ["architecture", "systems", "typescript"],
    author: {
      name: "TekMonk Research",
      username: "tekmonk",
      profileImage: null
    },
    path: "/tekmonk/architecture-of-enduring-software",
    reactionsCount: 142,
    commentsCount: 28,
    bodyHtml: `
      <p>Building software that endures requires balancing speed of delivery with fundamental architectural principles. Over the last decade, we have seen frameworks rise and fall, but core design patterns remain stable.</p>
      <h2>The Primacy of Explicit Boundaries</h2>
      <p>When services or modules hide their boundaries behind implicit magic, refactoring becomes expensive. Explicit contracts, typed boundaries, and strict encapsulation give engineers the freedom to evolve internals without cascading failures.</p>
      <blockquote>Good architecture is not about having zero bugs; it is about making the cost of change predictable and cheap.</blockquote>
      <p>As systems scale, invest early in automated testing, reproducible runtime environments, and decoupled storage layers.</p>
    `
  },
  {
    id: 102,
    title: "AI Inference at the Edge: What Changed in 2026",
    description:
      "From sub-100ms local models to hybrid quantization, running AI workloads in the browser and edge devices has finally hit production maturity.",
    publishedAt: new Date().toISOString(),
    readableDate: "Today",
    url: "https://tekmonk.dev/news/102",
    coverImage:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    socialImage: null,
    readingTimeMinutes: 4,
    tags: ["ai", "edge", "wasm"],
    author: {
      name: "Alex Vance",
      username: "avance",
      profileImage: null
    },
    path: "/avance/ai-inference-at-the-edge",
    reactionsCount: 98,
    commentsCount: 19,
    bodyHtml: `
      <p>Edge inference has crossed a watershed. With WebGPU and lightweight 2B-4B parameter architectures, modern client devices can process multimodal inputs with zero round-trip latency to a cloud cluster.</p>
      <h2>Hybrid Routing</h2>
      <p>The winning paradigm is hybrid: run instant speculative decoding on the local device, and fall back to high-capacity foundational models for deep reasoning tasks.</p>
    `
  },
  {
    id: 103,
    title: "Design Systems in High-Velocity Teams",
    description:
      "How to prevent component bloat while keeping user interfaces coherent, accessible, and fast.",
    publishedAt: new Date().toISOString(),
    readableDate: "Yesterday",
    url: "https://tekmonk.dev/news/103",
    coverImage:
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    socialImage: null,
    readingTimeMinutes: 5,
    tags: ["design", "ui", "web"],
    author: {
      name: "Maya Lin",
      username: "mayalin",
      profileImage: null
    },
    path: "/mayalin/design-systems-velocity",
    reactionsCount: 84,
    commentsCount: 12,
    bodyHtml: `
      <p>Design systems frequently suffer from component sprawl when developers add props for every one-off requirement. Keeping primitives focused on composition rather than configuration keeps libraries lean and adaptable.</p>
    `
  }
];

function normalizeArticle(item: any): NewsArticle {
  return {
    id: Number(item.id),
    title: String(item.title || "Untitled dispatch"),
    description: String(item.description || ""),
    publishedAt: String(item.published_at || item.published_timestamp || new Date().toISOString()),
    readableDate: String(item.readable_publish_date || "Recent"),
    url: String(item.url || ""),
    coverImage: item.cover_image || item.social_image || null,
    socialImage: item.social_image || null,
    readingTimeMinutes: Number(item.reading_time_minutes) || 3,
    tags: Array.isArray(item.tag_list)
      ? item.tag_list
      : typeof item.tags === "string"
      ? item.tags.split(",").map((t: string) => t.trim())
      : [],
    author: {
      name: String(item.user?.name || "Tech Dispatches"),
      username: String(item.user?.username || "builder"),
      profileImage: item.user?.profile_image || null
    },
    path: String(item.path || ""),
    reactionsCount: Number(item.public_reactions_count || item.positive_reactions_count) || 0,
    commentsCount: Number(item.comments_count) || 0,
    bodyHtml: item.body_html || undefined
  };
}

/**
 * Fetch top news stories from public news API
 */
export async function getNewsArticles(category?: string, limit = 20): Promise<NewsArticle[]> {
  try {
    const tagParam = category && category !== "all" ? `&tag=${encodeURIComponent(category)}` : "";
    const url = `https://dev.to/api/articles?top=7&per_page=${limit}${tagParam}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "tekmonk-reader/1.0" },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!res.ok) {
      console.warn("Public news API responded with status", res.status);
      return FALLBACK_NEWS;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return FALLBACK_NEWS;
    }

    return data.map(normalizeArticle);
  } catch (err) {
    console.error("Failed to fetch news articles:", err);
    return FALLBACK_NEWS;
  }
}

/**
 * Fetch a single news article with full images and text body
 */
export async function getNewsArticle(id: string | number): Promise<NewsArticle | null> {
  const numericId = Number(id);

  // Check fallback items first if id matches
  const fallbackMatch = FALLBACK_NEWS.find((item) => item.id === numericId);

  try {
    const headers = { "User-Agent": "tekmonk-reader/1.0" };
    let res = await fetch(`https://dev.to/api/articles/${id}`, {
      headers,
      next: { revalidate: 600 }
    });

    // If direct ID lookup returned 404, look in recent articles to get exact path
    if (!res.ok) {
      const recentRes = await fetch(`https://dev.to/api/articles?per_page=30`, {
        headers,
        next: { revalidate: 300 }
      });
      if (recentRes.ok) {
        const recent = await recentRes.json();
        const found = recent.find((r: any) => String(r.id) === String(id));
        if (found?.path) {
          const cleanPath = found.path.replace(/^\//, "");
          res = await fetch(`https://dev.to/api/articles/${cleanPath}`, {
            headers,
            next: { revalidate: 600 }
          });
        }
      }
    }

    if (!res.ok) {
      return fallbackMatch || null;
    }

    const raw = await res.json();
    const article = normalizeArticle(raw);
    article.bodyHtml = raw.body_html || raw.description || "";
    return article;
  } catch (err) {
    console.error(`Failed to fetch news article #${id}:`, err);
    return fallbackMatch || null;
  }
}

