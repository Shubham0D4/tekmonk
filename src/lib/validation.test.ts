/**
 * Unit tests for src/lib/validation.ts
 *
 * Covers: postSchema, commentSchema, contactSchema, folderSchema
 * No server-only imports — validation.ts is pure Zod and safe to import directly.
 */
import { describe, it, expect } from "vitest";
import {
  postSchema,
  commentSchema,
  contactSchema,
  folderSchema,
} from "@/lib/validation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A CUID-like string that passes z.string().cuid() */
const fakeCuid = "clh3v2e0m0000qzrmn9b72hg5";

/** Minimal valid post payload */
const validPost = {
  title: "Hello World",
  slug: "hello-world",
  content: { type: "doc", content: [] },
  status: "DRAFT" as const,
  tagIds: [],
  categoryIds: [],
};

// ---------------------------------------------------------------------------
// postSchema
// ---------------------------------------------------------------------------

describe("postSchema", () => {
  it("accepts a minimal valid draft post", () => {
    const result = postSchema.safeParse(validPost);
    expect(result.success).toBe(true);
  });

  it("rejects a slug with uppercase letters", () => {
    const result = postSchema.safeParse({ ...validPost, slug: "Hello-World" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("slug");
    }
  });

  it("rejects a title longer than 180 characters", () => {
    const result = postSchema.safeParse({
      ...validPost,
      title: "a".repeat(181),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a slug longer than 120 characters", () => {
    // Build a valid-pattern slug that is too long
    const longSlug = ("ab-").repeat(41); // 123 chars
    const result = postSchema.safeParse({ ...validPost, slug: longSlug });
    expect(result.success).toBe(false);
  });

  it("rejects SCHEDULED status when scheduledFor is missing", () => {
    const result = postSchema.safeParse({
      ...validPost,
      status: "SCHEDULED",
      scheduledFor: null,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("scheduledFor");
    }
  });

  it("accepts SCHEDULED status when scheduledFor is provided", () => {
    const result = postSchema.safeParse({
      ...validPost,
      status: "SCHEDULED",
      scheduledFor: new Date(Date.now() + 60_000),
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 12 tag IDs", () => {
    const result = postSchema.safeParse({
      ...validPost,
      tagIds: Array.from({ length: 13 }, () => fakeCuid),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 4 category IDs", () => {
    const result = postSchema.safeParse({
      ...validPost,
      categoryIds: Array.from({ length: 5 }, () => fakeCuid),
    });
    expect(result.success).toBe(false);
  });

  it("rejects seoTitle longer than 70 characters", () => {
    const result = postSchema.safeParse({
      ...validPost,
      seoTitle: "x".repeat(71),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// commentSchema
// ---------------------------------------------------------------------------

describe("commentSchema", () => {
  const validComment = {
    postId: fakeCuid,
    body: "This is a valid comment body.",
  };

  it("accepts a minimal valid comment", () => {
    const result = commentSchema.safeParse(validComment);
    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = commentSchema.safeParse({ ...validComment, body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a body longer than 2000 characters", () => {
    const result = commentSchema.safeParse({
      ...validComment,
      body: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional parentId that is a valid cuid", () => {
    const result = commentSchema.safeParse({
      ...validComment,
      parentId: fakeCuid,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a parentId that is not a cuid", () => {
    const result = commentSchema.safeParse({
      ...validComment,
      parentId: "not-a-cuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a paragraphAnchor longer than 160 characters", () => {
    const result = commentSchema.safeParse({
      ...validComment,
      paragraphAnchor: "p".repeat(161),
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// contactSchema
// ---------------------------------------------------------------------------

describe("contactSchema", () => {
  const validContact = {
    name: "Jane Doe",
    email: "jane@example.com",
    message: "This is a test message with more than twenty characters.",
  };

  it("accepts a valid contact form payload", () => {
    const result = contactSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = contactSchema.safeParse({ ...validContact, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email address", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a message shorter than 20 characters", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      message: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a message longer than 5000 characters", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      message: "m".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-empty honeypot website field (bot detection)", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      website: "http://spam.example.com",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty/absent honeypot website field", () => {
    const result = contactSchema.safeParse({ ...validContact, website: "" });
    expect(result.success).toBe(true);
  });

  it("accepts an optional subject", () => {
    const result = contactSchema.safeParse({
      ...validContact,
      subject: "Hello there",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// folderSchema
// ---------------------------------------------------------------------------

describe("folderSchema", () => {
  it("accepts a valid folder name", () => {
    const result = folderSchema.safeParse({ name: "My Articles" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty folder name", () => {
    const result = folderSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a folder name containing a forward slash", () => {
    const result = folderSchema.safeParse({ name: "draft/ideas" });
    expect(result.success).toBe(false);
  });

  it("rejects a folder name containing a backslash", () => {
    const result = folderSchema.safeParse({ name: "draft\\ideas" });
    expect(result.success).toBe(false);
  });

  it("rejects a folder name longer than 100 characters", () => {
    const result = folderSchema.safeParse({ name: "f".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts a valid cuid parentId", () => {
    const result = folderSchema.safeParse({
      name: "Nested",
      parentId: fakeCuid,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null parentId (top-level folder)", () => {
    const result = folderSchema.safeParse({ name: "Top Level", parentId: null });
    expect(result.success).toBe(true);
  });
});
