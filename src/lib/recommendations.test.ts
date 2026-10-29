/**
 * Unit tests for the scoring logic in src/lib/recommendations.ts
 *
 * recommendations.ts imports from "server-only" and Prisma (which requires a
 * live database connection), so we mock both before importing the module.
 * We then exercise the pure scoring / ranking logic by controlling the data
 * returned by the mocked getPrisma().
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks must be declared before any dynamic imports ──────────────────────

vi.mock("server-only", () => ({}));

// Mock the Prisma module — we return a factory so each test can override behaviour.
vi.mock("@/lib/prisma", () => ({
  getPrisma: vi.fn(),
}));

// Also mock the generated Prisma enum so the module can reference PostStatus.
vi.mock("@/generated/prisma/client", () => ({
  PostStatus: { PUBLISHED: "PUBLISHED" },
}));

// ── Import after mocks are registered ──────────────────────────────────────
const { recommendedPosts } = await import("@/lib/recommendations");
const { getPrisma } = await import("@/lib/prisma");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fake post object that mirrors what Prisma returns. */
function makePost(
  id: string,
  options: {
    likes?: number;
    comments?: number;
    /** Hours in the past the post was published */
    hoursAgo?: number;
    tags?: string[];
  } = {}
) {
  const { likes = 0, comments = 0, hoursAgo = 1, tags = [] } = options;
  return {
    id,
    title: `Post ${id}`,
    slug: `post-${id}`,
    publishedAt: new Date(Date.now() - hoursAgo * 3_600_000),
    author: { name: "Author", image: null },
    featuredImage: null,
    tags: tags.map((tagId) => ({ tagId, tag: { id: tagId, name: tagId, slug: tagId } })),
    _count: { likes, comments },
  };
}

/** A Prisma mock that returns no read events and a given list of posts. */
function buildPrismaMock(posts: ReturnType<typeof makePost>[]) {
  return {
    readEvent: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    post: {
      findMany: vi.fn().mockResolvedValue(posts),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("recommendedPosts — scoring logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns posts sorted by score descending (more likes → higher rank)", async () => {
    const posts = [
      makePost("low", { likes: 1, comments: 0, hoursAgo: 1 }),
      makePost("high", { likes: 10, comments: 5, hoursAgo: 1 }),
    ];
    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(buildPrismaMock(posts));

    const result = await recommendedPosts();

    expect(result[0].id).toBe("high");
    expect(result[1].id).toBe("low");
  });

  it("assigns a higher score to posts with more comments", async () => {
    // Same age, same likes — more comments wins
    const posts = [
      makePost("few-comments", { likes: 5, comments: 2, hoursAgo: 2 }),
      makePost("many-comments", { likes: 5, comments: 20, hoursAgo: 2 }),
    ];
    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(buildPrismaMock(posts));

    const result = await recommendedPosts();

    expect(result[0].id).toBe("many-comments");
  });

  it("decays score over time — newer post ranks higher when engagement is equal", async () => {
    // Same likes / comments but different ages
    const posts = [
      makePost("old", { likes: 5, comments: 3, hoursAgo: 200 }),
      makePost("new", { likes: 5, comments: 3, hoursAgo: 1 }),
    ];
    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(buildPrismaMock(posts));

    const result = await recommendedPosts();

    expect(result[0].id).toBe("new");
  });

  it("respects the `take` parameter and never returns more posts than requested", async () => {
    const posts = Array.from({ length: 10 }, (_, i) =>
      makePost(`p${i}`, { likes: i, hoursAgo: 1 })
    );
    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(buildPrismaMock(posts));

    const result = await recommendedPosts(undefined, 3);

    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("adds preference bonus for posts matching user tag affinity", async () => {
    const TAG = "typescript";

    // Post B shares the preferred tag; post A does not.
    const posts = [
      makePost("no-tag", { likes: 10, comments: 0, hoursAgo: 1, tags: [] }),
      makePost("has-tag", { likes: 5, comments: 0, hoursAgo: 1, tags: [TAG] }),
    ];

    // Simulate user affinity: one read event whose post had the TAG.
    const prismaWithAffinity = {
      readEvent: {
        findMany: vi.fn().mockResolvedValue([
          { post: { tags: [{ tagId: TAG }] } },
        ]),
      },
      post: {
        findMany: vi.fn().mockResolvedValue(posts),
      },
    };
    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(prismaWithAffinity);

    const result = await recommendedPosts("user-1");

    // "has-tag" should be boosted above "no-tag" despite fewer likes
    expect(result[0].id).toBe("has-tag");
  });

  it("exposes recommendationScore as a numeric property on every returned post", async () => {
    const posts = [makePost("x", { likes: 3, comments: 1, hoursAgo: 5 })];
    (getPrisma as ReturnType<typeof vi.fn>).mockReturnValue(buildPrismaMock(posts));

    const result = await recommendedPosts();

    expect(typeof result[0].recommendationScore).toBe("number");
    expect(result[0].recommendationScore).toBeGreaterThanOrEqual(0);
  });
});
